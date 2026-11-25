namespace Manada.Domain.Common;

/// <summary>Base entity: UUID identifier, UTC timestamps and a database concurrency token.</summary>
public abstract class Entity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();

    public DateTimeOffset CreatedUtc { get; protected set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedUtc { get; protected set; } = DateTimeOffset.UtcNow;

    /// <summary>Mapped to the PostgreSQL xmin system column for optimistic concurrency.</summary>
    public uint RowVersion { get; private set; }

    protected void Touch() => UpdatedUtc = DateTimeOffset.UtcNow;
}
