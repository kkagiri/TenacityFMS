using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities.Features.GPSIntergration.GpsGate;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// EF Core configuration for GpsGeofenceGroup entity - cached geofence group data from GPSGate.
    /// Groups marked with IsAllowedForFueling are used for global geofence validation.
    /// </summary>
    public class GpsGeofenceGroupConfiguration : EntityTypeConfiguration<GpsGeofenceGroup>
    {
        public override void Configure(EntityTypeBuilder<GpsGeofenceGroup> builder)
        {
            builder.ToTable("gps_geofence_group");

            builder.HasKey(e => e.Id);

            builder.Property(e => e.Id)
                .ValueGeneratedOnAdd();

            builder.Property(e => e.ExternalGroupId)
                .IsRequired();

            builder.HasIndex(e => e.ExternalGroupId)
                .HasDatabaseName("IX_gps_geofence_group_external_id")
                .IsUnique();

            builder.Property(e => e.Name)
                .HasMaxLength(200)
                .IsRequired();

            builder.Property(e => e.Description)
                .HasMaxLength(500);

            builder.Property(e => e.Colour)
                .HasMaxLength(20);

            builder.Property(e => e.IsPinned)
                .HasDefaultValue(false);

            builder.Property(e => e.IsActive)
                .HasDefaultValue(true);

            builder.Property(e => e.IsAllowedForFueling)
                .HasDefaultValue(false)
                .HasComment("When true, fueling is permitted within geofences of this group (global policy)");

            builder.Property(e => e.LastSyncedAt);

            builder.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(e => e.UpdatedAt);

            // Navigation property for group members
            builder.HasMany(e => e.Members)
                .WithOne(m => m.Group)
                .HasForeignKey(m => m.GroupId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}

