/**
 * File: VehicleTripConfiguration.cs
 * Purpose: Maps persisted vehicle trip legs to the database schema.
 * Dependencies: EF Core, VehicleTrip entity.
 * Last Modified: 2026-03-10
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

        builder.Property(e => e.VehicleTripId)
            .HasColumnType("int(11)")
            .HasColumnName("VehicleTripId");

        builder.Property(e => e.VehicleTripGroupId)
            .HasColumnType("int(11)")
            .HasColumnName("VehicleTripGroupId");

        builder.Property(e => e.VehicleId)
            .HasColumnType("int(11)")
            .HasColumnName("VehicleId");

        builder.Property(e => e.SequenceNo)
            .HasColumnType("int(11)")
            .HasColumnName("SequenceNo");

        builder.Property(e => e.StartTimeUtc)
            .HasColumnType("datetime")
            .HasColumnName("StartTimeUtc");

        builder.Property(e => e.EndTimeUtc)
            .HasColumnType("datetime")
            .HasColumnName("EndTimeUtc");

        builder.Property(e => e.OriginSiteId)
            .HasColumnType("int(11)")
            .HasColumnName("OriginSiteId");

        builder.Property(e => e.DestinationSiteId)
            .HasColumnType("int(11)")
            .HasColumnName("DestinationSiteId");

        builder.Property(e => e.OriginGeofenceId)
            .HasColumnType("int(11)")
            .HasColumnName("OriginGeofenceId");

        builder.Property(e => e.DestinationGeofenceId)
            .HasColumnType("int(11)")
            .HasColumnName("DestinationGeofenceId");

        builder.Property(e => e.StartLatitude)
            .HasColumnType("decimal(11,8)")
            .HasColumnName("StartLatitude");

        builder.Property(e => e.StartLongitude)
            .HasColumnType("decimal(11,8)")
            .HasColumnName("StartLongitude");

        builder.Property(e => e.EndLatitude)
            .HasColumnType("decimal(11,8)")
            .HasColumnName("EndLatitude");

        builder.Property(e => e.EndLongitude)
            .HasColumnType("decimal(11,8)")
            .HasColumnName("EndLongitude");

        builder.Property(e => e.DistanceKm)
            .HasColumnType("decimal(10,2)")
            .HasColumnName("DistanceKm");

        builder.Property(e => e.DurationMinutes)
            .HasColumnType("decimal(10,2)")
            .HasColumnName("DurationMinutes");

        builder.Property(e => e.MaxSpeedKph)
            .HasColumnType("decimal(10,2)")
            .HasColumnName("MaxSpeedKph");

        builder.Property(e => e.MovementProfile)
            .HasColumnType("tinyint(4)")
            .HasColumnName("MovementProfile")
            .HasConversion<int>();

        builder.Property(e => e.DetectionMode)
            .HasMaxLength(50)
            .HasColumnName("DetectionMode");

        builder.Property(e => e.CreatedAtUtc)
            .HasColumnType("datetime")
            .HasColumnName("CreatedAtUtc");

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