using Manada.Domain.Audit;
using Manada.Domain.Customers;
using Manada.Domain.Organization;
using Manada.Domain.Settings;
using Manada.Domain.Staff;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Manada.Infrastructure.Persistence.Configurations;

internal sealed class OrganizationConfiguration : IEntityTypeConfiguration<Organization>
{
    public void Configure(EntityTypeBuilder<Organization> builder)
    {
        builder.ToTable("organizations");
        builder.HasKey(o => o.Id);
        builder.Ignore(o => o.Branches);
        builder.Property(o => o.Name).HasMaxLength(200).IsRequired();
        builder.Property(o => o.CreatedUtc).HasColumnType("timestamptz");
        builder.Property(o => o.UpdatedUtc).HasColumnType("timestamptz");
        builder.HasMany<Branch>("_branches").WithOne().HasForeignKey(b => b.OrganizationId).OnDelete(DeleteBehavior.Restrict);
        builder.HasData(SeedData.Organization);
        ConcurrencyMapping.MapRowVersion(builder);
    }
}

internal sealed class BranchConfiguration : IEntityTypeConfiguration<Branch>
{
    public void Configure(EntityTypeBuilder<Branch> builder)
    {
        builder.ToTable("branches");
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Name).HasMaxLength(200).IsRequired();
        builder.Property(b => b.Code).HasMaxLength(32).IsRequired();
        builder.HasIndex(b => new { b.OrganizationId, b.Code }).IsUnique();
        builder.Property(b => b.CreatedUtc).HasColumnType("timestamptz");
        builder.Property(b => b.UpdatedUtc).HasColumnType("timestamptz");
    }
}

internal sealed class StaffProfileConfiguration : IEntityTypeConfiguration<StaffProfile>
{
    public void Configure(EntityTypeBuilder<StaffProfile> builder)
    {
        builder.ToTable("staff_profiles");
        builder.HasKey(s => s.UserId);
        builder.Property(s => s.JobTitle).HasMaxLength(120).IsRequired();
        builder.HasOne<Branch>().WithMany().HasForeignKey(s => s.BranchId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Manada.Domain.Identity.AppUser>().WithOne().HasForeignKey<StaffProfile>(s => s.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.Property(s => s.CreatedUtc).HasColumnType("timestamptz");
        builder.Property(s => s.UpdatedUtc).HasColumnType("timestamptz");
        ConcurrencyMapping.MapRowVersion(builder);
    }
}

internal sealed class CustomerProfileConfiguration : IEntityTypeConfiguration<CustomerProfile>
{
    public void Configure(EntityTypeBuilder<CustomerProfile> builder)
    {
        builder.ToTable("customer_profiles");
        builder.HasKey(c => c.UserId);
        builder.Property(c => c.FullName).HasMaxLength(200).IsRequired();
        builder.Property(c => c.Phone).HasMaxLength(32);
        builder.Property(c => c.CompanyName).HasMaxLength(200);
        builder.Property(c => c.ProfileCompletedUtc).HasColumnType("timestamptz");
        builder.HasOne<Manada.Domain.Identity.AppUser>().WithOne().HasForeignKey<CustomerProfile>(c => c.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.Property(c => c.CreatedUtc).HasColumnType("timestamptz");
        builder.Property(c => c.UpdatedUtc).HasColumnType("timestamptz");
        ConcurrencyMapping.MapRowVersion(builder);
    }
}

internal sealed class AuditEventConfiguration : IEntityTypeConfiguration<AuditEvent>
{
    public void Configure(EntityTypeBuilder<AuditEvent> builder)
    {
        builder.ToTable("audit_events");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.OccurredUtc).HasColumnType("timestamptz");
        builder.Property(e => e.ActorSubject).HasMaxLength(255);
        builder.Property(e => e.Action).HasMaxLength(100).IsRequired();
        builder.Property(e => e.TargetType).HasMaxLength(64);
        builder.Property(e => e.TargetId).HasMaxLength(128);
        builder.Property(e => e.Outcome).HasConversion<string>().HasMaxLength(16);
        builder.Property(e => e.CorrelationId).HasMaxLength(128);
        builder.Property(e => e.Details).HasMaxLength(2000);
        builder.HasIndex(e => e.OccurredUtc);
        builder.HasIndex(e => e.Action);
        builder.HasIndex(e => e.ActorUserId);
    }
}

internal sealed class SystemSettingConfiguration : IEntityTypeConfiguration<SystemSetting>
{
    public void Configure(EntityTypeBuilder<SystemSetting> builder)
    {
        builder.ToTable("system_settings");
        builder.HasKey(s => s.Key);
        builder.Property(s => s.Key).HasMaxLength(100);
        builder.Property(s => s.Value).HasMaxLength(2000).IsRequired();
        builder.Property(s => s.UpdatedUtc).HasColumnType("timestamptz");
        ConcurrencyMapping.MapRowVersion(builder);
    }
}
