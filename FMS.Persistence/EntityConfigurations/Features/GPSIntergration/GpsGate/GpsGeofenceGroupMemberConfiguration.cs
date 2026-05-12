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
                .ValueGeneratedOnAdd();

            builder.Property(e => e.GroupId)
                .IsRequired();

            builder.Property(e => e.GeofenceId)
                .IsRequired();

            builder.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Composite unique index to prevent duplicate memberships
            builder.HasIndex(e => new { e.GroupId, e.GeofenceId })
                .HasDatabaseName("IX_gps_geofence_group_member_unique")
                .IsUnique();

            // Foreign keys are configured in parent entity configurations
        }
    }
}

