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

        builder.Property(e => e.VehicleTripClusterSnapshotId)
            .HasColumnType("int(11)")
            .HasColumnName("VehicleTripClusterSnapshotId");

        builder.Property(e => e.VehicleId)
            .HasColumnType("int(11)")
            .HasColumnName("VehicleId");

        builder.Property(e => e.TripDate)
            .HasColumnType("date")
            .HasColumnName("TripDate");

        builder.Property(e => e.ClusterIndex)
            .HasColumnType("int(11)")
            .HasColumnName("ClusterIndex");

        builder.Property(e => e.Label)
            .HasMaxLength(100)
            .HasColumnName("Label");

        builder.Property(e => e.Classification)
            .HasMaxLength(30)
            .HasDefaultValue("Unknown")
            .HasColumnName("Classification");

        builder.Property(e => e.MatchedSiteId)
            .HasColumnType("int(11)")
            .HasColumnName("MatchedSiteId");

        builder.Property(e => e.MatchedSiteName)
            .HasMaxLength(100)
            .HasColumnName("MatchedSiteName");

        builder.Property(e => e.CentroidLatitude)
            .HasColumnType("decimal(11,8)")
            .HasColumnName("CentroidLatitude");

        builder.Property(e => e.CentroidLongitude)
            .HasColumnType("decimal(11,8)")
            .HasColumnName("CentroidLongitude");

        builder.Property(e => e.VisitCount)
            .HasColumnType("int(11)")
            .HasDefaultValue(0)
            .HasColumnName("VisitCount");

        builder.Property(e => e.AverageDwellMinutes)
            .HasColumnType("decimal(10,2)")
            .HasDefaultValue(0m)
            .HasColumnName("AverageDwellMinutes");

        builder.Property(e => e.SnapshotSource)
            .HasMaxLength(50)
            .HasDefaultValue("RealtimeDetector")
            .HasColumnName("SnapshotSource");

        builder.Property(e => e.MetadataJson)
            .HasColumnType("longtext")
            .HasColumnName("MetadataJson");

        builder.Property(e => e.CapturedAtUtc)
            .HasColumnType("datetime")
            .HasColumnName("CapturedAtUtc");

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