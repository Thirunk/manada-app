using Manada.API.Auth;
using Manada.API.Options;
using Manada.Application.Abstractions;
using Manada.Application.Audit;
using Manada.Application.Common;
using Manada.Application.Users;
using Manada.Domain.Audit;
using Manada.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.Extensions.Options;

namespace Manada.API.Endpoints;

/// <summary>Backend-for-Frontend endpoints. The browser never receives tokens.</summary>
public static class BffEndpoints
{
    public static IEndpointRouteBuilder MapBffEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/bff").WithTags("Session");

        group.MapGet("/login", (string? returnUrl) =>
                Results.Challenge(
                    new AuthenticationProperties { RedirectUri = SafeReturnUrl(returnUrl) },
                    [BffAuthentication.OidcScheme]))
            .AllowAnonymous()
            .WithSummary("Starts the sign-in flow (authorization code with PKCE).");

        group.MapGet("/session", GetSessionAsync)
            .AllowAnonymous()
            .WithSummary("Returns the signed-in user, permissions and CSRF token, or authenticated=false.");

        group.MapPost("/logout", LogoutAsync)
            .WithSummary("Revokes the server-side session and clears the session cookie.");

        return app;
    }

    private static async Task<IResult> GetSessionAsync(
        HttpContext http,
        IAppDbContext db,
        UserService users,
        CsrfProtection csrf,
        IOptions<BffOptions> options,
        CancellationToken ct)
    {
        if (http.User.Identity?.IsAuthenticated != true)
        {
            return Results.Ok(new { authenticated = false });
        }

        try
        {
            var actor = await ActorResolver.ResolveAsync(http, db, ct);
            var user = await users.GetCurrentUserAsync(actor, ct);
            var permissions = await users.GetPermissionsAsync(actor, ct);
            var sessionKey = http.Request.Cookies[options.Value.CookieName] ?? string.Empty;

            return Results.Ok(new
            {
                authenticated = true,
                csrfToken = csrf.IssueToken(sessionKey),
                user,
                permissions,
            });
        }
        catch (ForbiddenException)
        {
            return Results.Ok(new { authenticated = false });
        }
    }

    private static async Task<IResult> LogoutAsync(
        HttpContext http,
        DbTicketStore store,
        IAppDbContext db,
        IOptions<BffOptions> options,
        CancellationToken ct)
    {
        var sessionKey = http.Request.Cookies[options.Value.CookieName];
        if (!string.IsNullOrEmpty(sessionKey))
        {
            await store.RemoveAsync(sessionKey);
        }

        var userId = http.User.FindFirst(ManadaClaims.UserId)?.Value;
        if (Guid.TryParse(userId, out var id))
        {
            db.AuditEvents.Add(new AuditEvent("auth.signout", AuditOutcome.Success, id, http.User.FindFirst("sub")?.Value, "User", id.ToString(), http.TraceIdentifier, null));
            await db.SaveChangesAsync(ct);
        }

        await http.SignOutAsync(BffAuthentication.CookieScheme);
        return Results.Ok(new { redirectUrl = "/" });
    }

    /// <summary>Only local paths are accepted, which prevents open redirects.</summary>
    internal static string SafeReturnUrl(string? returnUrl)
    {
        if (string.IsNullOrWhiteSpace(returnUrl))
        {
            return "/";
        }

        var candidate = returnUrl.Trim();
        if (!candidate.StartsWith('/') || candidate.StartsWith("//") || candidate.Contains('\\') || candidate.Contains("://"))
        {
            return "/";
        }

        return candidate;
    }
}
