/**
 * File: VehicleTripConfiguration.cs
 * Purpose: Maps persisted vehicle trip legs to the database schema.
 * Dependencies: EF Core, VehicleTrip entity.
 * Last Modified: 2026-03-11
 */
using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations;

public class VehicleTripConfiguration : EntityTypeConfiguration<VehicleTrip>
{
    public override void Configure(EntityTypeBuilder<VehicleTrip> builder)
    {
        builder.HasKey(e => e.VehicleTripId).HasName("PRIMARY");

        builder.ToTable("vehicle_trip");

        builder.HasIndex(e => new { e.VehicleId, e.StartTimeUtc }, "idx_vehicle_trip_vehicle_start");
        builder.HasIndex(e => e.VehicleTripGroupId, "idx_vehicle_trip_group");

        builder.Property(e => e.VehicleTripId);

        builder.Property(e => e.VehicleTripGroupId);

        builder.Property(e => e.VehicleId);

        builder.Property(e => e.SequenceNo);

        builder.Property(e => e.StartTimeUtc);

        builder.Property(e => e.EndTimeUtc);

        builder.Property(e => e.OriginSiteId);

        builder.Property(e => e.DestinationSiteId);

        builder.Property(e => e.OriginGeofenceId);

        builder.Property(e => e.DestinationGeofenceId);

        builder.Property(e => e.StartLatitude)
            .HasColumnType("decimal(11,8)");

        builder.Property(e => e.StartLongitude)
            .HasColumnType("decimal(11,8)");

        builder.Property(e => e.EndLatitude)
            .HasColumnType("decimal(11,8)");

        builder.Property(e => e.EndLongitude)
            .HasColumnType("decimal(11,8)");

        builder.Property(e => e.DistanceKm)
            .HasColumnType("decimal(10,2)");

        builder.Property(e => e.DurationMinutes)
            .HasColumnType("decimal(10,2)");

        builder.Property(e => e.MaxSpeedKph)
            .HasColumnType("decimal(10,2)");

        builder.Property(e => e.Status)
            .HasDefaultValue(2);

        builder.Property(e => e.MovementProfile)
            .HasConversion<int>();

        builder.Property(e => e.DetectionMode)
            .HasMaxLength(50);

        builder.Property(e => e.StartTrackInfoId);

        builder.Property(e => e.EndTrackInfoId);

        builder.Property(e => e.FuelAtDeparture)
            .HasColumnType("decimal(10,2)");

        builder.Property(e => e.FuelAtArrival)
            .HasColumnType("decimal(10,2)");

        builder.Property(e => e.FuelConsumed)
            .HasColumnType("decimal(10,2)");

        builder.Property(e => e.ConfidenceScore)
            .HasColumnType("decimal(5,2)")
            .HasDefaultValue(1.00m);

        builder.Property(e => e.ConfidenceBand)
            .HasMaxLength(20)
            .HasDefaultValue("High");

        builder.Property(e => e.AnomalyFlags)
            .HasDefaultValue(0);

        builder.Property(e => e.ReconciliationStatus)
            .HasDefaultValue(0);

        builder.Property(e => e.IsLowConfidence)
            .HasDefaultValue(false);

        builder.Property(e => e.ProjectPlanId);

        builder.Property(e => e.WorkShiftId);

        builder.Property(e => e.PlannedHaulRouteId);

        builder.Property(e => e.PlannedOriginZoneId);

        builder.Property(e => e.PlannedDestinationZoneId);

        builder.Property(e => e.PlanningMatchStatus)
            .HasMaxLength(50);

        builder.Property(e => e.IsOutOfBounds);

        builder.Property(e => e.IsProductiveMovement);

        builder.Property(e => e.CreatedAtUtc);

        builder.HasOne(e => e.Vehicle)
            .WithMany(v => v.VehicleTrips)
            .HasForeignKey(e => e.VehicleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.VehicleTripGroup)
            .WithMany(g => g.Trips)
            .HasForeignKey(e => e.VehicleTripGroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.OriginSite)
            .WithMany()
            .HasForeignKey(e => e.OriginSiteId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.DestinationSite)
            .WithMany()
            .HasForeignKey(e => e.DestinationSiteId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
