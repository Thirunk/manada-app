using Manada.Application.Abstractions;
using Manada.Application.Common;
using Manada.Application.Identity;
using Manada.Domain.Audit;
using Manada.Domain.Common;
using Manada.Domain.Customers;
using Manada.Domain.Identity;
using Manada.Domain.Organization;
using Manada.Domain.Staff;
using Microsoft.EntityFrameworkCore;

namespace Manada.Application.Users;

/// <summary>
/// Use cases for identity and account management. Every operation checks the
/// caller's permission and the account policy, writes an audit record in the same
/// transaction, and uses the row version to detect concurrent changes.
/// </summary>
public sealed class UserService(
    IAppDbContext db,
    IIdentityProviderAdmin identityProvider,
    IPermissionService permissions)
{
    private const string TargetUser = "User";

    public async Task<CurrentUserDto> GetCurrentUserAsync(ActorContext actor, CancellationToken ct = default)
    {
        var user = await LoadActiveUserAsync(actor.UserId, ct);
        return ToCurrent(user);
    }

    public Task<IReadOnlyCollection<string>> GetPermissionsAsync(ActorContext actor, CancellationToken ct = default) =>
        permissions.GetPermissionsAsync(actor.UserId, ct);

    public async Task<CurrentUserDto> UpdateOwnProfileAsync(ActorContext actor, ProfileUpdateRequest request, CancellationToken ct = default)
    {
        await RequireAsync(actor, PermissionCodes.ProfileSelf, ct);
        var user = await LoadActiveUserAsync(actor.UserId, ct);

        user.UpdateDisplayName(request.DisplayName);

        if (user.Role == AppRole.Customer)
        {
            var profile = await db.CustomerProfiles.FirstOrDefaultAsync(p => p.UserId == user.Id, ct);
            if (profile is null)
            {
                profile = new CustomerProfile(user.Id, request.DisplayName);
                db.CustomerProfiles.Add(profile);
            }

            profile.Update(request.DisplayName, request.Phone, request.CompanyName);
        }

        AddAudit(actor, "profile.updated", AuditOutcome.Success, TargetUser, user.Id.ToString(), null);
        await SaveAsync(ct);
        return ToCurrent(user);
    }

    public async Task<PagedResult<UserSummaryDto>> ListUsersAsync(ActorContext actor, UserListQuery query, CancellationToken ct = default)
    {
        await RequireAsync(actor, PermissionCodes.UsersRead, ct);

        var visibleRoles = Enum.GetValues<AppRole>().Where(r => AccountPolicy.CanManage(actor.Role, r)).ToArray();
        var users = db.Users.AsNoTracking().Where(u => visibleRoles.Contains(u.Role));

        if (query.Role is { } role)
        {
            if (!visibleRoles.Contains(role))
            {
                throw new ForbiddenException("You cannot view accounts with this role.");
            }

            users = users.Where(u => u.Role == role);
        }

        if (query.Status is { } status)
        {
            users = users.Where(u => u.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLowerInvariant();
            users = users.Where(u => u.Email.Contains(term) || u.DisplayName.ToLower().Contains(term));
        }

        var total = await users.CountAsync(ct);
        var items = await users
            .OrderBy(u => u.Email)
            .Skip(query.Page.Skip)
            .Take(query.Page.SafePageSize)
            .Select(u => new UserSummaryDto(u.Id, u.Email, u.DisplayName, u.Role, u.Status, u.LastSignInUtc, u.RowVersion))
            .ToListAsync(ct);

        return new PagedResult<UserSummaryDto>(items, query.Page.SafePage, query.Page.SafePageSize, total);
    }

    public async Task<CreateAccountResult> CreateAccountAsync(ActorContext actor, CreateAccountRequest request, CancellationToken ct = default)
    {
        if (!AccountPolicy.CanCreate(actor.Role, request.Role))
        {
            await RecordDeniedAsync(actor, "account.create.denied", request.Role.ToString(), ct);
            throw new ForbiddenException("You cannot create accounts with this role.");
        }

        await RequireAsync(actor, RequiredCreatePermission(request.Role), ct);

        var email = request.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email, ct))
        {
            throw new ConflictException("An account with this email address already exists.");
        }

        var organizationId = await PrimaryOrganizationIdAsync(ct);
        var requiredActions = RequiredActionsFor(request.Role);
        var (firstName, lastName) = SplitName(request.FullName);

        var subject = await identityProvider.CreateUserAsync(
            new IdentityUserRequest(email, firstName, lastName, request.Role, requiredActions), ct);

        try
        {
            var user = new AppUser(email, request.FullName, request.Role, organizationId, UserStatus.PendingVerification);
            user.AttachIdentity(IdentityIssuer, subject);
            db.Users.Add(user);

            if (request.Role == AppRole.Staff)
            {
                var branchId = await ResolveBranchIdAsync(request.BranchCode, organizationId, ct);
                db.StaffProfiles.Add(new StaffProfile(user.Id, request.JobTitle ?? "Staff", branchId));
            }
            else if (request.Role == AppRole.Customer)
            {
                db.CustomerProfiles.Add(new CustomerProfile(user.Id, request.FullName));
            }

            AddAudit(actor, "account.created", AuditOutcome.Success, TargetUser, user.Id.ToString(), $"role={request.Role}");
            await SaveAsync(ct);

            var invitationSent = await TrySendInvitationAsync(subject, requiredActions, ct);
            return new CreateAccountResult(ToSummary(user), invitationSent);
        }
        catch
        {
            // Do not leave an enabled identity without an application record.
            await identityProvider.SetEnabledAsync(subject, false, CancellationToken.None);
            throw;
        }
    }

    public async Task<UserSummaryDto> ChangeRoleAsync(ActorContext actor, Guid userId, ChangeRoleRequest request, CancellationToken ct = default)
    {
        await RequireAsync(actor, PermissionCodes.RolesAssign, ct);
        if (!AccountPolicy.CanAssignRole(actor.Role, request.Role))
        {
            await RecordDeniedAsync(actor, "role.change.denied", userId.ToString(), ct);
            throw new ForbiddenException("You cannot assign this role.");
        }

        var user = await LoadUserAsync(userId, ct);
        if (user.Role == request.Role)
        {
            return ToSummary(user);
        }

        var superAdmins = await CountActiveSuperAdminsAsync(ct);
        if (!AccountPolicy.CanChangeStatusOrRole(actor.Role, actor.UserId, user.Role, user.Id, superAdmins))
        {
            await RecordDeniedAsync(actor, "role.change.denied", userId.ToString(), ct);
            throw new ConflictException("This role cannot be changed. Accounts cannot change their own role, and the last active SuperAdmin is protected.");
        }

        ExpectRowVersion(user, request.RowVersion);
        var previousRole = user.Role;
        var subject = await PrimarySubjectAsync(user, ct);
        await identityProvider.SetRealmRoleAsync(subject, request.Role, ct);

        try
        {
            user.ChangeRole(request.Role);
            await RevokeSessionsForUserAsync(user.Id, ct);
            AddAudit(actor, "role.changed", AuditOutcome.Success, TargetUser, user.Id.ToString(), $"from={previousRole};to={request.Role}");
            await SaveAsync(ct);
            return ToSummary(user);
        }
        catch
        {
            // Restore the provider role so the two systems stay consistent.
            await identityProvider.SetRealmRoleAsync(subject, previousRole, CancellationToken.None);
            throw;
        }
    }

    public async Task<UserSummaryDto> SetStatusAsync(ActorContext actor, Guid userId, ChangeStatusRequest request, CancellationToken ct = default)
    {
        var user = await LoadUserAsync(userId, ct);
        await RequireAsync(actor, ManagePermissionFor(user.Role), ct);

        var superAdmins = await CountActiveSuperAdminsAsync(ct);
        if (!AccountPolicy.CanChangeStatusOrRole(actor.Role, actor.UserId, user.Role, user.Id, superAdmins))
        {
            await RecordDeniedAsync(actor, "account.status.denied", userId.ToString(), ct);
            throw new ConflictException("This account cannot be changed. Accounts cannot change their own status, and the last active SuperAdmin is protected.");
        }

        ExpectRowVersion(user, request.RowVersion);
        var subject = await PrimarySubjectAsync(user, ct);

        if (request.Active)
        {
            await identityProvider.SetEnabledAsync(subject, true, ct);
            user.Activate();
        }
        else
        {
            await identityProvider.SetEnabledAsync(subject, false, ct);
            await identityProvider.RevokeSessionsAsync(subject, ct);
            user.Disable();
            await RevokeSessionsForUserAsync(user.Id, ct);
        }

        AddAudit(actor, request.Active ? "account.activated" : "account.deactivated", AuditOutcome.Success, TargetUser, user.Id.ToString(), null);
        await SaveAsync(ct);
        return ToSummary(user);
    }

    // ----- helpers -----

    public const string IdentityIssuer = "keycloak";

    private static string RequiredCreatePermission(AppRole role) => role switch
    {
        AppRole.Admin => PermissionCodes.UsersManageAdmins,
        AppRole.Staff => PermissionCodes.UsersManageStaff,
        AppRole.Customer => PermissionCodes.UsersManageCustomers,
        _ => PermissionCodes.UsersManageAdmins,
    };

    private static string ManagePermissionFor(AppRole role) => role switch
    {
        AppRole.SuperAdmin => PermissionCodes.UsersManageAdmins,
        AppRole.Admin => PermissionCodes.UsersManageAdmins,
        AppRole.Staff => PermissionCodes.UsersManageStaff,
        _ => PermissionCodes.UsersManageCustomers,
    };

    private static IReadOnlyCollection<string> RequiredActionsFor(AppRole role)
    {
        var actions = new List<string> { "VERIFY_EMAIL", "UPDATE_PASSWORD" };
        if (AccountPolicy.RequiresMfa(role, staffMfaEnforced: true))
        {
            actions.Add("CONFIGURE_TOTP");
        }

        return actions;
    }

    private static (string First, string Last) SplitName(string fullName)
    {
        var parts = fullName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return parts.Length switch
        {
            0 => ("", ""),
            1 => (parts[0], ""),
            _ => (parts[0], string.Join(' ', parts.Skip(1))),
        };
    }

    private async Task<bool> TrySendInvitationAsync(string subject, IReadOnlyCollection<string> actions, CancellationToken ct)
    {
        try
        {
            await identityProvider.SendRequiredActionsEmailAsync(subject, actions, ct);
            return true;
        }
        catch (DependencyFailureException)
        {
            return false;
        }
    }

    private async Task RequireAsync(ActorContext actor, string permission, CancellationToken ct)
    {
        if (!await permissions.HasPermissionAsync(actor.UserId, permission, ct))
        {
            await RecordDeniedAsync(actor, "authorization.denied", permission, ct);
            throw new ForbiddenException("You do not have permission to perform this action.");
        }
    }

    private async Task<AppUser> LoadActiveUserAsync(Guid userId, CancellationToken ct)
    {
        var user = await LoadUserAsync(userId, ct);
        if (!user.IsActive)
        {
            throw new ForbiddenException("This account is not active.");
        }

        return user;
    }

    private async Task<AppUser> LoadUserAsync(Guid userId, CancellationToken ct) =>
        await db.Users.Include(u => u.Identities).FirstOrDefaultAsync(u => u.Id == userId, ct)
        ?? throw new NotFoundException("The account was not found.");

    private async Task<string> PrimarySubjectAsync(AppUser user, CancellationToken ct)
    {
        var identity = user.Identities.FirstOrDefault(i => i.Issuer == IdentityIssuer)
            ?? await db.ExternalIdentities.FirstOrDefaultAsync(i => i.UserId == user.Id && i.Issuer == IdentityIssuer, ct);
        return identity?.Subject ?? throw new ConflictException("This account is not linked to an identity provider record.");
    }

    private async Task<int> CountActiveSuperAdminsAsync(CancellationToken ct) =>
        await db.Users.CountAsync(u => u.Role == AppRole.SuperAdmin && u.Status == UserStatus.Active, ct);

    private async Task<Guid> PrimaryOrganizationIdAsync(CancellationToken ct) =>
        await db.Organizations.Select(o => (Guid?)o.Id).OrderBy(id => id).FirstOrDefaultAsync(ct)
        ?? throw new DependencyFailureException("The organization has not been provisioned.");

    private async Task<Guid?> ResolveBranchIdAsync(string? branchCode, Guid organizationId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(branchCode))
        {
            return null;
        }

        var code = branchCode.Trim().ToUpperInvariant();
        var branchId = await db.Organizations
            .Where(o => o.Id == organizationId)
            .SelectMany(o => o.Branches)
            .Where(b => b.Code == code)
            .Select(b => (Guid?)b.Id)
            .FirstOrDefaultAsync(ct);

        return branchId ?? throw new NotFoundException("The branch was not found.");
    }

    private async Task RevokeSessionsForUserAsync(Guid userId, CancellationToken ct)
    {
        var sessions = await db.AuthSessions.Where(s => s.UserId == userId && s.RevokedUtc == null).ToListAsync(ct);
        foreach (var session in sessions)
        {
            session.Revoke();
        }
    }

    private void AddAudit(ActorContext actor, string action, AuditOutcome outcome, string targetType, string? targetId, string? details) =>
        db.AuditEvents.Add(new AuditEvent(action, outcome, actor.UserId, actor.Subject, targetType, targetId, actor.CorrelationId, details));

    private async Task RecordDeniedAsync(ActorContext actor, string action, string? target, CancellationToken ct)
    {
        db.AuditEvents.Add(new AuditEvent(action, AuditOutcome.Denied, actor.UserId, actor.Subject, TargetUser, target, actor.CorrelationId, null));
        await db.SaveChangesAsync(ct);
    }

    private static void ExpectRowVersion(AppUser user, uint expected)
    {
        if (user.RowVersion != expected)
        {
            throw new ConflictException("The account was changed by someone else. Reload it and try again.");
        }
    }

    private async Task SaveAsync(CancellationToken ct)
    {
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConflictException("The record was changed by another user. Reload it and try again.");
        }
    }

    private static CurrentUserDto ToCurrent(AppUser user) =>
        new(user.Id, user.Email, user.DisplayName, user.Role, user.Status, user.LastSignInUtc);

    private static UserSummaryDto ToSummary(AppUser user) =>
        new(user.Id, user.Email, user.DisplayName, user.Role, user.Status, user.LastSignInUtc, user.RowVersion);
}
