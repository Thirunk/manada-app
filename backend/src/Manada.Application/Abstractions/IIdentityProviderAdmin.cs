using Manada.Domain.Identity;

namespace Manada.Application.Abstractions;

/// <summary>Administrative operations against the identity provider (Keycloak). Keycloak remains the password authority.</summary>
public interface IIdentityProviderAdmin
{
    /// <summary>Creates a disabled-until-verified identity with required actions. Returns the provider subject.</summary>
    Task<string> CreateUserAsync(IdentityUserRequest request, CancellationToken cancellationToken = default);

    Task SetRealmRoleAsync(string subject, AppRole role, CancellationToken cancellationToken = default);

    Task SetEnabledAsync(string subject, bool enabled, CancellationToken cancellationToken = default);

    Task SendRequiredActionsEmailAsync(string subject, IReadOnlyCollection<string> actions, CancellationToken cancellationToken = default);

    Task RevokeSessionsAsync(string subject, CancellationToken cancellationToken = default);
}

public sealed record IdentityUserRequest(
    string Email,
    string FirstName,
    string LastName,
    AppRole Role,
    IReadOnlyCollection<string> RequiredActions);
