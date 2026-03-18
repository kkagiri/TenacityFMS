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

        builder.Property(e => e.VehicleTripGroupId)
            .HasColumnType("int(11)")
            .HasColumnName("VehicleTripGroupId");

        builder.Property(e => e.VehicleId)
            .HasColumnType("int(11)")
            .HasColumnName("VehicleId");

        builder.Property(e => e.TripDate)
            .HasColumnType("date")
            .HasColumnName("TripDate");

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

        builder.Property(e => e.TripCount)
            .HasColumnType("int(11)")
            .HasColumnName("TripCount");

        builder.Property(e => e.TotalDistanceKm)
            .HasColumnType("decimal(10,2)")
            .HasColumnName("TotalDistanceKm");

        builder.Property(e => e.TotalDurationMinutes)
            .HasColumnType("decimal(10,2)")
            .HasColumnName("TotalDurationMinutes");

        builder.Property(e => e.Status)
            .HasColumnType("tinyint(4)")
            .HasDefaultValue(2)
            .HasColumnName("Status");

        builder.Property(e => e.MovementProfile)
            .HasColumnType("tinyint(4)")
            .HasColumnName("MovementProfile")
            .HasConversion<int>();

        builder.Property(e => e.DetectionMode)
            .HasMaxLength(50)
            .HasColumnName("DetectionMode");

        builder.Property(e => e.TotalFuelConsumed)
            .HasColumnType("decimal(10,2)")
            .HasColumnName("TotalFuelConsumed");

        builder.Property(e => e.GroupingType)
            .HasColumnType("tinyint(4)")
            .HasDefaultValue(1)
            .HasColumnName("GroupingType");

        builder.Property(e => e.ConfidenceScore)
            .HasColumnType("decimal(5,2)")
            .HasDefaultValue(1.00m)
            .HasColumnName("ConfidenceScore");

        builder.Property(e => e.ConfidenceBand)
            .HasMaxLength(20)
            .HasDefaultValue("High")
            .HasColumnName("ConfidenceBand");

        builder.Property(e => e.AnomalyFlags)
            .HasColumnType("int(11)")
            .HasDefaultValue(0)
            .HasColumnName("AnomalyFlags");

        builder.Property(e => e.ReconciliationStatus)
            .HasColumnType("tinyint(4)")
            .HasDefaultValue(0)
            .HasColumnName("ReconciliationStatus");

        builder.Property(e => e.ProjectPlanId)
            .HasColumnType("int(11)")
            .HasColumnName("ProjectPlanId");

        builder.Property(e => e.WorkShiftId)
            .HasColumnType("int(11)")
            .HasColumnName("WorkShiftId");

        builder.Property(e => e.PlannedHaulRouteId)
            .HasColumnType("int(11)")
            .HasColumnName("PlannedHaulRouteId");

        builder.Property(e => e.PlannedOriginZoneId)
            .HasColumnType("int(11)")
            .HasColumnName("PlannedOriginZoneId");

        builder.Property(e => e.PlannedDestinationZoneId)
            .HasColumnType("int(11)")
            .HasColumnName("PlannedDestinationZoneId");

        builder.Property(e => e.PlanningMatchStatus)
            .HasMaxLength(50)
            .HasColumnName("PlanningMatchStatus");

        builder.Property(e => e.IsOutOfBounds)
            .HasColumnType("bit(1)")
            .HasColumnName("IsOutOfBounds");

        builder.Property(e => e.IsProductiveMovement)
            .HasColumnType("bit(1)")
            .HasColumnName("IsProductiveMovement");

        builder.Property(e => e.CreatedAtUtc)
            .HasColumnType("datetime")
            .HasColumnName("CreatedAtUtc");

        builder.Property(e => e.UpdatedAtUtc)
            .HasColumnType("datetime")
            .HasColumnName("UpdatedAtUtc");

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