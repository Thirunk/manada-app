using Manada.Domain.Identity;

namespace Manada.Application.Abstractions;

/// <summary>
/// The authenticated caller, resolved by the API from the server-side session and the
/// database. Role and status come from the database, never from client input.
/// </summary>
public sealed record ActorContext(Guid UserId, string Subject, AppRole Role, string? CorrelationId);
