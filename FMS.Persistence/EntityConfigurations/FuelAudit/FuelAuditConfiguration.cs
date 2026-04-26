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
                .ValueGeneratedOnAdd();

            builder.Property(a => a.AuditNumber)
                .HasMaxLength(50)
                .IsRequired();

            builder.Property(a => a.StartDate)
                .IsRequired();

            builder.Property(a => a.EndDate)
                .IsRequired();

            builder.Property(a => a.Status)
                .HasMaxLength(20)
                .IsRequired()
                .HasDefaultValue("Draft");

            builder.Property(a => a.Description);

            builder.Property(a => a.SiteId);

            // System Totals (Opening)
            builder.Property(a => a.SystemOpeningStock)
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.TankerOpeningStock)
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.GPSFleetOpeningStock)
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.PickupFleetOpeningStock)
                .HasColumnType("decimal(15,2)");

            // Movements
            builder.Property(a => a.ExternalFuelIn)
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.ExternalFuelOut)
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.TotalDispensed)
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.GPSFleetConsumption)
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.PickupFleetConsumption)
                .HasColumnType("decimal(15,2)");

            // System Totals (Closing)
            builder.Property(a => a.SystemClosingStock)
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.TankerClosingStock)
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.GPSFleetClosingStock)
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.PickupFleetClosingStock)
                .HasColumnType("decimal(15,2)");

            // Expected vs Actual
            builder.Property(a => a.ExpectedClosingStock)
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.SystemVariance)
                .HasColumnType("decimal(15,2)");

            builder.Property(a => a.SystemVariancePercent)
                .HasColumnType("decimal(5,2)");

            // Data Quality
            builder.Property(a => a.VehiclesWithExactData);

            builder.Property(a => a.VehiclesWithEstimatedData);

            builder.Property(a => a.VehiclesWithNoData);

            builder.Property(a => a.DataConfidence)
                .HasMaxLength(20);

            // Counts
            builder.Property(a => a.TankerCount);

            builder.Property(a => a.GPSVehicleCount);

            builder.Property(a => a.PickupVehicleCount);

            builder.Property(a => a.FlagCount);

            builder.Property(a => a.UnresolvedFlagCount);

            // Workflow
            builder.Property(a => a.WizardStep)
                .HasDefaultValue(1);

            builder.Property(a => a.CalculatedAt);

            builder.Property(a => a.CalculatedBy);

            builder.Property(a => a.FinalizedAt);

            builder.Property(a => a.FinalizedBy);

            builder.Property(a => a.FinalizationNotes);

            // Audit Trail
            builder.Property(a => a.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(a => a.CreatedBy);

            builder.Property(a => a.UpdatedAt);

            builder.Property(a => a.UpdatedBy);

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

