using FluentValidation;

namespace Manada.Application.Governance;

public sealed class OrganizationUpdateValidator : AbstractValidator<OrganizationUpdate>
{
    public OrganizationUpdateValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Organization name is required.")
            .MaximumLength(200).WithMessage("Organization name must be at most 200 characters.");
        RuleFor(x => x.RowVersion).GreaterThan(0u).WithMessage("The row version is required.");
    }
}
