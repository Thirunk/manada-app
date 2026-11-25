using Manada.Domain.Common;

namespace Manada.Domain.Organization;

/// <summary>A branch within an organization. Staff may be assigned to a branch. Branch-scoped business data is reserved for later modules.</summary>
public sealed class Branch : Entity
{
    private Branch() { }

    public Branch(Guid organizationId, string name, string code)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Length > 200)
        {
            throw new DomainException("Branch name is required (maximum 200 characters).");
        }

        if (string.IsNullOrWhiteSpace(code) || code.Length > 32)
        {
            throw new DomainException("Branch code is required (maximum 32 characters).");
        }

        OrganizationId = organizationId;
        Name = name.Trim();
        Code = code.Trim().ToUpperInvariant();
    }

    public Guid OrganizationId { get; private set; }

    public string Name { get; private set; } = string.Empty;

    public string Code { get; private set; } = string.Empty;
}
