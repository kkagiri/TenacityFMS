using FMS.Domain.Entities.VehicleTracking;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations.VehicleTracking
{
    /// <summary>
    /// Entity configuration for VehicleLastKnownLocationEntity
    /// </summary>
    public class VehicleLastKnownLocationConfiguration : IEntityTypeConfiguration<VehicleLastKnownLocationEntity>
    {
        public void Configure(EntityTypeBuilder<VehicleLastKnownLocationEntity> builder)
        {
            builder.ToTable("vehicle_last_known_location");

            builder.HasKey(e => e.VehicleId);

            builder.Property(e => e.VehicleId)
                .HasColumnName("vehicle_id")
                .IsRequired();

            builder.Property(e => e.Latitude)
                .HasColumnName("latitude")
                .HasPrecision(10, 7)
                .IsRequired();

            builder.Property(e => e.Longitude)
                .HasColumnName("longitude")
                .HasPrecision(10, 7)
                .IsRequired();

            builder.Property(e => e.Altitude)
                .HasColumnName("altitude")
                .HasPrecision(10, 2);

            builder.Property(e => e.Speed)
                .HasColumnName("speed")
                .HasPrecision(10, 2);

            builder.Property(e => e.Heading)
                .HasColumnName("heading")
                .HasPrecision(5, 2);

            builder.Property(e => e.IsGpsValid)
                .HasColumnName("is_gps_valid")
                .HasDefaultValue(true);

            builder.Property(e => e.DeviceActivityTime)
                .HasColumnName("device_activity_time");

            builder.Property(e => e.ExternalDeviceId)
                .HasColumnName("external_device_id")
                .HasMaxLength(50);

            builder.Property(e => e.CachedAt)
                .HasColumnName("cached_at")
                .IsRequired();

            builder.Property(e => e.Source)
                .HasColumnName("source")
                .HasMaxLength(50)
                .HasDefaultValue("GPSGate");

            builder.HasIndex(e => e.CachedAt)
                .HasDatabaseName("IX_vehicle_last_known_location_cached_at");

            // Relationship to Vehicle
            builder.HasOne(e => e.Vehicle)
                .WithOne()
                .HasForeignKey<VehicleLastKnownLocationEntity>(e => e.VehicleId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
