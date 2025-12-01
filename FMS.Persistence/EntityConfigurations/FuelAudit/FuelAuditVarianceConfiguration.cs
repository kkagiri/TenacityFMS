using FMS.Domain.Entities.FuelAudit;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations.FuelAudit
{
    /// <summary>
    /// Entity configuration for FuelAuditVariance
    /// </summary>
    public class FuelAuditVarianceConfiguration : IEntityTypeConfiguration<FuelAuditVariance>
    {
        public void Configure(EntityTypeBuilder<FuelAuditVariance> builder)
        {
            builder.ToTable("fuel_audit_variances");

            builder.HasKey(v => v.Id);

            builder.Property(v => v.Id)
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            builder.Property(v => v.AuditId)
                .HasColumnName("audit_id")
                .IsRequired();

            builder.Property(v => v.Category)
                .HasColumnName("category")
                .HasMaxLength(30)
                .IsRequired();

            builder.Property(v => v.ReferenceId)
                .HasColumnName("reference_id");

            builder.Property(v => v.ReferenceName)
                .HasColumnName("reference_name")
                .HasMaxLength(100);

            // Variance Values
            builder.Property(v => v.ExpectedValue)
                .HasColumnName("expected_value")
                .HasColumnType("decimal(15,2)");

            builder.Property(v => v.ActualValue)
                .HasColumnName("actual_value")
                .HasColumnType("decimal(15,2)");

            builder.Property(v => v.VarianceAmount)
                .HasColumnName("variance_amount")
                .HasColumnType("decimal(15,2)");

            builder.Property(v => v.VariancePercent)
                .HasColumnName("variance_percent")
                .HasColumnType("decimal(5,2)");

            builder.Property(v => v.VarianceDirection)
                .HasColumnName("variance_direction")
                .HasMaxLength(20);

            // Thresholds
            builder.Property(v => v.ThresholdAbsolute)
                .HasColumnName("threshold_absolute")
                .HasColumnType("decimal(10,2)");

            builder.Property(v => v.ThresholdPercent)
                .HasColumnName("threshold_percent")
                .HasColumnType("decimal(5,2)");

            builder.Property(v => v.ExceedsThreshold)
                .HasColumnName("exceeds_threshold")
                .HasColumnType("bit(1)")
                .HasDefaultValue(false);

            // Classification
            builder.Property(v => v.Severity)
                .HasColumnName("severity")
                .HasMaxLength(20);

            builder.Property(v => v.PossibleCause)
                .HasColumnName("possible_cause")
                .HasMaxLength(50);

            builder.Property(v => v.Notes)
                .HasColumnName("notes")
                .HasColumnType("text");

            // Data Quality
            builder.Property(v => v.DataConfidence)
                .HasColumnName("data_confidence")
                .HasMaxLength(20);

            builder.Property(v => v.ConfidenceFactors)
                .HasColumnName("confidence_factors")
                .HasColumnType("text");

            // Audit Trail
            builder.Property(v => v.CreatedAt)
                .HasColumnName("created_at")
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(v => v.UpdatedAt)
                .HasColumnName("updated_at")
                .HasColumnType("datetime");

            // Indexes
            builder.HasIndex(v => v.AuditId);
            builder.HasIndex(v => v.Category);
            builder.HasIndex(v => v.ExceedsThreshold);
        }
    }
}
