namespace Manada.Domain.Common;

/// <summary>A business rule was violated. The message is safe to show to the caller.</summary>
public sealed class DomainException(string message) : Exception(message);
