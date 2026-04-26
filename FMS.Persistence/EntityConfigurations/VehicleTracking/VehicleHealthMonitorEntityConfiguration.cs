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

            builder.Property(e => e.Id);

            builder.Property(e => e.VehicleId)
                .IsRequired();

            builder.Property(e => e.CheckedAt)
                .IsRequired();

            builder.Property(e => e.IsOnline)
                .IsRequired();

            builder.Property(e => e.LastOnlineAt);

            builder.Property(e => e.LastOfflineAt);

            builder.Property(e => e.OfflineDuration);

            builder.Property(e => e.OfflineReason)
                .HasMaxLength(50);

            builder.Property(e => e.PermanentLocation)
                .HasMaxLength(200);

            builder.Property(e => e.WorkingSiteId);

            builder.Property(e => e.LastKnownLatitude)
                .HasPrecision(10, 7);

            builder.Property(e => e.LastKnownLongitude)
                .HasPrecision(10, 7);

            builder.Property(e => e.LastKnownAddress)
                .HasMaxLength(500);

            builder.Property(e => e.IssueTrackingId);

            builder.Property(e => e.Notes);

            builder.Property(e => e.CreatedBy)
                .HasMaxLength(100);

            builder.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(e => e.UpdatedBy)
                .HasMaxLength(100);

            builder.Property(e => e.UpdatedAt);

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

