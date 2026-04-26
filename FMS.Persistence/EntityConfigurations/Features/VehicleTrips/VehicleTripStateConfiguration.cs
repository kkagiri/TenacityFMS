/**
 * File: VehicleTripStateConfiguration.cs
 * Purpose: Maps persisted per-vehicle trip detector state to the database schema.
 * Dependencies: EF Core, VehicleTripState entity.
 * Last Modified: 2026-03-12
 */
using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations;

public class VehicleTripStateConfiguration : EntityTypeConfiguration<VehicleTripState>
{
    public override void Configure(EntityTypeBuilder<VehicleTripState> builder)
    {
        builder.HasKey(e => e.VehicleTripStateId).HasName("PRIMARY");

        builder.ToTable("vehicle_trip_state");

        builder.HasIndex(e => new { e.VehicleId, e.MovementProfile, e.StateDate }, "ux_vehicle_trip_state_vehicle_profile_date")
            .IsUnique();
        builder.HasIndex(e => e.CurrentState, "idx_vehicle_trip_state_current_state");
        builder.HasIndex(e => e.UpdatedAtUtc, "idx_vehicle_trip_state_updated_at");

        builder.Property(e => e.VehicleTripStateId);

        builder.Property(e => e.VehicleId);

        builder.Property(e => e.StateDate);

        builder.Property(e => e.MovementProfile)
            .HasDefaultValue(VehicleMovementProfile.Geofence)
            .HasConversion<int>();

        builder.Property(e => e.CurrentState)
            .HasMaxLength(30)
            .HasDefaultValue("AT_SITE");

        builder.Property(e => e.CurrentSiteId);

        builder.Property(e => e.CurrentGeofenceId);

        builder.Property(e => e.CurrentSiteName)
            .HasMaxLength(100);

        builder.Property(e => e.CurrentClusterIndex);

        builder.Property(e => e.OriginSiteId);

        builder.Property(e => e.OriginGeofenceId);

        builder.Property(e => e.OriginSiteName)
            .HasMaxLength(100);

        builder.Property(e => e.OriginLatitude)
            .HasColumnType("decimal(11,8)");

        builder.Property(e => e.OriginLongitude)
            .HasColumnType("decimal(11,8)");

        builder.Property(e => e.TripStartTimeUtc);

        builder.Property(e => e.TripStartTrackInfoId);

        builder.Property(e => e.FuelAtDeparture)
            .HasColumnType("decimal(10,2)");

        builder.Property(e => e.ConsecutiveOutOfSitePoints)
            .HasDefaultValue(0);

        builder.Property(e => e.ConsecutiveAtSitePoints)
            .HasDefaultValue(0);

        builder.Property(e => e.AccumulatedDistanceKm)
            .HasColumnType("decimal(10,2)")
            .HasDefaultValue(0m);

        builder.Property(e => e.MaxSpeedKph)
            .HasColumnType("decimal(10,2)");

        builder.Property(e => e.LastProcessedPointTimeUtc);

        builder.Property(e => e.LastGpsTimestampUtc);

        builder.Property(e => e.LastLatitude)
            .HasColumnType("decimal(11,8)");

        builder.Property(e => e.LastLongitude)
            .HasColumnType("decimal(11,8)");

        builder.Property(e => e.InProgressTripGroupId);

        builder.Property(e => e.InProgressTripId);

        builder.Property(e => e.RecentPointsJson);

        builder.Property(e => e.KnownClustersJson);

        builder.Property(e => e.CreatedAtUtc);

        builder.Property(e => e.UpdatedAtUtc);

        builder.HasOne(e => e.Vehicle)
            .WithMany()
            .HasForeignKey(e => e.VehicleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.CurrentSite)
            .WithMany()
            .HasForeignKey(e => e.CurrentSiteId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.OriginSite)
            .WithMany()
            .HasForeignKey(e => e.OriginSiteId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.InProgressTripGroup)
            .WithMany()
            .HasForeignKey(e => e.InProgressTripGroupId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.InProgressTrip)
            .WithMany()
            .HasForeignKey(e => e.InProgressTripId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
