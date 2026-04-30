using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the Vehicleconsumption entity
    /// </summary>
    public class VehicleconsumptionConfiguration : EntityTypeConfiguration<Vehicleconsumption>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<Vehicleconsumption> builder)
        {
            try
            {
                builder.HasKey(e => e.Id);

                builder.ToTable("vehicleconsumption");

                builder.HasIndex(e => new { e.VehicleId, e.Date, e.IsNightShift }, "vehicle_date_shift_unique").IsUnique();
                builder.HasIndex(e => e.SiteId, "vehicleconsumption_site_idx");
                builder.HasIndex(e => e.ModifiedBy, "vehicleconsumption_user_idx");
                builder.HasIndex(e => e.ReportId, "vehilceconsumption_fuelreport_idx");

                builder.Property(e => e.Id);

                builder.Property(e => e.AvgSpeed).HasPrecision(10, 2);
                builder.Property(e => e.Comments).HasMaxLength(100);
                builder.Property(e => e.EmployeeName).HasMaxLength(100);
                builder.Property(e => e.EngHours).HasPrecision(10, 2);
                builder.Property(e => e.ExcessWorkingHrsCost).HasPrecision(10, 2);
                builder.Property(e => e.ExpectedConsumption).HasPrecision(10, 2);
                builder.Property(e => e.FlowMeterEffiency).HasPrecision(10, 2);
                builder.Property(e => e.FlowMeterEngineHrs).HasPrecision(10, 2);
                builder.Property(e => e.FlowMeterFuelLost).HasPrecision(10, 2);
                builder.Property(e => e.FlowMeterFuelUsed).HasPrecision(10, 2);
                builder.Property(e => e.FuelEfficiency).HasPrecision(10, 2);
                builder.Property(e => e.FuelLost).HasPrecision(10, 2);
                builder.Property(e => e.IsKmperLiter)
                    .HasDefaultValue(0UL);
                builder.Property(e => e.IsModified);
                builder.Property(e => e.IsNightShift)
                    .HasDefaultValue(0UL);
                builder.Property(e => e.MaxSpeed).HasPrecision(10, 2);
                builder.Property(e => e.ModifiedBy);
                builder.Property(e => e.ReportId).HasMaxLength(100);
                builder.Property(e => e.SiteId);
                builder.Property(e => e.TotalDistance).HasPrecision(10, 2);
                builder.Property(e => e.TotalFuel).HasPrecision(10, 2);
                builder.Property(e => e.VehicleId);

                // Relationships

                builder.HasOne(d => d.Site).WithMany(p => p.Vehicleconsumptions)
                    .HasForeignKey(d => d.SiteId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("vehicleconsumption_site");

                builder.HasOne(d => d.Vehicle).WithMany(p => p.Vehicleconsumptions)
                    .HasForeignKey(d => d.VehicleId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("vehicleconsumption_vehicle");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring VehicleconsumptionConfiguration: {ex.Message}", ex);
            }
        }
    }
}
