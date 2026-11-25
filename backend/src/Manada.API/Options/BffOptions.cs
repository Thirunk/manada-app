namespace Manada.API.Options;

/// <summary>Backend-for-Frontend settings. No secrets here: values come from environment or user-secret configuration.</summary>
public sealed class BffOptions
{
    public const string SectionName = "Bff";

    /// <summary>The browser-facing origin, for example http://localhost:5173 in development.</summary>
    public string FrontendOrigin { get; set; } = string.Empty;

    /// <summary>Exact OIDC redirect URI allowlist entry used for sign-in. Host headers are never trusted.</summary>
    public string SignInRedirectUri { get; set; } = string.Empty;

    /// <summary>Exact post-logout redirect URI.</summary>
    public string PostLogoutRedirectUri { get; set; } = string.Empty;

    /// <summary>Session cookie name. Production uses the __Host- prefix, which requires Secure and Path=/.</summary>
    public string CookieName { get; set; } = "manada.session";

    /// <summary>Require Secure cookies. Must be true in production. Local development over HTTP sets it false.</summary>
    public bool SecureCookies { get; set; } = true;

    public int IdleTimeoutMinutes { get; set; } = 30;

    public int AbsoluteTimeoutHours { get; set; } = 8;
}
