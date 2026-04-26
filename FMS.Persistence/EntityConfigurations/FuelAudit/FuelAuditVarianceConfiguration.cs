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
                .ValueGeneratedOnAdd();

            builder.Property(v => v.AuditId)
                .IsRequired();

            builder.Property(v => v.Category)
                .HasMaxLength(30)
                .IsRequired();

            builder.Property(v => v.ReferenceId);

            builder.Property(v => v.ReferenceName)
                .HasMaxLength(100);

            // Variance Values
            builder.Property(v => v.ExpectedValue)
                .HasColumnType("decimal(15,2)");

            builder.Property(v => v.ActualValue)
                .HasColumnType("decimal(15,2)");

            builder.Property(v => v.VarianceAmount)
                .HasColumnType("decimal(15,2)");

            builder.Property(v => v.VariancePercent)
                .HasColumnType("decimal(5,2)");

            builder.Property(v => v.VarianceDirection)
                .HasMaxLength(20);

            // Thresholds
            builder.Property(v => v.ThresholdAbsolute)
                .HasColumnType("decimal(10,2)");

            builder.Property(v => v.ThresholdPercent)
                .HasColumnType("decimal(5,2)");

            builder.Property(v => v.ExceedsThreshold)
                .HasDefaultValue(false);

            // Classification
            builder.Property(v => v.Severity)
                .HasMaxLength(20);

            builder.Property(v => v.PossibleCause)
                .HasMaxLength(50);

            builder.Property(v => v.Notes);

            // Data Quality
            builder.Property(v => v.DataConfidence)
                .HasMaxLength(20);

            builder.Property(v => v.ConfidenceFactors);

            // Audit Trail
            builder.Property(v => v.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(v => v.UpdatedAt);

            // Indexes
            builder.HasIndex(v => v.AuditId);
            builder.HasIndex(v => v.Category);
            builder.HasIndex(v => v.ExceedsThreshold);
        }
    }
}

