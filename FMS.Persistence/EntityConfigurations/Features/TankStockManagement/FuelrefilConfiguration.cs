using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    public class FuelrefilConfiguration : EntityTypeConfiguration<FuelRefill>
    {
        public override void Configure(EntityTypeBuilder<FuelRefill> builder)
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
                    .ValueGeneratedOnAdd();
                builder.Property(e => e.TankId);
                builder.Property(e => e.Comment).HasMaxLength(500);
                builder.Property(e => e.ModifiedBy).HasMaxLength(100);
                builder.Property(e => e.TagId).
                HasMaxLength(50)
                    .HasMaxLength(50);
                builder.Property(e => e.CurrentMeterReading).HasPrecision(10, 2);
                builder.Property(e => e.DriverId);
                builder.Property(e => e.FuelBy)
                    .HasMaxLength(100);
                builder.Property(e => e.IsModified)
                    .HasDefaultValueSql("'0'");
                builder.Property(e => e.ManualFuelrefillAmount).HasPrecision(10);
                builder.Property(e => e.PreviousMeterReading).HasPrecision(10, 2);
                builder.Property(e => e.PumpTranscationId);
                builder.Property(e => e.SiteId);
                builder.Property(e => e.VehicleId);

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
                builder.HasOne(d => d.TagNavigation)
                    .WithMany(p => p.Fuelrefils)
                    .HasForeignKey(d => d.TagId)
                    .HasPrincipalKey(p => p.Name)
                    .HasConstraintName("FuelRefil_Tag");

            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring FuelrefilConfiguration: {ex.Message}", ex);
            }
        }
    }
}

