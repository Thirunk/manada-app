namespace Manada.Application.Abstractions;

/// <summary>
/// The single authoritative permission evaluation. Permissions are read from the
/// role-permission assignments on each request, so revocation takes effect at once.
/// </summary>
public interface IPermissionService
{
    Task<IReadOnlyCollection<string>> GetPermissionsAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<bool> HasPermissionAsync(Guid userId, string permissionCode, CancellationToken cancellationToken = default);
}
