using FMS.Domain.Entities.Features.TankStockManagement;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the TankCalibrationSnapshot entity
    /// </summary>
    public class TankCalibrationSnapshotConfiguration : EntityTypeConfiguration<TankCalibrationSnapshot>
    {
        public override void Configure(EntityTypeBuilder<TankCalibrationSnapshot> builder)
        {
            builder.HasKey(e => e.Id);

            builder.ToTable("tankcalibrationsnapshots");

            builder.Property(e => e.Id)
                .ValueGeneratedOnAdd();

            builder.Property(e => e.TankId)
                .IsRequired();

            builder.Property(e => e.TankName)
                .HasMaxLength(255)
                .IsRequired();

            builder.Property(e => e.PtsDeviceId)
                .HasMaxLength(100)
                .IsRequired();

            builder.Property(e => e.ProbeNumber)
                .IsRequired();

            builder.Property(e => e.ChartType)
                .HasMaxLength(32)
                .IsRequired();

            builder.Property(e => e.Source)
                .HasMaxLength(64)
                .IsRequired();

            builder.Property(e => e.TotalRecords)
                .IsRequired();

            builder.Property(e => e.RecordedAtUtc)
                .IsRequired();

            builder.Property(e => e.RecordedBy)
                .HasMaxLength(255);

            builder.Property(e => e.Notes)
                .HasMaxLength(500);

            builder.Property(e => e.RecordsJson)
                .IsRequired();

            // Composite index for efficient lookups by tank + chart type + date
            builder.HasIndex(e => new { e.TankId, e.ChartType, e.RecordedAtUtc })
                .HasDatabaseName("IX_tankcalibrationsnapshots_tank_chart_recorded");
        }
    }
}

