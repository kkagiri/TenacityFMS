/**
 * File: VehicleTripGroupConfiguration.cs
 * Purpose: Maps persisted vehicle trip group summaries to the database schema.
 * Dependencies: EF Core, VehicleTripGroup entity.
 * Last Modified: 2026-03-11
 */
using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations;

public class VehicleTripGroupConfiguration : EntityTypeConfiguration<VehicleTripGroup>
{
    public override void Configure(EntityTypeBuilder<VehicleTripGroup> builder)
    {
        builder.HasKey(e => e.VehicleTripGroupId).HasName("PRIMARY");

        builder.ToTable("vehicle_trip_group");

        builder.HasIndex(e => new { e.VehicleId, e.TripDate }, "idx_vehicle_trip_group_vehicle_date");
        builder.HasIndex(e => new { e.OriginSiteId, e.DestinationSiteId }, "idx_vehicle_trip_group_route");

        builder.Property(e => e.VehicleTripGroupId);

        builder.Property(e => e.VehicleId);

        builder.Property(e => e.TripDate);

        builder.Property(e => e.StartTimeUtc);

        builder.Property(e => e.EndTimeUtc);

        builder.Property(e => e.OriginSiteId);

        builder.Property(e => e.DestinationSiteId);

        builder.Property(e => e.TripCount);

        builder.Property(e => e.TotalDistanceKm)
            .HasColumnType("decimal(10,2)");

        builder.Property(e => e.TotalDurationMinutes)
            .HasColumnType("decimal(10,2)");

        builder.Property(e => e.Status)
            .HasDefaultValue(2);

        builder.Property(e => e.MovementProfile)
            .HasConversion<int>();

        builder.Property(e => e.DetectionMode)
            .HasMaxLength(50);

        builder.Property(e => e.TotalFuelConsumed)
            .HasColumnType("decimal(10,2)");

        builder.Property(e => e.GroupingType)
            .HasDefaultValue(1);

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

        builder.Property(e => e.UpdatedAtUtc);

        builder.HasOne(e => e.Vehicle)
            .WithMany(v => v.VehicleTripGroups)
            .HasForeignKey(e => e.VehicleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.OriginSite)
            .WithMany()
            .HasForeignKey(e => e.OriginSiteId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.DestinationSite)
            .WithMany()
            .HasForeignKey(e => e.DestinationSiteId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.Trips)
            .WithOne(t => t.VehicleTripGroup)
            .HasForeignKey(t => t.VehicleTripGroupId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
