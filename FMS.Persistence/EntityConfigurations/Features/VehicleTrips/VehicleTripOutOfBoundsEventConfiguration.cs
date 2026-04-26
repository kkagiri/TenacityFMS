/**
 * File: VehicleTripOutOfBoundsEventConfiguration.cs
 * Purpose: Maps persisted out-of-bounds trip events to the database schema.
 * Dependencies: EF Core, VehicleTripOutOfBoundsEvent entity.
 * Last Modified: 2026-03-12
 */
using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations;

public class VehicleTripOutOfBoundsEventConfiguration : EntityTypeConfiguration<VehicleTripOutOfBoundsEvent>
{
    public override void Configure(EntityTypeBuilder<VehicleTripOutOfBoundsEvent> builder)
    {
        builder.HasKey(e => e.VehicleTripOutOfBoundsEventId).HasName("PRIMARY");

        builder.ToTable("vehicle_trip_out_of_bounds_event");

        builder.HasIndex(e => new { e.VehicleId, e.OccurredAtUtc }, "idx_vehicle_trip_oob_vehicle_occurred");
        builder.HasIndex(e => e.VehicleTripGroupId, "idx_vehicle_trip_oob_group");
        builder.HasIndex(e => e.VehicleTripId, "idx_vehicle_trip_oob_trip");

        builder.Property(e => e.VehicleTripOutOfBoundsEventId);

        builder.Property(e => e.VehicleId);

        builder.Property(e => e.VehicleTripGroupId);

        builder.Property(e => e.VehicleTripId);

        builder.Property(e => e.EventType)
            .HasMaxLength(50)
            .HasDefaultValue("BoundaryExit");

        builder.Property(e => e.OccurredAtUtc);

        builder.Property(e => e.Latitude)
            .HasColumnType("decimal(11,8)");

        builder.Property(e => e.Longitude)
            .HasColumnType("decimal(11,8)");

        builder.Property(e => e.SiteId);

        builder.Property(e => e.GeofenceId);

        builder.Property(e => e.DistanceFromBoundaryMeters)
            .HasColumnType("decimal(10,2)");

        builder.Property(e => e.DurationMinutes)
            .HasColumnType("decimal(10,2)");

        builder.Property(e => e.Reason)
            .HasMaxLength(255);

        builder.Property(e => e.MetadataJson);

        builder.Property(e => e.CreatedAtUtc);

        builder.HasOne(e => e.Vehicle)
            .WithMany()
            .HasForeignKey(e => e.VehicleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.VehicleTripGroup)
            .WithMany()
            .HasForeignKey(e => e.VehicleTripGroupId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.VehicleTrip)
            .WithMany()
            .HasForeignKey(e => e.VehicleTripId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Site)
            .WithMany()
            .HasForeignKey(e => e.SiteId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
