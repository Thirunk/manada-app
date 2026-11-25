namespace Manada.API.Middleware;

/// <summary>
/// Baseline security headers for every response. HSTS and CSP are configured at the
/// production edge and are documented in docs/security-baseline.md; they are not claimed here.
/// </summary>
public sealed class SecurityHeadersMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var headers = context.Response.Headers;
        headers["X-Content-Type-Options"] = "nosniff";
        headers["X-Frame-Options"] = "DENY";
        headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=(), usb=()";

        var path = context.Request.Path.Value ?? string.Empty;
        if (path.StartsWith("/api", StringComparison.OrdinalIgnoreCase) || path.StartsWith("/bff", StringComparison.OrdinalIgnoreCase))
        {
            headers["Cache-Control"] = "no-store";
        }

        await next(context);
    }
}
