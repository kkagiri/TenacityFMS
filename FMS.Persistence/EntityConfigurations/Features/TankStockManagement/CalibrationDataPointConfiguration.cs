/**
 * File: CalibrationDataPointConfiguration.cs
 * Purpose: Entity Framework configuration for learned-calibration data points.
 * Dependencies: CalibrationDataPoint, Entity Framework Core
 * Last Modified: 2026-03-24
 */
using FMS.Domain.Entities.Features.TankStockManagement;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the CalibrationDataPoint entity.
    /// </summary>
    public class CalibrationDataPointConfiguration : EntityTypeConfiguration<CalibrationDataPoint>
    {
        public override void Configure(EntityTypeBuilder<CalibrationDataPoint> builder)
        {
            builder.HasKey(e => e.Id).HasName("PRIMARY");

            builder.ToTable("calibrationdatapoints");

            builder.Property(e => e.Id)
                .ValueGeneratedOnAdd();

            builder.Property(e => e.TankId)
                .IsRequired();

            builder.Property(e => e.HeightBefore)
                .HasColumnType("decimal(12,3)")
                .IsRequired();

            builder.Property(e => e.HeightAfter)
                .HasColumnType("decimal(12,3)")
                .IsRequired();

            builder.Property(e => e.VolumeChange)
                .HasColumnType("decimal(18,3)")
                .IsRequired();

            builder.Property(e => e.HeightInterval)
                .IsRequired();

            builder.Property(e => e.VolumePerMm)
                .HasColumnType("decimal(18,6)")
                .IsRequired();

            builder.Property(e => e.SourceType)
                .HasMaxLength(32)
                .IsRequired();

            builder.Property(e => e.SourceEventId)
                .IsRequired();

            builder.Property(e => e.RecordedAtUtc)
                .IsRequired();

            builder.Property(e => e.IsProcessed)
                .IsRequired();

            builder.HasIndex(e => new { e.TankId, e.SourceType, e.SourceEventId })
                .IsUnique()
                .HasDatabaseName("UX_calibrationdatapoints_tank_source_event");

            builder.HasIndex(e => new { e.TankId, e.HeightInterval, e.RecordedAtUtc })
                .HasDatabaseName("IX_calibrationdatapoints_tank_interval_recorded");

            builder.HasIndex(e => new { e.TankId, e.IsProcessed, e.RecordedAtUtc })
                .HasDatabaseName("IX_calibrationdatapoints_tank_processed_recorded");
        }
    }
}
