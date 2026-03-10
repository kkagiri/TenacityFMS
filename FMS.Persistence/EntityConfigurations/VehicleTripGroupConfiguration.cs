/**
 * File: VehicleTripGroupConfiguration.cs
 * Purpose: Maps persisted vehicle trip group summaries to the database schema.
 * Dependencies: EF Core, VehicleTripGroup entity.
 * Last Modified: 2026-03-10
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