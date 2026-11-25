namespace Manada.API.Options;

/// <summary>
/// Deployment configuration for MFA enforcement (section "MfaEnforcement"). Every flag defaults to false: owner
/// decision for the current release is that MFA is optional for all roles. Only deployment configuration sets
/// these values; there is no runtime setting an application user can change.
/// </summary>
public sealed class MfaEnforcementOptions
{
    public const string SectionName = "MfaEnforcement";

    public bool SuperAdmin { get; set; }

    public bool Admin { get; set; }

    public bool Staff { get; set; }

    public bool Customer { get; set; }
}
