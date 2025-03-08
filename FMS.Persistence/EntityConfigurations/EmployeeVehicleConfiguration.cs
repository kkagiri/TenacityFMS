using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;
using System;

namespace FMS.Persistence.EntityConfigurations
{
    public class EmployeeVehicleConfiguration : EntityTypeConfiguration<EmployeeVehicle>
    {
        public override void Configure(EntityTypeBuilder<EmployeeVehicle> builder)
        {
            try
            {
                builder.ToTable("employeevehicle")
                    .HasCharSet("latin1");

                builder.HasKey(e => new { e.VehicleId, e.EmployeeId })
                    .HasName("PRIMARY");

                builder.HasIndex(e => e.EmployeeId, "EmployeeID_idx").IsUnique();

                builder.Property(e => e.EmployeeId)
          .HasColumnType("int(11)")
          .HasColumnName("EmployeeID");

                builder.Property(e => e.VehicleId)
                    .HasColumnType("int(11)")
                    .HasColumnName("VehicleID");

                // Configure relationships with specific column names
                builder.HasOne(ev => ev.Employee)
                    .WithMany(e => e.EmployeeVehicles)
                    .HasForeignKey(ev => ev.EmployeeId)
                    .HasConstraintName("EmployeeID");

                builder.HasOne(ev => ev.Vehicle)
                    .WithMany(v => v.EmployeeVehicles)
                    .HasForeignKey(ev => ev.VehicleId)
                    .HasConstraintName("VehicleID");
            }
            catch (Exception ex)
            {
                throw new Exception($"Error configuring EmployeeVehicle entity: {ex.Message}", ex);
            }
        }
    }
}