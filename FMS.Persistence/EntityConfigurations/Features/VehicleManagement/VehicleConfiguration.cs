/**
 * File: VehicleConfiguration.cs
 * Purpose: Maps Vehicle entity fields and relationships to database schema.
 * Dependencies: EF Core, Vehicle and related domain entities
 * Last Modified: 2026-02-26
 *
 * Key Functions/Components:
 * - Configure(): Defines table/column mapping and relationship constraints for Vehicle.
 */
using System;
using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the Vehicle entity
    /// </summary>
    public class VehicleConfiguration : EntityTypeConfiguration<FMS.Domain.Entities.Vehicle>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<Vehicle> builder)
        {
            try
            {
                builder.HasKey(e => e.VehicleId).HasName("PRIMARY");

                builder.ToTable("vehicle");

                builder.HasIndex(e => e.VehicleCode, "VehicleCode_UNIQUE").IsUnique();

                //builder.HasIndex (e => e.DeviceId, "Vehicle_Device_idx");
                builder.HasIndex(e => e.DefaultEmployeeId, "Vehicle_employee_idx");
                builder.HasIndex(e => e.DefaultExptdAvgid, "vehicle_expectedAvg_idx");
                builder.HasIndex(e => e.VehicleManufacturerId, "vehicle_manufacturer_idx");
                builder.HasIndex(e => e.VehicleModelId, "vehicle_model_idx");
                builder.HasIndex(e => e.WorkingSiteId, "vehicle_site_idx");
                builder.HasIndex(e => e.VehicleTypeId, "vehicle_vehicleType_idx");
                builder.HasIndex(e => e.ModifiedBy, "vehilce_user_idx");
                builder.HasIndex(e => e.CreatedBy, "vehicle_user1_idx");

                builder.Property(e => e.VehicleId);

                builder.Property(e => e.AverageKmL);
                // Note: Legacy 'Capacity' column removed - use FuelTankCapacity instead
                builder.Property(e => e.CurrentPhysicalReading).HasMaxLength(45);
                builder.Property(e => e.DefaultEmployeeId);
                builder.Property(e => e.DefaultExptdAvgid);
                //builder.Property (e => e.DeviceId)
                //    .HasColumnType ("int(11)")
                //;
                builder.Property(e => e.ExcessWorkingHrCost).HasPrecision(10);
                builder.Property(e => e.GpsgategeneratedId);
                builder.Property(e => e.HasGPSInstalled);
                builder.Property(e => e.IsCompanyVehicle);
                builder.Property(e => e.IsActive);
                builder.Property(e => e.VehicleStatusValue)
                    .HasDefaultValue(VehicleStatus.Working)
                    .HasConversion<int>();
                builder.Property(e => e.MovementProfile)
                    .HasDefaultValue(VehicleMovementProfile.Geofence)
                    .HasConversion<int>();
                builder.Property(e => e.VehicleCode).HasMaxLength(45);
                builder.Property(e => e.FuelTankCapacity)
                    .HasColumnType("decimal(10,2)");
                builder.Property(e => e.IsFullTankPolicy);
                builder.Property(e => e.ModifiedBy)
                    .HasMaxLength(100);
                builder.Property(e => e.CreatedBy)
                    .HasMaxLength(100);
                builder.Property(e => e.DateCreated);
                builder.Property(e => e.DateModified);
                builder.Property(e => e.NumberPlate).HasMaxLength(45);
                builder.Property(e => e.Passenger).HasMaxLength(100);
                builder.Property(e => e.VehicleManufacturerId);
                builder.Property(e => e.VehicleModelId);
                builder.Property(e => e.VehicleTypeId)
                    .HasDefaultValueSql("'1'");
                builder.Property(e => e.WorkingSiteId);
                builder.Property(e => e.Yom)
                    .HasMaxLength(45);

                builder.HasOne(v => v.DefaultExptdAvg)
                    .WithMany()
                    .HasForeignKey(v => v.DefaultExptdAvgid)
                    .OnDelete(DeleteBehavior.Restrict);

                //One - to - many relationship configuration.
                builder.HasOne(d => d.DefaultEmployee)
                    .WithMany()
                    .HasForeignKey(d => d.DefaultEmployeeId)
                    .HasConstraintName("Vehicle_employee");

                builder.HasOne(d => d.DefaultExptdAvg).WithMany()
                    .HasForeignKey(d => d.DefaultExptdAvgid)
                    .HasConstraintName("vehicle_expectedAvg");

                //builder.HasOne (d => d.Device).WithMany (p => p.Vehicles)
                //    .HasForeignKey (d => d.DeviceId)
                //    .HasConstraintName ("Vehicle_Device");

                builder.HasMany(v => v.VehicleTripGroups)
                    .WithOne(g => g.Vehicle)
                    .HasForeignKey(g => g.VehicleId)
                    .OnDelete(DeleteBehavior.Restrict);

                builder.HasMany(v => v.VehicleTrips)
                    .WithOne(t => t.Vehicle)
                    .HasForeignKey(t => t.VehicleId)
                    .OnDelete(DeleteBehavior.Restrict);

                builder.HasOne(d => d.ModifiedByNavigation).WithMany(p => p.Vehicles)
                    .HasForeignKey(d => d.ModifiedBy)
                    .HasConstraintName("vehilce_user");

                builder.HasOne(d => d.CreatedByNavigation).WithMany()
                    .HasForeignKey(d => d.CreatedBy)
                    .HasConstraintName("vehicle_user1");

                builder.HasOne(d => d.VehicleManufacturer).WithMany(p => p.Vehicles)
                    .HasForeignKey(d => d.VehicleManufacturerId)
                    .HasConstraintName("vehicle_manufacturer");

                builder.HasOne(d => d.VehicleModel).WithMany(p => p.Vehicles)
                    .HasForeignKey(d => d.VehicleModelId)
                    .HasConstraintName("vehicle_model");

                builder.HasOne(d => d.VehicleType).WithMany(p => p.Vehicles)
                    .HasForeignKey(d => d.VehicleTypeId)
                    .HasConstraintName("vehicle_vehicleType");

                builder.HasOne(d => d.WorkingSite).WithMany(p => p.Vehicles)
                    .HasForeignKey(d => d.WorkingSiteId)
                    .HasConstraintName("vehicle_site");

                // Prevent implicit many-to-many join table creation (EmployeesId/VehiclesVehicleId).
                // Vehicle-employee links are managed explicitly by EmployeeVehicleConfiguration.
                builder.Ignore(v => v.Employees);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");
            }
        }
    }
}


