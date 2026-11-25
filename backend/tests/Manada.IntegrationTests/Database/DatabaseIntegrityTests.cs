using Manada.Domain.Audit;
using Manada.Domain.Identity;
using Manada.IntegrationTests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Xunit;

namespace Manada.IntegrationTests.Database;

/// <summary>Migration integrity, seeded matrix, database constraints and audit immutability on real PostgreSQL.</summary>
[Collection("Postgres")]
public sealed class DatabaseIntegrityTests(PostgresFixture postgres)
{
    [Fact]
    public async Task Every_migration_is_applied_and_none_is_pending()
    {
        var database = await postgres.CreateDatabaseAsync();
        await using var db = database.CreateContext();

        Assert.Empty(await db.Database.GetPendingMigrationsAsync());
        Assert.Contains(await db.Database.GetAppliedMigrationsAsync(), m => m.EndsWith("AuditImmutabilityAndGrants", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Seeded_role_permission_matrix_matches_the_policy()
    {
        var database = await postgres.CreateDatabaseAsync();
        await using var db = database.CreateContext();

        var counts = await db.RolePermissions.AsNoTracking()
            .GroupBy(rp => rp.Role)
            .Select(g => new { Role = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Role, x => x.Count);

        Assert.Equal(10, counts[AppRole.SuperAdmin]);
        Assert.Equal(4, counts[AppRole.Admin]);
        Assert.Equal(1, counts[AppRole.Staff]);
        Assert.Equal(2, counts[AppRole.Customer]);

        var admin = await db.RolePermissions.AsNoTracking().Where(rp => rp.Role == AppRole.Admin).Select(rp => rp.PermissionCode).ToListAsync();
        Assert.DoesNotContain(PermissionCodes.UsersManageAdmins, admin);
        Assert.DoesNotContain(PermissionCodes.RolesAssign, admin);
        Assert.DoesNotContain(PermissionCodes.AuditRead, admin);

        var staff = await db.RolePermissions.AsNoTracking().Where(rp => rp.Role == AppRole.Staff).Select(rp => rp.PermissionCode).ToListAsync();
        Assert.Equal(new[] { PermissionCodes.ProfileSelf }, staff);
    }

    [Fact]
    public async Task Audit_events_reject_update_delete_and_truncate()
    {
        var database = await postgres.CreateDatabaseAsync();
        await using var db = database.CreateContext();
        db.AuditEvents.Add(new AuditEvent("test.append", AuditOutcome.Success, null, null, null, null, null, null));
        await db.SaveChangesAsync();

        await AssertRejectedAsync(db, "UPDATE manada.audit_events SET \"Action\" = 'tampered'");
        await AssertRejectedAsync(db, "DELETE FROM manada.audit_events");
        await AssertRejectedAsync(db, "TRUNCATE manada.audit_events");

        Assert.True(await db.AuditEvents.AsNoTracking().AnyAsync(a => a.Action == "test.append"));
    }

    [Fact]
    public async Task Audit_outcome_check_constraint_rejects_unknown_values()
    {
        var database = await postgres.CreateDatabaseAsync();
        await using var db = database.CreateContext();

        var ex = await Assert.ThrowsAnyAsync<Exception>(() => db.Database.ExecuteSqlRawAsync(
            "INSERT INTO manada.audit_events (\"Id\", \"OccurredUtc\", \"Action\", \"Outcome\") VALUES (gen_random_uuid(), now(), 'raw.insert', 'Partial')"));

        var pg = Assert.IsType<PostgresException>(ex is PostgresException direct ? direct : ex.InnerException);
        Assert.Equal("23514", pg.SqlState);
    }

    [Fact]
    public async Task Users_table_rejects_an_unknown_role_written_directly()
    {
        var database = await postgres.CreateDatabaseAsync();
        await using var db = database.CreateContext();

        var ex = await Assert.ThrowsAnyAsync<Exception>(() => db.Database.ExecuteSqlRawAsync(
            "INSERT INTO manada.users (\"Id\", \"Email\", \"DisplayName\", \"Role\", \"Status\", \"OrganizationId\", \"CreatedUtc\", \"UpdatedUtc\") " +
            "VALUES (gen_random_uuid(), 'bad.role@manada.test', 'Bad Role', 'Root', 'Active', '0f6b6a5e-2d3c-4f7a-9b1e-000000000001', now(), now())"));

        var pg = Assert.IsType<PostgresException>(ex is PostgresException direct ? direct : ex.InnerException);
        Assert.Equal("23514", pg.SqlState);
    }

    [Fact]
    public async Task One_provider_subject_cannot_be_linked_to_two_accounts()
    {
        var database = await postgres.CreateDatabaseAsync();
        await using (var first = database.CreateContext())
        {
            await Seed.UserAsync(first, AppRole.Customer, issuer: FixedIssuer.Value, subject: "shared-subject");
        }

        await using var second = database.CreateContext();
        await Assert.ThrowsAsync<DbUpdateException>(() =>
            Seed.UserAsync(second, AppRole.Customer, issuer: FixedIssuer.Value, subject: "shared-subject"));
    }

    private static async Task AssertRejectedAsync(Manada.Infrastructure.Persistence.ManadaDbContext db, string sql)
    {
        var ex = await Assert.ThrowsAnyAsync<Exception>(() => db.Database.ExecuteSqlRawAsync(sql));
        Assert.Contains("append-only", ex.ToString(), StringComparison.Ordinal);
    }
}
