using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities.Features.GPSIntergration.GpsGate;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// EF Core configuration for GpsGeofenceGroupMember entity - many-to-many join table
    /// </summary>
    public class GpsGeofenceGroupMemberConfiguration : EntityTypeConfiguration<GpsGeofenceGroupMember>
    {
        public override void Configure(EntityTypeBuilder<GpsGeofenceGroupMember> builder)
        {
            builder.ToTable("gps_geofence_group_member");

            builder.HasKey(e => e.Id);

            builder.Property(e => e.Id)
                .HasColumnType("int(11)")
                .ValueGeneratedOnAdd();

            builder.Property(e => e.GroupId)
                .HasColumnName("group_id")
                .HasColumnType("int(11)")
                .IsRequired();

            builder.Property(e => e.GeofenceId)
                .HasColumnName("geofence_id")
                .HasColumnType("int(11)")
                .IsRequired();

            builder.Property(e => e.CreatedAt)
                .HasColumnName("created_at")
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Composite unique index to prevent duplicate memberships
            builder.HasIndex(e => new { e.GroupId, e.GeofenceId })
                .HasDatabaseName("IX_gps_geofence_group_member_unique")
                .IsUnique();

            // Foreign keys are configured in parent entity configurations
        }
    }
}
