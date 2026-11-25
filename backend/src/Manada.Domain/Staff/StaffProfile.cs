using Manada.Domain.Common;

namespace Manada.Domain.Staff;

/// <summary>Staff details and branch assignment. One profile per staff account.</summary>
public sealed class StaffProfile : Entity
{
    private StaffProfile() { }

    public StaffProfile(Guid userId, string jobTitle, Guid? branchId)
    {
        UserId = userId;
        JobTitle = ValidateTitle(jobTitle);
        BranchId = branchId;
    }

    public Guid UserId { get; private set; }

    public string JobTitle { get; private set; } = string.Empty;

    public Guid? BranchId { get; private set; }

    public void Update(string jobTitle, Guid? branchId)
    {
        JobTitle = ValidateTitle(jobTitle);
        BranchId = branchId;
        Touch();
    }

    private static string ValidateTitle(string jobTitle)
    {
        var trimmed = (jobTitle ?? string.Empty).Trim();
        if (trimmed.Length is < 1 or > 120)
        {
            throw new DomainException("Job title must be between 1 and 120 characters.");
        }

        return trimmed;
    }
}
