/**
 * File: CalibrationIntervalAccumulationConfiguration.cs
 * Purpose: Entity Framework configuration for learned-calibration interval accumulations.
 * Dependencies: CalibrationIntervalAccumulation, Entity Framework Core
 * Last Modified: 2026-03-24
 */
using FMS.Domain.Entities.Features.TankStockManagement;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the CalibrationIntervalAccumulation entity.
    /// </summary>
    public class CalibrationIntervalAccumulationConfiguration : EntityTypeConfiguration<CalibrationIntervalAccumulation>
    {
        public override void Configure(EntityTypeBuilder<CalibrationIntervalAccumulation> builder)
        {
            builder.HasKey(e => e.Id).HasName("PRIMARY");

            builder.ToTable("calibrationintervalaccumulations");

            builder.Property(e => e.Id)
                .ValueGeneratedOnAdd();

            builder.Property(e => e.TankId)
                .IsRequired();

            builder.Property(e => e.IntervalStartMm)
                .IsRequired();

            builder.Property(e => e.IntervalEndMm)
                .IsRequired();

            builder.Property(e => e.ObservationCount)
                .IsRequired();

            builder.Property(e => e.MeanVolumePerMm)
                .HasColumnType("decimal(18,6)")
                .IsRequired();

            builder.Property(e => e.StdDevVolumePerMm)
                .HasColumnType("decimal(18,6)")
                .IsRequired();

            builder.Property(e => e.LastUpdatedUtc)
                .IsRequired();

            builder.Property(e => e.SeededFromSnapshotId)
                .IsRequired(false);

            builder.HasIndex(e => new { e.TankId, e.IntervalStartMm, e.IntervalEndMm })
                .IsUnique()
                .HasDatabaseName("UX_calibrationintervalaccumulations_tank_interval");

            builder.HasIndex(e => new { e.TankId, e.LastUpdatedUtc })
                .HasDatabaseName("IX_calibrationintervalaccumulations_tank_updated");
        }
    }
}
