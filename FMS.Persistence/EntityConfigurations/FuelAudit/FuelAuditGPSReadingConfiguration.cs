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
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            // Relationships
            builder.Property(r => r.AuditId)
                .HasColumnName("audit_id");

            builder.Property(r => r.VehicleId)
                .HasColumnName("vehicle_id")
                .IsRequired();

            // Request Context
            builder.Property(r => r.ReadingDate)
                .HasColumnName("reading_date")
                .HasColumnType("date")
                .IsRequired();

            builder.Property(r => r.ReadingType)
                .HasColumnName("reading_type")
                .HasMaxLength(20)
                .IsRequired();

            // Fuel Data
            builder.Property(r => r.FuelLevel)
                .HasColumnName("fuel_level")
                .HasColumnType("decimal(10,2)");

            builder.Property(r => r.FuelLevelUnit)
                .HasColumnName("fuel_level_unit")
                .HasMaxLength(20)
                .HasDefaultValue("Liters");

            // Timestamp
            builder.Property(r => r.ReadingTimestamp)
                .HasColumnName("reading_timestamp")
                .HasColumnType("datetime");

            builder.Property(r => r.ActualDataDate)
                .HasColumnName("actual_data_date")
                .HasColumnType("date");

            // Data Quality
            builder.Property(r => r.DataQuality)
                .HasColumnName("data_quality")
                .HasMaxLength(30)
                .IsRequired()
                .HasDefaultValue("Exact");

            builder.Property(r => r.DataQualityReason)
                .HasColumnName("data_quality_reason")
                .HasMaxLength(255);

            builder.Property(r => r.DaysFromRequestedDate)
                .HasColumnName("days_from_requested_date");

            // Vehicle Status at Reading
            builder.Property(r => r.WasOnline)
                .HasColumnName("was_online")
                .HasDefaultValue(false);

            builder.Property(r => r.Latitude)
                .HasColumnName("latitude")
                .HasColumnType("decimal(10,7)");

            builder.Property(r => r.Longitude)
                .HasColumnName("longitude")
                .HasColumnType("decimal(10,7)");

            builder.Property(r => r.IgnitionStatus)
                .HasColumnName("ignition_status");

            // Source Tracking
            builder.Property(r => r.GPSDeviceId)
                .HasColumnName("gps_device_id")
                .HasMaxLength(50);

            builder.Property(r => r.TrackInfoId)
                .HasColumnName("track_info_id");

            builder.Property(r => r.RawData)
                .HasColumnName("raw_data")
                .HasColumnType("longtext");

            // Audit Trail
            builder.Property(r => r.CreatedAt)
                .HasColumnName("created_at")
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(r => r.UpdatedAt)
                .HasColumnName("updated_at")
                .HasColumnType("datetime");

            builder.Property(r => r.CreatedBy)
                .HasColumnName("created_by");

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
