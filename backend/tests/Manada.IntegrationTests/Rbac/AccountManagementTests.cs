using Manada.Application.Abstractions;
using Manada.Application.Common;
using Manada.Application.Users;
using Manada.Domain.Audit;
using Manada.Domain.Identity;
using Manada.Infrastructure.Identity;
using Manada.Infrastructure.Persistence;
using Manada.IntegrationTests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Manada.IntegrationTests.Rbac;

/// <summary>
/// Application-level authorization against real PostgreSQL. The identity provider is a labelled fake;
/// these tests do not exercise Keycloak, sign-in, MFA or token handling.
/// </summary>
[Collection("Postgres")]
public sealed class AccountManagementTests(PostgresFixture postgres)
{
    private static CreateAccountRequest Request(AppRole role, string? email = null) =>
        new(email ?? $"{role.ToString().ToLowerInvariant()}.{Guid.NewGuid():N}@manada.test", $"Sample {role}", role, null, null);

    private static async Task<uint> RowVersionAsync(RbacHarness h, Guid userId) =>
        (await h.Db.Users.AsNoTracking().SingleAsync(u => u.Id == userId)).RowVersion;

    private static async Task<AppUser> ReloadAsync(RbacHarness h, Guid userId) =>
        await h.Db.Users.AsNoTracking().SingleAsync(u => u.Id == userId);

    [Fact]
    public async Task SuperAdmin_provisions_an_admin_pending_verification_with_totp_required()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var superAdmin = await Seed.UserAsync(h.Db, AppRole.SuperAdmin);

        var result = await h.Users.CreateAccountAsync(Seed.Actor(superAdmin), Request(AppRole.Admin, "New.Admin@Manada.test"));

        Assert.Equal(AppRole.Admin, result.User.Role);
        Assert.Equal(UserStatus.PendingVerification, result.User.Status);
        Assert.Equal("new.admin@manada.test", result.User.Email);
        var provider = Assert.Single(h.Identity.Created);
        Assert.Contains("CONFIGURE_TOTP", provider.RequiredActions);
        Assert.True(await h.Db.AuditEvents.AnyAsync(a =>
            a.Action == "account.created" && a.Outcome == AuditOutcome.Success && a.ActorUserId == superAdmin.Id));
    }

    [Fact]
    public async Task Customer_accounts_do_not_require_totp_enrolment()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var superAdmin = await Seed.UserAsync(h.Db, AppRole.SuperAdmin);

        await h.Users.CreateAccountAsync(Seed.Actor(superAdmin), Request(AppRole.Customer));

        var provider = Assert.Single(h.Identity.Created);
        Assert.DoesNotContain("CONFIGURE_TOTP", provider.RequiredActions);
    }

    [Fact]
    public async Task Admin_cannot_create_another_admin_and_the_denial_is_audited()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var admin = await Seed.UserAsync(h.Db, AppRole.Admin);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            h.Users.CreateAccountAsync(Seed.Actor(admin), Request(AppRole.Admin)));

        Assert.Empty(h.Identity.Created);
        Assert.True(await h.Db.AuditEvents.AnyAsync(a =>
            a.Action == "account.create.denied" && a.Outcome == AuditOutcome.Denied && a.ActorUserId == admin.Id));
    }

    [Fact]
    public async Task No_account_can_be_provisioned_as_superadmin_through_the_api()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var superAdmin = await Seed.UserAsync(h.Db, AppRole.SuperAdmin);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            h.Users.CreateAccountAsync(Seed.Actor(superAdmin), Request(AppRole.SuperAdmin)));

        Assert.Empty(h.Identity.Created);
    }

    [Fact]
    public async Task Admin_provisions_staff_and_the_staff_profile_is_created()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var admin = await Seed.UserAsync(h.Db, AppRole.Admin);

        var result = await h.Users.CreateAccountAsync(Seed.Actor(admin), Request(AppRole.Staff));

        Assert.Equal(AppRole.Staff, result.User.Role);
        Assert.True(await h.Db.StaffProfiles.AnyAsync(p => p.UserId == result.User.Id));
    }

    [Fact]
    public async Task Admin_provisions_customer_and_the_customer_profile_is_created()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var admin = await Seed.UserAsync(h.Db, AppRole.Admin);

        var result = await h.Users.CreateAccountAsync(Seed.Actor(admin), Request(AppRole.Customer));

        Assert.Equal(AppRole.Customer, result.User.Role);
        Assert.True(await h.Db.CustomerProfiles.AnyAsync(p => p.UserId == result.User.Id));
    }

    [Theory]
    [InlineData(AppRole.Staff)]
    [InlineData(AppRole.Customer)]
    public async Task Staff_and_customers_cannot_create_accounts(AppRole actorRole)
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var actor = await Seed.UserAsync(h.Db, actorRole);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            h.Users.CreateAccountAsync(Seed.Actor(actor), Request(AppRole.Customer)));

        Assert.Empty(h.Identity.Created);
    }

    [Fact]
    public async Task Admin_cannot_change_any_role_and_the_database_role_is_unchanged()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var admin = await Seed.UserAsync(h.Db, AppRole.Admin);
        var target = await Seed.UserAsync(h.Db, AppRole.Customer);
        var rowVersion = await RowVersionAsync(h, target.Id);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            h.Users.ChangeRoleAsync(Seed.Actor(admin), target.Id, new ChangeRoleRequest(AppRole.Admin, rowVersion)));

        Assert.Equal(AppRole.Customer, (await ReloadAsync(h, target.Id)).Role);
        Assert.DoesNotContain(h.Identity.Calls, call => call.StartsWith("role:", StringComparison.Ordinal));
        Assert.True(await h.Db.AuditEvents.AnyAsync(a =>
            a.Action == "authorization.denied" && a.Outcome == AuditOutcome.Denied && a.ActorUserId == admin.Id));
    }

    [Fact]
    public async Task SuperAdmin_changes_a_role_and_existing_sessions_of_that_account_are_revoked()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var superAdmin = await Seed.UserAsync(h.Db, AppRole.SuperAdmin);
        var target = await Seed.UserAsync(h.Db, AppRole.Customer);
        var session = new AuthSession($"key-{Guid.NewGuid():N}", target.Id, new byte[] { 1, 2, 3 }, DateTimeOffset.UtcNow.AddHours(1));
        h.Db.AuthSessions.Add(session);
        await h.Db.SaveChangesAsync();

        var rowVersion = await RowVersionAsync(h, target.Id);
        var updated = await h.Users.ChangeRoleAsync(Seed.Actor(superAdmin), target.Id, new ChangeRoleRequest(AppRole.Staff, rowVersion));

        Assert.Equal(AppRole.Staff, updated.Role);
        Assert.Equal(AppRole.Staff, (await ReloadAsync(h, target.Id)).Role);
        var stored = await h.Db.AuthSessions.AsNoTracking().SingleAsync(s => s.Key == session.Key);
        Assert.NotNull(stored.RevokedUtc);
    }

    [Fact]
    public async Task Role_change_with_a_stale_row_version_is_rejected_as_a_conflict()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var superAdmin = await Seed.UserAsync(h.Db, AppRole.SuperAdmin);
        var target = await Seed.UserAsync(h.Db, AppRole.Customer);
        var rowVersion = await RowVersionAsync(h, target.Id);

        // Another writer changes the account first.
        await h.Users.ChangeRoleAsync(Seed.Actor(superAdmin), target.Id, new ChangeRoleRequest(AppRole.Staff, rowVersion));

        await Assert.ThrowsAsync<ConflictException>(() =>
            h.Users.ChangeRoleAsync(Seed.Actor(superAdmin), target.Id, new ChangeRoleRequest(AppRole.Admin, rowVersion)));

        Assert.Equal(AppRole.Staff, (await ReloadAsync(h, target.Id)).Role);
    }

    [Theory]
    [InlineData(AppRole.Staff)]
    [InlineData(AppRole.Customer)]
    public async Task Staff_and_customers_cannot_list_accounts(AppRole actorRole)
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var actor = await Seed.UserAsync(h.Db, actorRole);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            h.Users.ListUsersAsync(Seed.Actor(actor), new UserListQuery(null, null, null, new PageRequest())));
    }

    [Fact]
    public async Task Admin_list_contains_only_staff_and_customers()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var admin = await Seed.UserAsync(h.Db, AppRole.Admin);
        await Seed.UserAsync(h.Db, AppRole.SuperAdmin);
        var staff = await Seed.UserAsync(h.Db, AppRole.Staff);

        var page = await h.Users.ListUsersAsync(Seed.Actor(admin), new UserListQuery(null, null, null, new PageRequest(1, 100)));

        Assert.Contains(page.Items, item => item.Id == staff.Id);
        Assert.All(page.Items, item => Assert.Contains(item.Role, new[] { AppRole.Staff, AppRole.Customer }));
    }

    [Fact]
    public async Task Admin_cannot_disable_a_superadmin()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var admin = await Seed.UserAsync(h.Db, AppRole.Admin);
        var superAdmin = await Seed.UserAsync(h.Db, AppRole.SuperAdmin);
        var rowVersion = await RowVersionAsync(h, superAdmin.Id);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            h.Users.SetStatusAsync(Seed.Actor(admin), superAdmin.Id, new ChangeStatusRequest(false, rowVersion)));

        Assert.Equal(UserStatus.Active, (await ReloadAsync(h, superAdmin.Id)).Status);
        Assert.Empty(h.Identity.Disabled);
    }

    [Fact]
    public async Task Superadmin_cannot_disable_their_own_account()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var superAdmin = await Seed.UserAsync(h.Db, AppRole.SuperAdmin);
        await Seed.UserAsync(h.Db, AppRole.SuperAdmin);
        var rowVersion = await RowVersionAsync(h, superAdmin.Id);

        await Assert.ThrowsAsync<ConflictException>(() =>
            h.Users.SetStatusAsync(Seed.Actor(superAdmin), superAdmin.Id, new ChangeStatusRequest(false, rowVersion)));

        Assert.Equal(UserStatus.Active, (await ReloadAsync(h, superAdmin.Id)).Status);
    }

    [Fact]
    public async Task Disabling_an_admin_removes_access_immediately_and_revokes_its_sessions()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var superAdmin = await Seed.UserAsync(h.Db, AppRole.SuperAdmin);
        var admin = await Seed.UserAsync(h.Db, AppRole.Admin);
        var session = new AuthSession($"key-{Guid.NewGuid():N}", admin.Id, new byte[] { 4, 5, 6 }, DateTimeOffset.UtcNow.AddHours(1));
        h.Db.AuthSessions.Add(session);
        await h.Db.SaveChangesAsync();
        var rowVersion = await RowVersionAsync(h, admin.Id);

        await h.Users.SetStatusAsync(Seed.Actor(superAdmin), admin.Id, new ChangeStatusRequest(false, rowVersion));

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            h.Users.ListUsersAsync(Seed.Actor(admin), new UserListQuery(null, null, null, new PageRequest())));
        await Assert.ThrowsAsync<ForbiddenException>(() => h.Users.GetCurrentUserAsync(Seed.Actor(admin)));
        Assert.Contains($"revoke:{admin.Identities.First().Subject}", h.Identity.Calls);
        var stored = await h.Db.AuthSessions.AsNoTracking().SingleAsync(s => s.Key == session.Key);
        Assert.NotNull(stored.RevokedUtc);
    }

    [Fact]
    public async Task Revoking_a_permission_takes_effect_on_the_next_request()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var admin = await Seed.UserAsync(h.Db, AppRole.Admin);

        await h.Db.RolePermissions
            .Where(rp => rp.Role == AppRole.Admin && rp.PermissionCode == PermissionCodes.UsersManageStaff)
            .ExecuteDeleteAsync();

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            h.Users.CreateAccountAsync(Seed.Actor(admin), Request(AppRole.Staff)));
        Assert.Empty(h.Identity.Created);
    }

    [Fact]
    public async Task Failed_identity_provisioning_leaves_no_application_account()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var admin = await Seed.UserAsync(h.Db, AppRole.Admin);
        h.Identity.FailNextCreate = true;

        await Assert.ThrowsAsync<DependencyFailureException>(() =>
            h.Users.CreateAccountAsync(Seed.Actor(admin), Request(AppRole.Staff)));

        Assert.False(await h.Db.Users.AnyAsync(u => u.Role == AppRole.Staff));
    }

    [Fact]
    public async Task Duplicate_email_inserted_after_the_precheck_is_recovered_as_a_conflict()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var superAdmin = await Seed.UserAsync(h.Db, AppRole.SuperAdmin);
        const string email = "late.winner@manada.test";

        // The pre-check runs first and sees no account. Another request then commits the same email
        // before this request's insert, so the unique index is the only thing that can catch it.
        h.Identity.BeforeCreate = async _ =>
        {
            await using var other = h.Database.CreateContext();
            other.Users.Add(new AppUser(email, "Late Winner", AppRole.Staff, (await Seed.FirstOrganizationIdAsync(other)), UserStatus.Active));
            await other.SaveChangesAsync();
        };

        await Assert.ThrowsAsync<ConflictException>(() =>
            h.Users.CreateAccountAsync(Seed.Actor(superAdmin), new CreateAccountRequest(email, "Late Loser", AppRole.Staff, null, null)));

        // The identity created at the provider is disabled again, so it cannot sign in.
        Assert.Single(h.Identity.Created);
        Assert.Contains(h.Identity.Calls, c => c.StartsWith("enabled:", StringComparison.Ordinal) && c.EndsWith(":False", StringComparison.Ordinal));
        Assert.Equal(1, await h.Db.Users.AsNoTracking().CountAsync(u => u.Email == email));
    }

    [Fact]
    public async Task Concurrent_provisioning_of_one_email_creates_exactly_one_account()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var superAdmin = await Seed.UserAsync(h.Db, AppRole.SuperAdmin);
        var actor = Seed.Actor(superAdmin);
        var request = new CreateAccountRequest("race.candidate@manada.test", "Race Candidate", AppRole.Staff, null, null);

        async Task<Exception?> AttemptAsync()
        {
            // Each attempt uses its own DbContext, because a DbContext is not safe for concurrent use.
            await using var db = h.Database.CreateContext();
            var service = new UserService(db, new FakeIdentityProvider(), new FixedIssuer(), new PermissionService(db), new PostgresUniqueViolationDetector());
            try
            {
                await service.CreateAccountAsync(actor, request);
                return null;
            }
            catch (Exception ex)
            {
                return ex;
            }
        }

        var outcomes = await Task.WhenAll(AttemptAsync(), AttemptAsync());

        Assert.Single(outcomes, outcome => outcome is null);
        Assert.IsType<ConflictException>(Assert.Single(outcomes, outcome => outcome is not null));
        await using var verify = h.Database.CreateContext();
        Assert.Equal(1, await verify.Users.CountAsync(u => u.Email == "race.candidate@manada.test"));
    }
}
