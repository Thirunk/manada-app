using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Manada.Application.Abstractions;
using Manada.Application.Common;
using Manada.Domain.Identity;
using Microsoft.Extensions.Options;

namespace Manada.Infrastructure.Identity;

/// <summary>
/// Keycloak Admin REST client. It uses a confidential service client with the minimum
/// realm-management roles. Every operation obtains a bearer token and sends it explicitly.
/// Credentials come from configuration and are never logged. Provider error bodies are not
/// returned to callers.
/// </summary>
public sealed class KeycloakAdminClient(HttpClient http, IOptions<IdentityProviderOptions> options) : IIdentityProviderAdmin
{
    private readonly IdentityProviderOptions _options = options.Value;

    private static readonly string[] AppRoleNames = ["superadmin", "admin", "staff", "customer"];

    public async Task<string> CreateUserAsync(IdentityUserRequest request, CancellationToken cancellationToken = default)
    {
        var accessToken = await GetAccessTokenAsync(cancellationToken);
        var body = new
        {
            username = request.Email,
            email = request.Email,
            firstName = request.FirstName,
            lastName = request.LastName,
            enabled = true,
            emailVerified = false,
            requiredActions = request.RequiredActions,
        };

        using var response = await SendRawAsync(HttpMethod.Post, Admin("users"), accessToken, body, cancellationToken);

        if (response.StatusCode == HttpStatusCode.Conflict)
        {
            throw new ConflictException("An identity with this email address already exists.");
        }

        EnsureSuccess(response, "create the identity");

        var location = response.Headers.Location
            ?? throw new DependencyFailureException("The identity provider did not return the new account.");
        var subject = location.Segments.Last().TrimEnd('/');

        await SetRealmRoleAsync(subject, request.Role, cancellationToken);
        return subject;
    }

    public async Task SetRealmRoleAsync(string subject, AppRole role, CancellationToken cancellationToken = default)
    {
        var accessToken = await GetAccessTokenAsync(cancellationToken);
        var mappingsUrl = Admin($"users/{Uri.EscapeDataString(subject)}/role-mappings/realm");

        var current = await GetJsonAsync<List<RoleRepresentation>>(mappingsUrl, accessToken, cancellationToken);
        var target = ToRoleName(role);

        var toRemove = current.Where(r => AppRoleNames.Contains(r.Name) && r.Name != target).ToList();
        if (toRemove.Count > 0)
        {
            await SendAsync(HttpMethod.Delete, mappingsUrl, accessToken, toRemove, "remove the previous role", cancellationToken);
        }

        if (!current.Any(r => r.Name == target))
        {
            var roleRepresentation = await GetJsonAsync<RoleRepresentation>(Admin($"roles/{target}"), accessToken, cancellationToken);
            await SendAsync(HttpMethod.Post, mappingsUrl, accessToken, new[] { roleRepresentation }, "assign the role", cancellationToken);
        }
    }

    public async Task SetEnabledAsync(string subject, bool enabled, CancellationToken cancellationToken = default)
    {
        var accessToken = await GetAccessTokenAsync(cancellationToken);
        var userUrl = Admin($"users/{Uri.EscapeDataString(subject)}");
        var user = await GetJsonAsync<JsonElement>(userUrl, accessToken, cancellationToken);

        var update = new Dictionary<string, object?>();
        foreach (var property in user.EnumerateObject())
        {
            update[property.Name] = property.Value.Clone();
        }

        update["enabled"] = enabled;
        await SendAsync(HttpMethod.Put, userUrl, accessToken, update, "update the account status", cancellationToken);
    }

    public async Task SendRequiredActionsEmailAsync(string subject, IReadOnlyCollection<string> actions, CancellationToken cancellationToken = default)
    {
        var accessToken = await GetAccessTokenAsync(cancellationToken);
        await SendAsync(HttpMethod.Put, Admin($"users/{Uri.EscapeDataString(subject)}/execute-actions-email"), accessToken, actions, "send the invitation", cancellationToken);
    }

    public async Task RevokeSessionsAsync(string subject, CancellationToken cancellationToken = default)
    {
        var accessToken = await GetAccessTokenAsync(cancellationToken);
        await SendAsync(HttpMethod.Post, Admin($"users/{Uri.EscapeDataString(subject)}/logout"), accessToken, null, "revoke provider sessions", cancellationToken);
    }

    // ----- helpers -----

    private static string ToRoleName(AppRole role) => role switch
    {
        AppRole.SuperAdmin => "superadmin",
        AppRole.Admin => "admin",
        AppRole.Staff => "staff",
        _ => "customer",
    };

    private string Admin(string path) => $"{_options.AdminBaseUrl.TrimEnd('/')}/admin/realms/{_options.Realm}/{path}";

    private async Task<string> GetAccessTokenAsync(CancellationToken cancellationToken)
    {
        var form = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "client_credentials",
            ["client_id"] = _options.BackendClientId,
            ["client_secret"] = _options.BackendClientSecret,
        });

        using var response = await http.PostAsync(
            $"{_options.AdminBaseUrl.TrimEnd('/')}/realms/{_options.Realm}/protocol/openid-connect/token",
            form,
            cancellationToken);
        EnsureSuccess(response, "authenticate to the identity provider");

        var payload = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken);
        return payload.GetProperty("access_token").GetString()
            ?? throw new DependencyFailureException("The identity provider returned no access token.");
    }

    private Task<HttpResponseMessage> SendRawAsync(HttpMethod method, string url, string accessToken, object? body, CancellationToken cancellationToken)
    {
        var request = new HttpRequestMessage(method, url)
        {
            Headers = { Authorization = new AuthenticationHeaderValue("Bearer", accessToken) },
            Content = body is null ? null : JsonContent.Create(body),
        };
        return http.SendAsync(request, cancellationToken);
    }

    private async Task<T> GetJsonAsync<T>(string url, string accessToken, CancellationToken cancellationToken)
    {
        using var response = await SendRawAsync(HttpMethod.Get, url, accessToken, null, cancellationToken);
        EnsureSuccess(response, "read the identity");
        return await response.Content.ReadFromJsonAsync<T>(cancellationToken)
            ?? throw new DependencyFailureException("The identity provider returned an empty response.");
    }

    private async Task SendAsync(HttpMethod method, string url, string accessToken, object? body, string operation, CancellationToken cancellationToken)
    {
        using var response = await SendRawAsync(method, url, accessToken, body, cancellationToken);
        EnsureSuccess(response, operation);
    }

    private static void EnsureSuccess(HttpResponseMessage response, string operation)
    {
        if (!response.IsSuccessStatusCode)
        {
            // Provider error bodies are deliberately not included in the message.
            throw new DependencyFailureException($"The identity provider could not {operation}. Try again later.");
        }
    }

    private sealed record RoleRepresentation(string Id, string Name);
}

/// <summary>Identity provider configuration. Secrets come from environment or user-secret configuration only.</summary>
public sealed class IdentityProviderOptions
{
    public const string SectionName = "IdentityProvider";

    /// <summary>Public issuer, for example http://localhost:8081/realms/manada. Must match token "iss".</summary>
    public string Authority { get; set; } = string.Empty;

    /// <summary>Base URL reachable from the backend, for example http://keycloak:8080 inside Docker.</summary>
    public string AdminBaseUrl { get; set; } = string.Empty;

    public string Realm { get; set; } = "manada";

    public string BrowserClientId { get; set; } = "manada-bff";

    public string BrowserClientSecret { get; set; } = string.Empty;

    public string BackendClientId { get; set; } = "manada-backend";

    public string BackendClientSecret { get; set; } = string.Empty;
}
