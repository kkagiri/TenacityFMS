using FMS.Domain.Entities.VehicleTracking;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations.VehicleTracking
{
    /// <summary>
    /// Entity Framework configuration for ProviderConfigurationEntity
    /// </summary>
    public class ProviderConfigurationEntityConfiguration : IEntityTypeConfiguration<ProviderConfigurationEntity>
    {
        public void Configure(EntityTypeBuilder<ProviderConfigurationEntity> builder)
        {
            builder.ToTable("provider_configurations");

            builder.HasKey(e => e.Id);

            builder.Property(e => e.Id)
                .ValueGeneratedOnAdd();

            builder.Property(e => e.TenantId)
                .IsRequired();

            builder.Property(e => e.DeviceCategory)
                .HasMaxLength(40)
                .IsRequired()
                .HasDefaultValue("Tracking");

            builder.Property(e => e.Name)
                .HasMaxLength(100)
                .IsRequired();

            builder.Property(e => e.DisplayName)
                .HasMaxLength(200)
                .IsRequired();

            builder.Property(e => e.Description)
                .HasMaxLength(1000);

            builder.Property(e => e.IsEnabled)
                .HasDefaultValue(true);

            builder.Property(e => e.IsDefault)
                .HasDefaultValue(false);

            builder.Property(e => e.Version)
                .HasMaxLength(50)
                .IsRequired()
                .HasDefaultValue("1.0.0");

            // MySQL 5.5/5.6 compatibility: no JSON type, no defaults for TEXT/LONGTEXT
            builder.Property(e => e.Settings)
                .IsRequired();

            builder.Property(e => e.Priority)
                .HasDefaultValue(999);

            // No DEFAULT CURRENT_TIMESTAMP on MySQL 5.5/5.6 (multiple timestamp columns unsupported)
            builder.Property(e => e.CreatedAt);

            // No ON UPDATE CURRENT_TIMESTAMP on MySQL 5.5/5.6
            builder.Property(e => e.UpdatedAt);

            builder.Property(e => e.CreatedBy)
                .HasMaxLength(100);

            builder.Property(e => e.UpdatedBy)
                .HasMaxLength(100);

            builder.Property(e => e.IsDeleted)
                .HasDefaultValue(false);

            builder.Property(e => e.DeletedAt);

            builder.Property(e => e.DeletedBy)
                .HasMaxLength(100);

            // Indexes
            builder.HasIndex(e => new { e.TenantId, e.Name })
                .IsUnique()
                .HasDatabaseName("idx_provider_tenant_name");

            builder.HasIndex(e => new { e.TenantId, e.DeviceCategory, e.IsEnabled })
                .HasDatabaseName("idx_provider_tenant_category");

            builder.HasIndex(e => e.IsEnabled)
                .HasDatabaseName("idx_provider_enabled");

            builder.HasIndex(e => e.IsDefault)
                .HasDatabaseName("idx_provider_default");

            builder.HasIndex(e => new { e.IsDeleted, e.IsEnabled })
                .HasDatabaseName("idx_provider_active");

            // Global query filter for soft delete
            builder.HasQueryFilter(e => !e.IsDeleted);
        }
    }
}

