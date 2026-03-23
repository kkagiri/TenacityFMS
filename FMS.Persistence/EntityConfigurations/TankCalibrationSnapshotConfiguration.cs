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
            builder.HasKey(e => e.Id).HasName("PRIMARY");

            builder.ToTable("tankcalibrationsnapshots");

            builder.Property(e => e.Id)
                .HasColumnName("Id")
                .HasColumnType("bigint")
                .ValueGeneratedOnAdd();

            builder.Property(e => e.TankId)
                .HasColumnName("TankId")
                .HasColumnType("int(11)")
                .IsRequired();

            builder.Property(e => e.TankName)
                .HasColumnName("TankName")
                .HasMaxLength(255)
                .IsRequired();

            builder.Property(e => e.PtsDeviceId)
                .HasColumnName("PtsDeviceId")
                .HasMaxLength(100)
                .IsRequired();

            builder.Property(e => e.ProbeNumber)
                .HasColumnName("ProbeNumber")
                .HasColumnType("int(11)")
                .IsRequired();

            builder.Property(e => e.ChartType)
                .HasColumnName("ChartType")
                .HasMaxLength(32)
                .IsRequired();

            builder.Property(e => e.Source)
                .HasColumnName("Source")
                .HasMaxLength(64)
                .IsRequired();

            builder.Property(e => e.TotalRecords)
                .HasColumnName("TotalRecords")
                .HasColumnType("int(11)")
                .IsRequired();

            builder.Property(e => e.RecordedAtUtc)
                .HasColumnName("RecordedAtUtc")
                .HasColumnType("datetime")
                .IsRequired();

            builder.Property(e => e.RecordedBy)
                .HasColumnName("RecordedBy")
                .HasMaxLength(255);

            builder.Property(e => e.Notes)
                .HasColumnName("Notes")
                .HasMaxLength(500);

            builder.Property(e => e.RecordsJson)
                .HasColumnName("RecordsJson")
                .HasColumnType("longtext")
                .IsRequired();

            // Composite index for efficient lookups by tank + chart type + date
            builder.HasIndex(e => new { e.TankId, e.ChartType, e.RecordedAtUtc })
                .HasDatabaseName("IX_tankcalibrationsnapshots_tank_chart_recorded");
        }
    }
}
