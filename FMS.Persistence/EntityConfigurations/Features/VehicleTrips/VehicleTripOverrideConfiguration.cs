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

        builder.Property(e => e.VehicleTripOverrideId)
            .HasColumnType("int(11)")
            .HasColumnName("VehicleTripOverrideId");

        builder.Property(e => e.VehicleId)
            .HasColumnType("int(11)")
            .HasColumnName("VehicleId");

        builder.Property(e => e.VehicleTripGroupId)
            .HasColumnType("int(11)")
            .HasColumnName("VehicleTripGroupId");

        builder.Property(e => e.VehicleTripId)
            .HasColumnType("int(11)")
            .HasColumnName("VehicleTripId");

        builder.Property(e => e.SecondaryVehicleTripId)
            .HasColumnType("int(11)")
            .HasColumnName("SecondaryVehicleTripId");

        builder.Property(e => e.ResultVehicleTripGroupId)
            .HasColumnType("int(11)")
            .HasColumnName("ResultVehicleTripGroupId");

        builder.Property(e => e.ActionType)
            .HasMaxLength(50)
            .HasColumnName("ActionType");

        builder.Property(e => e.Reason)
            .HasMaxLength(1000)
            .HasColumnName("Reason");

        builder.Property(e => e.RequestedByUserId)
            .HasMaxLength(100)
            .HasColumnName("RequestedByUserId");

        builder.Property(e => e.RequestedByName)
            .HasMaxLength(255)
            .HasColumnName("RequestedByName");

        builder.Property(e => e.RequestIpAddress)
            .HasMaxLength(45)
            .HasColumnName("RequestIpAddress");

        builder.Property(e => e.RequestedAtUtc)
            .HasColumnType("datetime")
            .HasColumnName("RequestedAtUtc");

        builder.Property(e => e.RequiredSupervisorApproval)
            .HasColumnType("bit(1)")
            .HasDefaultValue(false)
            .HasColumnName("RequiredSupervisorApproval");

        builder.Property(e => e.SupervisorApprovalJson)
            .HasColumnType("longtext")
            .HasColumnName("SupervisorApprovalJson");

        builder.Property(e => e.OriginalValuesJson)
            .HasColumnType("longtext")
            .HasColumnName("OriginalValuesJson");

        builder.Property(e => e.NewValuesJson)
            .HasColumnType("longtext")
            .HasColumnName("NewValuesJson");

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

        builder.HasOne(e => e.ResultVehicleTripGroup)
            .WithMany()
            .HasForeignKey(e => e.ResultVehicleTripGroupId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}