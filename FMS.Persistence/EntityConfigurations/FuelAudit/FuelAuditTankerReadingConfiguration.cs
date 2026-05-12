using FMS.Domain.Entities.FuelAudit;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations.FuelAudit
{
    /// <summary>
    /// Entity configuration for FuelAuditTankerReading
    /// </summary>
    public class FuelAuditTankerReadingConfiguration : IEntityTypeConfiguration<FuelAuditTankerReading>
    {
        public void Configure(EntityTypeBuilder<FuelAuditTankerReading> builder)
        {
            builder.ToTable("fuel_audit_tanker_readings");

            builder.HasKey(r => r.Id);

            builder.Property(r => r.Id)
                .ValueGeneratedOnAdd();

            builder.Property(r => r.AuditId)
                .IsRequired();

            builder.Property(r => r.TankId)
                .IsRequired();

            builder.Property(r => r.TankName)
                .HasMaxLength(100);

            builder.Property(r => r.TankCapacity)
                .HasColumnType("decimal(15,2)");

            // Opening Reading
            builder.Property(r => r.OpeningStock)
                .HasColumnType("decimal(15,2)");

            builder.Property(r => r.OpeningReadingTime);

            builder.Property(r => r.OpeningMethod)
                .HasMaxLength(20);

            builder.Property(r => r.OpeningNotes);

            // Closing Reading
            builder.Property(r => r.ClosingStock)
                .HasColumnType("decimal(15,2)");

            builder.Property(r => r.ClosingReadingTime);

            builder.Property(r => r.ClosingMethod)
                .HasMaxLength(20);

            builder.Property(r => r.ClosingNotes);

            // Movements
            builder.Property(r => r.FuelReceived)
                .HasColumnType("decimal(15,2)");

            builder.Property(r => r.FuelDispensed)
                .HasColumnType("decimal(15,2)");

            builder.Property(r => r.FuelTransferredOut)
                .HasColumnType("decimal(15,2)");

            builder.Property(r => r.FuelTransferredIn)
                .HasColumnType("decimal(15,2)");

            // Calculated
            builder.Property(r => r.ExpectedClosing)
                .HasColumnType("decimal(15,2)");

            builder.Property(r => r.Variance)
                .HasColumnType("decimal(15,2)");

            builder.Property(r => r.VariancePercent)
                .HasColumnType("decimal(5,2)");

            builder.Property(r => r.HasVarianceFlag)
                .HasDefaultValue(false);

            // Data Source
            builder.Property(r => r.DataSource)
                .HasMaxLength(50);

            builder.Property(r => r.IsAutoPopulated)
                .HasDefaultValue(false);

            builder.Property(r => r.HasDataQualityIssue)
                .HasDefaultValue(false);

            builder.Property(r => r.DataQualityNotes);

            // Audit Trail
            builder.Property(r => r.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(r => r.CreatedBy);

            builder.Property(r => r.UpdatedAt);

            builder.Property(r => r.UpdatedBy);

            // Indexes
            builder.HasIndex(r => r.AuditId);
            builder.HasIndex(r => r.TankId);

            // Note: Tank relationship is intentionally NOT configured because:
            // - FuelAuditTankerReading.TankId is long
            // - Tank.Id is int
            // This is a loose reference - use TankId to query tanks manually
            builder.Ignore(r => r.Tank);
        }
    }
}

