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

            builder.Property(e => e.Id);

            builder.Property(e => e.ReportId)
                .IsRequired();

            builder.Property(e => e.VehicleId)
                .IsRequired();

            builder.Property(e => e.DispenseDate)
                .IsRequired();

            builder.Property(e => e.StartTime);

            builder.Property(e => e.Duration);

            builder.Property(e => e.FuelBefore)
                .HasColumnType("decimal(10,2)");

            builder.Property(e => e.FuelAfter)
                .HasColumnType("decimal(10,2)");

            builder.Property(e => e.RefillVolume)
                .HasColumnType("decimal(10,2)")
                .IsRequired();

            // Modification tracking
            builder.Property(e => e.OriginalVolume)
                .HasColumnType("decimal(10,2)");

            builder.Property(e => e.ModifiedVolume)
                .HasColumnType("decimal(10,2)");

            builder.Property(e => e.ModificationReason);

            builder.Property(e => e.ModifiedBy)
                .HasMaxLength(100);

            builder.Property(e => e.ModifiedAt);

            // Soft delete
            builder.Property(e => e.IsDeleted)
                .HasDefaultValue(false)
                .IsRequired();

            builder.Property(e => e.DeletedBy)
                .HasMaxLength(100);

            builder.Property(e => e.DeletedAt);

            builder.Property(e => e.DeletionReason);

            builder.Property(e => e.CreatedAt)
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

