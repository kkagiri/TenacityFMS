using FMS.Domain.Entities.FuelAudit;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations.FuelAudit
{
    /// <summary>
    /// Entity configuration for FuelAuditVehiclePosition
    /// </summary>
    public class FuelAuditVehiclePositionConfiguration : IEntityTypeConfiguration<FuelAuditVehiclePosition>
    {
        public void Configure(EntityTypeBuilder<FuelAuditVehiclePosition> builder)
        {
            builder.ToTable("fuel_audit_vehicle_positions");

            builder.HasKey(v => v.Id);

            builder.Property(v => v.Id)
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            builder.Property(v => v.AuditId)
                .HasColumnName("audit_id")
                .IsRequired();

            builder.Property(v => v.VehicleId)
                .HasColumnName("vehicle_id")
                .IsRequired();

            builder.Property(v => v.VehicleName)
                .HasColumnName("vehicle_name")
                .HasMaxLength(100);

            builder.Property(v => v.NumberPlate)
                .HasColumnName("number_plate")
                .HasMaxLength(50);

            builder.Property(v => v.VehicleType)
                .HasColumnName("vehicle_type")
                .HasMaxLength(20)
                .IsRequired()
                .HasDefaultValue("GPS");

            builder.Property(v => v.TankCapacity)
                .HasColumnName("tank_capacity")
                .HasColumnType("decimal(10,2)");

            // Opening Position
            builder.Property(v => v.OpeningStock)
                .HasColumnName("opening_stock")
                .HasColumnType("decimal(10,2)");

            builder.Property(v => v.OpeningReadingTime)
                .HasColumnName("opening_reading_time")
                .HasColumnType("datetime");

            builder.Property(v => v.OpeningDataQuality)
                .HasColumnName("opening_data_quality")
                .HasMaxLength(30);

            builder.Property(v => v.OpeningDataSource)
                .HasColumnName("opening_data_source")
                .HasMaxLength(30);

            builder.Property(v => v.OpeningGPSReadingId)
                .HasColumnName("opening_gps_reading_id");

            // Closing Position
            builder.Property(v => v.ClosingStock)
                .HasColumnName("closing_stock")
                .HasColumnType("decimal(10,2)");

            builder.Property(v => v.ClosingReadingTime)
                .HasColumnName("closing_reading_time")
                .HasColumnType("datetime");

            builder.Property(v => v.ClosingDataQuality)
                .HasColumnName("closing_data_quality")
                .HasMaxLength(30);

            builder.Property(v => v.ClosingDataSource)
                .HasColumnName("closing_data_source")
                .HasMaxLength(30);

            builder.Property(v => v.ClosingGPSReadingId)
                .HasColumnName("closing_gps_reading_id");

            // Movements
            builder.Property(v => v.FuelRefueled)
                .HasColumnName("fuel_refueled")
                .HasColumnType("decimal(10,2)");

            builder.Property(v => v.RefuelCount)
                .HasColumnName("refuel_count");

            builder.Property(v => v.FuelConsumed)
                .HasColumnName("fuel_consumed")
                .HasColumnType("decimal(10,2)");

            builder.Property(v => v.DistanceTraveled)
                .HasColumnName("distance_traveled")
                .HasColumnType("decimal(10,2)");

            builder.Property(v => v.FuelEfficiency)
                .HasColumnName("fuel_efficiency")
                .HasColumnType("decimal(5,2)");

            // Calculated
            builder.Property(v => v.ExpectedClosing)
                .HasColumnName("expected_closing")
                .HasColumnType("decimal(10,2)");

            builder.Property(v => v.Variance)
                .HasColumnName("variance")
                .HasColumnType("decimal(10,2)");

            builder.Property(v => v.VariancePercent)
                .HasColumnName("variance_percent")
                .HasColumnType("decimal(5,2)");

            builder.Property(v => v.HasVarianceFlag)
                .HasColumnName("has_variance_flag")
                .HasColumnType("bit(1)")
                .HasDefaultValue(false);

            // Pickup Fleet Specific
            builder.Property(v => v.DaysSinceLastRefuelStart)
                .HasColumnName("days_since_last_refuel_start");

            builder.Property(v => v.DaysSinceLastRefuelEnd)
                .HasColumnName("days_since_last_refuel_end");

            builder.Property(v => v.EstimationConfidence)
                .HasColumnName("estimation_confidence")
                .HasMaxLength(20);

            builder.Property(v => v.EstimationNotes)
                .HasColumnName("estimation_notes")
                .HasColumnType("text");

            // Cross-Verification
            builder.Property(v => v.DispensingRecordFuel)
                .HasColumnName("dispensing_record_fuel")
                .HasColumnType("decimal(10,2)");

            builder.Property(v => v.GPSRefuelDetected)
                .HasColumnName("gps_refuel_detected")
                .HasColumnType("decimal(10,2)");

            builder.Property(v => v.RefuelMismatch)
                .HasColumnName("refuel_mismatch")
                .HasColumnType("decimal(10,2)");

            builder.Property(v => v.HasRefuelMismatchFlag)
                .HasColumnName("has_refuel_mismatch_flag")
                .HasColumnType("bit(1)")
                .HasDefaultValue(false);

            // Audit Trail
            builder.Property(v => v.CreatedAt)
                .HasColumnName("created_at")
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(v => v.CreatedBy)
                .HasColumnName("created_by");

            builder.Property(v => v.UpdatedAt)
                .HasColumnName("updated_at")
                .HasColumnType("datetime");

            builder.Property(v => v.UpdatedBy)
                .HasColumnName("updated_by");

            // Indexes
            builder.HasIndex(v => v.AuditId);
            builder.HasIndex(v => v.VehicleId);
            builder.HasIndex(v => v.VehicleType);

            // Relationships
            builder.HasOne(v => v.Vehicle)
                .WithMany()
                .HasForeignKey(v => v.VehicleId)
                .OnDelete(DeleteBehavior.Restrict);

            // OpeningGPSReadingId and ClosingGPSReadingId are FK columns only,
            // navigation properties not implemented to avoid coupling with GPSGate module
        }
    }
}
