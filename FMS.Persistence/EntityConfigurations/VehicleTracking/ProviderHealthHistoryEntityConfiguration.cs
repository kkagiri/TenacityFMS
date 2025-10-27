using FMS.Domain.Entities.VehicleTracking;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations.VehicleTracking
{
    /// <summary>
    /// Entity Framework configuration for ProviderHealthHistoryEntity
    /// </summary>
    public class ProviderHealthHistoryEntityConfiguration : IEntityTypeConfiguration<ProviderHealthHistoryEntity>
    {
        public void Configure(EntityTypeBuilder<ProviderHealthHistoryEntity> builder)
        {
            builder.ToTable("provider_health_history");

            builder.HasKey(e => e.Id);

            builder.Property(e => e.Id)
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            builder.Property(e => e.ProviderConfigId)
                .HasColumnName("provider_config_id")
                .IsRequired();

            builder.Property(e => e.ProviderName)
                .HasColumnName("provider_name")
                .HasMaxLength(100)
                .IsRequired();

            builder.Property(e => e.Status)
                .HasColumnName("status")
                .HasMaxLength(50)
                .IsRequired()
                .HasDefaultValue("Unknown");

            builder.Property(e => e.Message)
                .HasColumnName("message")
                .HasColumnType("text");

            builder.Property(e => e.ResponseTimeMs)
                .HasColumnName("response_time_ms");

            builder.Property(e => e.SuccessRate)
                .HasColumnName("success_rate")
                .HasColumnType("decimal(5,2)");

            builder.Property(e => e.ErrorCount)
                .HasColumnName("error_count")
                .HasDefaultValue(0);

            // MySQL 5.5/5.6 compatibility: no JSON type
            builder.Property(e => e.AdditionalMetrics)
                .HasColumnName("additional_metrics")
                .HasColumnType("longtext");

            builder.Property(e => e.CheckedAt)
                .HasColumnName("checked_at"); // No DEFAULT CURRENT_TIMESTAMP

            // Relationships
            builder.HasOne(e => e.ProviderConfiguration)
                .WithMany()
                .HasForeignKey(e => e.ProviderConfigId)
                .OnDelete(DeleteBehavior.Cascade);

            // Indexes
            builder.HasIndex(e => e.ProviderConfigId)
                .HasDatabaseName("idx_health_provider_id");

            builder.HasIndex(e => e.ProviderName)
                .HasDatabaseName("idx_health_provider_name");

            builder.HasIndex(e => e.CheckedAt)
                .HasDatabaseName("idx_health_checked_at");

            builder.HasIndex(e => new { e.ProviderConfigId, e.CheckedAt })
                .HasDatabaseName("idx_health_provider_time");

            builder.HasIndex(e => e.Status)
                .HasDatabaseName("idx_health_status");
        }
    }
}
