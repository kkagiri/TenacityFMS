using FMS.Domain.Entities.Devices;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations.Devices
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
                .IsRequired();

            builder.Property(e => e.Latitude)
                .HasPrecision(10, 7)
                .IsRequired();

            builder.Property(e => e.Longitude)
                .HasPrecision(10, 7)
                .IsRequired();

            builder.Property(e => e.Altitude)
                .HasPrecision(10, 2);

            builder.Property(e => e.Speed)
                .HasPrecision(10, 2);

            builder.Property(e => e.Heading)
                .HasPrecision(5, 2);

            builder.Property(e => e.IsGpsValid)
                .HasDefaultValue(true);

            builder.Property(e => e.DeviceActivityTime);

            builder.Property(e => e.ExternalDeviceId)
                .HasMaxLength(50);

            builder.Property(e => e.CachedAt)
                .IsRequired();

            builder.Property(e => e.Source)
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
