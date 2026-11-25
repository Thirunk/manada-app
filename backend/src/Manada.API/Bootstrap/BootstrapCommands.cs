using Manada.Application.Abstractions;
using Manada.Domain.Audit;
using Manada.Domain.Identity;
using Manada.Domain.Settings;
using Manada.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Manada.API.Bootstrap;

/// <summary>
/// Operator commands run from the command line, never over HTTP.
/// The SuperAdmin bootstrap is one-time: it refuses to run when a SuperAdmin exists or it has already completed.
/// No password is generated or printed. The account is created in Keycloak with required actions, so the
/// person sets their own password and TOTP and verifies their email.
/// </summary>
public static class BootstrapCommands
{
    public const string CompletedSettingKey = "bootstrap.superadmin.completed";

    public static async Task<int> BootstrapSuperAdminAsync(IServiceProvider services, string email)
    {
        var db = services.GetRequiredService<ManadaDbContext>();
        var identity = services.GetRequiredService<IIdentityProviderAdmin>();

        if (await db.Users.AnyAsync(u => u.Role == AppRole.SuperAdmin) ||
            await db.SystemSettings.AnyAsync(s => s.Key == CompletedSettingKey))
        {
            Console.Error.WriteLine("Bootstrap refused: a SuperAdmin already exists or the bootstrap has already completed.");
            return 2;
        }

        var organizationId = await db.Organizations.Select(o => o.Id).OrderBy(id => id).FirstAsync();
        var actions = new[] { "VERIFY_EMAIL", "UPDATE_PASSWORD", "CONFIGURE_TOTP" };

        var subject = await identity.CreateUserAsync(new IdentityUserRequest(email.Trim().ToLowerInvariant(), "Manada", "SuperAdmin", AppRole.SuperAdmin, actions));

        try
        {
            var user = new AppUser(email, "Manada SuperAdmin", AppRole.SuperAdmin, organizationId, UserStatus.PendingVerification);
            user.AttachIdentity(services.GetRequiredService<IIdentityIssuer>().Issuer, subject);
            db.Users.Add(user);
            db.SystemSettings.Add(new SystemSetting(CompletedSettingKey, DateTimeOffset.UtcNow.ToString("o"), null));
            db.AuditEvents.Add(new AuditEvent("superadmin.bootstrapped", AuditOutcome.Success, user.Id, "bootstrap", "User", user.Id.ToString(), null, null));
            await db.SaveChangesAsync();
        }
        catch
        {
            // Never leave an enabled privileged identity without an application record.
            await identity.SetEnabledAsync(subject, false);
            throw;
        }

        try
        {
            await identity.SendRequiredActionsEmailAsync(subject, actions);
            Console.WriteLine("SuperAdmin created. An invitation was sent. Complete the required actions before signing in.");
        }
        catch
        {
            Console.WriteLine("SuperAdmin created, but the invitation email could not be sent. Re-send it from the identity provider administration console.");
        }

        return 0;
    }

    public static async Task<int> MigrateAsync(IServiceProvider services)
    {
        var db = services.GetRequiredService<ManadaDbContext>();
        await db.Database.MigrateAsync();
        Console.WriteLine("Database migrations applied.");
        return 0;
    }
}
