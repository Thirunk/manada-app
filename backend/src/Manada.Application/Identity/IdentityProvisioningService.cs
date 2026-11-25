using Manada.Application.Abstractions;
using Manada.Application.Common;
using Manada.Domain.Audit;
using Manada.Domain.Customers;
using Manada.Domain.Identity;
using Manada.Domain.Common;
using Microsoft.EntityFrameworkCore;

namespace Manada.Application.Identity;

/// <summary>A verified identity presented by the identity provider after sign-in.</summary>
public sealed record VerifiedIdentity(
    string Issuer,
    string Subject,
    string Email,
    bool EmailVerified,
    string DisplayName,
    IReadOnlyCollection<string> ProviderRoles);

public sealed record ProvisionedUser(Guid UserId, AppRole Role, UserStatus Status, bool Created);

/// <summary>
/// Idempotent provisioning of application users from verified identities.
/// Rules:
/// - Self-registered accounts are always Customer; any role claim is ignored.
/// - A privileged role claim without an existing application record is rejected.
/// - Accounts are never linked by email alone. An email owned by a different identity is a conflict.
/// - Disabled accounts cannot sign in.
/// </summary>
public sealed class IdentityProvisioningService(IAppDbContext db)
{
    private static readonly string[] PrivilegedProviderRoles = ["superadmin", "admin", "staff"];

    public async Task<ProvisionedUser> ProvisionAsync(VerifiedIdentity identity, CancellationToken ct = default)
    {
        var existing = await FindByIdentityAsync(identity.Issuer, identity.Subject, ct);
        if (existing is not null)
        {
            var result = Existing(existing, identity);
            await db.SaveChangesAsync(ct);
            return result;
        }

        var emailOwner = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == identity.Email.ToLowerInvariant(), ct);
        if (emailOwner is not null)
        {
            // Never link two identities just because their email addresses match.
            throw new ConflictException("This email address is already associated with another account. Contact Manada for help.");
        }

        if (identity.ProviderRoles.Any(r => PrivilegedProviderRoles.Contains(r, StringComparer.OrdinalIgnoreCase)))
        {
            throw new ForbiddenException("This account is not provisioned in the application. Contact Manada.");
        }

        var organizationId = await db.Organizations.Select(o => (Guid?)o.Id).OrderBy(id => id).FirstOrDefaultAsync(ct)
            ?? throw new DependencyFailureException("The organization has not been provisioned.");

        var status = identity.EmailVerified ? UserStatus.Active : UserStatus.PendingVerification;
        var user = new AppUser(identity.Email, identity.DisplayName, AppRole.Customer, organizationId, status);
        user.AttachIdentity(identity.Issuer, identity.Subject);
        db.Users.Add(user);
        db.CustomerProfiles.Add(new CustomerProfile(user.Id, identity.DisplayName));
        db.AuditEvents.Add(new AuditEvent("account.provisioned", AuditOutcome.Success, user.Id, identity.Subject, "User", user.Id.ToString(), null, "role=Customer"));

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // A concurrent sign-in created the same identity. Discard the failed insert, then reload it instead of failing.
            db.DiscardPendingChanges();
            var raced = await FindByIdentityAsync(identity.Issuer, identity.Subject, ct);
            if (raced is null)
            {
                throw;
            }

            var reloaded = Existing(raced, identity);
            await db.SaveChangesAsync(ct);
            return reloaded;
        }

        return new ProvisionedUser(user.Id, AppRole.Customer, status, Created: true);
    }

    private async Task<AppUser?> FindByIdentityAsync(string issuer, string subject, CancellationToken ct)
    {
        // Identities are queried directly; the user's identity collection is mapped to a backing field.
        var identity = await db.ExternalIdentities.AsNoTracking()
            .FirstOrDefaultAsync(i => i.Issuer == issuer && i.Subject == subject, ct);
        if (identity is null)
        {
            return null;
        }

        return await db.Users.Include("_identities").FirstOrDefaultAsync(u => u.Id == identity.UserId, ct);
    }

    private static ProvisionedUser Existing(AppUser user, VerifiedIdentity identity)
    {
        if (user.Status == UserStatus.Disabled)
        {
            throw new ForbiddenException("This account has been disabled. Contact Manada for help.");
        }

        user.RecordSignIn(DateTimeOffset.UtcNow);
        if (user.Status == UserStatus.PendingVerification && identity.EmailVerified)
        {
            user.Activate();
        }

        return new ProvisionedUser(user.Id, user.Role, user.Status, Created: false);
    }
}
