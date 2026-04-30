using FMS.Domain.Entities.VehicleTracking;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations.VehicleTracking
{
    /// <summary>
    /// Entity Framework configuration for VehicleProviderMappingEntity
    /// </summary>
    public class VehicleProviderMappingEntityConfiguration : IEntityTypeConfiguration<VehicleProviderMappingEntity>
    {
        public void Configure(EntityTypeBuilder<VehicleProviderMappingEntity> builder)
        {
            builder.ToTable("vehicle_provider_mappings");

            builder.HasKey(e => e.Id);

            builder.Property(e => e.Id)
                .ValueGeneratedOnAdd();

            builder.Property(e => e.TenantId)
                .IsRequired();

            builder.Property(e => e.DeviceCategory)
                .HasMaxLength(40)
                .IsRequired()
                .HasDefaultValue("Tracking");

            builder.Property(e => e.VehicleId);
                // Now nullable to allow fueling-only mappings.

            builder.Property(e => e.FuelingDeviceId);
                // Populated only when DeviceCategory == "Fueling".

            builder.Property(e => e.ProviderConfigId)
                .IsRequired();

            builder.Property(e => e.ExternalDeviceId)
                .HasMaxLength(191); // MySQL 5.5/utf8mb4 index-safe length (<= 767 bytes)

            builder.Property(e => e.IsActive)
                .HasDefaultValue(true);

            builder.Property(e => e.CreatedAt); // No DEFAULT CURRENT_TIMESTAMP

            builder.Property(e => e.UpdatedAt); // No ON UPDATE CURRENT_TIMESTAMP

            builder.Property(e => e.CreatedBy)
                .HasMaxLength(100);

            builder.Property(e => e.UpdatedBy)
                .HasMaxLength(100);

            // Relationships
            builder.HasOne(e => e.ProviderConfiguration)
                .WithMany()
                .HasForeignKey(e => e.ProviderConfigId)
                .OnDelete(DeleteBehavior.Cascade);

            // Indexes
            builder.HasIndex(e => new { e.TenantId, e.VehicleId })
                .HasDatabaseName("idx_mapping_tenant_vehicle");

            builder.HasIndex(e => new { e.TenantId, e.FuelingDeviceId })
                .HasDatabaseName("idx_mapping_tenant_fueling_device");

            builder.HasIndex(e => new { e.TenantId, e.DeviceCategory, e.IsActive })
                .HasDatabaseName("idx_mapping_tenant_category_active");

            builder.HasIndex(e => e.ProviderConfigId)
                .HasDatabaseName("idx_mapping_provider_id");

            builder.HasIndex(e => e.ExternalDeviceId)
                .HasDatabaseName("idx_mapping_external_device");

            // MySQL 5.5: No filtered unique indexes; enforce in application logic
        }
    }
}
