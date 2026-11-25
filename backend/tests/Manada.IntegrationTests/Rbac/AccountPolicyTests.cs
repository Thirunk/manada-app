using Manada.Application.Identity;
using Manada.Domain.Identity;
using Xunit;

namespace Manada.IntegrationTests.Rbac;

/// <summary>
/// Pure policy matrix. No database is needed, so these run fast. They back the database-level
/// tests and keep the escalation rules explicit.
/// </summary>
public sealed class AccountPolicyTests
{
    [Theory]
    [InlineData(AppRole.SuperAdmin, AppRole.Admin, true)]
    [InlineData(AppRole.SuperAdmin, AppRole.Staff, true)]
    [InlineData(AppRole.SuperAdmin, AppRole.Customer, true)]
    [InlineData(AppRole.SuperAdmin, AppRole.SuperAdmin, false)]
    [InlineData(AppRole.Admin, AppRole.Staff, true)]
    [InlineData(AppRole.Admin, AppRole.Customer, true)]
    [InlineData(AppRole.Admin, AppRole.Admin, false)]
    [InlineData(AppRole.Admin, AppRole.SuperAdmin, false)]
    [InlineData(AppRole.Staff, AppRole.Customer, false)]
    [InlineData(AppRole.Customer, AppRole.Customer, false)]
    public void Only_permitted_roles_may_be_provisioned(AppRole actor, AppRole newRole, bool allowed) =>
        Assert.Equal(allowed, AccountPolicy.CanCreate(actor, newRole));

    [Theory]
    [InlineData(AppRole.SuperAdmin, AppRole.Admin, true)]
    [InlineData(AppRole.SuperAdmin, AppRole.Staff, true)]
    [InlineData(AppRole.SuperAdmin, AppRole.SuperAdmin, false)]
    [InlineData(AppRole.Admin, AppRole.Staff, false)]
    [InlineData(AppRole.Admin, AppRole.Admin, false)]
    [InlineData(AppRole.Staff, AppRole.Customer, false)]
    public void Only_superadmin_may_assign_roles(AppRole actor, AppRole newRole, bool allowed) =>
        Assert.Equal(allowed, AccountPolicy.CanAssignRole(actor, newRole));

    [Fact]
    public void Nobody_may_change_their_own_status_or_role()
    {
        var self = Guid.NewGuid();

        Assert.False(AccountPolicy.CanChangeStatusOrRole(AppRole.SuperAdmin, self, AppRole.SuperAdmin, self, 2));
    }

    [Fact]
    public void The_last_active_superadmin_cannot_be_changed_by_another_superadmin()
    {
        Assert.False(AccountPolicy.CanChangeStatusOrRole(AppRole.SuperAdmin, Guid.NewGuid(), AppRole.SuperAdmin, Guid.NewGuid(), activeSuperAdminCount: 1));
        Assert.True(AccountPolicy.CanChangeStatusOrRole(AppRole.SuperAdmin, Guid.NewGuid(), AppRole.SuperAdmin, Guid.NewGuid(), activeSuperAdminCount: 2));
    }

    [Theory]
    [InlineData(true, true)]
    [InlineData(false, false)]
    public void Staff_mfa_follows_the_configured_setting(bool enforced, bool expected) =>
        Assert.Equal(expected, AccountPolicy.RequiresMfa(AppRole.Staff, enforced));

    [Theory]
    [InlineData(AppRole.SuperAdmin)]
    [InlineData(AppRole.Admin)]
    public void Privileged_roles_always_require_mfa(AppRole role) =>
        Assert.True(AccountPolicy.RequiresMfa(role, staffMfaEnforced: false));

    [Fact]
    public void Customers_never_have_mfa_enforced_by_policy() =>
        Assert.False(AccountPolicy.RequiresMfa(AppRole.Customer, staffMfaEnforced: true));
}
