namespace Manada.Application.Abstractions;

/// <summary>
/// Names of the unique indexes that application rules depend on. Classification is by constraint name, so an
/// unrelated unique violation is never mistaken for a duplicate account or identity.
/// </summary>
public static class UniqueConstraints
{
    public const string UserEmail = "IX_users_Email";

    public const string ExternalIdentitySubject = "IX_external_identities_Issuer_Subject";
}

/// <summary>Recognises a unique-constraint violation of one named constraint. Implemented by the persistence provider.</summary>
public interface IUniqueViolationDetector
{
    bool IsUniqueViolation(Exception exception, string constraintName);
}
