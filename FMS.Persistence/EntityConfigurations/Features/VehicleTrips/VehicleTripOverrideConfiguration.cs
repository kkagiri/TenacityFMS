/**
 * File: VehicleTripOverrideConfiguration.cs
 * Purpose: Maps dedicated vehicle trip manual override audit records to the database schema.
 * Dependencies: EF Core, VehicleTripOverride entity.
 * Last Modified: 2026-03-12
 */
using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations;

public class VehicleTripOverrideConfiguration : EntityTypeConfiguration<VehicleTripOverride>
{
    public override void Configure(EntityTypeBuilder<VehicleTripOverride> builder)
    {
        builder.HasKey(e => e.VehicleTripOverrideId).HasName("PRIMARY");

        builder.ToTable("vehicle_trip_override");

        builder.HasIndex(e => new { e.VehicleId, e.RequestedAtUtc }, "idx_vehicle_trip_override_vehicle_requested");
        builder.HasIndex(e => e.VehicleTripGroupId, "idx_vehicle_trip_override_group");
        builder.HasIndex(e => e.ResultVehicleTripGroupId, "idx_vehicle_trip_override_result_group");
        builder.HasIndex(e => e.VehicleTripId, "idx_vehicle_trip_override_trip");

        builder.Property(e => e.VehicleTripOverrideId);

        builder.Property(e => e.VehicleId);

        builder.Property(e => e.VehicleTripGroupId);

        builder.Property(e => e.VehicleTripId);

        builder.Property(e => e.SecondaryVehicleTripId);

        builder.Property(e => e.ResultVehicleTripGroupId);

        builder.Property(e => e.ActionType)
            .HasMaxLength(50);

        builder.Property(e => e.Reason)
            .HasMaxLength(1000);

        builder.Property(e => e.RequestedByUserId)
            .HasMaxLength(100);

        builder.Property(e => e.RequestedByName)
            .HasMaxLength(255);

        builder.Property(e => e.RequestIpAddress)
            .HasMaxLength(45);

        builder.Property(e => e.RequestedAtUtc);

        builder.Property(e => e.RequiredSupervisorApproval)
            .HasDefaultValue(false);

        builder.Property(e => e.SupervisorApprovalJson);

        builder.Property(e => e.OriginalValuesJson);

        builder.Property(e => e.NewValuesJson);

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

        builder.HasOne(e => e.ResultVehicleTripGroup)
            .WithMany()
            .HasForeignKey(e => e.ResultVehicleTripGroupId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
