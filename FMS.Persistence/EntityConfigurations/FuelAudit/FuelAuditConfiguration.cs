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
            builder.ToTable("fuel_audits");

            builder.HasKey(a => a.Id);

            builder.Property(a => a.Id)
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            builder.Property(a => a.AuditNumber)
                .HasColumnName("audit_number")
                .HasMaxLength(50)
                .IsRequired();

            builder.Property(a => a.StartDate)
                .HasColumnName("start_date")
                .HasColumnType("date")
                .IsRequired();

            builder.Property(a => a.EndDate)
                .HasColumnName("end_date")
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
                .HasColumnName("site_id");

            // System Totals (Opening)
            builder.Property(a => a.SystemOpeningStock)
                .HasColumnName("system_opening_stock")
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.TankerOpeningStock)
                .HasColumnName("tanker_opening_stock")
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.GPSFleetOpeningStock)
                .HasColumnName("gps_fleet_opening_stock")
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.PickupFleetOpeningStock)
                .HasColumnName("pickup_fleet_opening_stock")
                .HasColumnType("decimal(15,2)");

            // Movements
            builder.Property(a => a.ExternalFuelIn)
                .HasColumnName("external_fuel_in")
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.ExternalFuelOut)
                .HasColumnName("external_fuel_out")
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.TotalDispensed)
                .HasColumnName("total_dispensed")
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.GPSFleetConsumption)
                .HasColumnName("gps_fleet_consumption")
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.PickupFleetConsumption)
                .HasColumnName("pickup_fleet_consumption")
                .HasColumnType("decimal(15,2)");

            // System Totals (Closing)
            builder.Property(a => a.SystemClosingStock)
                .HasColumnName("system_closing_stock")
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.TankerClosingStock)
                .HasColumnName("tanker_closing_stock")
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.GPSFleetClosingStock)
                .HasColumnName("gps_fleet_closing_stock")
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.PickupFleetClosingStock)
                .HasColumnName("pickup_fleet_closing_stock")
                .HasColumnType("decimal(15,2)");

            // Expected vs Actual
            builder.Property(a => a.ExpectedClosingStock)
                .HasColumnName("expected_closing_stock")
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.SystemVariance)
                .HasColumnName("system_variance")
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.SystemVariancePercent)
                .HasColumnName("system_variance_percent")
                .HasColumnType("decimal(5,2)");

            // Data Quality
            builder.Property(a => a.VehiclesWithExactData)
                .HasColumnName("vehicles_with_exact_data");

            builder.Property(a => a.VehiclesWithEstimatedData)
                .HasColumnName("vehicles_with_estimated_data");

            builder.Property(a => a.VehiclesWithNoData)
                .HasColumnName("vehicles_with_no_data");

            builder.Property(a => a.DataConfidence)
                .HasColumnName("data_confidence")
                .HasMaxLength(20);

            // Counts
            builder.Property(a => a.TankerCount)
                .HasColumnName("tanker_count");

            builder.Property(a => a.GPSVehicleCount)
                .HasColumnName("gps_vehicle_count");

            builder.Property(a => a.PickupVehicleCount)
                .HasColumnName("pickup_vehicle_count");

            builder.Property(a => a.FlagCount)
                .HasColumnName("flag_count");

            builder.Property(a => a.UnresolvedFlagCount)
                .HasColumnName("unresolved_flag_count");

            // Workflow
            builder.Property(a => a.CalculatedAt)
                .HasColumnName("calculated_at")
                .HasColumnType("datetime");

            builder.Property(a => a.CalculatedBy)
                .HasColumnName("calculated_by");

            builder.Property(a => a.FinalizedAt)
                .HasColumnName("finalized_at")
                .HasColumnType("datetime");

            builder.Property(a => a.FinalizedBy)
                .HasColumnName("finalized_by");

            builder.Property(a => a.FinalizationNotes)
                .HasColumnName("finalization_notes")
                .HasColumnType("text");

            // Audit Trail
            builder.Property(a => a.CreatedAt)
                .HasColumnName("created_at")
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(a => a.CreatedBy)
                .HasColumnName("created_by");

            builder.Property(a => a.UpdatedAt)
                .HasColumnName("updated_at")
                .HasColumnType("datetime");

            builder.Property(a => a.UpdatedBy)
                .HasColumnName("updated_by");

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
