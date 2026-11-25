using Manada.Domain.Common;

namespace Manada.Domain.Organization;

/// <summary>The business organization. A single Manada organization is provisioned initially.</summary>
public sealed class Organization : Entity
{
    private readonly List<Branch> _branches = [];

    private Organization() { }

    public Organization(string name)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Length > 200)
        {
            throw new DomainException("Organization name is required (maximum 200 characters).");
        }

        Name = name.Trim();
    }

    public string Name { get; private set; } = string.Empty;

    public IReadOnlyCollection<Branch> Branches => _branches;

    public Branch AddBranch(string name, string code)
    {
        if (_branches.Any(b => string.Equals(b.Code, code, StringComparison.OrdinalIgnoreCase)))
        {
            throw new DomainException("A branch with this code already exists.");
        }

        var branch = new Branch(Id, name, code);
        _branches.Add(branch);
        Touch();
        return branch;
    }
}
