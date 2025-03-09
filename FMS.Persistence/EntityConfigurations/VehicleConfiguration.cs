using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;
using System;

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

                builder.HasIndex(e => e.HyoungNo, "HyoungNo_UNIQUE").IsUnique();
                builder.HasIndex(e => e.DeviceId, "Vehicle_Device_idx");
                builder.HasIndex(e => e.DefaultEmployeeId, "Vehicle_employee_idx");
                builder.HasIndex(e => e.DefaultExptdAvgid, "vehicle_expectedAvg_idx");
                builder.HasIndex(e => e.VehicleManufacturerId, "vehicle_manufacturer_idx");
                builder.HasIndex(e => e.VehicleModelId, "vehicle_model_idx");
                builder.HasIndex(e => e.WorkingSiteId, "vehicle_site_idx");
                builder.HasIndex(e => e.VehicleTypeId, "vehicle_vehicleType_idx");
                builder.HasIndex(e => e.ModifiedBy, "vehilce_user_idx");

                builder.Property(e => e.VehicleId)
                    .HasColumnType("int(11)")
                    .HasColumnName("vehicleID");

                builder.Property(e => e.AverageKmL).HasColumnName("Average_km_l");
                builder.Property(e => e.Capacity).HasMaxLength(45);
                builder.Property(e => e.CurrentPhysicalReading).HasMaxLength(45);
                builder.Property(e => e.DefaultEmployeeId)
                    .HasColumnType("int(11)")
                    .HasColumnName("DefaultEmployeeID");
                builder.Property(e => e.DefaultExptdAvgid)
                    .HasColumnType("int(11)")
                    .HasColumnName("DefaultExptdAVGId");
                builder.Property(e => e.DeviceId)
                    .HasColumnType("int(11)")
                    .HasColumnName("DeviceID");
                builder.Property(e => e.ExcessWorkingHrCost).HasPrecision(10);
                builder.Property(e => e.GpsgategeneratedId)
                    .HasColumnType("tinyint(4)")
                    .HasColumnName("GPSGATEGeneratedID");
                builder.Property(e => e.HasGPSInstalled)
                    .HasColumnType("tinyint(4)")
                    .HasColumnName("HasGPSInstalled");
                builder.Property(e => e.HyoungNo).HasMaxLength(45);
                builder.Property(e => e.ModifiedBy)
                    .HasMaxLength(100)
                    .UseCollation("utf8mb4_general_ci")
                    .HasCharSet("utf8mb4");
                builder.Property(e => e.NumberPlate).HasMaxLength(45);
                builder.Property(e => e.Passenger).HasMaxLength(100);
                builder.Property(e => e.VehicleManufacturerId)
                    .HasColumnType("int(11)")
                    .HasColumnName("VehicleManufacturerID");
                builder.Property(e => e.VehicleModelId)
                    .HasColumnType("int(11)")
                    .HasColumnName("VehicleModelID");
                builder.Property(e => e.VehicleTypeId)
                    .HasDefaultValueSql("'1'")
                    .HasColumnType("int(11)")
                    .HasColumnName("VehicleTypeID");
                builder.Property(e => e.WorkingSiteId)
                    .HasColumnType("int(11)")
                    .HasColumnName("WorkingSiteID");
                builder.Property(e => e.Yom)
                    .HasMaxLength(45)
                    .HasColumnName("YOM");
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

                builder.HasOne(d => d.Device).WithMany(p => p.Vehicles)
                    .HasForeignKey(d => d.DeviceId)
                    .HasConstraintName("Vehicle_Device");

                builder.HasOne(d => d.ModifiedByNavigation).WithMany(p => p.Vehicles)
                    .HasForeignKey(d => d.ModifiedBy)
                    .HasConstraintName("vehilce_user");

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

                // Many-to-many relationship configuration using the new navigation properties:
                // builder.HasMany(v => v.Employees)
                //     .WithMany(e => e.Vehicles)
                //     .UsingEntity<Dictionary<string, object>>(
                //         "Employeevehicle",
                //         r => r.HasOne<Employee>()
                //               .WithMany()
                //               .HasForeignKey("EmployeeId")
                //               .OnDelete(DeleteBehavior.ClientSetNull)
                //               .HasConstraintName("EmployeeID"),
                //         l => l.HasOne<Vehicle>()
                //               .WithMany()
                //               .HasForeignKey("VehicleId")
                //               .OnDelete(DeleteBehavior.ClientSetNull)
                //               .HasConstraintName("VehicleID"),
                //         j =>
                //         {
                //             j.HasKey("VehicleId", "EmployeeId")
                //              .HasName("PRIMARY")
                //              .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                //             j.ToTable("employeevehicles");
                //             j.HasIndex(new[] { "EmployeeId" }, "EmployeeID_idx");
                //             j.IndexerProperty<int>("VehicleId")
                //              .HasColumnType("int(11)")
                //              .HasColumnName("VehicleID");
                //             j.IndexerProperty<int>("EmployeeId")
                //              .HasColumnType("int(11)")
                //              .HasColumnName("EmployeeID");
                //         });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring Vehicle entity: {ex.Message}", ex);
            }
        }
    }
}