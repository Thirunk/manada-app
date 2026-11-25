namespace Manada.Domain.Identity;

/// <summary>An application permission. The code is the stable identifier used in authorization policies.</summary>
public sealed class Permission
{
    private Permission() { }

    public Permission(string code, string description)
    {
        Code = code;
        Description = description;
    }

    public string Code { get; private set; } = string.Empty;

    public string Description { get; private set; } = string.Empty;
}
