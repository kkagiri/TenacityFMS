/**
 * File: VehicleTripClusterSnapshotConfiguration.cs
 * Purpose: Maps persisted cluster snapshot audit records to the database schema.
 * Dependencies: EF Core, VehicleTripClusterSnapshot entity.
 * Last Modified: 2026-03-12
 */
using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations;

public class VehicleTripClusterSnapshotConfiguration : EntityTypeConfiguration<VehicleTripClusterSnapshot>
{
    public override void Configure(EntityTypeBuilder<VehicleTripClusterSnapshot> builder)
    {
        builder.HasKey(e => e.VehicleTripClusterSnapshotId).HasName("PRIMARY");

        builder.ToTable("vehicle_trip_cluster_snapshot");

        builder.HasIndex(e => new { e.VehicleId, e.TripDate, e.CapturedAtUtc }, "idx_vehicle_trip_cluster_snapshot_vehicle_date");
        builder.HasIndex(e => e.MatchedSiteId, "idx_vehicle_trip_cluster_snapshot_site");

        builder.Property(e => e.VehicleTripClusterSnapshotId);

        builder.Property(e => e.VehicleId);

        builder.Property(e => e.TripDate);

        builder.Property(e => e.ClusterIndex);

        builder.Property(e => e.Label)
            .HasMaxLength(100);

        builder.Property(e => e.Classification)
            .HasMaxLength(30)
            .HasDefaultValue("Unknown");

        builder.Property(e => e.MatchedSiteId);

        builder.Property(e => e.MatchedSiteName)
            .HasMaxLength(100);

        builder.Property(e => e.CentroidLatitude)
            .HasColumnType("decimal(11,8)");

        builder.Property(e => e.CentroidLongitude)
            .HasColumnType("decimal(11,8)");

        builder.Property(e => e.VisitCount)
            .HasDefaultValue(0);

        builder.Property(e => e.AverageDwellMinutes)
            .HasColumnType("decimal(10,2)")
            .HasDefaultValue(0m);

        builder.Property(e => e.SnapshotSource)
            .HasMaxLength(50)
            .HasDefaultValue("RealtimeDetector");

        builder.Property(e => e.MetadataJson);

        builder.Property(e => e.CapturedAtUtc);

        builder.HasOne(e => e.Vehicle)
            .WithMany()
            .HasForeignKey(e => e.VehicleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.MatchedSite)
            .WithMany()
            .HasForeignKey(e => e.MatchedSiteId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
