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
                .HasColumnType("int(11)")
                .ValueGeneratedOnAdd();

            builder.Property(e => e.ExternalGroupId)
                .HasColumnName("external_group_id")
                .HasColumnType("int(11)")
                .IsRequired();

            builder.HasIndex(e => e.ExternalGroupId)
                .HasDatabaseName("IX_gps_geofence_group_external_id")
                .IsUnique();

            builder.Property(e => e.Name)
                .HasColumnName("name")
                .HasMaxLength(200)
                .IsRequired();

            builder.Property(e => e.Description)
                .HasColumnName("description")
                .HasMaxLength(500);

            builder.Property(e => e.Colour)
                .HasColumnName("colour")
                .HasMaxLength(20);

            builder.Property(e => e.IsPinned)
                .HasColumnName("is_pinned")
                .HasColumnType("tinyint(1)")
                .HasDefaultValue(false);

            builder.Property(e => e.IsActive)
                .HasColumnName("is_active")
                .HasColumnType("tinyint(1)")
                .HasDefaultValue(true);

            builder.Property(e => e.IsAllowedForFueling)
                .HasColumnName("is_allowed_for_fueling")
                .HasColumnType("tinyint(1)")
                .HasDefaultValue(false)
                .HasComment("When true, fueling is permitted within geofences of this group (global policy)");

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

            // Navigation property for group members
            builder.HasMany(e => e.Members)
                .WithOne(m => m.Group)
                .HasForeignKey(m => m.GroupId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
