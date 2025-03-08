using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    public class FuelrefilConfiguration : EntityTypeConfiguration<Fuelrefil>
    {
        public override void Configure(EntityTypeBuilder<Fuelrefil> builder)
        {
            try
            {
                builder.HasKey(e => new { e.Id, e.TankId })
                    .HasName("PRIMARY")
                    .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

                builder.ToTable("fuelrefil");

                builder.HasIndex(e => e.DriverId, "FuelRefil_Driver_idx");
                builder.HasIndex(e => e.PumpTranscationId, "FuelRefil_PumpTransaction_idx");
                builder.HasIndex(e => e.FuelBy, "FuelRefil_User_idx");
                builder.HasIndex(e => e.SiteId, "FuelRefil_site_idx");
                builder.HasIndex(e => e.TankId, "FuelRefill_tank_idx");
                builder.HasIndex(e => e.VehicleId, "fuelRefil_vehilce_idx");

                builder.Property(e => e.Id)
                    .ValueGeneratedOnAdd()
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                builder.Property(e => e.TankId)
                    .HasColumnType("int(11)")
                    .HasColumnName("TankID");
                builder.Property(e => e.Comment).HasMaxLength(500);
                builder.Property(e => e.CurrentMeterReading).HasPrecision(10);
                builder.Property(e => e.DriverId)
                    .HasColumnType("int(11)")
                    .HasColumnName("DriverID");
                builder.Property(e => e.FuelBy)
                    .HasMaxLength(100)
                    .UseCollation("utf8mb4_general_ci")
                    .HasCharSet("utf8mb4");
                builder.Property(e => e.IsModified)
                    .HasDefaultValueSql("'0'")
                    .HasColumnType("tinyint(4)");
                builder.Property(e => e.ManualFuelrefilAmount).HasPrecision(10);
                builder.Property(e => e.PreviousMeterReading).HasPrecision(10);
                builder.Property(e => e.PumpTranscationId)
                    .HasColumnType("int(11)")
                    .HasColumnName("PumpTranscationID");
                builder.Property(e => e.SiteId)
                    .HasColumnType("int(11)")
                    .HasColumnName("SiteID");
                builder.Property(e => e.VehicleId)
                    .HasColumnType("int(11)")
                    .HasColumnName("vehicleID");

                builder.HasOne(d => d.Driver)
                    .WithMany(p => p.Fuelrefils)
                    .HasForeignKey(d => d.DriverId)
                    .HasConstraintName("FuelRefil_Driver");

                builder.HasOne(d => d.FuelByNavigation)
                    .WithMany(p => p.Fuelrefils)
                    .HasForeignKey(d => d.FuelBy)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FuelRefi_Fuelby");

                builder.HasOne(d => d.PumpTranscation)
                    .WithMany(p => p.Fuelrefils)
                    .HasForeignKey(d => d.PumpTranscationId)
                    .HasConstraintName("FuelRefil_PumpTransaction");

                builder.HasOne(d => d.Site)
                    .WithMany(p => p.Fuelrefils)
                    .HasForeignKey(d => d.SiteId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fuelRefil_Site");

                builder.HasOne(d => d.Tank)
                    .WithMany(p => p.Fuelrefils)
                    .HasForeignKey(d => d.TankId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FuelRefill_tank");

                builder.HasOne(d => d.Vehicle)
                    .WithMany(p => p.Fuelrefils)
                    .HasForeignKey(d => d.VehicleId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fuelRefil_vehicle");
            }


            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring FuelrefilConfiguration: {ex.Message}", ex);
            }
        }
    }
}
