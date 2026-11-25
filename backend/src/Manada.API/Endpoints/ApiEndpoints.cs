using Manada.Domain.Common;
using FluentValidation;
using Manada.API.Auth;
using Manada.Application.Abstractions;
using Manada.Application.Audit;
using Manada.Application.Common;
using Manada.Application.Settings;
using Manada.Application.Users;
using Manada.Domain.Audit;
using Manada.Domain.Identity;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Manada.API.Endpoints;

public sealed record SettingUpdate(string Value, uint? RowVersion);

/// <summary>
/// Authenticated API. Every endpoint resolves the caller from the server-side session and
/// the database. Authorization is enforced by permission policies and by the application services.
/// </summary>
public static class ApiEndpoints
{
    public static IEndpointRouteBuilder MapManadaApi(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("/api").WithTags("Manada");

        var me = api.MapGroup("/me");
        me.MapGet("/", GetMeAsync).WithSummary("Current user.");
        me.MapGet("/permissions", GetPermissionsAsync).WithSummary("Current permissions.");
        me.MapPut("/profile", UpdateProfileAsync).WithSummary("Update own profile.");

        var admin = api.MapGroup("/admin");
        admin.MapGet("/users", ListUsersAsync).WithSummary("List accounts within the caller's scope.");
        admin.MapPost("/users", CreateAccountAsync).WithSummary("Create an Admin, Staff or Customer account.");
        admin.MapPut("/users/{id:guid}/role", ChangeRoleAsync).WithSummary("Change an account role (SuperAdmin only).");
        admin.MapPut("/users/{id:guid}/status", ChangeStatusAsync).WithSummary("Activate or deactivate an account.");
        admin.MapGet("/audit", ListAuditAsync).WithSummary("Query security audit events.");
        admin.MapGet("/settings", ListSettingsAsync).WithSummary("List system settings.");
        admin.MapPut("/settings/{key}", SetSettingAsync).WithSummary("Update an allowlisted system setting.");

        return app;
    }

    private static async Task<Ok<CurrentUserDto>> GetMeAsync(HttpContext http, IAppDbContext db, UserService users, CancellationToken ct) =>
        TypedResults.Ok(await users.GetCurrentUserAsync(await ActorResolver.ResolveAsync(http, db, ct), ct));

    private static async Task<Ok<IReadOnlyCollection<string>>> GetPermissionsAsync(HttpContext http, IAppDbContext db, UserService users, CancellationToken ct) =>
        TypedResults.Ok(await users.GetPermissionsAsync(await ActorResolver.ResolveAsync(http, db, ct), ct));

    private static async Task<IResult> UpdateProfileAsync(
        ProfileUpdateRequest request,
        HttpContext http,
        IAppDbContext db,
        UserService users,
        IValidator<ProfileUpdateRequest> validator,
        CancellationToken ct)
    {
        var invalid = Validate(validator, request);
        if (invalid is not null)
        {
            return invalid;
        }

        var result = await users.UpdateOwnProfileAsync(await ActorResolver.ResolveAsync(http, db, ct), request, ct);
        return TypedResults.Ok(result);
    }

    private static async Task<Ok<PagedResult<UserSummaryDto>>> ListUsersAsync(
        HttpContext http,
        IAppDbContext db,
        UserService users,
        string? role,
        string? status,
        string? search,
        int page = 1,
        int pageSize = 25,
        CancellationToken ct = default)
    {
        var query = new UserListQuery(
            ParseEnum<AppRole>(role, "role"),
            ParseEnum<UserStatus>(status, "status"),
            search,
            new PageRequest(page, pageSize));

        return TypedResults.Ok(await users.ListUsersAsync(await ActorResolver.ResolveAsync(http, db, ct), query, ct));
    }

    private static async Task<IResult> CreateAccountAsync(
        CreateAccountRequest request,
        HttpContext http,
        IAppDbContext db,
        UserService users,
        IValidator<CreateAccountRequest> validator,
        CancellationToken ct)
    {
        var invalid = Validate(validator, request);
        if (invalid is not null)
        {
            return invalid;
        }

        var result = await users.CreateAccountAsync(await ActorResolver.ResolveAsync(http, db, ct), request, ct);
        return TypedResults.Created($"/api/admin/users/{result.User.Id}", result);
    }

    private static async Task<IResult> ChangeRoleAsync(
        Guid id,
        ChangeRoleRequest request,
        HttpContext http,
        IAppDbContext db,
        UserService users,
        IValidator<ChangeRoleRequest> validator,
        CancellationToken ct)
    {
        var invalid = Validate(validator, request);
        if (invalid is not null)
        {
            return invalid;
        }

        return TypedResults.Ok(await users.ChangeRoleAsync(await ActorResolver.ResolveAsync(http, db, ct), id, request, ct));
    }

    private static async Task<Ok<UserSummaryDto>> ChangeStatusAsync(
        Guid id,
        ChangeStatusRequest request,
        HttpContext http,
        IAppDbContext db,
        UserService users,
        CancellationToken ct) =>
        TypedResults.Ok(await users.SetStatusAsync(await ActorResolver.ResolveAsync(http, db, ct), id, request, ct));

    private static async Task<Ok<PagedResult<AuditEventDto>>> ListAuditAsync(
        HttpContext http,
        IAppDbContext db,
        AuditQueryService audit,
        string? action,
        Guid? actorUserId,
        string? outcome,
        DateTimeOffset? from,
        DateTimeOffset? to,
        int page = 1,
        int pageSize = 25,
        CancellationToken ct = default)
    {
        var query = new AuditQuery(action, actorUserId, ParseEnum<AuditOutcome>(outcome, "outcome"), from, to, new PageRequest(page, pageSize));
        return TypedResults.Ok(await audit.ListAsync(await ActorResolver.ResolveAsync(http, db, ct), query, ct));
    }

    private static async Task<Ok<IReadOnlyList<SettingDto>>> ListSettingsAsync(HttpContext http, IAppDbContext db, SettingsService settings, CancellationToken ct) =>
        TypedResults.Ok(await settings.ListAsync(await ActorResolver.ResolveAsync(http, db, ct), ct));

    private static async Task<IResult> SetSettingAsync(
        string key,
        SettingUpdate update,
        HttpContext http,
        IAppDbContext db,
        SettingsService settings,
        CancellationToken ct)
    {
        var result = await settings.SetAsync(await ActorResolver.ResolveAsync(http, db, ct), key, update.Value, update.RowVersion, ct);
        return TypedResults.Ok(result);
    }

    private static IResult? Validate<T>(IValidator<T> validator, T request)
    {
        var result = validator.Validate(request);
        if (result.IsValid)
        {
            return null;
        }

        var errors = result.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
        return TypedResults.ValidationProblem(errors);
    }

    private static T? ParseEnum<T>(string? value, string name) where T : struct, Enum
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        if (Enum.TryParse<T>(value, ignoreCase: true, out var parsed) && Enum.IsDefined(parsed))
        {
            return parsed;
        }

        throw new DomainException($"The {name} filter is not valid.");
    }
}
