using Manada.API.Options;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Options;

namespace Manada.API.Auth;

/// <summary>
/// Synchronizer-style CSRF protection bound to the server-side session. The token is a
/// time-limited protection of the session key, so it cannot be forged without the server's
/// data-protection keys and it expires with the absolute session lifetime.
/// </summary>
public sealed class CsrfProtection(IDataProtectionProvider protection, IOptions<BffOptions> options)
{
    private const string Purpose = "Manada.Csrf.v1";

    private ITimeLimitedDataProtector Protector =>
        protection.CreateProtector(Purpose).ToTimeLimitedDataProtector();

    private TimeSpan Lifetime => TimeSpan.FromHours(options.Value.AbsoluteTimeoutHours);

    public string IssueToken(string sessionKey) => Protector.Protect(sessionKey, Lifetime);

    public bool IsValid(string? token, string? sessionKey)
    {
        if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(sessionKey))
        {
            return false;
        }

        try
        {
            var unprotected = Protector.Unprotect(token);
            return string.Equals(unprotected, sessionKey, StringComparison.Ordinal);
        }
        catch (Exception)
        {
            return false;
        }
    }
}

/// <summary>
/// Rejects state-changing requests to the API or BFF that lack a valid CSRF token or come
/// from an unexpected origin. Safe methods are not affected.
/// </summary>
public sealed class CsrfMiddleware(RequestDelegate next, IOptions<BffOptions> options)
{
    public const string HeaderName = "X-CSRF-TOKEN";

    private static readonly HashSet<string> UnsafeMethods = ["POST", "PUT", "PATCH", "DELETE"];

    public async Task InvokeAsync(HttpContext context, CsrfProtection csrf)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        var guarded = path.StartsWith("/api", StringComparison.OrdinalIgnoreCase) || path.StartsWith("/bff", StringComparison.OrdinalIgnoreCase);

        if (guarded && UnsafeMethods.Contains(context.Request.Method))
        {
            var origin = context.Request.Headers.Origin.FirstOrDefault();
            var allowed = options.Value.FrontendOrigin.TrimEnd('/');
            if (origin is not null && !string.Equals(origin.TrimEnd('/'), allowed, StringComparison.OrdinalIgnoreCase))
            {
                await Reject(context);
                return;
            }

            var sessionKey = context.Request.Cookies[options.Value.CookieName];
            var token = context.Request.Headers[HeaderName].FirstOrDefault();
            if (!csrf.IsValid(token, sessionKey))
            {
                await Reject(context);
                return;
            }
        }

        await next(context);
    }

    private static async Task Reject(HttpContext context)
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        context.Response.ContentType = "application/problem+json";
        await context.Response.WriteAsJsonAsync(new
        {
            type = "https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.4",
            title = "The request could not be verified.",
            status = StatusCodes.Status403Forbidden,
        });
    }
}
