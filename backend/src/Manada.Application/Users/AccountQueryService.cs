using Manada.Application.Abstractions;
using Manada.Application.Common;
using Manada.Application.Identity;
using Manada.Domain.Identity;
using Microsoft.EntityFrameworkCore;

namespace Manada.Application.Users;

/// <summary>Account detail with profile data. Contains no tokens, provider identifiers or session data.</summary>
public sealed record AccountDetailDto(
    Guid Id,
    string Email,
    string DisplayName,
    AppRole Role,
    UserStatus Status,
    DateTimeOffset? LastSignInUtc,
    uint RowVersion,
    string? JobTitle,
    string? BranchCode,
    string? BranchName,
    string? Phone,
    string? CompanyName);

/// <summary>
/// Single-account reads. Admin detail reads are limited to the accounts the caller may manage, and
/// out-of-scope accounts are reported as not found so their existence is not revealed.
/// </summary>
public sealed class AccountQueryService(IAppDbContext db, IPermissionService permissions)
{
    public async Task<AccountDetailDto> GetManagedAccountAsync(ActorContext actor, Guid userId, CancellationToken ct = default)
    {
        if (!await permissions.HasPermissionAsync(actor.UserId, PermissionCodes.UsersRead, ct))
        {
            throw new ForbiddenException("You do not have permission to view accounts.");
        }

        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundException("The account was not found.");

        if (!AccountPolicy.CanManage(actor.Role, user.Role))
        {
            throw new NotFoundException("The account was not found.");
        }

        return await BuildAsync(user, ct);
    }

    public async Task<AccountDetailDto> GetOwnAccountAsync(ActorContext actor, CancellationToken ct = default)
    {
        if (!await permissions.HasPermissionAsync(actor.UserId, PermissionCodes.ProfileSelf, ct))
        {
            throw new ForbiddenException("You do not have permission to view this account.");
        }

        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == actor.UserId, ct)
            ?? throw new NotFoundException("The account was not found.");

        return await BuildAsync(user, ct);
    }

    private async Task<AccountDetailDto> BuildAsync(AppUser user, CancellationToken ct)
    {
        var staff = await db.StaffProfiles.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == user.Id, ct);
        var customer = await db.CustomerProfiles.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == user.Id, ct);

        string? branchCode = null;
        string? branchName = null;
        if (staff?.BranchId is { } branchId)
        {
            var branch = await db.Branches.AsNoTracking().FirstOrDefaultAsync(b => b.Id == branchId, ct);
            branchCode = branch?.Code;
            branchName = branch?.Name;
        }

        return new AccountDetailDto(
            user.Id,
            user.Email,
            user.DisplayName,
            user.Role,
            user.Status,
            user.LastSignInUtc,
            user.RowVersion,
            staff?.JobTitle,
            branchCode,
            branchName,
            customer?.Phone,
            customer?.CompanyName);
    }
}
