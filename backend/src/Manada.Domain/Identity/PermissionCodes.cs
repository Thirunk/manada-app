namespace Manada.Domain.Identity;

/// <summary>Stable permission codes. Seeded into the database by migrations.</summary>
public static class PermissionCodes
{
    public const string ProfileSelf = "profile.self";
    public const string CustomerSelf = "customer.self";
    public const string UsersRead = "users.read";
    public const string UsersManageStaff = "users.manage.staff";
    public const string UsersManageCustomers = "users.manage.customers";
    public const string UsersManageAdmins = "users.manage.admins";
    public const string RolesAssign = "roles.assign";
    public const string RolesPermissionsManage = "roles.permissions.manage";
    public const string AuditRead = "audit.read";
    public const string SettingsManage = "settings.manage";
}
