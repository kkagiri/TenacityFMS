/**
 * File: FuelImportFileTrackerConfiguration.cs
 * Purpose: EF Core configuration for FuelImportFileTracker entity → fuel_import_file_tracker table
 * Dependencies: FuelImportFileTracker, Site
 * Last Modified: 2026-03-03
 */
using FMS.Domain.Entities.Features.FuelImport;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations;

/// <summary>
/// Configuration for FuelImportFileTracker entity.
/// Maps to fuel_import_file_tracker table in MySQL.
/// </summary>
public class FuelImportFileTrackerConfiguration : EntityTypeConfiguration<FuelImportFileTracker>
{
    public override void Configure(EntityTypeBuilder<FuelImportFileTracker> builder)
    {
        try
        {
            builder.HasKey(e => e.Id).HasName("PRIMARY");
            builder.ToTable("fuel_import_file_tracker");

            builder.Property(e => e.Id)
                .HasColumnType("int(11)")
                .HasColumnName("Id");

            builder.Property(e => e.FilePath)
                .IsRequired()
                .HasMaxLength(1000)
                .HasColumnName("FilePath");

            builder.Property(e => e.FileName)
                .IsRequired()
                .HasMaxLength(500)
                .HasColumnName("FileName");

            builder.Property(e => e.FileSizeBytes)
                .IsRequired()
                .HasColumnType("bigint")
                .HasColumnName("FileSizeBytes");

            builder.Property(e => e.FileLastModifiedUtc)
                .IsRequired()
                .HasColumnType("datetime")
                .HasColumnName("FileLastModifiedUtc");

            builder.Property(e => e.ReportType)
                .IsRequired()
                .HasMaxLength(10)
                .HasColumnName("ReportType");

            builder.Property(e => e.DetectedSiteName)
                .HasMaxLength(200)
                .HasColumnName("DetectedSiteName");

            builder.Property(e => e.DetectedMonth)
                .HasMaxLength(20)
                .HasColumnName("DetectedMonth");

            builder.Property(e => e.DetectedYear)
                .HasColumnType("int(11)")
                .HasColumnName("DetectedYear");

            builder.Property(e => e.SiteId)
                .HasColumnType("int(11)")
                .HasColumnName("SiteId");

            builder.Property(e => e.Status)
                .IsRequired()
                .HasMaxLength(20)
                .HasColumnName("Status")
                .HasDefaultValue("Pending");

            builder.Property(e => e.ImportReportId)
                .HasMaxLength(100)
                .HasColumnName("ImportReportId");

            builder.Property(e => e.TotalRecords)
                .HasColumnType("int(11)")
                .HasColumnName("TotalRecords")
                .HasDefaultValue(0);

            builder.Property(e => e.SuccessCount)
                .HasColumnType("int(11)")
                .HasColumnName("SuccessCount")
                .HasDefaultValue(0);

            builder.Property(e => e.FailedCount)
                .HasColumnType("int(11)")
                .HasColumnName("FailedCount")
                .HasDefaultValue(0);

            builder.Property(e => e.SkippedCount)
                .HasColumnType("int(11)")
                .HasColumnName("SkippedCount")
                .HasDefaultValue(0);

            builder.Property(e => e.DuplicateCount)
                .HasColumnType("int(11)")
                .HasColumnName("DuplicateCount")
                .HasDefaultValue(0);

            builder.Property(e => e.ErrorMessage)
                .HasColumnType("text")
                .HasColumnName("ErrorMessage");

            builder.Property(e => e.RetryCount)
                .HasColumnType("int(11)")
                .HasColumnName("RetryCount")
                .HasDefaultValue(0);

            builder.Property(e => e.MaxRetries)
                .HasColumnType("int(11)")
                .HasColumnName("MaxRetries")
                .HasDefaultValue(3);

            builder.Property(e => e.FirstScannedAtUtc)
                .IsRequired()
                .HasColumnType("datetime")
                .HasColumnName("FirstScannedAtUtc");

            builder.Property(e => e.LastProcessedAtUtc)
                .HasColumnType("datetime")
                .HasColumnName("LastProcessedAtUtc");

            builder.Property(e => e.CreatedAt)
                .IsRequired()
                .HasColumnType("datetime")
                .HasColumnName("CreatedAt")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(e => e.UpdatedAt)
                .IsRequired()
                .HasColumnType("datetime")
                .HasColumnName("UpdatedAt")
                .HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

            // Indexes
            builder.HasIndex(e => e.Status, "idx_file_tracker_status");
            builder.HasIndex(e => new { e.FilePath, e.FileLastModifiedUtc }, "IX_FuelImportFileTracker_FilePath_LastModified")
                .IsUnique();

            // Relationships
            builder.HasOne(d => d.Site)
                .WithMany()
                .HasForeignKey(d => d.SiteId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_file_tracker_site");
        }
        catch (Exception ex)
        {
            throw new Exception($"Error configuring FuelImportFileTrackerConfiguration: {ex.Message}", ex);
        }
    }
}
