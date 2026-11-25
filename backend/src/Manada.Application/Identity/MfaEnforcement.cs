using Manada.Domain.Identity;

namespace Manada.Application.Identity;

/// <summary>
/// Per-role MFA enforcement. Owner decision for the current release: MFA is optional for every role, so every
/// flag defaults to false. The flags come from deployment configuration (MfaEnforcement section), not from
/// database settings, so ordinary users cannot change them. Turning a flag on keeps the existing level-2
/// assurance validation in place.
/// </summary>
public sealed record MfaEnforcement(bool SuperAdmin, bool Admin, bool Staff, bool Customer)
{
    public static readonly MfaEnforcement Disabled = new(false, false, false, false);

    public bool Requires(AppRole role) => role switch
    {
        AppRole.SuperAdmin => SuperAdmin,
        AppRole.Admin => Admin,
        AppRole.Staff => Staff,
        AppRole.Customer => Customer,
        _ => false,
    };
}
