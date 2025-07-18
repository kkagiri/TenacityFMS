using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    //Cursor on changes to code
    /// <summary>
    /// Entity configuration for SystemConfiguration
    /// </summary>
    public class SystemConfigurationConfiguration : IEntityTypeConfiguration<SystemConfiguration> {
        public void Configure (EntityTypeBuilder<SystemConfiguration> builder) {
            builder.ToTable ("SystemConfigurations");

            // Primary key
            builder.HasKey (e => e.Id);

            // Properties
            builder.Property (e => e.ConfigurationKey)
                .IsRequired ()
                .HasMaxLength (191);

            builder.Property (e => e.ConfigurationValue)
                .IsRequired ()
                .HasMaxLength (1000);

            builder.Property (e => e.Description)
                .HasMaxLength (500);

            builder.Property (e => e.DataType)
                .HasMaxLength (50);

            builder.Property (e => e.Category)
                .HasMaxLength (100);

            builder.Property (e => e.CreatedBy)
                .HasMaxLength (100);

            builder.Property (e => e.UpdatedBy)
                .HasMaxLength (100);

            builder.Property (e => e.ValidationPattern)
                .HasMaxLength (191);

            builder.Property (e => e.DefaultValue)
                .HasMaxLength (1000);

            builder.Property (e => e.CreatedAt)
                .HasDefaultValueSql ("CURRENT_TIMESTAMP")
                .HasColumnType ("timestamp");

            builder.Property (e => e.UpdatedAt)
                .HasDefaultValueSql ("'0000-00-00 00:00:00'")
                .HasColumnType ("timestamp");

            // Indexes
            builder.HasIndex (e => e.ConfigurationKey)
                .IsUnique ()
                .HasDatabaseName ("IX_SystemConfigurations_ConfigurationKey");

            builder.HasIndex (e => e.Category)
                .HasDatabaseName ("IX_SystemConfigurations_Category");

            builder.HasIndex (e => new { e.IsActive, e.ConfigurationKey })
                .HasDatabaseName ("IX_SystemConfigurations_IsActive_ConfigurationKey");

            // Default values
            builder.Property (e => e.IsActive)
                .HasDefaultValue (true);

            builder.Property (e => e.IsEditable)
                .HasDefaultValue (true);
        }
    }
}