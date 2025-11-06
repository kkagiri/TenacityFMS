using FMS.Domain.Entities.VehicleTracking;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations.VehicleTracking
{
    public class VehicleHealthMonitorEntityConfiguration : IEntityTypeConfiguration<VehicleHealthMonitorEntity>
    {
        public void Configure(EntityTypeBuilder<VehicleHealthMonitorEntity> builder)
        {
            builder.ToTable("vehicle_health_monitor");

            builder.HasKey(e => e.Id);

            builder.Property(e => e.Id)
                .HasColumnName("id");

            builder.Property(e => e.VehicleId)
                .HasColumnName("vehicle_id")
                .IsRequired();

            builder.Property(e => e.CheckedAt)
                .HasColumnName("checked_at")
                .IsRequired();

            builder.Property(e => e.IsOnline)
                .HasColumnName("is_online")
                .IsRequired();

            builder.Property(e => e.LastOnlineAt)
                .HasColumnName("last_online_at");

            builder.Property(e => e.LastOfflineAt)
                .HasColumnName("last_offline_at");

            builder.Property(e => e.OfflineDuration)
                .HasColumnName("offline_duration");

            builder.Property(e => e.OfflineReason)
                .HasColumnName("offline_reason")
                .HasMaxLength(50);

            builder.Property(e => e.PermanentLocation)
                .HasColumnName("permanent_location")
                .HasMaxLength(200);

            builder.Property(e => e.WorkingSiteId)
                .HasColumnName("working_site_id");

            builder.Property(e => e.LastKnownLatitude)
                .HasColumnName("last_known_latitude")
                .HasPrecision(10, 7);

            builder.Property(e => e.LastKnownLongitude)
                .HasColumnName("last_known_longitude")
                .HasPrecision(10, 7);

            builder.Property(e => e.LastKnownAddress)
                .HasColumnName("last_known_address")
                .HasMaxLength(500);

            builder.Property(e => e.IssueTrackingId)
                .HasColumnName("issue_tracking_id");

            builder.Property(e => e.Notes)
                .HasColumnName("notes")
                .HasColumnType("text");

            builder.Property(e => e.CreatedBy)
                .HasColumnName("created_by")
                .HasMaxLength(100);

            builder.Property(e => e.CreatedAt)
                .HasColumnName("created_at")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(e => e.UpdatedBy)
                .HasColumnName("updated_by")
                .HasMaxLength(100);

            builder.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at");

            // Indexes
            builder.HasIndex(e => e.VehicleId)
                .HasDatabaseName("idx_vehicle_health_vehicle_id");

            builder.HasIndex(e => e.CheckedAt)
                .HasDatabaseName("idx_vehicle_health_checked_at");

            builder.HasIndex(e => new { e.VehicleId, e.CheckedAt })
                .HasDatabaseName("idx_vehicle_health_vehicle_checked");

            builder.HasIndex(e => e.IsOnline)
                .HasDatabaseName("idx_vehicle_health_is_online");

            builder.HasIndex(e => e.OfflineReason)
                .HasDatabaseName("idx_vehicle_health_offline_reason");

            builder.HasIndex(e => e.IssueTrackingId)
                .HasDatabaseName("idx_vehicle_health_issue_tracking");
        }
    }
}
