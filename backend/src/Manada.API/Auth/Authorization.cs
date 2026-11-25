using Microsoft.EntityFrameworkCore;
using System.Reflection;
using Manada.Application.Abstractions;
using Manada.Application.Common;
using Manada.Domain.Identity;
using Microsoft.AspNetCore.Authorization;

namespace Manada.API.Auth;

/// <summary>Requires one application permission. Evaluated against the database on every request.</summary>
public sealed record PermissionRequirement(string Permission) : IAuthorizationRequirement;

public sealed class PermissionRequirementHandler(IPermissionService permissions) : AuthorizationHandler<PermissionRequirement>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        var claim = context.User.FindFirst(ManadaClaims.UserId)?.Value;
        if (!Guid.TryParse(claim, out var userId))
        {
            return;
        }

        if (await permissions.HasPermissionAsync(userId, requirement.Permission))
        {
            context.Succeed(requirement);
        }
    }
}

public static class AuthorizationSetup
{
    /// <summary>
    /// Default deny: every endpoint requires an authenticated session unless it is explicitly
    /// marked AllowAnonymous. A policy exists for every permission code.
    /// </summary>
    public static IServiceCollection AddManadaAuthorization(this IServiceCollection services)
    {
        services.AddScoped<IAuthorizationHandler, PermissionRequirementHandler>();

        services.AddAuthorization(options =>
        {
            options.FallbackPolicy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();

            foreach (var code in PermissionCodeValues())
            {
                options.AddPolicy(code, policy => policy
                    .RequireAuthenticatedUser()
                    .AddRequirements(new PermissionRequirement(code)));
            }
        });

        return services;
    }

    public static IEnumerable<string> PermissionCodeValues() =>
        typeof(PermissionCodes)
            .GetFields(BindingFlags.Public | BindingFlags.Static | BindingFlags.FlattenHierarchy)
            .Where(f => f.IsLiteral && f.FieldType == typeof(string))
            .Select(f => (string)f.GetRawConstantValue()!);
}

/// <summary>Resolves the caller from the server-side session. Role and status come from the database.</summary>
public static class ActorResolver
{
    public static async Task<ActorContext> ResolveAsync(HttpContext http, IAppDbContext db, CancellationToken ct = default)
    {
        var userId = http.User.FindFirst(ManadaClaims.UserId)?.Value;
        if (!Guid.TryParse(userId, out var id))
        {
            throw new ForbiddenException("Sign in is required.");
        }

        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new ForbiddenException("Sign in is required.");

        if (!user.IsActive)
        {
            throw new ForbiddenException("This account is not active.");
        }

        var subject = http.User.FindFirst("sub")?.Value ?? string.Empty;
        var correlation = http.Request.Headers["X-Correlation-ID"].FirstOrDefault() ?? http.TraceIdentifier;
        return new ActorContext(user.Id, subject, user.Role, correlation);
    }
}
