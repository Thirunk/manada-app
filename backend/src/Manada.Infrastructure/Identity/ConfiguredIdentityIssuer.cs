using Manada.Application.Abstractions;
using Microsoft.Extensions.Options;

namespace Manada.Infrastructure.Identity;

/// <summary>Reads the issuer from configuration so it always matches the authority used for sign-in.</summary>
public sealed class ConfiguredIdentityIssuer(IOptions<IdentityProviderOptions> options) : IIdentityIssuer
{
    public string Issuer => options.Value.Authority;
}
