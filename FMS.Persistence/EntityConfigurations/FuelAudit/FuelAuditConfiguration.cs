using FMS.Domain.Entities.FuelAudit;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations.FuelAudit
{
    /// <summary>
    /// Entity configuration for FuelAudit (master audit record)
    /// </summary>
    public class FuelAuditConfiguration : IEntityTypeConfiguration<Domain.Entities.FuelAudit.FuelAudit>
    {
        public void Configure(EntityTypeBuilder<Domain.Entities.FuelAudit.FuelAudit> builder)
        {
            // Match actual database table name: fuelaudits (no underscore)
            builder.ToTable("fuelaudits");

            builder.HasKey(a => a.Id);

            builder.Property(a => a.Id)
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            builder.Property(a => a.AuditNumber)
                .HasColumnName("AuditNumber")
                .HasMaxLength(50)
                .IsRequired();

            builder.Property(a => a.StartDate)
                .HasColumnName("startdate")
                .HasColumnType("date")
                .IsRequired();

            builder.Property(a => a.EndDate)
                .HasColumnName("enddate")
                .HasColumnType("date")
                .IsRequired();

            builder.Property(a => a.Status)
                .HasColumnName("status")
                .HasMaxLength(20)
                .IsRequired()
                .HasDefaultValue("Draft");

            builder.Property(a => a.Description)
                .HasColumnName("description")
                .HasColumnType("text");

            builder.Property(a => a.SiteId)
                .HasColumnName("siteid");

            // System Totals (Opening)
            builder.Property(a => a.SystemOpeningStock)
                .HasColumnName("systemopening_stock")
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.TankerOpeningStock)
                .HasColumnName("tankeropening_stock")
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.GPSFleetOpeningStock)
                .HasColumnName("gpsfleet_opening_stock")
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.PickupFleetOpeningStock)
                .HasColumnName("pickupfleetopening_stock")
                .HasColumnType("decimal(15,2)");

            // Movements
            builder.Property(a => a.ExternalFuelIn)
                .HasColumnName("externalfuel_in")
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.ExternalFuelOut)
                .HasColumnName("externalfuelout")
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.TotalDispensed)
                .HasColumnName("totaldispensed")
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.GPSFleetConsumption)
                .HasColumnName("gpsfleetconsumption")
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.PickupFleetConsumption)
                .HasColumnName("pickupfleetconsumption")
                .HasColumnType("decimal(15,2)");

            // System Totals (Closing)
            builder.Property(a => a.SystemClosingStock)
                .HasColumnName("systemclosingstock")
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.TankerClosingStock)
                .HasColumnName("tankerclosingstock")
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.GPSFleetClosingStock)
                .HasColumnName("gpsfleetclosingstock")
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.PickupFleetClosingStock)
                .HasColumnName("pickupfleetclosingstock")
                .HasColumnType("decimal(15,2)");

            // Expected vs Actual
            builder.Property(a => a.ExpectedClosingStock)
                .HasColumnName("expectedclosingstock")
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.SystemVariance)
                .HasColumnName("systemvariance")
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.SystemVariancePercent)
                .HasColumnName("systemvariancepercent")
                .HasColumnType("decimal(5,2)");

            // Data Quality
            builder.Property(a => a.VehiclesWithExactData)
                .HasColumnName("vehicleswithexact_data");

            builder.Property(a => a.VehiclesWithEstimatedData)
                .HasColumnName("vehicleswithestimated_data");

            builder.Property(a => a.VehiclesWithNoData)
                .HasColumnName("vehicleswithnodata");

            builder.Property(a => a.DataConfidence)
                .HasColumnName("dataconfidence")
                .HasMaxLength(20);

            // Counts
            builder.Property(a => a.TankerCount)
                .HasColumnName("tankercount");

            builder.Property(a => a.GPSVehicleCount)
                .HasColumnName("gpsvehiclecount");

            builder.Property(a => a.PickupVehicleCount)
                .HasColumnName("pickupvehiclecount");

            builder.Property(a => a.FlagCount)
                .HasColumnName("flagcount");

            builder.Property(a => a.UnresolvedFlagCount)
                .HasColumnName("unresolvedflagcount");

            // Workflow
            builder.Property(a => a.WizardStep)
                .HasColumnName("wizardstep")
                .HasDefaultValue(1);

            builder.Property(a => a.CalculatedAt)
                .HasColumnName("calculatedat")
                .HasColumnType("datetime");

            builder.Property(a => a.CalculatedBy)
                .HasColumnName("calculatedby");

            builder.Property(a => a.FinalizedAt)
                .HasColumnName("finalizedat")
                .HasColumnType("datetime");

            builder.Property(a => a.FinalizedBy)
                .HasColumnName("finalizedby");

            builder.Property(a => a.FinalizationNotes)
                .HasColumnName("finalizationnotes")
                .HasColumnType("text");

            // Audit Trail
            builder.Property(a => a.CreatedAt)
                .HasColumnName("createdat")
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(a => a.CreatedBy)
                .HasColumnName("createdby");

            builder.Property(a => a.UpdatedAt)
                .HasColumnName("updatedat")
                .HasColumnType("datetime");

            builder.Property(a => a.UpdatedBy)
                .HasColumnName("updatedby");

            // Indexes
            builder.HasIndex(a => a.AuditNumber).IsUnique();
            builder.HasIndex(a => a.Status);
            builder.HasIndex(a => new { a.StartDate, a.EndDate });

            // Relationships
            builder.HasMany(a => a.TankerReadings)
                .WithOne(t => t.Audit)
                .HasForeignKey(t => t.AuditId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(a => a.VehiclePositions)
                .WithOne(v => v.Audit)
                .HasForeignKey(v => v.AuditId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(a => a.Variances)
                .WithOne(v => v.Audit)
                .HasForeignKey(v => v.AuditId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(a => a.Flags)
                .WithOne(f => f.Audit)
                .HasForeignKey(f => f.AuditId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(a => a.GPSReadings)
                .WithOne()
                .HasForeignKey(g => g.AuditId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
