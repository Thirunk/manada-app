using FluentValidation;
using Manada.Domain.Identity;

namespace Manada.Application.Users;

/// <summary>Centralized request validation. Privileged fields are not part of any request DTO.</summary>
public sealed class CreateAccountRequestValidator : AbstractValidator<CreateAccountRequest>
{
    public CreateAccountRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(254);

        RuleFor(x => x.FullName)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Role)
            .Must(role => role is AppRole.Admin or AppRole.Staff or AppRole.Customer)
            .WithMessage("Choose Admin, Staff or Customer. SuperAdmin accounts are not created here.");

        RuleFor(x => x.JobTitle)
            .MaximumLength(120);

        RuleFor(x => x.BranchCode)
            .MaximumLength(32);
    }
}

public sealed class ProfileUpdateRequestValidator : AbstractValidator<ProfileUpdateRequest>
{
    public ProfileUpdateRequestValidator()
    {
        RuleFor(x => x.DisplayName)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Phone)
            .MaximumLength(32)
            .Matches(@"^[+0-9 ()-]*$")
            .When(x => !string.IsNullOrEmpty(x.Phone))
            .WithMessage("Phone numbers may contain digits, spaces, +, ( ) and -.");

        RuleFor(x => x.CompanyName)
            .MaximumLength(200);
    }
}

public sealed class ChangeRoleRequestValidator : AbstractValidator<ChangeRoleRequest>
{
    public ChangeRoleRequestValidator()
    {
        RuleFor(x => x.Role).IsInEnum();
    }
}
