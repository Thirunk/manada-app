using Manada.API.Auth;
using Manada.API.Endpoints;
using Manada.Domain.Identity;
using Xunit;

namespace Manada.IntegrationTests.Authentication;

/// <summary>
/// Pure assurance and role-consistency rules used by the BFF. These do not prove Keycloak issues the
/// acr claim; that is the job of the gated real-Keycloak tests. They prove how the backend interprets
/// whatever acr value arrives, and that missing or malformed values never grant assurance.
/// </summary>
public sealed class AssuranceRulesTests
{
    [Theory]
    [InlineData("1", 1)]
    [InlineData("2", 2)]
    [InlineData("3", 3)]
    [InlineData(null, 0)]
    [InlineData("", 0)]
    [InlineData("mfa", 0)]
    [InlineData("urn:mace:incommon:iap:silver", 0)]
    [InlineData(" 2", 0)]
    public void Assurance_is_read_only_from_a_numeric_acr_value(string? acr, int expected) =>
        Assert.Equal(expected, BffAuthentication.ParseAssurance(acr));

    [Theory]
    [InlineData(0, false)]
    [InlineData(1, false)]
    [InlineData(2, true)]
    [InlineData(3, true)]
    public void Privileged_access_requires_level_two_assurance(int level, bool satisfied) =>
        Assert.Equal(satisfied, BffAuthentication.AssuranceSatisfied(level));

    [Fact]
    public void Level_two_assurance_is_the_mfa_level()
    {
        Assert.Equal(AssuranceLevels.Mfa, 2);
        Assert.Equal(AssuranceLevels.Password, 1);
    }

    [Theory]
    [InlineData(AppRole.SuperAdmin, "superadmin")]
    [InlineData(AppRole.Admin, "admin")]
    [InlineData(AppRole.Staff, "staff")]
    public void Matching_privileged_provider_role_is_consistent(AppRole role, string providerRole) =>
        Assert.False(BffAuthentication.ProviderRoleMismatch(role, new[] { providerRole, "default-roles-manada" }));

    [Theory]
    [InlineData(AppRole.SuperAdmin, "SuperAdmin")]
    [InlineData(AppRole.Admin, "ADMIN")]
    public void Provider_role_comparison_ignores_case(AppRole role, string providerRole) =>
        Assert.False(BffAuthentication.ProviderRoleMismatch(role, new[] { providerRole }));

    [Theory]
    [InlineData(AppRole.Admin, "superadmin")]
    [InlineData(AppRole.Staff, "admin")]
    [InlineData(AppRole.Admin, "admin", "staff")]
    [InlineData(AppRole.Staff, "staff", "admin")]
    [InlineData(AppRole.SuperAdmin, "admin")]
    [InlineData(AppRole.Staff)]
    [InlineData(AppRole.Admin)]
    public void Privileged_provider_roles_that_disagree_with_the_database_are_rejected(AppRole role, params string[] providerRoles) =>
        Assert.True(BffAuthentication.ProviderRoleMismatch(role, providerRoles));

    [Fact]
    public void Customer_with_no_privileged_provider_role_is_consistent()
    {
        Assert.False(BffAuthentication.ProviderRoleMismatch(AppRole.Customer, new[] { "default-roles-manada" }));
        Assert.False(BffAuthentication.ProviderRoleMismatch(AppRole.Customer, Array.Empty<string>()));
    }

    [Theory]
    [InlineData("admin")]
    [InlineData("staff")]
    [InlineData("superadmin")]
    public void Customer_carrying_a_privileged_provider_role_is_rejected(string providerRole) =>
        Assert.True(BffAuthentication.ProviderRoleMismatch(AppRole.Customer, new[] { providerRole }));

    [Theory]
    [InlineData(null, "/")]
    [InlineData("", "/")]
    [InlineData("/account", "/account")]
    [InlineData("/portal/admin?tab=users", "/portal/admin?tab=users")]
    [InlineData("//evil.example", "/")]
    [InlineData("/\\evil.example", "/")]
    [InlineData("https://evil.example", "/")]
    [InlineData("http://evil.example/a", "/")]
    [InlineData("evil.example", "/")]
    public void Return_urls_are_limited_to_local_paths(string? returnUrl, string expected) =>
        Assert.Equal(expected, BffEndpoints.SafeReturnUrl(returnUrl));
}
