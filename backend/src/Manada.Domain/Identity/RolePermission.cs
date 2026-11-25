namespace Manada.Domain.Identity;

/// <summary>Assignment of a permission to a role. Changes are audited by the application layer.</summary>
public sealed class RolePermission
{
    private RolePermission() { }

    public RolePermission(AppRole role, string permissionCode)
    {
        Role = role;
        PermissionCode = permissionCode;
    }

    public AppRole Role { get; private set; }

    public string PermissionCode { get; private set; } = string.Empty;
}
