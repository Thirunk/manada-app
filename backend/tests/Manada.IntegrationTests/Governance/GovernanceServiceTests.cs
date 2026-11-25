using Manada.Application.Abstractions;
using Manada.Application.Common;
using Manada.Application.Governance;
using Manada.Domain.Audit;
using Manada.Domain.Identity;
using Manada.Infrastructure.Persistence;
using Manada.IntegrationTests.Infrastructure;
using Manada.IntegrationTests.Rbac;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Manada.IntegrationTests.Governance;

/// <summary>Governance, organization and own-session rules against real PostgreSQL.</summary>
[Collection("Postgres")]
public sealed class GovernanceServiceTests(PostgresFixture postgres)
{
    private static GovernanceService Service(RbacHarness h) => new(h.Db, h.Permissions);

    private static async Task<AuthSession> AddSessionAsync(ManadaDbContext db, Guid userId, DateTimeOffset? expires = null, bool revoked = false)
    {
        var session = new AuthSession(Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N"), userId, new byte[] { 9 }, expires ?? DateTimeOffset.UtcNow.AddHours(1));
        db.AuthSessions.Add(session);
        await db.SaveChangesAsync();
        if (revoked)
        {
            session.Revoke();
            await db.SaveChangesAsync();
        }

        return session;
    }

    [Fact]
    public async Task Only_a_superadmin_can_read_the_role_matrix_and_it_matches_the_seed()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var superAdmin = await Seed.UserAsync(h.Db, AppRole.SuperAdmin);
        var admin = await Seed.UserAsync(h.Db, AppRole.Admin);

        var matrix = await Service(h).GetRoleMatrixAsync(Seed.Actor(superAdmin));
        Assert.Equal(new[] { "SuperAdmin", "Admin", "Staff", "Customer" }, matrix.Roles);
        Assert.Equal(10, matrix.Permissions.Count);
        Assert.Equal(17, matrix.Grants.Count);

        await Assert.ThrowsAsync<ForbiddenException>(() => Service(h).GetRoleMatrixAsync(Seed.Actor(admin)));
    }

    [Fact]
    public async Task Organization_is_readable_by_superadmin_and_denied_to_admin()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var superAdmin = await Seed.UserAsync(h.Db, AppRole.SuperAdmin);
        var admin = await Seed.UserAsync(h.Db, AppRole.Admin);

        var organization = await Service(h).GetOrganizationAsync(Seed.Actor(superAdmin));
        Assert.Equal("Manada Embroidery Machine Solution", organization.Name);

        await Assert.ThrowsAsync<ForbiddenException>(() => Service(h).GetOrganizationAsync(Seed.Actor(admin)));
    }

    [Fact]
    public async Task Organization_rename_succeeds_with_the_current_row_version_and_is_audited()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var superAdmin = await Seed.UserAsync(h.Db, AppRole.SuperAdmin);
        var current = await Service(h).GetOrganizationAsync(Seed.Actor(superAdmin));

        var updated = await Service(h).UpdateOrganizationAsync(Seed.Actor(superAdmin), new OrganizationUpdate("Manada Trading Name", current.RowVersion));

        Assert.Equal("Manada Trading Name", updated.Name);
        Assert.True(await h.Db.AuditEvents.AnyAsync(a => a.Action == "organization.updated" && a.Outcome == AuditOutcome.Success));
    }

    [Fact]
    public async Task Organization_update_with_a_stale_row_version_is_a_conflict_and_changes_nothing()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var superAdmin = await Seed.UserAsync(h.Db, AppRole.SuperAdmin);
        var stale = await Service(h).GetOrganizationAsync(Seed.Actor(superAdmin));
        await Service(h).UpdateOrganizationAsync(Seed.Actor(superAdmin), new OrganizationUpdate("First Change", stale.RowVersion));

        await Assert.ThrowsAsync<ConflictException>(() =>
            Service(h).UpdateOrganizationAsync(Seed.Actor(superAdmin), new OrganizationUpdate("Second Change", stale.RowVersion)));

        Assert.Equal("First Change", (await Service(h).GetOrganizationAsync(Seed.Actor(superAdmin))).Name);
    }

    [Fact]
    public async Task Admin_cannot_update_the_organization()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var superAdmin = await Seed.UserAsync(h.Db, AppRole.SuperAdmin);
        var admin = await Seed.UserAsync(h.Db, AppRole.Admin);
        var current = await Service(h).GetOrganizationAsync(Seed.Actor(superAdmin));

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            Service(h).UpdateOrganizationAsync(Seed.Actor(admin), new OrganizationUpdate("Hijacked", current.RowVersion)));

        Assert.Equal("Manada Embroidery Machine Solution", (await Service(h).GetOrganizationAsync(Seed.Actor(superAdmin))).Name);
    }

    [Fact]
    public async Task Sessions_list_only_the_callers_active_sessions_and_never_expose_the_cookie_key()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var user = await Seed.UserAsync(h.Db, AppRole.Customer);
        var other = await Seed.UserAsync(h.Db, AppRole.Customer);
        var mine = await AddSessionAsync(h.Db, user.Id);
        await AddSessionAsync(h.Db, user.Id, revoked: true);
        await AddSessionAsync(h.Db, user.Id, expires: DateTimeOffset.UtcNow.AddMinutes(-1));
        await AddSessionAsync(h.Db, other.Id);

        var sessions = await Service(h).ListOwnSessionsAsync(Seed.Actor(user));

        var only = Assert.Single(sessions);
        Assert.Equal(SessionHandle.From(mine.Key), only.Handle);
        Assert.DoesNotContain(mine.Key, only.Handle, StringComparison.Ordinal);
    }

    [Fact]
    public async Task A_caller_can_revoke_their_own_session_by_handle()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var user = await Seed.UserAsync(h.Db, AppRole.Customer);
        var session = await AddSessionAsync(h.Db, user.Id);
        var handle = SessionHandle.From(session.Key);

        await Service(h).RevokeOwnSessionAsync(Seed.Actor(user), handle);

        var stored = await h.Db.AuthSessions.AsNoTracking().SingleAsync(s => s.Key == session.Key);
        Assert.NotNull(stored.RevokedUtc);
        Assert.True(await h.Db.AuditEvents.AnyAsync(a => a.Action == "session.revoked" && a.ActorUserId == user.Id));
    }

    [Fact]
    public async Task A_caller_cannot_revoke_another_accounts_session_even_with_its_handle()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var owner = await Seed.UserAsync(h.Db, AppRole.Customer);
        var intruder = await Seed.UserAsync(h.Db, AppRole.Customer);
        var session = await AddSessionAsync(h.Db, owner.Id);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            Service(h).RevokeOwnSessionAsync(Seed.Actor(intruder), SessionHandle.From(session.Key)));

        var stored = await h.Db.AuthSessions.AsNoTracking().SingleAsync(s => s.Key == session.Key);
        Assert.Null(stored.RevokedUtc);
    }

    [Fact]
    public async Task Disabled_accounts_cannot_list_or_revoke_sessions()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var user = await Seed.UserAsync(h.Db, AppRole.Customer, UserStatus.Disabled);
        var session = await AddSessionAsync(h.Db, user.Id);

        // The ActorResolver rejects inactive accounts before this service is reached; the permission check
        // also returns false for inactive users, so the service denies the call directly.
        await Assert.ThrowsAsync<ForbiddenException>(() => Service(h).ListOwnSessionsAsync(Seed.Actor(user)));
        await Assert.ThrowsAsync<ForbiddenException>(() =>
            Service(h).RevokeOwnSessionAsync(Seed.Actor(user), SessionHandle.From(session.Key)));
    }
}
