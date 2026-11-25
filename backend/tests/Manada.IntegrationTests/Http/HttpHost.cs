using System.Net;
using System.Security.Claims;
using System.Text;
using Manada.API.Auth;
using Manada.Domain.Identity;
using Manada.IntegrationTests.Infrastructure;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Manada.IntegrationTests.Http;

/// <summary>
/// Runs the real application pipeline (authentication, cookie validation, CSRF, authorization, endpoints)
/// against a PostgreSQL test database. Only the identity provider's token endpoint is replaced, and only
/// for the refresh test. No authentication step is bypassed.
/// </summary>
public sealed class ManadaWebFactory : WebApplicationFactory<Program>
{
    /// <summary>
    /// The application reads its connection string while services are registered, which happens before
    /// host configuration callbacks run. An environment variable is read at host creation, so it is used here.
    /// Test collections are serial, so only one factory uses the variable at a time.
    /// </summary>
    public ManadaWebFactory(string connectionString)
    {
        Environment.SetEnvironmentVariable(ConnectionVariable, connectionString);
    }

    private const string ConnectionVariable = "ConnectionStrings__ManadaDb";

    /// <summary>Application-level identity-provider fake. Not Keycloak; provider behaviour is verified separately.</summary>
    public FakeIdentityProvider Identity { get; } = new();

    public override async ValueTask DisposeAsync()
    {
        await base.DisposeAsync();
        Environment.SetEnvironmentVariable(ConnectionVariable, null);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<Manada.Application.Abstractions.IIdentityProviderAdmin>();
            services.AddSingleton<Manada.Application.Abstractions.IIdentityProviderAdmin>(Identity);
            // Test identities carry the same issuer the application is configured to accept.
            services.RemoveAll<Manada.Application.Abstractions.IIdentityIssuer>();
            services.AddSingleton<Manada.Application.Abstractions.IIdentityIssuer>(new FixedIssuer());
            services.AddHttpClient("keycloak-token").ConfigurePrimaryHttpMessageHandler(() => new StubTokenHandler());
        });
    }
}

/// <summary>Stands in for the identity provider's token endpoint only. It never grants assurance.</summary>
internal sealed class StubTokenHandler : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
        Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("{\"access_token\":\"refreshed-access\",\"expires_in\":300,\"refresh_token\":\"rotated-refresh\"}", Encoding.UTF8, "application/json"),
        });
}

/// <summary>One HTTP host and one PostgreSQL database per test, so every test starts from known state.</summary>
public sealed class HttpHost : IAsyncDisposable
{
    public const string SessionCookie = "manada.session";

    private readonly ManadaWebFactory _factory;
    private readonly Dictionary<string, string> _storeKeys = new(StringComparer.Ordinal);

    private HttpHost(TestDatabase database, ManadaWebFactory factory, HttpClient client)
    {
        Database = database;
        _factory = factory;
        Client = client;
    }

    public TestDatabase Database { get; }

    public HttpClient Client { get; }

    public FakeIdentityProvider Identity => _factory.Identity;

    public IServiceProvider Services => _factory.Services;

    public static async Task<HttpHost> CreateAsync(PostgresFixture postgres)
    {
        var database = await postgres.CreateDatabaseAsync();
        var factory = new ManadaWebFactory(database.ConnectionString);
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        return new HttpHost(database, factory, client);
    }

    /// <summary>Reads the CSRF token the application issues for a session, as the browser does from /bff/session.</summary>
    public async Task<string> CsrfTokenAsync(string sessionKey)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/bff/session");
        request.Headers.Add("Cookie", CookieHeader(sessionKey));
        using var response = await Client.SendAsync(request);
        response.EnsureSuccessStatusCode();
        using var json = System.Text.Json.JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return json.RootElement.GetProperty("csrfToken").GetString()!;
    }

    /// <summary>
    /// Creates a server-side session through the application's own session store, exactly as the BFF does
    /// after a successful sign-in. The cookie is then validated by the real authentication middleware.
    /// </summary>
    public async Task<string> SessionAsync(
        AppUser user,
        int assurance,
        DateTimeOffset? issuedUtc = null,
        DateTimeOffset? expiresUtc = null,
        DateTimeOffset? accessExpiresUtc = null)
    {
        var services = _factory.Services;
        var now = DateTimeOffset.UtcNow;
        var claims = new List<Claim>
        {
            new("sub", user.Identities.First().Subject),
            new("iss", FixedIssuer.Value),
            new(ManadaClaims.UserId, user.Id.ToString()),
            new(ManadaClaims.Role, user.Role.ToString()),
            new(ManadaClaims.Assurance, assurance.ToString()),
            new("name", user.DisplayName),
        };

        var properties = new AuthenticationProperties
        {
            IssuedUtc = issuedUtc ?? now,
            ExpiresUtc = expiresUtc ?? now.AddHours(8),
            IsPersistent = false,
        };
        properties.StoreTokens(
        [
            new AuthenticationToken { Name = "access_token", Value = "stored-access" },
            new AuthenticationToken { Name = "refresh_token", Value = "stored-refresh" },
            new AuthenticationToken
            {
                Name = "expires_at",
                Value = (accessExpiresUtc ?? now.AddHours(1)).ToString("o", System.Globalization.CultureInfo.InvariantCulture),
            },
        ]);

        var identity = new ClaimsIdentity(claims, BffAuthentication.CookieScheme, "name", "roles");

        // The framework's own cookie sign-in issues the session, so the cookie format is the one the
        // middleware reads back. The same mechanism completes the OIDC sign-in in production.
        using var scope = services.CreateScope();
        var httpContext = new DefaultHttpContext { RequestServices = scope.ServiceProvider };
        await scope.ServiceProvider.GetRequiredService<IAuthenticationService>()
            .SignInAsync(httpContext, BffAuthentication.CookieScheme, new ClaimsPrincipal(identity), properties);

        var setCookie = httpContext.Response.Headers.SetCookie.ToString();
        var prefix = SessionCookie + "=";
        var start = setCookie.IndexOf(prefix, StringComparison.Ordinal);
        if (start < 0)
        {
            throw new InvalidOperationException("The sign-in did not issue the session cookie.");
        }

        var valueStart = start + prefix.Length;
        var valueEnd = setCookie.IndexOf(';', valueStart);
        var cookieValue = valueEnd < 0 ? setCookie[valueStart..] : setCookie[valueStart..valueEnd];

        // Remember the server-side session key behind this cookie, for session-handle assertions.
        await using var db = Database.CreateContext();
        var stored = await db.AuthSessions.AsNoTracking()
            .Where(s => s.UserId == user.Id)
            .OrderByDescending(s => s.CreatedUtc)
            .FirstAsync();
        _storeKeys[cookieValue] = stored.Key;
        return cookieValue;
    }

    /// <summary>The non-secret handle the API exposes for the session behind a cookie.</summary>
    public string HandleFor(string cookieValue) =>
        Manada.Application.Governance.SessionHandle.From(_storeKeys[cookieValue]);

    public static string CookieHeader(string? sessionKey) =>
        $"{SessionCookie}={sessionKey ?? "forged-session-value"}";

    public async ValueTask DisposeAsync()
    {
        Client.Dispose();
        await _factory.DisposeAsync();
    }
}
