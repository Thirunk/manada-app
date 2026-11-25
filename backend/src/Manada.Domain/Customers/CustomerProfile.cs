using Manada.Domain.Common;

namespace Manada.Domain.Customers;

/// <summary>Customer details. One profile per customer account.</summary>
public sealed class CustomerProfile : Entity
{
    private CustomerProfile() { }

    public CustomerProfile(Guid userId, string fullName)
    {
        UserId = userId;
        FullName = ValidateName(fullName);
    }

    public Guid UserId { get; private set; }

    public string FullName { get; private set; } = string.Empty;

    public string? Phone { get; private set; }

    public string? CompanyName { get; private set; }

    public DateTimeOffset? ProfileCompletedUtc { get; private set; }

    public void Update(string fullName, string? phone, string? companyName)
    {
        FullName = ValidateName(fullName);
        Phone = Optional(phone, 32);
        CompanyName = Optional(companyName, 200);
        ProfileCompletedUtc ??= DateTimeOffset.UtcNow;
        Touch();
    }

    private static string ValidateName(string fullName)
    {
        var trimmed = (fullName ?? string.Empty).Trim();
        if (trimmed.Length is < 1 or > 200)
        {
            throw new DomainException("Full name must be between 1 and 200 characters.");
        }

        return trimmed;
    }

    private static string? Optional(string? value, int maxLength)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrEmpty(trimmed))
        {
            return null;
        }

        if (trimmed.Length > maxLength)
        {
            throw new DomainException($"Value must be at most {maxLength} characters.");
        }

        return trimmed;
    }
}
