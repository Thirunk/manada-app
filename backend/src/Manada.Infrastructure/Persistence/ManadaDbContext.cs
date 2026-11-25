using Manada.Application.Abstractions;
using Manada.Domain.Audit;
using Manada.Domain.Customers;
using Manada.Domain.Identity;
using Manada.Domain.Organization;
using Manada.Domain.Settings;
using Manada.Domain.Staff;
using Microsoft.EntityFrameworkCore;

namespace Manada.Infrastructure.Persistence;

/// <summary>PostgreSQL persistence. Configuration lives in the Configurations folder; seed data is in the model.</summary>
public sealed class ManadaDbContext(DbContextOptions<ManadaDbContext> options) : DbContext(options), IAppDbContext
{
    public DbSet<AppUser> Users => Set<AppUser>();

    public DbSet<ExternalIdentity> ExternalIdentities => Set<ExternalIdentity>();

    public DbSet<Organization> Organizations => Set<Organization>();

    public DbSet<Branch> Branches => Set<Branch>();

    public DbSet<StaffProfile> StaffProfiles => Set<StaffProfile>();

    public DbSet<CustomerProfile> CustomerProfiles => Set<CustomerProfile>();

    public DbSet<Permission> Permissions => Set<Permission>();

    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();

    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();

    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();

    public DbSet<AuthSession> AuthSessions => Set<AuthSession>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("manada");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ManadaDbContext).Assembly);
    }

    /// <summary>Detaches every tracked change. Used after a failed save so the retry sees the database, not the failed insert.</summary>
    public void DiscardPendingChanges() => ChangeTracker.Clear();
}
