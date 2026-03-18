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

        builder.Property(e => e.VehicleTripStateId)
            .HasColumnType("int(11)")
            .HasColumnName("VehicleTripStateId");

        builder.Property(e => e.VehicleId)
            .HasColumnType("int(11)")
            .HasColumnName("VehicleId");

        builder.Property(e => e.StateDate)
            .HasColumnType("date")
            .HasColumnName("StateDate");

        builder.Property(e => e.MovementProfile)
            .HasColumnType("tinyint(4)")
            .HasColumnName("MovementProfile")
            .HasDefaultValue(VehicleMovementProfile.Geofence)
            .HasConversion<int>();

        builder.Property(e => e.CurrentState)
            .HasMaxLength(30)
            .HasDefaultValue("AT_SITE")
            .HasColumnName("CurrentState");

        builder.Property(e => e.CurrentSiteId)
            .HasColumnType("int(11)")
            .HasColumnName("CurrentSiteId");

        builder.Property(e => e.CurrentGeofenceId)
            .HasColumnType("int(11)")
            .HasColumnName("CurrentGeofenceId");

        builder.Property(e => e.CurrentSiteName)
            .HasMaxLength(100)
            .HasColumnName("CurrentSiteName");

        builder.Property(e => e.CurrentClusterIndex)
            .HasColumnType("int(11)")
            .HasColumnName("CurrentClusterIndex");

        builder.Property(e => e.OriginSiteId)
            .HasColumnType("int(11)")
            .HasColumnName("OriginSiteId");

        builder.Property(e => e.OriginGeofenceId)
            .HasColumnType("int(11)")
            .HasColumnName("OriginGeofenceId");

        builder.Property(e => e.OriginSiteName)
            .HasMaxLength(100)
            .HasColumnName("OriginSiteName");

        builder.Property(e => e.OriginLatitude)
            .HasColumnType("decimal(11,8)")
            .HasColumnName("OriginLatitude");

        builder.Property(e => e.OriginLongitude)
            .HasColumnType("decimal(11,8)")
            .HasColumnName("OriginLongitude");

        builder.Property(e => e.TripStartTimeUtc)
            .HasColumnType("datetime")
            .HasColumnName("TripStartTimeUtc");

        builder.Property(e => e.TripStartTrackInfoId)
            .HasColumnType("int(11)")
            .HasColumnName("TripStartTrackInfoId");

        builder.Property(e => e.FuelAtDeparture)
            .HasColumnType("decimal(10,2)")
            .HasColumnName("FuelAtDeparture");

        builder.Property(e => e.ConsecutiveOutOfSitePoints)
            .HasColumnType("int(11)")
            .HasDefaultValue(0)
            .HasColumnName("ConsecutiveOutOfSitePoints");

        builder.Property(e => e.ConsecutiveAtSitePoints)
            .HasColumnType("int(11)")
            .HasDefaultValue(0)
            .HasColumnName("ConsecutiveAtSitePoints");

        builder.Property(e => e.AccumulatedDistanceKm)
            .HasColumnType("decimal(10,2)")
            .HasDefaultValue(0m)
            .HasColumnName("AccumulatedDistanceKm");

        builder.Property(e => e.MaxSpeedKph)
            .HasColumnType("decimal(10,2)")
            .HasColumnName("MaxSpeedKph");

        builder.Property(e => e.LastProcessedPointTimeUtc)
            .HasColumnType("datetime")
            .HasColumnName("LastProcessedPointTimeUtc");

        builder.Property(e => e.LastGpsTimestampUtc)
            .HasColumnType("datetime")
            .HasColumnName("LastGpsTimestampUtc");

        builder.Property(e => e.LastLatitude)
            .HasColumnType("decimal(11,8)")
            .HasColumnName("LastLatitude");

        builder.Property(e => e.LastLongitude)
            .HasColumnType("decimal(11,8)")
            .HasColumnName("LastLongitude");

        builder.Property(e => e.InProgressTripGroupId)
            .HasColumnType("int(11)")
            .HasColumnName("InProgressTripGroupId");

        builder.Property(e => e.InProgressTripId)
            .HasColumnType("int(11)")
            .HasColumnName("InProgressTripId");

        builder.Property(e => e.RecentPointsJson)
            .HasColumnType("longtext")
            .HasColumnName("RecentPointsJson");

        builder.Property(e => e.KnownClustersJson)
            .HasColumnType("longtext")
            .HasColumnName("KnownClustersJson");

        builder.Property(e => e.CreatedAtUtc)
            .HasColumnType("datetime")
            .HasColumnName("CreatedAtUtc");

        builder.Property(e => e.UpdatedAtUtc)
            .HasColumnType("datetime")
            .HasColumnName("UpdatedAtUtc");

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