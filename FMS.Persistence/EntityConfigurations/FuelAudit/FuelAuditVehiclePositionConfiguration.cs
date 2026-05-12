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
                .ValueGeneratedOnAdd();

            builder.Property(v => v.AuditId)
                .IsRequired();

            builder.Property(v => v.VehicleId)
                .IsRequired();

            builder.Property(v => v.VehicleName)
                .HasMaxLength(100);

            builder.Property(v => v.NumberPlate)
                .HasMaxLength(50);

            builder.Property(v => v.VehicleType)
                .HasMaxLength(20)
                .IsRequired()
                .HasDefaultValue("GPS");

            builder.Property(v => v.TankCapacity)
                .HasColumnType("decimal(10,2)");

            // Opening Position
            builder.Property(v => v.OpeningStock)
                .HasColumnType("decimal(10,2)");

            builder.Property(v => v.OpeningReadingTime);

            builder.Property(v => v.OpeningDataQuality)
                .HasMaxLength(30);

            builder.Property(v => v.OpeningDataSource)
                .HasMaxLength(30);

            builder.Property(v => v.OpeningGPSReadingId);

            // Closing Position
            builder.Property(v => v.ClosingStock)
                .HasColumnType("decimal(10,2)");

            builder.Property(v => v.ClosingReadingTime);

            builder.Property(v => v.ClosingDataQuality)
                .HasMaxLength(30);

            builder.Property(v => v.ClosingDataSource)
                .HasMaxLength(30);

            builder.Property(v => v.ClosingGPSReadingId);

            // Movements
            builder.Property(v => v.FuelRefueled)
                .HasColumnType("decimal(10,2)");

            builder.Property(v => v.RefuelCount);

            builder.Property(v => v.FuelConsumed)
                .HasColumnType("decimal(10,2)");

            builder.Property(v => v.GpsMeasuredConsumption)
                .HasColumnType("decimal(10,2)");

            builder.Property(v => v.DistanceTraveled)
                .HasColumnType("decimal(10,2)");

            builder.Property(v => v.FuelEfficiency)
                .HasColumnType("decimal(5,2)");

            // Calculated
            builder.Property(v => v.ExpectedClosing)
                .HasColumnType("decimal(10,2)");

            builder.Property(v => v.Variance)
                .HasColumnType("decimal(10,2)");

            builder.Property(v => v.VariancePercent)
                .HasColumnType("decimal(5,2)");

            builder.Property(v => v.HasVarianceFlag)
                .HasDefaultValue(false);

            builder.Property(v => v.VarianceFlagMessage)
                .HasMaxLength(500);

            builder.Property(v => v.IsManuallyEdited)
                .HasDefaultValue(false);

            // Pickup Fleet Specific
            builder.Property(v => v.DaysSinceLastRefuelStart);

            builder.Property(v => v.DaysSinceLastRefuelEnd);

            builder.Property(v => v.EstimationConfidence)
                .HasMaxLength(20);

            builder.Property(v => v.EstimationNotes);

            // Cross-Verification
            builder.Property(v => v.DispensingRecordFuel)
                .HasColumnType("decimal(10,2)");

            builder.Property(v => v.GPSRefuelDetected)
                .HasColumnType("decimal(10,2)");

            builder.Property(v => v.RefuelMismatch)
                .HasColumnType("decimal(10,2)");

            builder.Property(v => v.HasRefuelMismatchFlag)
                .HasDefaultValue(false);

            // GPS Refill Events (stored as JSON string for MySQL 5.5.x compatibility)
            builder.Property(v => v.GpsRefillEventsJson);

            // Audit Trail
            builder.Property(v => v.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(v => v.CreatedBy);

            builder.Property(v => v.UpdatedAt);

            builder.Property(v => v.UpdatedBy);

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

