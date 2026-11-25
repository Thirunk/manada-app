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

    /// <summary>
    /// Detaches the added entities of one failed account insert and nothing else. Changes to unrelated
    /// entities stay tracked, so they are not silently discarded.
    /// </summary>
    public void DetachPendingAccount(Guid userId)
    {
        var idText = userId.ToString();
        var failed = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added)
            .Where(e => e.Entity switch
            {
                AppUser user => user.Id == userId,
                StaffProfile staff => staff.UserId == userId,
                CustomerProfile customer => customer.UserId == userId,
                ExternalIdentity identity => identity.UserId == userId,
                AuditEvent audit => audit.TargetId == idText && audit.Action is "account.created" or "account.provisioned",
                _ => false,
            })
            .ToList();

        foreach (var entry in failed)
        {
            entry.State = EntityState.Detached;
        }
    }
}

/// <summary>Recognises PostgreSQL unique violations (SQLSTATE 23505) by constraint name.</summary>
public sealed class PostgresUniqueViolationDetector : IUniqueViolationDetector
{
    public bool IsUniqueViolation(Exception exception, string constraintName)
    {
        for (Exception? current = exception; current is not null; current = current.InnerException)
        {
            if (current is Npgsql.PostgresException pg
                && pg.SqlState == Npgsql.PostgresErrorCodes.UniqueViolation
                && string.Equals(pg.ConstraintName, constraintName, StringComparison.Ordinal))
            {
                return true;
            }
        }

        return false;
    }
}
