/*
 * File:          TenantConfiguration.cs
 * Purpose:       EF Core configuration for the Tenant entity (root of
 *                multi-tenancy isolation). Maps to the `tenant` table.
 * Dependencies:  EF Core, FMS.Domain
 * Last Modified: 2026-04-26
 */
using FMS.Domain.Entities.Features.MultiTenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations.Features.MultiTenancy
{
    public class TenantConfiguration : EntityTypeConfiguration<Tenant>
    {
        public override void Configure(EntityTypeBuilder<Tenant> builder)
        {
            builder.ToTable("tenant");
            builder.HasKey(e => e.Id).HasName("PRIMARY");

            builder.Property(e => e.Id);

            builder.Property(e => e.Code)
                .HasMaxLength(64)
                .IsRequired();

            builder.HasIndex(e => e.Code, "Tenant_Code_UNIQUE").IsUnique();

            builder.Property(e => e.Name)
                .HasMaxLength(255)
                .IsRequired();

            builder.Property(e => e.IsActive);

            // MySQL 5.5/5.6 compat: use DATETIME NULL, no CURRENT_TIMESTAMP defaults.
            builder.Property(e => e.CreatedAt);
            builder.Property(e => e.UpdatedAt);
        }
    }
}

