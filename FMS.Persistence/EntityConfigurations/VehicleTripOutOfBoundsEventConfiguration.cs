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

        builder.Property(e => e.VehicleTripOutOfBoundsEventId)
            .HasColumnType("int(11)")
            .HasColumnName("VehicleTripOutOfBoundsEventId");

        builder.Property(e => e.VehicleId)
            .HasColumnType("int(11)")
            .HasColumnName("VehicleId");

        builder.Property(e => e.VehicleTripGroupId)
            .HasColumnType("int(11)")
            .HasColumnName("VehicleTripGroupId");

        builder.Property(e => e.VehicleTripId)
            .HasColumnType("int(11)")
            .HasColumnName("VehicleTripId");

        builder.Property(e => e.EventType)
            .HasMaxLength(50)
            .HasDefaultValue("BoundaryExit")
            .HasColumnName("EventType");

        builder.Property(e => e.OccurredAtUtc)
            .HasColumnType("datetime")
            .HasColumnName("OccurredAtUtc");

        builder.Property(e => e.Latitude)
            .HasColumnType("decimal(11,8)")
            .HasColumnName("Latitude");

        builder.Property(e => e.Longitude)
            .HasColumnType("decimal(11,8)")
            .HasColumnName("Longitude");

        builder.Property(e => e.SiteId)
            .HasColumnType("int(11)")
            .HasColumnName("SiteId");

        builder.Property(e => e.GeofenceId)
            .HasColumnType("int(11)")
            .HasColumnName("GeofenceId");

        builder.Property(e => e.DistanceFromBoundaryMeters)
            .HasColumnType("decimal(10,2)")
            .HasColumnName("DistanceFromBoundaryMeters");

        builder.Property(e => e.DurationMinutes)
            .HasColumnType("decimal(10,2)")
            .HasColumnName("DurationMinutes");

        builder.Property(e => e.Reason)
            .HasMaxLength(255)
            .HasColumnName("Reason");

        builder.Property(e => e.MetadataJson)
            .HasColumnType("longtext")
            .HasColumnName("MetadataJson");

        builder.Property(e => e.CreatedAtUtc)
            .HasColumnType("datetime")
            .HasColumnName("CreatedAtUtc");

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