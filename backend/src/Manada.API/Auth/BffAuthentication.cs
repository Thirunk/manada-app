using System.Globalization;
using System.Net.Http.Headers;
using System.Text.Json;
using Manada.Application.Abstractions;
using Manada.Application.Audit;
using Manada.Application.Common;
using Manada.Application.Identity;
using Manada.API.Options;
using Manada.Domain.Audit;
using Manada.Domain.Identity;
using Manada.Infrastructure.Identity;
using Manada.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using System.Security.Claims;

namespace Manada.API.Auth;

/// <summary>
/// Browser authentication for the BFF. OpenID Connect uses the authorization code flow
/// with PKCE and a fixed redirect URI. Tokens stay server-side in the session store.
/// The browser receives only an HttpOnly session cookie.
/// </summary>
public static class BffAuthentication
{
    public const string CookieScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    public const string OidcScheme = OpenIdConnectDefaults.AuthenticationScheme;
    public const string StepUpItem = "manada.stepUp";

    public static IServiceCollection AddBffAuthentication(this IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment)
    {
        var bff = configuration.GetSection(BffOptions.SectionName).Get<BffOptions>() ?? new BffOptions();
        var idp = configuration.GetSection(IdentityProviderOptions.SectionName).Get<IdentityProviderOptions>() ?? new IdentityProviderOptions();

        services.AddSingleton<DbTicketStore>();
        services.AddHttpClient("keycloak-token");
        services.Configure<BffOptions>(configuration.GetSection(BffOptions.SectionName));
        services.AddOptions<CookieAuthenticationOptions>(CookieScheme)
            .Configure<DbTicketStore>((cookieOptions, store) => cookieOptions.SessionStore = store);

        services
            .AddAuthentication(CookieScheme)
            .AddCookie(CookieScheme, options =>
            {
                options.Cookie.Name = bff.CookieName;
                options.Cookie.HttpOnly = true;
                options.Cookie.SameSite = SameSiteMode.Lax;
                options.Cookie.SecurePolicy = bff.SecureCookies ? CookieSecurePolicy.Always : CookieSecurePolicy.SameAsRequest;
                options.Cookie.Path = "/";
                options.ExpireTimeSpan = TimeSpan.FromMinutes(bff.IdleTimeoutMinutes);
                options.SlidingExpiration = true;
                options.Events = new CookieAuthenticationEvents
                {
                    OnValidatePrincipal = ValidatePrincipalAsync,
                    OnRedirectToLogin = context =>
                    {
                        // API callers receive 401 rather than a redirect.
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        return Task.CompletedTask;
                    },
                    OnRedirectToAccessDenied = context =>
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        return Task.CompletedTask;
                    },
                };
            })
            .AddOpenIdConnect(OidcScheme, options =>
            {
                options.Authority = idp.Authority;
                options.ClientId = idp.BrowserClientId;
                options.ClientSecret = idp.BrowserClientSecret;
                options.ResponseType = "code";
                options.UsePkce = true;
                options.SaveTokens = true;
                options.GetClaimsFromUserInfoEndpoint = false;
                options.CallbackPath = "/signin-oidc";
                options.SignedOutCallbackPath = "/signout-callback-oidc";
                options.RequireHttpsMetadata = !environment.IsDevelopment();
                options.Scope.Clear();
                options.Scope.Add("openid");
                options.Scope.Add("profile");
                options.Scope.Add("email");
                options.SignInScheme = CookieScheme;
                options.MapInboundClaims = false;

                if (!string.IsNullOrWhiteSpace(idp.AdminBaseUrl))
                {
                    // Discovery is fetched over the internal network; the issuer stays the public one.
                    options.MetadataAddress = $"{idp.AdminBaseUrl.TrimEnd('/')}/realms/{idp.Realm}/.well-known/openid-configuration";
                }

                options.TokenValidationParameters.ValidIssuer = idp.Authority;
                options.TokenValidationParameters.ValidateAudience = true;
                options.TokenValidationParameters.ValidAudience = idp.BrowserClientId;
                options.TokenValidationParameters.NameClaimType = "name";
                options.TokenValidationParameters.RoleClaimType = "roles";

                options.Events = new OpenIdConnectEvents
                {
                    OnRedirectToIdentityProvider = context =>
                    {
                        // Exact redirect URI from configuration. Host headers are never trusted.
                        context.ProtocolMessage.RedirectUri = bff.SignInRedirectUri;
                        // Request level-2 authentication assurance. Privileged roles must reach it through OTP;
                        // the Keycloak flow treats the request as voluntary for other roles.
                        if (context.Properties.Items.ContainsKey(StepUpItem))
                        {
                            context.ProtocolMessage.SetParameter("acr_values", AssuranceLevels.Mfa.ToString());
                            context.ProtocolMessage.Prompt = "login";
                        }
                        return Task.CompletedTask;
                    },
                    OnRedirectToIdentityProviderForSignOut = context =>
                    {
                        context.ProtocolMessage.PostLogoutRedirectUri = bff.PostLogoutRedirectUri;
                        return Task.CompletedTask;
                    },
                    OnTokenValidated = context => ProvisionAsync(context, bff),
                    OnRemoteFailure = context =>
                    {
                        // Do not reveal provider error details to the browser.
                        context.HandleResponse();
                        context.Response.Redirect($"{bff.FrontendOrigin}/?auth=failed");
                        return Task.CompletedTask;
                    },
                };
            });

        return services;
    }

    /// <summary>
    /// Runs on every authenticated request. Checks the account is still active, enforces the
    /// absolute session lifetime, and refreshes access tokens through a controlled refresh.
    /// </summary>
    private static async Task ValidatePrincipalAsync(CookieValidatePrincipalContext context)
    {
        var services = context.HttpContext.RequestServices;
        var db = services.GetRequiredService<ManadaDbContext>();
        var bff = services.GetRequiredService<IOptions<BffOptions>>().Value;

        var userIdClaim = context.Principal?.FindFirst(ManadaClaims.UserId);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            await RejectAsync(context);
            return;
        }

        var account = await db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new { u.Status, u.Role })
            .FirstOrDefaultAsync();
        if (account is null || account.Status != UserStatus.Active)
        {
            await RejectAsync(context);
            return;
        }

        // The session must still match the database role. A role change forces re-authentication.
        if (context.Principal?.FindFirst(ManadaClaims.Role)?.Value != account.Role.ToString())
        {
            await RejectAsync(context);
            return;
        }

        // Privileged sessions must have been established with the required assurance level.
        // Token refresh keeps the original level; it never raises it.
        var sessionAssurance = ParseAssurance(context.Principal?.FindFirst(ManadaClaims.Assurance)?.Value);
        if (AccountPolicy.RequiresMfa(account.Role, staffMfaEnforced: true) && !AssuranceSatisfied(sessionAssurance))
        {
            await RejectAsync(context);
            return;
        }

        var issued = context.Properties.IssuedUtc;
        if (issued is not null && issued.Value.AddHours(bff.AbsoluteTimeoutHours) < DateTimeOffset.UtcNow)
        {
            await RejectAsync(context);
            return;
        }

        var expiresAtText = context.Properties.GetTokenValue("expires_at");
        if (expiresAtText is not null
            && DateTimeOffset.TryParse(expiresAtText, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var expiresAt)
            && expiresAt <= DateTimeOffset.UtcNow.AddMinutes(1))
        {
            var refreshed = await TryRefreshAsync(context, services);
            if (!refreshed)
            {
                await RejectAsync(context);
                return;
            }

            context.ShouldRenew = true;
        }
    }

    private static async Task<bool> TryRefreshAsync(CookieValidatePrincipalContext context, IServiceProvider services)
    {
        var refreshToken = context.Properties.GetTokenValue("refresh_token");
        if (string.IsNullOrEmpty(refreshToken))
        {
            return false;
        }

        var idp = services.GetRequiredService<IOptions<IdentityProviderOptions>>().Value;
        var http = services.GetRequiredService<IHttpClientFactory>().CreateClient("keycloak-token");
        var tokenEndpoint = $"{idp.AdminBaseUrl.TrimEnd('/')}/realms/{idp.Realm}/protocol/openid-connect/token";

        using var response = await http.PostAsync(tokenEndpoint, new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "refresh_token",
            ["client_id"] = idp.BrowserClientId,
            ["client_secret"] = idp.BrowserClientSecret,
            ["refresh_token"] = refreshToken,
        }));

        if (!response.IsSuccessStatusCode)
        {
            return false;
        }

        using var payload = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var root = payload.RootElement;
        var access = root.GetProperty("access_token").GetString();
        var expiresIn = root.TryGetProperty("expires_in", out var seconds) ? seconds.GetInt32() : 300;
        if (string.IsNullOrEmpty(access))
        {
            return false;
        }

        context.Properties.UpdateTokenValue("access_token", access);
        if (root.TryGetProperty("refresh_token", out var newRefresh) && newRefresh.GetString() is { Length: > 0 } rotated)
        {
            context.Properties.UpdateTokenValue("refresh_token", rotated);
        }

        context.Properties.UpdateTokenValue("expires_at", DateTimeOffset.UtcNow.AddSeconds(expiresIn).ToString("o", CultureInfo.InvariantCulture));
        return true;
    }

    private static async Task RejectAsync(CookieValidatePrincipalContext context)
    {
        context.RejectPrincipal();
        await context.HttpContext.SignOutAsync(CookieScheme);
    }

    /// <summary>
    /// Verifies the identity after the provider issues tokens. Applies provisioning rules,
    /// role-consistency checks and MFA enforcement, then replaces provider role claims with
    /// application claims. Failures redirect to the frontend with a generic code.
    /// </summary>
    private static async Task ProvisionAsync(TokenValidatedContext context, BffOptions bff)
    {
        var services = context.HttpContext.RequestServices;
        var provisioning = services.GetRequiredService<IdentityProvisioningService>();
        var db = services.GetRequiredService<ManadaDbContext>();
        var principal = context.Principal ?? throw new InvalidOperationException("The identity principal is missing.");
        // Properties carry the step-up marker. A missing bag means no step-up was requested, so start an empty one.
        context.Properties ??= new AuthenticationProperties();

        var issuer = principal.FindFirst("iss")?.Value ?? string.Empty;
        var subject = principal.FindFirst("sub")?.Value ?? string.Empty;
        var email = principal.FindFirst("email")?.Value ?? string.Empty;
        var emailVerified = string.Equals(principal.FindFirst("email_verified")?.Value, "true", StringComparison.OrdinalIgnoreCase);
        var name = principal.FindFirst("name")?.Value ?? email;
        var providerRoles = principal.FindAll("roles").Select(c => c.Value).ToArray();

        try
        {
            var provisioned = await provisioning.ProvisionAsync(
                new VerifiedIdentity(issuer, subject, email, emailVerified, name, providerRoles));

            var mismatch = ProviderRoleMismatch(provisioned.Role, providerRoles);
            if (mismatch)
            {
                services.GetRequiredService<ILoggerFactory>().CreateLogger("Manada.Auth").LogWarning("Provider roles [{Roles}] do not match application role {Role}. Claim types: {Claims}", string.Join(",", providerRoles), provisioned.Role, string.Join(",", principal.Claims.Select(c => c.Type).Distinct()));
            }
            if (mismatch)
            {
                throw new ForbiddenException("Your account roles are not consistent. Contact Manada.");
            }

            var assurance = ParseAssurance(principal.FindFirst("acr")?.Value);
            if (AccountPolicy.RequiresMfa(provisioned.Role, staffMfaEnforced: true) && !AssuranceSatisfied(assurance))
            {
                if (context.Properties.Items.ContainsKey(StepUpItem))
                {
                    // Step-up was already attempted and the provider still did not return level-2 assurance.
                    throw new ForbiddenException("Two-step verification is required for this account.");
                }

                // Native step-up: send the browser back through sign-in requesting level-2 assurance.
                context.HandleResponse();
                context.Response.Redirect($"{bff.FrontendOrigin}/bff/login?stepUp=true");
                return;
            }

            var identity = new ClaimsIdentity(CookieScheme, "name", "roles");
            identity.AddClaim(new Claim("sub", subject));
            identity.AddClaim(new Claim("iss", issuer));
            identity.AddClaim(new Claim(ManadaClaims.UserId, provisioned.UserId.ToString()));
            identity.AddClaim(new Claim(ManadaClaims.Role, provisioned.Role.ToString()));
            identity.AddClaim(new Claim(ManadaClaims.Assurance, assurance.ToString()));
            identity.AddClaim(new Claim("name", name));

            context.Principal = new ClaimsPrincipal(identity);
            context.Properties.IsPersistent = false;
            context.Properties.IssuedUtc = DateTimeOffset.UtcNow;
            context.Properties.ExpiresUtc = DateTimeOffset.UtcNow.AddHours(bff.AbsoluteTimeoutHours);

            db.AuditEvents.Add(new AuditEvent("auth.signin.success", AuditOutcome.Success, provisioned.UserId, subject, "User", provisioned.UserId.ToString(), null, null));
            await db.SaveChangesAsync();
        }
        catch (Exception exception) when (exception is ForbiddenException or ConflictException or DependencyFailureException)
        {
            db.AuditEvents.Add(new AuditEvent("auth.signin.denied", AuditOutcome.Denied, null, subject, "User", null, null, exception.Message));
            await db.SaveChangesAsync();

            context.HandleResponse();
            context.Response.Redirect($"{bff.FrontendOrigin}/?auth=denied");
        }
    }

    /// <summary>The database role is authoritative. Provider roles must agree with it.</summary>
    internal static bool ProviderRoleMismatch(AppRole role, IEnumerable<string> providerRoles)
    {
        // Privileged provider roles must match the database role exactly. Customers carry the
        // default composite role, which the provider does not expand, so only privileged claims are checked.
        var privileged = new[] { "superadmin", "admin", "staff" };
        var presentPrivileged = providerRoles
            .Select(r => r.ToLowerInvariant())
            .Where(r => privileged.Contains(r))
            .Distinct()
            .ToArray();

        if (role == AppRole.Customer)
        {
            return presentPrivileged.Length > 0;
        }

        var expected = role switch
        {
            AppRole.SuperAdmin => "superadmin",
            AppRole.Admin => "admin",
            _ => "staff",
        };

        return presentPrivileged.Length != 1 || presentPrivileged[0] != expected;
    }

    /// <summary>Authentication assurance from the provider "acr" claim. Missing or non-numeric values are level 0.</summary>
    internal static int ParseAssurance(string? acr) =>
        int.TryParse(acr, NumberStyles.None, CultureInfo.InvariantCulture, out var level) ? level : 0;

    /// <summary>Privileged roles require at least the MFA assurance level.</summary>
    internal static bool AssuranceSatisfied(int level) => level >= AssuranceLevels.Mfa;
}

