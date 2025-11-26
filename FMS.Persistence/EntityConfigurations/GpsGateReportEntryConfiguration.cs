using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    public class GpsGateReportEntryConfiguration : IEntityTypeConfiguration<GpsGateReportEntry>
    {
        public void Configure(EntityTypeBuilder<GpsGateReportEntry> builder)
        {
            builder.ToTable("gpsgate_report_entries");

            builder.HasKey(e => e.Id);

            builder.Property(e => e.Id)
                .HasColumnName("Id");

            builder.Property(e => e.ReportId)
                .HasColumnName("ReportId")
                .IsRequired();

            builder.Property(e => e.VehicleId)
                .HasColumnName("VehicleId")
                .IsRequired();

            builder.Property(e => e.DispenseDate)
                .HasColumnName("DispenseDate")
                .HasColumnType("datetime")
                .IsRequired();

            builder.Property(e => e.StartTime)
                .HasColumnName("StartTime")
                .HasColumnType("time");

            builder.Property(e => e.Duration)
                .HasColumnName("Duration")
                .HasColumnType("time");

            builder.Property(e => e.FuelBefore)
                .HasColumnName("FuelBefore")
                .HasColumnType("decimal(10,2)");

            builder.Property(e => e.FuelAfter)
                .HasColumnName("FuelAfter")
                .HasColumnType("decimal(10,2)");

            builder.Property(e => e.RefillVolume)
                .HasColumnName("RefillVolume")
                .HasColumnType("decimal(10,2)")
                .IsRequired();

            // Modification tracking
            builder.Property(e => e.OriginalVolume)
                .HasColumnName("OriginalVolume")
                .HasColumnType("decimal(10,2)");

            builder.Property(e => e.ModifiedVolume)
                .HasColumnName("ModifiedVolume")
                .HasColumnType("decimal(10,2)");

            builder.Property(e => e.ModificationReason)
                .HasColumnName("ModificationReason")
                .HasColumnType("text");

            builder.Property(e => e.ModifiedBy)
                .HasColumnName("ModifiedBy")
                .HasMaxLength(100);

            builder.Property(e => e.ModifiedAt)
                .HasColumnName("ModifiedAt")
                .HasColumnType("datetime");

            // Soft delete
            builder.Property(e => e.IsDeleted)
                .HasColumnName("IsDeleted")
                .HasColumnType("tinyint(1)")
                .HasDefaultValue(false)
                .IsRequired();

            builder.Property(e => e.DeletedBy)
                .HasColumnName("DeletedBy")
                .HasMaxLength(100);

            builder.Property(e => e.DeletedAt)
                .HasColumnName("DeletedAt")
                .HasColumnType("datetime");

            builder.Property(e => e.DeletionReason)
                .HasColumnName("DeletionReason")
                .HasColumnType("text");

            builder.Property(e => e.CreatedAt)
                .HasColumnName("CreatedAt")
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .IsRequired();

            // Relationships
            builder.HasOne(e => e.Report)
                .WithMany()
                .HasForeignKey(e => e.ReportId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(e => e.Vehicle)
                .WithMany()
                .HasForeignKey(e => e.VehicleId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(e => e.ModifiedByNavigation)
                .WithMany()
                .HasForeignKey(e => e.ModifiedBy)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(e => e.DeletedByNavigation)
                .WithMany()
                .HasForeignKey(e => e.DeletedBy)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes for performance
            builder.HasIndex(e => new { e.VehicleId, e.DispenseDate })
                .HasDatabaseName("idx_vehicle_date");

            builder.HasIndex(e => e.ReportId)
                .HasDatabaseName("idx_report");

            builder.HasIndex(e => e.IsDeleted)
                .HasDatabaseName("idx_deleted");

            builder.HasIndex(e => e.DispenseDate)
                .HasDatabaseName("idx_dispense_date");

            // Ignore computed properties
            builder.Ignore(e => e.EffectiveVolume);
            builder.Ignore(e => e.IsModified);
        }
    }
}
