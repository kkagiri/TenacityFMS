using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.GPSIntergration.GpsGate;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// EF Core configuration for GpsGeofence entity - cached geofence data from GPSGate
    /// </summary>
    public class GpsGeofenceConfiguration : EntityTypeConfiguration<GpsGeofence>
    {
        public override void Configure(EntityTypeBuilder<GpsGeofence> builder)
        {
            builder.ToTable("gps_geofence");

            builder.HasKey(e => e.Id);

            builder.Property(e => e.Id)
                .ValueGeneratedOnAdd();

            builder.Property(e => e.ExternalGeofenceId)
                .IsRequired();

            builder.HasIndex(e => e.ExternalGeofenceId)
                .HasDatabaseName("IX_gps_geofence_external_id")
                .IsUnique();

            builder.Property(e => e.Name)
                .HasMaxLength(200)
                .IsRequired();

            builder.Property(e => e.Description)
                .HasMaxLength(500);

            builder.Property(e => e.GeofenceType)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            builder.Property(e => e.GeometryJson);

            builder.Property(e => e.CenterLatitude)
                .HasColumnType("decimal(10, 8)");

            builder.Property(e => e.CenterLongitude)
                .HasColumnType("decimal(11, 8)");

            builder.Property(e => e.RadiusMeters)
                .HasColumnType("decimal(10, 2)");

            builder.Property(e => e.Classification)
                .HasDefaultValue(SiteClassification.Unknown)
                .HasComment("Operational classification: 0=Unknown, 1=Parking, 2=Load, 3=Dump, 4=Fuel, 5=Workshop");

            builder.Property(e => e.IsActive)
                .HasDefaultValue(true);

            builder.Property(e => e.LastSyncedAt);

            builder.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(e => e.UpdatedAt);

            // Navigation property for group memberships
            builder.HasMany(e => e.GroupMemberships)
                .WithOne(m => m.Geofence)
                .HasForeignKey(m => m.GeofenceId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}

