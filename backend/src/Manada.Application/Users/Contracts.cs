using Manada.Application.Common;
using Manada.Domain.Identity;

namespace Manada.Application.Users;

/// <summary>Current user as returned to the browser. Contains no tokens or provider secrets.</summary>
public sealed record CurrentUserDto(
    Guid Id,
    string Email,
    string DisplayName,
    AppRole Role,
    UserStatus Status,
    DateTimeOffset? LastSignInUtc);

/// <summary>Account summary for administrative lists. Limited personal information only.</summary>
public sealed record UserSummaryDto(
    Guid Id,
    string Email,
    string DisplayName,
    AppRole Role,
    UserStatus Status,
    DateTimeOffset? LastSignInUtc,
    uint RowVersion);

public sealed record ProfileUpdateRequest(string DisplayName, string? Phone, string? CompanyName);

public sealed record UserListQuery(AppRole? Role, UserStatus? Status, string? Search, PageRequest Page);

public sealed record CreateAccountRequest(
    string Email,
    string FullName,
    AppRole Role,
    string? JobTitle,
    string? BranchCode);

public sealed record CreateAccountResult(UserSummaryDto User, bool InvitationSent);

public sealed record ChangeRoleRequest(AppRole Role, uint RowVersion);

public sealed record ChangeStatusRequest(bool Active, uint RowVersion);
