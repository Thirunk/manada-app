using Manada.Domain.Common;

namespace Manada.Domain.Identity;

/// <summary>Maps one identity-provider subject to one application user. Unique on (issuer, subject).</summary>
public sealed class ExternalIdentity : Entity
{
    private ExternalIdentity() { }

    public ExternalIdentity(Guid userId, string issuer, string subject)
    {
        if (string.IsNullOrWhiteSpace(issuer) || string.IsNullOrWhiteSpace(subject))
        {
            throw new DomainException("Identity issuer and subject are required.");
        }

        UserId = userId;
        Issuer = issuer;
        Subject = subject;
    }

    public Guid UserId { get; private set; }

    public string Issuer { get; private set; } = string.Empty;

    public string Subject { get; private set; } = string.Empty;
}
