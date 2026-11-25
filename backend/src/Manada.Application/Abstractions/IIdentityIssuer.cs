namespace Manada.Application.Abstractions;

/// <summary>The identity provider issuer as it appears in tokens ("iss"). Identities are keyed by (issuer, subject).</summary>
public interface IIdentityIssuer
{
    string Issuer { get; }
}
