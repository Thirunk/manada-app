using System.Security.Cryptography;
using System.Text;
using Manada.Application.Abstractions;
using Manada.Application.Common;
using Manada.Domain.Audit;
using Manada.Domain.Identity;
using Microsoft.EntityFrameworkCore;

namespace Manada.Application.Governance;

public sealed record PermissionDto(string Code, string Description);

public sealed record RoleGrantDto(string Role, string PermissionCode);

/// <summary>Read-only view of the role-permission matrix. Changing the matrix is not exposed in M3.</summary>
public sealed record RoleMatrixDto(
    IReadOnlyList<string> Roles,
    IReadOnlyList<PermissionDto> Permissions,
    IReadOnlyList<RoleGrantDto> Grants);

public sealed record BranchDto(Guid Id, string Name, string Code);

public sealed record OrganizationDto(Guid Id, string Name, uint RowVersion, IReadOnlyList<BranchDto> Branches);

public sealed record OrganizationUpdate(string Name, uint RowVersion);

/// <summary>A session that belongs to the caller. The handle is derived on the server; the cookie key is never returned.</summary>
public sealed record SessionDto(string Handle, DateTimeOffset CreatedUtc, DateTimeOffset ExpiresUtc);

/// <summary>
/// Governance and self-service: role-permission matrix, organization settings, and the caller's own sessions.
/// Every method checks the permission for its operation, so a missing permission is denied even if the
/// endpoint is reachable.
/// </summary>
public sealed class GovernanceService(IAppDbContext db, IPermissionService permissions)
{
    private const string TargetOrganization = "Organization";
    private const string TargetSession = "AuthSession";

    public async Task<RoleMatrixDto> GetRoleMatrixAsync(ActorContext actor, CancellationToken ct = default)
    {
        await RequireAsync(actor, PermissionCodes.RolesPermissionsManage, ct);

        var roles = Enum.GetNames<AppRole>();
        var permissionList = await db.Permissions.AsNoTracking()
            .OrderBy(p => p.Code)
            .Select(p => new PermissionDto(p.Code, p.Description))
            .ToListAsync(ct);
        var grants = await db.RolePermissions.AsNoTracking()
            .Select(rp => new RoleGrantDto(rp.Role.ToString(), rp.PermissionCode))
            .ToListAsync(ct);

        return new RoleMatrixDto(roles, permissionList, grants);
    }

    public async Task<OrganizationDto> GetOrganizationAsync(ActorContext actor, CancellationToken ct = default)
    {
        await RequireAsync(actor, PermissionCodes.SettingsManage, ct);
        return await LoadOrganizationAsync(ct);
    }

    public async Task<OrganizationDto> UpdateOrganizationAsync(ActorContext actor, OrganizationUpdate update, CancellationToken ct = default)
    {
        await RequireAsync(actor, PermissionCodes.SettingsManage, ct);

        var organization = await db.Organizations.FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("The organization was not found.");
        if (organization.RowVersion != update.RowVersion)
        {
            throw new ConflictException("The organization was changed by someone else. Reload it and try again.");
        }

        var previous = organization.Name;
        organization.Rename(update.Name);
        db.AuditEvents.Add(new AuditEvent("organization.updated", AuditOutcome.Success, actor.UserId, actor.Subject,
            TargetOrganization, organization.Id.ToString(), actor.CorrelationId, $"nameChanged={!string.Equals(previous, organization.Name, StringComparison.Ordinal)}"));

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            throw new ConflictException("The organization was changed by someone else. Reload it and try again.");
        }

        return await LoadOrganizationAsync(ct);
    }

    public async Task<IReadOnlyList<SessionDto>> ListOwnSessionsAsync(ActorContext actor, CancellationToken ct = default)
    {
        await RequireAsync(actor, PermissionCodes.ProfileSelf, ct);
        var now = DateTimeOffset.UtcNow;

        var sessions = await db.AuthSessions.AsNoTracking()
            .Where(s => s.UserId == actor.UserId && s.RevokedUtc == null && s.ExpiresUtc > now)
            .OrderByDescending(s => s.CreatedUtc)
            .Select(s => new { s.Key, s.CreatedUtc, s.ExpiresUtc })
            .ToListAsync(ct);

        return sessions.Select(s => new SessionDto(SessionHandle.From(s.Key), s.CreatedUtc, s.ExpiresUtc)).ToList();
    }

    public async Task RevokeOwnSessionAsync(ActorContext actor, string handle, CancellationToken ct = default)
    {
        await RequireAsync(actor, PermissionCodes.ProfileSelf, ct);
        var now = DateTimeOffset.UtcNow;

        // Only the caller's own active sessions can be matched. Any other handle is reported as not found.
        var candidates = await db.AuthSessions
            .Where(s => s.UserId == actor.UserId && s.RevokedUtc == null && s.ExpiresUtc > now)
            .ToListAsync(ct);
        var session = candidates.FirstOrDefault(s => SessionHandle.From(s.Key) == handle)
            ?? throw new NotFoundException("The session was not found.");

        session.Revoke();
        db.AuditEvents.Add(new AuditEvent("session.revoked", AuditOutcome.Success, actor.UserId, actor.Subject,
            TargetSession, handle, actor.CorrelationId, null));
        await db.SaveChangesAsync(ct);
    }

    private async Task<OrganizationDto> LoadOrganizationAsync(CancellationToken ct)
    {
        var organization = await db.Organizations.AsNoTracking().OrderBy(o => o.Id).FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("The organization was not found.");
        var branches = await db.Branches.AsNoTracking()
            .Where(b => b.OrganizationId == organization.Id)
            .OrderBy(b => b.Code)
            .Select(b => new BranchDto(b.Id, b.Name, b.Code))
            .ToListAsync(ct);

        return new OrganizationDto(organization.Id, organization.Name, organization.RowVersion, branches);
    }

    private async Task RequireAsync(ActorContext actor, string permission, CancellationToken ct)
    {
        if (!await permissions.HasPermissionAsync(actor.UserId, permission, ct))
        {
            db.AuditEvents.Add(new AuditEvent("authorization.denied", AuditOutcome.Denied, actor.UserId, actor.Subject,
                "Permission", permission, actor.CorrelationId, null));
            await db.SaveChangesAsync(ct);
            throw new ForbiddenException("You do not have permission to perform this action.");
        }
    }
}

/// <summary>Non-secret, stable handle for a session. A SHA-256 digest of the cookie key, so the key itself is never exposed.</summary>
public static class SessionHandle
{
    public static string From(string sessionKey) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(sessionKey))).ToLowerInvariant();
}
