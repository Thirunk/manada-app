using Manada.Application.Abstractions;
using Manada.Domain.Identity;
using Microsoft.EntityFrameworkCore;

namespace Manada.Infrastructure.Identity;

/// <summary>
/// The single authoritative permission evaluation. It reads the user's active status and
/// role-permission assignments from the database on every call, so disabled accounts and
/// revoked permissions take effect immediately. Unknown users have no permissions (default deny).
/// </summary>
public sealed class PermissionService(IAppDbContext db) : IPermissionService
{
    public async Task<IReadOnlyCollection<string>> GetPermissionsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var role = await ActiveRoleAsync(userId, cancellationToken);
        if (role is null)
        {
            return [];
        }

        return await db.RolePermissions.AsNoTracking()
            .Where(rp => rp.Role == role.Value)
            .Select(rp => rp.PermissionCode)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> HasPermissionAsync(Guid userId, string permissionCode, CancellationToken cancellationToken = default)
    {
        var role = await ActiveRoleAsync(userId, cancellationToken);
        if (role is null)
        {
            return false;
        }

        return await db.RolePermissions.AsNoTracking()
            .AnyAsync(rp => rp.Role == role.Value && rp.PermissionCode == permissionCode, cancellationToken);
    }

    private async Task<AppRole?> ActiveRoleAsync(Guid userId, CancellationToken cancellationToken) =>
        await db.Users.AsNoTracking()
            .Where(u => u.Id == userId && u.Status == UserStatus.Active)
            .Select(u => (AppRole?)u.Role)
            .FirstOrDefaultAsync(cancellationToken);
}
