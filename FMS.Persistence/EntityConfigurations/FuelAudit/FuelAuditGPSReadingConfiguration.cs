using FMS.Domain.Entities.FuelAudit;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations.FuelAudit
{
    /// <summary>
    /// Entity configuration for FuelAuditGPSReading
    /// Maps to fuel_audit_gps_readings table
    /// </summary>
    public class FuelAuditGPSReadingConfiguration : IEntityTypeConfiguration<FuelAuditGPSReading>
    {
        public void Configure(EntityTypeBuilder<FuelAuditGPSReading> builder)
        {
            builder.ToTable("fuel_audit_gps_readings");

            builder.HasKey(r => r.Id);

            builder.Property(r => r.Id)
                .ValueGeneratedOnAdd();

            // Relationships
            builder.Property(r => r.AuditId);

            builder.Property(r => r.VehicleId)
                .IsRequired();

            // Request Context
            builder.Property(r => r.ReadingDate)
                .IsRequired();

            builder.Property(r => r.ReadingType)
                .HasMaxLength(20)
                .IsRequired();

            // Fuel Data
            builder.Property(r => r.FuelLevel)
                .HasColumnType("decimal(10,2)");

            builder.Property(r => r.FuelLevelUnit)
                .HasMaxLength(20)
                .HasDefaultValue("Liters");

            // Timestamp
            builder.Property(r => r.ReadingTimestamp);

            builder.Property(r => r.ActualDataDate);

            // Data Quality
            builder.Property(r => r.DataQuality)
                .HasMaxLength(30)
                .IsRequired()
                .HasDefaultValue("Exact");

            builder.Property(r => r.DataQualityReason)
                .HasMaxLength(255);

            builder.Property(r => r.DaysFromRequestedDate);

            // Vehicle Status at Reading
            builder.Property(r => r.WasOnline)
                .HasDefaultValue(false);

            builder.Property(r => r.Latitude)
                .HasColumnType("decimal(10,7)");

            builder.Property(r => r.Longitude)
                .HasColumnType("decimal(10,7)");

            builder.Property(r => r.IgnitionStatus);

            // Source Tracking
            builder.Property(r => r.GPSDeviceId)
                .HasMaxLength(50);

            builder.Property(r => r.TrackInfoId);

            builder.Property(r => r.RawData);

            // Audit Trail
            builder.Property(r => r.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(r => r.UpdatedAt);

            builder.Property(r => r.CreatedBy);

            // Indexes
            builder.HasIndex(r => r.AuditId)
                .HasDatabaseName("idx_audit_id");

            builder.HasIndex(r => r.VehicleId)
                .HasDatabaseName("idx_vehicle_id");

            builder.HasIndex(r => new { r.VehicleId, r.ReadingDate, r.ReadingType })
                .IsUnique()
                .HasDatabaseName("uq_vehicle_date_type");

            builder.HasIndex(r => new { r.ReadingDate, r.ReadingType })
                .HasDatabaseName("idx_reading_date_type");

            builder.HasIndex(r => r.DataQuality)
                .HasDatabaseName("idx_data_quality");

            // Foreign Key - Vehicle
            builder.HasOne(r => r.Vehicle)
                .WithMany()
                .HasForeignKey(r => r.VehicleId)
                .HasConstraintName("fk_gps_reading_vehicle")
                .OnDelete(DeleteBehavior.Cascade);

            // Foreign Key - FuelAudit (use AuditId, not inferred FuelAuditId)
            // Use fully qualified name to avoid conflict with namespace
            builder.HasOne<FMS.Domain.Entities.FuelAudit.FuelAudit>()
                .WithMany(a => a.GPSReadings)
                .HasForeignKey(r => r.AuditId)
                .HasConstraintName("fk_gps_reading_audit")
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}

