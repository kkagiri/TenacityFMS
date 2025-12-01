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
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            builder.Property(r => r.AuditId)
                .HasColumnName("audit_id")
                .IsRequired();

            builder.Property(r => r.TankId)
                .HasColumnName("tank_id")
                .IsRequired();

            builder.Property(r => r.TankName)
                .HasColumnName("tank_name")
                .HasMaxLength(100);

            builder.Property(r => r.TankCapacity)
                .HasColumnName("tank_capacity")
                .HasColumnType("decimal(15,2)");

            // Opening Reading
            builder.Property(r => r.OpeningStock)
                .HasColumnName("opening_stock")
                .HasColumnType("decimal(15,2)");

            builder.Property(r => r.OpeningReadingTime)
                .HasColumnName("opening_reading_time")
                .HasColumnType("datetime");

            builder.Property(r => r.OpeningMethod)
                .HasColumnName("opening_method")
                .HasMaxLength(20);

            builder.Property(r => r.OpeningNotes)
                .HasColumnName("opening_notes")
                .HasColumnType("text");

            // Closing Reading
            builder.Property(r => r.ClosingStock)
                .HasColumnName("closing_stock")
                .HasColumnType("decimal(15,2)");

            builder.Property(r => r.ClosingReadingTime)
                .HasColumnName("closing_reading_time")
                .HasColumnType("datetime");

            builder.Property(r => r.ClosingMethod)
                .HasColumnName("closing_method")
                .HasMaxLength(20);

            builder.Property(r => r.ClosingNotes)
                .HasColumnName("closing_notes")
                .HasColumnType("text");

            // Movements
            builder.Property(r => r.FuelReceived)
                .HasColumnName("fuel_received")
                .HasColumnType("decimal(15,2)");

            builder.Property(r => r.FuelDispensed)
                .HasColumnName("fuel_dispensed")
                .HasColumnType("decimal(15,2)");

            builder.Property(r => r.FuelTransferredOut)
                .HasColumnName("fuel_transferred_out")
                .HasColumnType("decimal(15,2)");

            builder.Property(r => r.FuelTransferredIn)
                .HasColumnName("fuel_transferred_in")
                .HasColumnType("decimal(15,2)");

            // Calculated
            builder.Property(r => r.ExpectedClosing)
                .HasColumnName("expected_closing")
                .HasColumnType("decimal(15,2)");

            builder.Property(r => r.Variance)
                .HasColumnName("variance")
                .HasColumnType("decimal(15,2)");

            builder.Property(r => r.VariancePercent)
                .HasColumnName("variance_percent")
                .HasColumnType("decimal(5,2)");

            builder.Property(r => r.HasVarianceFlag)
                .HasColumnName("has_variance_flag")
                .HasColumnType("bit(1)")
                .HasDefaultValue(false);

            // Data Source
            builder.Property(r => r.DataSource)
                .HasColumnName("data_source")
                .HasMaxLength(50);

            builder.Property(r => r.IsAutoPopulated)
                .HasColumnName("is_auto_populated")
                .HasColumnType("bit(1)")
                .HasDefaultValue(false);

            builder.Property(r => r.HasDataQualityIssue)
                .HasColumnName("has_data_quality_issue")
                .HasColumnType("bit(1)")
                .HasDefaultValue(false);

            builder.Property(r => r.DataQualityNotes)
                .HasColumnName("data_quality_notes")
                .HasColumnType("text");

            // Audit Trail
            builder.Property(r => r.CreatedAt)
                .HasColumnName("created_at")
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(r => r.CreatedBy)
                .HasColumnName("created_by");

            builder.Property(r => r.UpdatedAt)
                .HasColumnName("updated_at")
                .HasColumnType("datetime");

            builder.Property(r => r.UpdatedBy)
                .HasColumnName("updated_by");

            // Indexes
            builder.HasIndex(r => r.AuditId);
            builder.HasIndex(r => r.TankId);

            // Relationships
            builder.HasOne(r => r.Tank)
                .WithMany()
                .HasForeignKey(r => r.TankId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
