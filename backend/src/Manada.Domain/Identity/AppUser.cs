using Manada.Domain.Common;

namespace Manada.Domain.Identity;

/// <summary>
/// An application user. Passwords are never stored here: Keycloak is the password authority.
/// Permissions are evaluated from the role-permission assignments in the database.
/// </summary>
public sealed class AppUser : Entity
{
    private readonly List<ExternalIdentity> _identities = [];

    private AppUser() { }

    public AppUser(string email, string displayName, AppRole role, Guid organizationId, UserStatus status)
    {
        Email = NormalizeEmail(email);
        DisplayName = ValidateDisplayName(displayName);
        Role = role;
        OrganizationId = organizationId;
        Status = status;
    }

    public string Email { get; private set; } = string.Empty;

    public string DisplayName { get; private set; } = string.Empty;

    public AppRole Role { get; private set; }

    public UserStatus Status { get; private set; }

    public Guid OrganizationId { get; private set; }

    public DateTimeOffset? LastSignInUtc { get; private set; }

    public IReadOnlyCollection<ExternalIdentity> Identities => _identities;

    public bool IsActive => Status == UserStatus.Active;

    public void AttachIdentity(string issuer, string subject)
    {
        if (_identities.Any(i => i.Issuer == issuer && i.Subject == subject))
        {
            return;
        }

        _identities.Add(new ExternalIdentity(Id, issuer, subject));
        Touch();
    }

    public void ChangeRole(AppRole role)
    {
        Role = role;
        Touch();
    }

    public void Activate()
    {
        Status = UserStatus.Active;
        Touch();
    }

    public void Disable()
    {
        Status = UserStatus.Disabled;
        Touch();
    }

    public void RecordSignIn(DateTimeOffset when)
    {
        LastSignInUtc = when;
        Touch();
    }

    public void UpdateDisplayName(string displayName)
    {
        DisplayName = ValidateDisplayName(displayName);
        Touch();
    }

    private static string NormalizeEmail(string email)
    {
        var normalized = (email ?? string.Empty).Trim().ToLowerInvariant();
        if (normalized.Length is < 3 or > 254 || !normalized.Contains('@'))
        {
            throw new DomainException("A valid email address is required.");
        }

        return normalized;
    }

    private static string ValidateDisplayName(string displayName)
    {
        var trimmed = (displayName ?? string.Empty).Trim();
        if (trimmed.Length is < 1 or > 200)
        {
            throw new DomainException("Display name must be between 1 and 200 characters.");
        }

        return trimmed;
    }
}
