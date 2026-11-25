using Manada.Domain.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Manada.Infrastructure.Persistence.Configurations;

/// <summary>Maps the concurrency token to PostgreSQL's xmin system column.</summary>
internal static class ConcurrencyMapping
{
    public static void MapRowVersion<T>(EntityTypeBuilder<T> builder) where T : class
    {
        builder.Property<uint>("RowVersion")
            .HasColumnName("xmin")
            .HasColumnType("xid")
            .ValueGeneratedOnAddOrUpdate()
            .IsConcurrencyToken();
    }
}

internal sealed class AppUserConfiguration : IEntityTypeConfiguration<AppUser>
{
    public void Configure(EntityTypeBuilder<AppUser> builder)
    {
        builder.ToTable("users", t =>
        {
            t.HasCheckConstraint("ck_users_role", "\"Role\" IN ('SuperAdmin','Admin','Staff','Customer')");
            t.HasCheckConstraint("ck_users_status", "\"Status\" IN ('PendingVerification','Active','Disabled')");
        });

        builder.HasKey(u => u.Id);
        builder.Ignore(u => u.Identities);
        builder.Property(u => u.Email).HasMaxLength(254).IsRequired();
        builder.HasIndex(u => u.Email).IsUnique();
        builder.Property(u => u.DisplayName).HasMaxLength(200).IsRequired();
        builder.Property(u => u.Role).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(u => u.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(u => u.OrganizationId).IsRequired();
        builder.Property(u => u.CreatedUtc).HasColumnType("timestamptz");
        builder.Property(u => u.UpdatedUtc).HasColumnType("timestamptz");
        builder.Property(u => u.LastSignInUtc).HasColumnType("timestamptz");
        builder.HasMany<ExternalIdentity>("_identities").WithOne().HasForeignKey(i => i.UserId).OnDelete(DeleteBehavior.Restrict);
        ConcurrencyMapping.MapRowVersion(builder);
    }
}

internal sealed class ExternalIdentityConfiguration : IEntityTypeConfiguration<ExternalIdentity>
{
    public void Configure(EntityTypeBuilder<ExternalIdentity> builder)
    {
        builder.ToTable("external_identities");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Issuer).HasMaxLength(255).IsRequired();
        builder.Property(i => i.Subject).HasMaxLength(255).IsRequired();
        // One application user per provider subject.
        builder.HasIndex(i => new { i.Issuer, i.Subject }).IsUnique();
        builder.HasIndex(i => i.UserId);
        builder.Property(i => i.CreatedUtc).HasColumnType("timestamptz");
        builder.Property(i => i.UpdatedUtc).HasColumnType("timestamptz");
    }
}

internal sealed class PermissionConfiguration : IEntityTypeConfiguration<Permission>
{
    public void Configure(EntityTypeBuilder<Permission> builder)
    {
        builder.ToTable("permissions");
        builder.HasKey(p => p.Code);
        builder.Property(p => p.Code).HasMaxLength(100);
        builder.Property(p => p.Description).HasMaxLength(300).IsRequired();
        builder.HasData(SeedData.Permissions);
    }
}

internal sealed class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermission>
{
    public void Configure(EntityTypeBuilder<RolePermission> builder)
    {
        builder.ToTable("role_permissions");
        builder.HasKey(rp => new { rp.Role, rp.PermissionCode });
        builder.Property(rp => rp.Role).HasConversion<string>().HasMaxLength(32);
        builder.Property(rp => rp.PermissionCode).HasMaxLength(100);
        builder.HasOne<Permission>().WithMany().HasForeignKey(rp => rp.PermissionCode).OnDelete(DeleteBehavior.Restrict);
        builder.HasData(SeedData.RolePermissions);
    }
}

internal sealed class AuthSessionConfiguration : IEntityTypeConfiguration<AuthSession>
{
    public void Configure(EntityTypeBuilder<AuthSession> builder)
    {
        builder.ToTable("auth_sessions");
        builder.HasKey(s => s.Key);
        builder.Property(s => s.Key).HasMaxLength(128);
        builder.Property(s => s.ProtectedTicket).HasColumnType("bytea").IsRequired();
        builder.Property(s => s.CreatedUtc).HasColumnType("timestamptz");
        builder.Property(s => s.ExpiresUtc).HasColumnType("timestamptz");
        builder.Property(s => s.RevokedUtc).HasColumnType("timestamptz");
        builder.HasIndex(s => s.UserId);
        builder.HasOne<AppUser>().WithMany().HasForeignKey(s => s.UserId).OnDelete(DeleteBehavior.Cascade);
        ConcurrencyMapping.MapRowVersion(builder);
    }
}
