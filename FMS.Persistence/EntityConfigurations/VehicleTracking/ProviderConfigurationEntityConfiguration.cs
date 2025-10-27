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
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            builder.Property(e => e.Name)
                .HasColumnName("name")
                .HasMaxLength(100)
                .IsRequired();

            builder.Property(e => e.DisplayName)
                .HasColumnName("display_name")
                .HasMaxLength(200)
                .IsRequired();

            builder.Property(e => e.Description)
                .HasColumnName("description")
                .HasMaxLength(1000);

            builder.Property(e => e.IsEnabled)
                .HasColumnName("is_enabled")
                .HasDefaultValue(true);

            builder.Property(e => e.IsDefault)
                .HasColumnName("is_default")
                .HasDefaultValue(false);

            builder.Property(e => e.Version)
                .HasColumnName("version")
                .HasMaxLength(50)
                .IsRequired()
                .HasDefaultValue("1.0.0");

            // MySQL 5.5/5.6 compatibility: no JSON type, no defaults for TEXT/LONGTEXT
            builder.Property(e => e.Settings)
                .HasColumnName("settings")
                .HasColumnType("longtext")
                .IsRequired();

            builder.Property(e => e.Priority)
                .HasColumnName("priority")
                .HasDefaultValue(999);

            // No DEFAULT CURRENT_TIMESTAMP on MySQL 5.5/5.6 (multiple timestamp columns unsupported)
            builder.Property(e => e.CreatedAt)
                .HasColumnName("created_at");

            // No ON UPDATE CURRENT_TIMESTAMP on MySQL 5.5/5.6
            builder.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at");

            builder.Property(e => e.CreatedBy)
                .HasColumnName("created_by")
                .HasMaxLength(100);

            builder.Property(e => e.UpdatedBy)
                .HasColumnName("updated_by")
                .HasMaxLength(100);

            builder.Property(e => e.IsDeleted)
                .HasColumnName("is_deleted")
                .HasDefaultValue(false);

            builder.Property(e => e.DeletedAt)
                .HasColumnName("deleted_at");

            builder.Property(e => e.DeletedBy)
                .HasColumnName("deleted_by")
                .HasMaxLength(100);

            // Indexes
            builder.HasIndex(e => e.Name)
                .IsUnique()
                .HasDatabaseName("idx_provider_name");

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
