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
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            builder.Property(e => e.VehicleId)
                .HasColumnName("vehicle_id")
                .IsRequired();

            builder.Property(e => e.ProviderConfigId)
                .HasColumnName("provider_config_id")
                .IsRequired();

            builder.Property(e => e.ExternalDeviceId)
                .HasColumnName("external_device_id")
                .HasMaxLength(191); // MySQL 5.5/utf8mb4 index-safe length (<= 767 bytes)

            builder.Property(e => e.IsActive)
                .HasColumnName("is_active")
                .HasDefaultValue(true);

            builder.Property(e => e.CreatedAt)
                .HasColumnName("created_at"); // No DEFAULT CURRENT_TIMESTAMP

            builder.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at"); // No ON UPDATE CURRENT_TIMESTAMP

            builder.Property(e => e.CreatedBy)
                .HasColumnName("created_by")
                .HasMaxLength(100);

            builder.Property(e => e.UpdatedBy)
                .HasColumnName("updated_by")
                .HasMaxLength(100);

            // Relationships
            builder.HasOne(e => e.ProviderConfiguration)
                .WithMany()
                .HasForeignKey(e => e.ProviderConfigId)
                .OnDelete(DeleteBehavior.Cascade);

            // Indexes
            builder.HasIndex(e => e.VehicleId)
                .HasDatabaseName("idx_mapping_vehicle_id");

            builder.HasIndex(e => e.ProviderConfigId)
                .HasDatabaseName("idx_mapping_provider_id");

            builder.HasIndex(e => new { e.VehicleId, e.IsActive })
                .HasDatabaseName("idx_mapping_vehicle_active");

            builder.HasIndex(e => e.ExternalDeviceId)
                .HasDatabaseName("idx_mapping_external_device");

            // MySQL 5.5: No filtered unique indexes; enforce in application logic
        }
    }
}
