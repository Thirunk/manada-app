using Manada.Application.Abstractions;
using Manada.Application.Common;
using Manada.Domain.Audit;
using Manada.Domain.Identity;
using Microsoft.EntityFrameworkCore;

namespace Manada.Application.Audit;

public sealed record AuditQuery(
    string? Action,
    Guid? ActorUserId,
    AuditOutcome? Outcome,
    DateTimeOffset? FromUtc,
    DateTimeOffset? ToUtc,
    PageRequest Page);

public sealed record AuditEventDto(
    Guid Id,
    DateTimeOffset OccurredUtc,
    Guid? ActorUserId,
    string Action,
    string? TargetType,
    string? TargetId,
    AuditOutcome Outcome,
    string? CorrelationId,
    string? Details);

/// <summary>Read-only audit queries. Access requires the audit.read permission.</summary>
public sealed class AuditQueryService(IAppDbContext db, IPermissionService permissions)
{
    public async Task<PagedResult<AuditEventDto>> ListAsync(ActorContext actor, AuditQuery query, CancellationToken ct = default)
    {
        if (!await permissions.HasPermissionAsync(actor.UserId, PermissionCodes.AuditRead, ct))
        {
            throw new ForbiddenException("You do not have permission to view audit events.");
        }

        var events = db.AuditEvents.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Action))
        {
            var action = query.Action.Trim();
            events = events.Where(e => e.Action.StartsWith(action));
        }

        if (query.ActorUserId is { } actorId)
        {
            events = events.Where(e => e.ActorUserId == actorId);
        }

        if (query.Outcome is { } outcome)
        {
            events = events.Where(e => e.Outcome == outcome);
        }

        if (query.FromUtc is { } from)
        {
            events = events.Where(e => e.OccurredUtc >= from);
        }

        if (query.ToUtc is { } to)
        {
            events = events.Where(e => e.OccurredUtc <= to);
        }

        var total = await events.CountAsync(ct);
        var items = await events
            .OrderByDescending(e => e.OccurredUtc)
            .Skip(query.Page.Skip)
            .Take(query.Page.SafePageSize)
            .Select(e => new AuditEventDto(
                e.Id,
                e.OccurredUtc,
                e.ActorUserId,
                e.Action,
                e.TargetType,
                e.TargetId,
                e.Outcome,
                e.CorrelationId,
                e.Details))
            .ToListAsync(ct);

        return new PagedResult<AuditEventDto>(items, query.Page.SafePage, query.Page.SafePageSize, total);
    }
}
