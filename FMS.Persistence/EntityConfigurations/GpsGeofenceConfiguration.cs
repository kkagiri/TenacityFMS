using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
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
                .HasColumnType("int(11)")
                .ValueGeneratedOnAdd();

            builder.Property(e => e.ExternalGeofenceId)
                .HasColumnName("external_geofence_id")
                .HasColumnType("int(11)")
                .IsRequired();

            builder.HasIndex(e => e.ExternalGeofenceId)
                .HasDatabaseName("IX_gps_geofence_external_id")
                .IsUnique();

            builder.Property(e => e.Name)
                .HasColumnName("name")
                .HasMaxLength(200)
                .IsRequired();

            builder.Property(e => e.Description)
                .HasColumnName("description")
                .HasMaxLength(500);

            builder.Property(e => e.GeofenceType)
                .HasColumnName("geofence_type")
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            builder.Property(e => e.GeometryJson)
                .HasColumnName("geometry_json")
                .HasColumnType("longtext");

            builder.Property(e => e.CenterLatitude)
                .HasColumnName("center_latitude")
                .HasColumnType("decimal(10, 8)");

            builder.Property(e => e.CenterLongitude)
                .HasColumnName("center_longitude")
                .HasColumnType("decimal(11, 8)");

            builder.Property(e => e.RadiusMeters)
                .HasColumnName("radius_meters")
                .HasColumnType("decimal(10, 2)");

            builder.Property(e => e.IsActive)
                .HasColumnName("is_active")
                .HasColumnType("tinyint(1)")
                .HasDefaultValue(true);

            builder.Property(e => e.LastSyncedAt)
                .HasColumnName("last_synced_at")
                .HasColumnType("datetime");

            builder.Property(e => e.CreatedAt)
                .HasColumnName("created_at")
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at")
                .HasColumnType("datetime");

            // Navigation property for group memberships
            builder.HasMany(e => e.GroupMemberships)
                .WithOne(m => m.Geofence)
                .HasForeignKey(m => m.GeofenceId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
