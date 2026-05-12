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
                .ValueGeneratedOnAdd();

            builder.Property(t => t.Category)
                .HasMaxLength(30)
                .IsRequired();

            builder.Property(t => t.ThresholdType)
                .HasMaxLength(30)
                .IsRequired();

            builder.Property(t => t.Name)
                .HasMaxLength(100)
                .IsRequired();

            builder.Property(t => t.Description);

            builder.Property(t => t.ThresholdValue)
                .HasColumnType("decimal(10,2)")
                .IsRequired();

            builder.Property(t => t.Unit)
                .HasMaxLength(20)
                .IsRequired();

            builder.Property(t => t.Severity)
                .HasMaxLength(20)
                .IsRequired()
                .HasDefaultValue("Medium");

            builder.Property(t => t.IsActive)
                .HasDefaultValue(true);

            builder.Property(t => t.AutoApply)
                .HasDefaultValue(true);

            builder.Property(t => t.VehicleTypeFilter)
                .HasMaxLength(20);

            // Audit Trail
            builder.Property(t => t.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(t => t.CreatedBy);

            builder.Property(t => t.UpdatedAt);

            builder.Property(t => t.UpdatedBy);

            // Indexes
            builder.HasIndex(t => t.Category);
            builder.HasIndex(t => t.IsActive);
        }
    }
}

