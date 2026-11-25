using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Manada.API.Auth;
using Manada.Application.Governance;
using Manada.Domain.Identity;
using Manada.Infrastructure.Persistence;
using Manada.IntegrationTests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Manada.IntegrationTests.Http;

/// <summary>
/// HTTP-level security verification through the real pipeline. Sessions are created by the application's own
/// session store (controlled test identities, labelled as such). Assurance results here are application-level;
/// they are not Keycloak MFA verification.
/// </summary>
[Collection("Postgres")]
public sealed class HttpSecurityTests(PostgresFixture postgres)
{
    private const string FrontendOrigin = "http://localhost:5173";

    private static async Task<HttpResponseMessage> SendAsync(
        HttpHost host,
        HttpMethod method,
        string path,
        string? sessionKey,
        object? body = null,
        string? csrf = null,
        string? origin = FrontendOrigin)
    {
        var request = new HttpRequestMessage(method, path);
        if (sessionKey is not null)
        {
            request.Headers.Add("Cookie", HttpHost.CookieHeader(sessionKey));
        }

        if (csrf is not null)
        {
            request.Headers.Add(CsrfMiddleware.HeaderName, csrf);
        }

        if (origin is not null && method != HttpMethod.Get)
        {
            request.Headers.Add("Origin", origin);
        }

        if (body is not null)
        {
            request.Content = JsonContent.Create(body);
        }

        return await host.Client.SendAsync(request);
    }

    private static async Task<uint> RowVersionAsync(TestDatabase database, Guid userId)
    {
        await using var db = database.CreateContext();
        return (await db.Users.AsNoTracking().SingleAsync(u => u.Id == userId)).RowVersion;
    }

    private static async Task<AppUser> Reload(TestDatabase database, Guid userId)
    {
        await using var db = database.CreateContext();
        return await db.Users.AsNoTracking().SingleAsync(u => u.Id == userId);
    }

    private static void AssertNotAllowed(HttpResponseMessage response) =>
        Assert.NotEqual(HttpStatusCode.OK, response.StatusCode);

    // ----- session acceptance and rejection -----

    [Fact]
    public async Task A_valid_session_is_accepted_by_the_real_pipeline()
    {
        await using var host = await HttpHost.CreateAsync(postgres);
        await using var db = host.Database.CreateContext();
        var customer = await Seed.UserAsync(db, AppRole.Customer);
        var key = await host.SessionAsync(customer, assurance: 0);

        var response = await SendAsync(host, HttpMethod.Get, "/api/me", key);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains(customer.Email, await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task An_unknown_session_cookie_is_rejected()
    {
        await using var host = await HttpHost.CreateAsync(postgres);

        var response = await SendAsync(host, HttpMethod.Get, "/api/me", "forged-session-value");

        AssertNotAllowed(response);
    }

    [Fact]
    public async Task An_expired_session_is_rejected()
    {
        await using var host = await HttpHost.CreateAsync(postgres);
        await using var db = host.Database.CreateContext();
        var customer = await Seed.UserAsync(db, AppRole.Customer);
        var key = await host.SessionAsync(customer, assurance: 0, expiresUtc: DateTimeOffset.UtcNow.AddMinutes(-1));

        AssertNotAllowed(await SendAsync(host, HttpMethod.Get, "/api/me", key));
    }

    [Fact]
    public async Task The_absolute_session_lifetime_is_enforced()
    {
        await using var host = await HttpHost.CreateAsync(postgres);
        await using var db = host.Database.CreateContext();
        var customer = await Seed.UserAsync(db, AppRole.Customer);
        var key = await host.SessionAsync(customer, assurance: 0,
            issuedUtc: DateTimeOffset.UtcNow.AddHours(-9),
            expiresUtc: DateTimeOffset.UtcNow.AddHours(1));

        AssertNotAllowed(await SendAsync(host, HttpMethod.Get, "/api/me", key));
    }

    [Fact]
    public async Task A_session_of_a_disabled_account_is_rejected_on_the_next_request()
    {
        await using var host = await HttpHost.CreateAsync(postgres);
        await using var db = host.Database.CreateContext();
        var customer = await Seed.UserAsync(db, AppRole.Customer);
        var key = await host.SessionAsync(customer, assurance: 0);
        Assert.Equal(HttpStatusCode.OK, (await SendAsync(host, HttpMethod.Get, "/api/me", key)).StatusCode);

        var stored = await db.Users.SingleAsync(u => u.Id == customer.Id);
        stored.Disable();
        await db.SaveChangesAsync();

        AssertNotAllowed(await SendAsync(host, HttpMethod.Get, "/api/me", key));
    }

    // ----- revocation through the application's own mutations -----

    [Fact]
    public async Task Disabling_an_account_through_the_api_revokes_its_session()
    {
        await using var host = await HttpHost.CreateAsync(postgres);
        await using var db = host.Database.CreateContext();
        var superAdmin = await Seed.UserAsync(db, AppRole.SuperAdmin);
        var target = await Seed.UserAsync(db, AppRole.Staff);
        var targetKey = await host.SessionAsync(target, assurance: 2);
        var adminKey = await host.SessionAsync(superAdmin, assurance: 2);
        var rowVersion = await RowVersionAsync(host.Database, target.Id);

        var disable = await SendAsync(host, HttpMethod.Put, $"/api/admin/users/{target.Id}/status", adminKey,
            new { active = false, rowVersion }, await host.CsrfTokenAsync(adminKey));

        Assert.Equal(HttpStatusCode.OK, disable.StatusCode);
        AssertNotAllowed(await SendAsync(host, HttpMethod.Get, "/api/me", targetKey));
    }

    [Fact]
    public async Task Changing_a_role_through_the_api_revokes_the_existing_session()
    {
        await using var host = await HttpHost.CreateAsync(postgres);
        await using var db = host.Database.CreateContext();
        var superAdmin = await Seed.UserAsync(db, AppRole.SuperAdmin);
        var target = await Seed.UserAsync(db, AppRole.Admin);
        var targetKey = await host.SessionAsync(target, assurance: 2);
        var adminKey = await host.SessionAsync(superAdmin, assurance: 2);
        var rowVersion = await RowVersionAsync(host.Database, target.Id);

        var change = await SendAsync(host, HttpMethod.Put, $"/api/admin/users/{target.Id}/role", adminKey,
            new { role = "Staff", rowVersion }, await host.CsrfTokenAsync(adminKey));

        Assert.Equal(HttpStatusCode.OK, change.StatusCode);
        AssertNotAllowed(await SendAsync(host, HttpMethod.Get, "/api/me", targetKey));
    }

    [Fact]
    public async Task Removing_a_permission_takes_effect_on_the_next_authorized_request()
    {
        await using var host = await HttpHost.CreateAsync(postgres);
        await using var db = host.Database.CreateContext();
        var admin = await Seed.UserAsync(db, AppRole.Admin);
        var key = await host.SessionAsync(admin, assurance: 2);
        var csrf = await host.CsrfTokenAsync(key);
        var body = new { email = $"perm.{Guid.NewGuid():N}@manada.test", fullName = "Perm Check", role = "Staff", jobTitle = (string?)null, branchCode = (string?)null };

        Assert.Equal(HttpStatusCode.Created, (await SendAsync(host, HttpMethod.Post, "/api/admin/users", key, body, csrf)).StatusCode);

        await db.RolePermissions.Where(rp => rp.Role == AppRole.Admin && rp.PermissionCode == Manada.Domain.Identity.PermissionCodes.UsersManageStaff).ExecuteDeleteAsync();

        Assert.Equal(HttpStatusCode.Forbidden, (await SendAsync(host, HttpMethod.Post, "/api/admin/users", key,
            new { email = $"perm2.{Guid.NewGuid():N}@manada.test", fullName = "Perm Check Two", role = "Staff", jobTitle = (string?)null, branchCode = (string?)null }, csrf)).StatusCode);
    }

    // ----- assurance (ACR) -----

    [Theory]
    [InlineData(AppRole.SuperAdmin, 0)]
    [InlineData(AppRole.Admin, 0)]
    [InlineData(AppRole.SuperAdmin, 1)]
    [InlineData(AppRole.Admin, 1)]
    public async Task Privileged_sessions_without_mfa_assurance_are_rejected(AppRole role, int assurance)
    {
        await using var host = await HttpHost.CreateAsync(postgres, mfaEnforced: true);
        await using var db = host.Database.CreateContext();
        var account = await Seed.UserAsync(db, role);
        var key = await host.SessionAsync(account, assurance);

        AssertNotAllowed(await SendAsync(host, HttpMethod.Get, "/api/admin/users?role=Staff", key));
    }

    [Fact]
    public async Task Privileged_sessions_with_mfa_assurance_are_accepted()
    {
        await using var host = await HttpHost.CreateAsync(postgres);
        await using var db = host.Database.CreateContext();
        var admin = await Seed.UserAsync(db, AppRole.Admin);
        var key = await host.SessionAsync(admin, assurance: 2);

        Assert.Equal(HttpStatusCode.OK, (await SendAsync(host, HttpMethod.Get, "/api/admin/users?role=Staff", key)).StatusCode);
    }

    [Fact]
    public async Task Customer_sessions_are_not_required_to_have_mfa_assurance()
    {
        await using var host = await HttpHost.CreateAsync(postgres);
        await using var db = host.Database.CreateContext();
        var customer = await Seed.UserAsync(db, AppRole.Customer);
        var key = await host.SessionAsync(customer, assurance: 0);

        Assert.Equal(HttpStatusCode.OK, (await SendAsync(host, HttpMethod.Get, "/api/me", key)).StatusCode);
    }

    [Fact]
    public async Task A_token_refresh_does_not_raise_authentication_assurance()
    {
        await using var host = await HttpHost.CreateAsync(postgres, mfaEnforced: true);
        await using var db = host.Database.CreateContext();
        var admin = await Seed.UserAsync(db, AppRole.Admin);
        // The access token is near expiry, so the middleware performs a controlled refresh on this request.
        var key = await host.SessionAsync(admin, assurance: 1, accessExpiresUtc: DateTimeOffset.UtcNow.AddSeconds(30));

        var first = await SendAsync(host, HttpMethod.Get, "/api/admin/users?role=Staff", key);
        var second = await SendAsync(host, HttpMethod.Get, "/api/admin/users?role=Staff", key);

        AssertNotAllowed(first);
        AssertNotAllowed(second);
    }

    [Fact]
    public async Task A_token_refresh_keeps_a_sufficient_assurance_session_working()
    {
        await using var host = await HttpHost.CreateAsync(postgres);
        await using var db = host.Database.CreateContext();
        var admin = await Seed.UserAsync(db, AppRole.Admin);
        var key = await host.SessionAsync(admin, assurance: 2, accessExpiresUtc: DateTimeOffset.UtcNow.AddSeconds(30));

        Assert.Equal(HttpStatusCode.OK, (await SendAsync(host, HttpMethod.Get, "/api/admin/users?role=Staff", key)).StatusCode);
    }

    // ----- CSRF -----

    [Fact]
    public async Task Account_creation_without_a_csrf_token_is_rejected()
    {
        await using var host = await HttpHost.CreateAsync(postgres);
        await using var db = host.Database.CreateContext();
        var superAdmin = await Seed.UserAsync(db, AppRole.SuperAdmin);
        var key = await host.SessionAsync(superAdmin, assurance: 2);

        var response = await SendAsync(host, HttpMethod.Post, "/api/admin/users", key,
            new { email = "csrf.none@manada.test", fullName = "No Token", role = "Staff", jobTitle = (string?)null, branchCode = (string?)null });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Empty(host.Identity.Created);
    }

    [Fact]
    public async Task Account_creation_with_a_csrf_token_is_accepted()
    {
        await using var host = await HttpHost.CreateAsync(postgres);
        await using var db = host.Database.CreateContext();
        var superAdmin = await Seed.UserAsync(db, AppRole.SuperAdmin);
        var key = await host.SessionAsync(superAdmin, assurance: 2);

        var response = await SendAsync(host, HttpMethod.Post, "/api/admin/users", key,
            new { email = "csrf.ok@manada.test", fullName = "With Token", role = "Staff", jobTitle = (string?)null, branchCode = (string?)null },
            await host.CsrfTokenAsync(key));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Organization_rename_without_a_csrf_token_is_rejected_and_with_one_is_accepted()
    {
        await using var host = await HttpHost.CreateAsync(postgres);
        await using var db = host.Database.CreateContext();
        var superAdmin = await Seed.UserAsync(db, AppRole.SuperAdmin);
        var key = await host.SessionAsync(superAdmin, assurance: 2);
        var current = await (await SendAsync(host, HttpMethod.Get, "/api/admin/organization", key)).Content.ReadFromJsonAsync<OrganizationDto>();

        var without = await SendAsync(host, HttpMethod.Put, "/api/admin/organization", key, new { name = "Renamed Without Token", rowVersion = current!.RowVersion });
        var with = await SendAsync(host, HttpMethod.Put, "/api/admin/organization", key, new { name = "Renamed With Token", rowVersion = current.RowVersion }, await host.CsrfTokenAsync(key));

        Assert.Equal(HttpStatusCode.Forbidden, without.StatusCode);
        Assert.Equal(HttpStatusCode.OK, with.StatusCode);
    }

    [Fact]
    public async Task Session_revocation_without_a_csrf_token_is_rejected_and_the_session_stays_active()
    {
        await using var host = await HttpHost.CreateAsync(postgres);
        await using var db = host.Database.CreateContext();
        var customer = await Seed.UserAsync(db, AppRole.Customer);
        var key = await host.SessionAsync(customer, assurance: 0);
        var second = await host.SessionAsync(customer, assurance: 0);
        var handle = host.HandleFor(second);

        var response = await SendAsync(host, HttpMethod.Post, $"/api/me/sessions/{handle}/revoke", key);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await SendAsync(host, HttpMethod.Get, "/api/me", second)).StatusCode);
    }

    [Fact]
    public async Task A_request_from_an_unexpected_origin_is_rejected_even_with_a_valid_token()
    {
        await using var host = await HttpHost.CreateAsync(postgres);
        await using var db = host.Database.CreateContext();
        var superAdmin = await Seed.UserAsync(db, AppRole.SuperAdmin);
        var key = await host.SessionAsync(superAdmin, assurance: 2);

        var response = await SendAsync(host, HttpMethod.Post, "/api/admin/users", key,
            new { email = "origin@manada.test", fullName = "Foreign", role = "Staff", jobTitle = (string?)null, branchCode = (string?)null },
            await host.CsrfTokenAsync(key), origin: "https://evil.example");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // ----- ownership, scope and concurrency -----

    [Fact]
    public async Task A_caller_cannot_revoke_another_accounts_session_by_handle()
    {
        await using var host = await HttpHost.CreateAsync(postgres);
        await using var db = host.Database.CreateContext();
        var owner = await Seed.UserAsync(db, AppRole.Customer);
        var intruder = await Seed.UserAsync(db, AppRole.Customer);
        var ownerKey = await host.SessionAsync(owner, assurance: 0);
        var intruderKey = await host.SessionAsync(intruder, assurance: 0);
        var handle = host.HandleFor(ownerKey);

        var response = await SendAsync(host, HttpMethod.Post, $"/api/me/sessions/{handle}/revoke", intruderKey, csrf: await host.CsrfTokenAsync(intruderKey));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await SendAsync(host, HttpMethod.Get, "/api/me", ownerKey)).StatusCode);
    }

    [Fact]
    public async Task Session_listing_shows_only_the_callers_own_sessions_without_keys()
    {
        await using var host = await HttpHost.CreateAsync(postgres);
        await using var db = host.Database.CreateContext();
        var user = await Seed.UserAsync(db, AppRole.Customer);
        var other = await Seed.UserAsync(db, AppRole.Customer);
        var mine = await host.SessionAsync(user, assurance: 0);
        await host.SessionAsync(other, assurance: 0);

        var text = await (await SendAsync(host, HttpMethod.Get, "/api/me/sessions", mine)).Content.ReadAsStringAsync();
        using var json = JsonDocument.Parse(text);

        Assert.Equal(1, json.RootElement.GetArrayLength());
        Assert.Equal(host.HandleFor(mine), json.RootElement[0].GetProperty("handle").GetString());
        Assert.DoesNotContain(mine, text, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Customers_read_only_their_own_account()
    {
        await using var host = await HttpHost.CreateAsync(postgres);
        await using var db = host.Database.CreateContext();
        var customer = await Seed.UserAsync(db, AppRole.Customer);
        var other = await Seed.UserAsync(db, AppRole.Customer);
        var key = await host.SessionAsync(customer, assurance: 0);

        var own = await SendAsync(host, HttpMethod.Get, "/api/me/account", key);
        var foreign = await SendAsync(host, HttpMethod.Get, $"/api/admin/users/{other.Id}", key);

        Assert.Equal(HttpStatusCode.OK, own.StatusCode);
        Assert.Contains(customer.Email, await own.Content.ReadAsStringAsync());
        Assert.Equal(HttpStatusCode.Forbidden, foreign.StatusCode);
    }

    [Theory]
    [InlineData("GET", "/api/admin/users")]
    [InlineData("GET", "/api/admin/audit")]
    [InlineData("GET", "/api/admin/organization")]
    public async Task Staff_cannot_reach_administrative_endpoints(string method, string path)
    {
        await using var host = await HttpHost.CreateAsync(postgres);
        await using var db = host.Database.CreateContext();
        var staff = await Seed.UserAsync(db, AppRole.Staff);
        var key = await host.SessionAsync(staff, assurance: 2);

        var response = await SendAsync(host, new HttpMethod(method), path, key);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Staff_cannot_create_accounts()
    {
        await using var host = await HttpHost.CreateAsync(postgres);
        await using var db = host.Database.CreateContext();
        var staff = await Seed.UserAsync(db, AppRole.Staff);
        var key = await host.SessionAsync(staff, assurance: 2);

        var response = await SendAsync(host, HttpMethod.Post, "/api/admin/users", key,
            new { email = "staffmake@manada.test", fullName = "Nope", role = "Customer", jobTitle = (string?)null, branchCode = (string?)null },
            await host.CsrfTokenAsync(key));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Empty(host.Identity.Created);
    }

    [Fact]
    public async Task Admin_scope_hides_superadmin_and_peer_admin_accounts_as_not_found()
    {
        await using var host = await HttpHost.CreateAsync(postgres);
        await using var db = host.Database.CreateContext();
        var admin = await Seed.UserAsync(db, AppRole.Admin);
        var superAdmin = await Seed.UserAsync(db, AppRole.SuperAdmin);
        var peer = await Seed.UserAsync(db, AppRole.Admin);
        var staff = await Seed.UserAsync(db, AppRole.Staff);
        var key = await host.SessionAsync(admin, assurance: 2);

        Assert.Equal(HttpStatusCode.NotFound, (await SendAsync(host, HttpMethod.Get, $"/api/admin/users/{superAdmin.Id}", key)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await SendAsync(host, HttpMethod.Get, $"/api/admin/users/{peer.Id}", key)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await SendAsync(host, HttpMethod.Get, $"/api/admin/users/{staff.Id}", key)).StatusCode);
    }

    [Fact]
    public async Task Admin_cannot_disable_a_superadmin_through_the_api()
    {
        await using var host = await HttpHost.CreateAsync(postgres);
        await using var db = host.Database.CreateContext();
        var admin = await Seed.UserAsync(db, AppRole.Admin);
        var superAdmin = await Seed.UserAsync(db, AppRole.SuperAdmin);
        var key = await host.SessionAsync(admin, assurance: 2);
        var rowVersion = await RowVersionAsync(host.Database, superAdmin.Id);

        var response = await SendAsync(host, HttpMethod.Put, $"/api/admin/users/{superAdmin.Id}/status", key,
            new { active = false, rowVersion }, await host.CsrfTokenAsync(key));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal(UserStatus.Active, (await Reload(host.Database, superAdmin.Id)).Status);
    }

    [Fact]
    public async Task A_stale_row_version_on_a_status_change_returns_conflict()
    {
        await using var host = await HttpHost.CreateAsync(postgres);
        await using var db = host.Database.CreateContext();
        var admin = await Seed.UserAsync(db, AppRole.Admin);
        var staff = await Seed.UserAsync(db, AppRole.Staff);
        var key = await host.SessionAsync(admin, assurance: 2);
        var csrf = await host.CsrfTokenAsync(key);
        var stale = await RowVersionAsync(host.Database, staff.Id);

        Assert.Equal(HttpStatusCode.OK, (await SendAsync(host, HttpMethod.Put, $"/api/admin/users/{staff.Id}/status", key,
            new { active = false, rowVersion = stale }, csrf)).StatusCode);

        var conflict = await SendAsync(host, HttpMethod.Put, $"/api/admin/users/{staff.Id}/status", key,
            new { active = true, rowVersion = stale }, csrf);

        Assert.Equal(HttpStatusCode.Conflict, conflict.StatusCode);
    }


    [Fact]
    public async Task Staff_sessions_without_mfa_assurance_are_rejected_when_enforcement_is_enabled()
    {
        await using var host = await HttpHost.CreateAsync(postgres, mfaEnforced: true);
        await using var db = host.Database.CreateContext();
        var staff = await Seed.UserAsync(db, AppRole.Staff);
        var key = await host.SessionAsync(staff, assurance: 0);

        AssertNotAllowed(await SendAsync(host, HttpMethod.Get, "/api/me", key));
    }

    [Theory]
    [InlineData(AppRole.SuperAdmin)]
    [InlineData(AppRole.Admin)]
    [InlineData(AppRole.Staff)]
    [InlineData(AppRole.Customer)]
    public async Task Password_only_sessions_are_accepted_for_every_role_under_the_default_policy(AppRole role)
    {
        // Owner decision for this release: MFA is optional for all roles. Default enforcement is disabled.
        await using var host = await HttpHost.CreateAsync(postgres);
        await using var db = host.Database.CreateContext();
        var account = await Seed.UserAsync(db, role);
        var key = await host.SessionAsync(account, assurance: 0);

        var response = await SendAsync(host, HttpMethod.Get, "/api/me", key);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private sealed record OrganizationDto(Guid Id, string Name, uint RowVersion, List<BranchDto> Branches);

    private sealed record BranchDto(Guid Id, string Name, string Code);
}
