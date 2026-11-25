using Manada.Domain.Identity;
using Manada.Domain.Organization;

namespace Manada.Infrastructure.Persistence;

/// <summary>
/// Deterministic seed data for migrations. Identifiers are fixed so the seed is
/// identical in every environment. The organization name is the owner's company name.
/// </summary>
internal static class SeedData
{
    public static readonly Guid OrganizationId = Guid.Parse("0f6b6a5e-2d3c-4f7a-9b1e-000000000001");

    public static readonly DateTimeOffset SeedTime = new(2026, 11, 1, 0, 0, 0, TimeSpan.Zero);

    public static readonly object Organization = new
    {
        Id = OrganizationId,
        Name = "Manada Embroidery Machine Solution",
        CreatedUtc = SeedTime,
        UpdatedUtc = SeedTime,
    };

    public static readonly object[] Permissions =
    [
        new { Code = PermissionCodes.ProfileSelf, Description = "View and update own profile" },
        new { Code = PermissionCodes.CustomerSelf, Description = "Use customer self-service areas" },
        new { Code = PermissionCodes.UsersRead, Description = "View accounts within the caller's management scope" },
        new { Code = PermissionCodes.UsersManageStaff, Description = "Create and manage Staff accounts" },
        new { Code = PermissionCodes.UsersManageCustomers, Description = "Manage customer accounts and records" },
        new { Code = PermissionCodes.UsersManageAdmins, Description = "Create and manage Admin accounts" },
        new { Code = PermissionCodes.RolesAssign, Description = "Assign roles to accounts" },
        new { Code = PermissionCodes.RolesPermissionsManage, Description = "Manage role-permission assignments" },
        new { Code = PermissionCodes.AuditRead, Description = "View security audit events" },
        new { Code = PermissionCodes.SettingsManage, Description = "Manage system settings" },
    ];

    private static readonly string[] AllPermissions =
    [
        PermissionCodes.ProfileSelf,
        PermissionCodes.CustomerSelf,
        PermissionCodes.UsersRead,
        PermissionCodes.UsersManageStaff,
        PermissionCodes.UsersManageCustomers,
        PermissionCodes.UsersManageAdmins,
        PermissionCodes.RolesAssign,
        PermissionCodes.RolesPermissionsManage,
        PermissionCodes.AuditRead,
        PermissionCodes.SettingsManage,
    ];

    /// <summary>The role-permission matrix. Changes to this matrix are audited through the application layer.</summary>
    public static readonly object[] RolePermissions = BuildRolePermissions();

    private static object[] BuildRolePermissions()
    {
        var rows = new List<object>();

        foreach (var code in AllPermissions)
        {
            rows.Add(new { Role = AppRole.SuperAdmin, PermissionCode = code });
        }

        foreach (var code in new[]
        {
            PermissionCodes.ProfileSelf,
            PermissionCodes.UsersRead,
            PermissionCodes.UsersManageStaff,
            PermissionCodes.UsersManageCustomers,
        })
        {
            rows.Add(new { Role = AppRole.Admin, PermissionCode = code });
        }

        foreach (var code in new[] { PermissionCodes.ProfileSelf })
        {
            rows.Add(new { Role = AppRole.Staff, PermissionCode = code });
        }

        foreach (var code in new[] { PermissionCodes.ProfileSelf, PermissionCodes.CustomerSelf })
        {
            rows.Add(new { Role = AppRole.Customer, PermissionCode = code });
        }

        return rows.ToArray();
    }
}
