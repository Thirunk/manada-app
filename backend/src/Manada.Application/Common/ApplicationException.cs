namespace Manada.Application.Common;

/// <summary>The caller is not allowed to perform the requested operation.</summary>
public sealed class ForbiddenException(string message) : Exception(message);

/// <summary>The requested resource does not exist or is not visible to the caller.</summary>
public sealed class NotFoundException(string message) : Exception(message);

/// <summary>The request conflicts with current state (duplicate, concurrent update, last-admin protection).</summary>
public sealed class ConflictException(string message) : Exception(message);

/// <summary>The identity provider or another external dependency failed. The message is safe to show.</summary>
public sealed class DependencyFailureException(string message) : Exception(message);
