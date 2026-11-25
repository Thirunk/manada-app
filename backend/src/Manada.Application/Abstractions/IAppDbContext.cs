using Manada.Domain.Audit;
using Manada.Domain.Customers;
using Manada.Domain.Identity;
using Manada.Domain.Organization;
using Manada.Domain.Settings;
using Manada.Domain.Staff;
using Microsoft.EntityFrameworkCore;

namespace Manada.Application.Abstractions;

/// <summary>Persistence port. Implemented by the PostgreSQL DbContext in the infrastructure layer.</summary>
public interface IAppDbContext
{
    DbSet<AppUser> Users { get; }

    DbSet<ExternalIdentity> ExternalIdentities { get; }

    DbSet<Organization> Organizations { get; }

    DbSet<Branch> Branches { get; }

    DbSet<StaffProfile> StaffProfiles { get; }

    DbSet<CustomerProfile> CustomerProfiles { get; }

    DbSet<Permission> Permissions { get; }

    DbSet<RolePermission> RolePermissions { get; }

    DbSet<AuditEvent> AuditEvents { get; }

    DbSet<SystemSetting> SystemSettings { get; }

    DbSet<AuthSession> AuthSessions { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    /// <summary>Discards tracked changes that a failed save left behind.</summary>
    void DiscardPendingChanges();
}
