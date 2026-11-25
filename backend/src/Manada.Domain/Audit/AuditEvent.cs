namespace Manada.Domain.Audit;

public enum AuditOutcome
{
    Success = 1,
    Denied = 2,
    Failed = 3,
}

/// <summary>
/// Append-only security audit record. Never store passwords, tokens, recovery codes or other secrets.
/// A database trigger rejects updates and deletes.
/// </summary>
public sealed class AuditEvent
{
    private AuditEvent() { }

    public AuditEvent(
        string action,
        AuditOutcome outcome,
        Guid? actorUserId,
        string? actorSubject,
        string? targetType,
        string? targetId,
        string? correlationId,
        string? details)
    {
        Id = Guid.NewGuid();
        OccurredUtc = DateTimeOffset.UtcNow;
        Action = action;
        Outcome = outcome;
        ActorUserId = actorUserId;
        ActorSubject = actorSubject;
        TargetType = targetType;
        TargetId = targetId;
        CorrelationId = correlationId;
        Details = details;
    }

    public Guid Id { get; private set; }

    public DateTimeOffset OccurredUtc { get; private set; }

    public Guid? ActorUserId { get; private set; }

    public string? ActorSubject { get; private set; }

    public string Action { get; private set; } = string.Empty;

    public string? TargetType { get; private set; }

    public string? TargetId { get; private set; }

    public AuditOutcome Outcome { get; private set; }

    public string? CorrelationId { get; private set; }

    public string? Details { get; private set; }
}
