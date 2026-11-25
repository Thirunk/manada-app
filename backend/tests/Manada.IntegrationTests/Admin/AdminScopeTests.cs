using Manada.Application.Abstractions;
using Manada.Application.Common;
using Manada.Application.Users;
using Manada.Domain.Identity;
using Manada.Domain.Organization;
using Manada.Domain.Staff;
using Manada.IntegrationTests.Infrastructure;
using Manada.IntegrationTests.Rbac;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Manada.IntegrationTests.Admin;

/// <summary>Admin portal scope: detail reads, listing bounds and peer protection, against real PostgreSQL.</summary>
[Collection("Postgres")]
public sealed class AdminScopeTests(PostgresFixture postgres)
{
    private static AccountQueryService Accounts(RbacHarness h) => new(h.Db, h.Permissions);

    private static async Task<uint> RowVersionAsync(RbacHarness h, Guid id) =>
        (await h.Db.Users.AsNoTracking().SingleAsync(u => u.Id == id)).RowVersion;

    [Fact]
    public async Task Admin_reads_a_staff_account_with_job_title_and_branch()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var organizationId = await h.Db.Organizations.Select(o => o.Id).OrderBy(id => id).FirstAsync();
        var branch = new Branch(organizationId, "Main Workshop", "MAIN");
        h.Db.Branches.Add(branch);
        var admin = await Seed.UserAsync(h.Db, AppRole.Admin);
        var staff = new AppUser($"tech.{Guid.NewGuid():N}@manada.test", "Tech One", AppRole.Staff, organizationId, UserStatus.Active);
        staff.AttachIdentity(FixedIssuer.Value, Guid.NewGuid().ToString("N"));
        h.Db.Users.Add(staff);
        h.Db.StaffProfiles.Add(new StaffProfile(staff.Id, "Embroidery technician", branch.Id));
        await h.Db.SaveChangesAsync();

        var detail = await Accounts(h).GetManagedAccountAsync(Seed.Actor(admin), staff.Id);

        Assert.Equal("Embroidery technician", detail.JobTitle);
        Assert.Equal("MAIN", detail.BranchCode);
        Assert.Equal("Main Workshop", detail.BranchName);
    }

    [Theory]
    [InlineData(AppRole.SuperAdmin)]
    [InlineData(AppRole.Admin)]
    public async Task Admin_cannot_see_superadmin_or_peer_admin_accounts_and_is_told_they_do_not_exist(AppRole targetRole)
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var admin = await Seed.UserAsync(h.Db, AppRole.Admin);
        var target = await Seed.UserAsync(h.Db, targetRole);

        await Assert.ThrowsAsync<NotFoundException>(() => Accounts(h).GetManagedAccountAsync(Seed.Actor(admin), target.Id));
    }

    [Fact]
    public async Task Customers_cannot_read_any_account_detail()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var customer = await Seed.UserAsync(h.Db, AppRole.Customer);
        var other = await Seed.UserAsync(h.Db, AppRole.Customer);

        await Assert.ThrowsAsync<ForbiddenException>(() => Accounts(h).GetManagedAccountAsync(Seed.Actor(customer), other.Id));
    }

    [Fact]
    public async Task Own_account_read_returns_only_the_callers_record()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var first = await Seed.UserAsync(h.Db, AppRole.Customer);
        await Seed.UserAsync(h.Db, AppRole.Customer);

        var own = await Accounts(h).GetOwnAccountAsync(Seed.Actor(first));

        Assert.Equal(first.Id, own.Id);
        Assert.Equal(first.Email, own.Email);
    }

    [Fact]
    public async Task Admin_listing_pages_staff_with_a_stable_total()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var admin = await Seed.UserAsync(h.Db, AppRole.Admin);
        for (var i = 0; i < 30; i++)
        {
            await Seed.UserAsync(h.Db, AppRole.Staff);
        }

        var second = await h.Users.ListUsersAsync(Seed.Actor(admin), new UserListQuery(AppRole.Staff, null, null, new PageRequest(2, 25)));

        Assert.Equal(30, second.TotalCount);
        Assert.Equal(5, second.Items.Count);
        Assert.All(second.Items, item => Assert.Equal(AppRole.Staff, item.Role));
    }

    [Fact]
    public async Task Admin_search_matches_only_in_scope_accounts()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var admin = await Seed.UserAsync(h.Db, AppRole.Admin);
        var needle = $"needle{Guid.NewGuid():N}";
        var customer = await Seed.UserAsync(h.Db, AppRole.Customer);
        customer.UpdateDisplayName($"{needle} Customer");
        await h.Db.SaveChangesAsync();

        var page = await h.Users.ListUsersAsync(Seed.Actor(admin), new UserListQuery(null, null, needle, new PageRequest()));

        Assert.Single(page.Items);
        Assert.Equal(AppRole.Customer, page.Items[0].Role);
    }

    [Fact]
    public async Task Admin_cannot_list_admin_accounts_by_role_filter()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var admin = await Seed.UserAsync(h.Db, AppRole.Admin);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            h.Users.ListUsersAsync(Seed.Actor(admin), new UserListQuery(AppRole.Admin, null, null, new PageRequest())));
    }

    [Fact]
    public async Task Admin_cannot_disable_a_peer_admin()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var admin = await Seed.UserAsync(h.Db, AppRole.Admin);
        var peer = await Seed.UserAsync(h.Db, AppRole.Admin);

        var rowVersion = await RowVersionAsync(h, peer.Id);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            h.Users.SetStatusAsync(Seed.Actor(admin), peer.Id, new ChangeStatusRequest(false, rowVersion)));
    }

    [Fact]
    public async Task Admin_status_change_with_a_stale_row_version_is_a_conflict()
    {
        await using var h = await RbacHarness.CreateAsync(postgres);
        var admin = await Seed.UserAsync(h.Db, AppRole.Admin);
        var staff = await Seed.UserAsync(h.Db, AppRole.Staff);
        var stale = await RowVersionAsync(h, staff.Id);
        await h.Users.SetStatusAsync(Seed.Actor(admin), staff.Id, new ChangeStatusRequest(false, stale));

        await Assert.ThrowsAsync<ConflictException>(() =>
            h.Users.SetStatusAsync(Seed.Actor(admin), staff.Id, new ChangeStatusRequest(true, stale)));
    }
}
