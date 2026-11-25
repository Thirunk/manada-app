using Manada.Application.Abstractions;
using Manada.Application.Common;
using Manada.Application.Users;
using Manada.Domain.Identity;
using Manada.Infrastructure.Persistence;
using Manada.IntegrationTests.Infrastructure;
using Manada.IntegrationTests.Rbac;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Xunit;

namespace Manada.IntegrationTests.Persistence;

/// <summary>
/// Failed-entry recovery and unique-violation classification against real PostgreSQL. Races are forced
/// deterministically with the fake identity provider's hook, which runs after the application pre-check.
/// </summary>
[Collection("Postgres")]
public sealed class ConcurrencyRecoveryTests(PostgresFixture postgres)
{
    private static async Task InsertOtherAccountAsync(TestDatabase database, Func<ManadaDbContext, Task> insert)
    {
        await using var other = database.CreateContext();
        await insert(other);
        await other.SaveChangesAsync();
    }

    [Fact]
    public async Task Failed_account_insert_preserves_unrelated_pending_changes()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var superAdmin = await Seed.UserAsync(h.Db, AppRole.SuperAdmin);
        var bystander = await Seed.UserAsync(h.Db, AppRole.Customer);
        bystander.UpdateDisplayName("Unsaved Pending Name");
        const string email = "recovery.winner@manada.test";
        h.Identity.BeforeCreate = _ => InsertOtherAccountAsync(h.Database, async db =>
            db.Users.Add(new AppUser(email, "Winner", AppRole.Staff, await Seed.FirstOrganizationIdAsync(db), UserStatus.Active)));

        await Assert.ThrowsAsync<ConflictException>(() =>
            h.Users.CreateAccountAsync(Seed.Actor(superAdmin), new CreateAccountRequest(email, "Loser", AppRole.Staff, null, null)));

        // The unrelated change is still tracked and still pending; it was not silently discarded.
        Assert.Equal(Microsoft.EntityFrameworkCore.EntityState.Modified, h.Db.Entry(bystander).State);
        Assert.Equal("Unsaved Pending Name", bystander.DisplayName);
        var stored = await h.Db.Users.AsNoTracking().SingleAsync(u => u.Id == bystander.Id);
        Assert.NotEqual("Unsaved Pending Name", stored.DisplayName);
    }

    [Fact]
    public async Task Unrelated_unique_violation_on_identity_is_not_reported_as_a_duplicate_email()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var superAdmin = await Seed.UserAsync(h.Db, AppRole.SuperAdmin);
        h.Identity.FixedSubject = "collides-subject";
        h.Identity.BeforeCreate = _ => InsertOtherAccountAsync(h.Database, db =>
        {
            return Seed.UserAsync(db, AppRole.Customer, issuer: FixedIssuer.Value, subject: "collides-subject");
        });

        // An identity collision is a database failure, not a duplicate email, so it must not be reported as a conflict.
        await Assert.ThrowsAsync<DbUpdateException>(() =>
            h.Users.CreateAccountAsync(Seed.Actor(superAdmin), new CreateAccountRequest("unrelated@manada.test", "Unrelated", AppRole.Staff, null, null)));

        // The identity created at the provider is still disabled again.
        Assert.Contains(h.Identity.Calls, c => c.StartsWith("enabled:", StringComparison.Ordinal) && c.EndsWith(":False", StringComparison.Ordinal));
        Assert.False(await h.Db.Users.AsNoTracking().AnyAsync(u => u.Email == "unrelated@manada.test"));
    }

    [Fact]
    public async Task Duplicate_email_is_classified_by_the_email_constraint_only()
    {
        var database = await postgres.CreateDatabaseAsync();
        var detector = new PostgresUniqueViolationDetector();
        await using (var first = database.CreateContext())
        {
            await Seed.UserAsync(first, AppRole.Customer);
        }

        await using var db = database.CreateContext();
        var organizationId = await db.Organizations.Select(o => o.Id).OrderBy(id => id).FirstAsync();
        db.Users.Add(new AppUser("same@manada.test", "One", AppRole.Customer, organizationId, UserStatus.Active));
        await db.SaveChangesAsync();
        await using var second = database.CreateContext();
        second.Users.Add(new AppUser("same@manada.test", "Two", AppRole.Customer, organizationId, UserStatus.Active));

        var ex = await Assert.ThrowsAsync<DbUpdateException>(() => second.SaveChangesAsync());

        Assert.True(detector.IsUniqueViolation(ex, UniqueConstraints.UserEmail));
        Assert.False(detector.IsUniqueViolation(ex, UniqueConstraints.ExternalIdentitySubject));
    }

    [Fact]
    public async Task Check_constraint_failures_are_never_classified_as_unique_violations()
    {
        var database = await postgres.CreateDatabaseAsync();
        var detector = new PostgresUniqueViolationDetector();
        await using var db = database.CreateContext();

        var ex = await Assert.ThrowsAnyAsync<Exception>(() => db.Database.ExecuteSqlRawAsync(
            "INSERT INTO manada.users (\"Id\", \"Email\", \"DisplayName\", \"Role\", \"Status\", \"OrganizationId\", \"CreatedUtc\", \"UpdatedUtc\") " +
            "VALUES (gen_random_uuid(), 'check.fail@manada.test', 'Check', 'Root', 'Active', '0f6b6a5e-2d3c-4f7a-9b1e-000000000001', now(), now())"));

        Assert.IsType<PostgresException>(ex);
        Assert.False(detector.IsUniqueViolation(ex, UniqueConstraints.UserEmail));
        Assert.False(detector.IsUniqueViolation(ex, UniqueConstraints.ExternalIdentitySubject));
    }

    [Fact]
    public void Exceptions_that_are_not_database_failures_are_never_unique_violations()
    {
        var detector = new PostgresUniqueViolationDetector();
        var unrelated = new InvalidOperationException("duplicate key value violates unique constraint");

        Assert.False(detector.IsUniqueViolation(unrelated, UniqueConstraints.UserEmail));
        Assert.False(detector.IsUniqueViolation(unrelated, UniqueConstraints.ExternalIdentitySubject));
    }
}
