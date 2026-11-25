using Manada.Domain.Identity;

namespace Manada.Application.Identity;

/// <summary>
/// Account-management rules: who may create, change or disable which accounts.
/// Kept pure so the matrix can be unit tested exhaustively.
/// </summary>
public static class AccountPolicy
{
    /// <summary>SuperAdmin accounts are created only by the one-time bootstrap, never through the API.</summary>
    public static bool CanCreate(AppRole actor, AppRole newRole) => actor switch
    {
        AppRole.SuperAdmin => newRole is AppRole.Admin or AppRole.Staff or AppRole.Customer,
        AppRole.Admin => newRole is AppRole.Staff or AppRole.Customer,
        _ => false,
    };

    /// <summary>Only a SuperAdmin may assign or change roles.</summary>
    public static bool CanAssignRole(AppRole actor, AppRole newRole) =>
        actor == AppRole.SuperAdmin && newRole is AppRole.Admin or AppRole.Staff or AppRole.Customer;

    /// <summary>Whether an actor may view or manage an account with the target role.</summary>
    public static bool CanManage(AppRole actor, AppRole targetRole) => actor switch
    {
        AppRole.SuperAdmin => true,
        AppRole.Admin => targetRole is AppRole.Staff or AppRole.Customer,
        _ => false,
    };

    /// <summary>
    /// Whether an account may be deactivated or demoted. The last active SuperAdmin is protected,
    /// and nobody may change their own status or role.
    /// </summary>
    public static bool CanChangeStatusOrRole(
        AppRole actor,
        Guid actorUserId,
        AppRole targetRole,
        Guid targetUserId,
        int activeSuperAdminCount)
    {
        if (actorUserId == targetUserId)
        {
            return false;
        }

        if (!CanManage(actor, targetRole))
        {
            return false;
        }

        if (targetRole == AppRole.SuperAdmin && activeSuperAdminCount <= 1)
        {
            return false;
        }

        return true;
    }

    /// <summary>Whether MFA (level-2 assurance) is required for the role under the configured enforcement.</summary>
    public static bool RequiresMfa(AppRole role, MfaEnforcement enforcement) => enforcement.Requires(role);
}
