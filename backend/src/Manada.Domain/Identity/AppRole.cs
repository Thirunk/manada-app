namespace Manada.Domain.Identity;

/// <summary>Application roles. The database role is authoritative for permissions.</summary>
public enum AppRole
{
    SuperAdmin = 1,
    Admin = 2,
    Staff = 3,
    Customer = 4,
}
