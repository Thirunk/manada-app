using Manada.Application.Abstractions;
using Manada.Application.Common;
using Manada.Domain.Customers;
using Manada.Domain.Identity;
using Manada.Domain.Staff;
using Manada.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Manada.IntegrationTests.Infrastructure;

/// <summary>Issuer used by the synthetic test identities. Real tokens use the configured Keycloak issuer.</summary>
public sealed class FixedIssuer : IIdentityIssuer
{
    public const string Value = "https://issuer.test/realms/manada";

    public string Issuer => Value;
}

/// <summary>
/// Controlled stand-in for the identity-provider admin port. APPLICATION-LEVEL ONLY: these tests prove
/// the authorization and persistence rules in UserService. They do not prove Keycloak behaviour; that
/// is verified separately against a real Keycloak instance.
/// </summary>
public sealed class FakeIdentityProvider : IIdentityProviderAdmin
{
    public List<string> Calls { get; } = [];

    public List<IdentityUserRequest> Created { get; } = [];

    public Dictionary<string, AppRole> RoleBySubject { get; } = [];

    public HashSet<string> Disabled { get; } = [];

    public bool FailNextCreate { get; set; }

    /// <summary>Runs after the application's email pre-check and before the account row is written. Used to force a race deterministically.</summary>
    public Func<IdentityUserRequest, Task>? BeforeCreate { get; set; }

    /// <summary>When set, the next created identity uses this subject. Used to force a deterministic identity collision.</summary>
    public string? FixedSubject { get; set; }

    public async Task<string> CreateUserAsync(IdentityUserRequest request, CancellationToken cancellationToken = default)
    {
        Calls.Add($"create:{request.Email}:{request.Role}");
        if (FailNextCreate)
        {
            FailNextCreate = false;
            throw new DependencyFailureException("The identity provider could not create the identity. Try again later.");
        }

        if (BeforeCreate is not null)
        {
            await BeforeCreate(request);
        }

        Created.Add(request);
        var subject = FixedSubject ?? Guid.NewGuid().ToString("N");
        RoleBySubject[subject] = request.Role;
        return subject;
    }

    public Task SetRealmRoleAsync(string subject, AppRole role, CancellationToken cancellationToken = default)
    {
        Calls.Add($"role:{subject}:{role}");
        RoleBySubject[subject] = role;
        return Task.CompletedTask;
    }

    public Task SetEnabledAsync(string subject, bool enabled, CancellationToken cancellationToken = default)
    {
        Calls.Add($"enabled:{subject}:{enabled}");
        if (enabled)
        {
            Disabled.Remove(subject);
        }
        else
        {
            Disabled.Add(subject);
        }

        return Task.CompletedTask;
    }

    public Task SendRequiredActionsEmailAsync(string subject, IReadOnlyCollection<string> actions, CancellationToken cancellationToken = default)
    {
        Calls.Add($"invite:{subject}");
        return Task.CompletedTask;
    }

    public Task RevokeSessionsAsync(string subject, CancellationToken cancellationToken = default)
    {
        Calls.Add($"revoke:{subject}");
        return Task.CompletedTask;
    }
}

/// <summary>Creates synthetic accounts directly in the test database.</summary>
public static class Seed
{
    public static async Task<AppUser> UserAsync(
        ManadaDbContext db,
        AppRole role,
        UserStatus status = UserStatus.Active,
        string? issuer = null,
        string? subject = null)
    {
        var organizationId = await db.Organizations.Select(o => o.Id).OrderBy(id => id).FirstAsync();
        var email = $"{role.ToString().ToLowerInvariant()}.{Guid.NewGuid():N}@manada.test";
        var user = new AppUser(email, $"Sample {role}", role, organizationId, status);
        user.AttachIdentity(issuer ?? FixedIssuer.Value, subject ?? Guid.NewGuid().ToString("N"));
        db.Users.Add(user);

        if (role == AppRole.Customer)
        {
            db.CustomerProfiles.Add(new CustomerProfile(user.Id, $"Sample Customer {Guid.NewGuid():N}"));
        }

        if (role == AppRole.Staff)
        {
            db.StaffProfiles.Add(new StaffProfile(user.Id, "Embroidery technician", null));
        }

        await db.SaveChangesAsync();
        return user;
    }

    public static async Task<Guid> FirstOrganizationIdAsync(ManadaDbContext db) =>
        await db.Organizations.Select(o => o.Id).OrderBy(id => id).FirstAsync();

    public static ActorContext Actor(AppUser user) =>
        new(user.Id, user.Identities.First().Subject, user.Role, $"test-{Guid.NewGuid():N}");
}
