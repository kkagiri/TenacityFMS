using FMS.Domain.Entities.FuelAudit;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations.FuelAudit
{
    /// <summary>
    /// Entity configuration for FuelAuditThreshold
    /// </summary>
    public class FuelAuditThresholdConfiguration : IEntityTypeConfiguration<FuelAuditThreshold>
    {
        public void Configure(EntityTypeBuilder<FuelAuditThreshold> builder)
        {
            builder.ToTable("fuel_audit_thresholds");

            builder.HasKey(t => t.Id);

            builder.Property(t => t.Id)
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            builder.Property(t => t.Category)
                .HasColumnName("category")
                .HasMaxLength(30)
                .IsRequired();

            builder.Property(t => t.ThresholdType)
                .HasColumnName("threshold_type")
                .HasMaxLength(30)
                .IsRequired();

            builder.Property(t => t.Name)
                .HasColumnName("name")
                .HasMaxLength(100)
                .IsRequired();

            builder.Property(t => t.Description)
                .HasColumnName("description")
                .HasColumnType("text");

            builder.Property(t => t.ThresholdValue)
                .HasColumnName("threshold_value")
                .HasColumnType("decimal(10,2)")
                .IsRequired();

            builder.Property(t => t.Unit)
                .HasColumnName("unit")
                .HasMaxLength(20)
                .IsRequired();

            builder.Property(t => t.Severity)
                .HasColumnName("severity")
                .HasMaxLength(20)
                .IsRequired()
                .HasDefaultValue("Medium");

            builder.Property(t => t.IsActive)
                .HasColumnName("is_active")
                .HasColumnType("bit(1)")
                .HasDefaultValue(true);

            builder.Property(t => t.AutoApply)
                .HasColumnName("auto_apply")
                .HasColumnType("bit(1)")
                .HasDefaultValue(true);

            builder.Property(t => t.VehicleTypeFilter)
                .HasColumnName("vehicle_type_filter")
                .HasMaxLength(20);

            // Audit Trail
            builder.Property(t => t.CreatedAt)
                .HasColumnName("created_at")
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(t => t.CreatedBy)
                .HasColumnName("created_by");

            builder.Property(t => t.UpdatedAt)
                .HasColumnName("updated_at")
                .HasColumnType("datetime");

            builder.Property(t => t.UpdatedBy)
                .HasColumnName("updated_by");

            // Indexes
            builder.HasIndex(t => t.Category);
            builder.HasIndex(t => t.IsActive);
        }
    }
}
