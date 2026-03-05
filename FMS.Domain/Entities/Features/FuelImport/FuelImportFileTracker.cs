/**
 * File: FuelImportFileTracker.cs
 * Purpose: Tracks fuel report files discovered on network shares to avoid re-processing unchanged files.
 *          The DB unique constraint on vehicleconsumption is the real duplicate guard — this is a performance optimization.
 * Dependencies: Site entity
 * Last Modified: 2026-03-03
 *
 * Key Fields:
 * - FilePath + FileLastModifiedUtc: Primary change detection (free OS stat call, no file read needed)
 * - Status: Pending → Processing → Completed/Failed/Skipped
 * - ImportReportId: Links to FuelReportImportHistory for detailed results
 */
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities.Features.FuelImport;

/// <summary>
/// Tracks individual fuel report files for auto-import.
/// Change detection uses (FilePath + FileLastModifiedUtc) — not file content hash.
/// If LastModified hasn't changed, the file is skipped without reading it.
/// </summary>
[Table("fuel_import_file_tracker")]
public class FuelImportFileTracker
{
    public int Id { get; set; }

    /// <summary>
    /// Full path to the file on the network share (e.g., Z:\Truck Report\2025 Fuel Report\APRIL 2025\MERU Fuel Report APRIL 2025.xlsx)
    /// </summary>
    [Required]
    [MaxLength(1000)]
    public string FilePath { get; set; } = null!;

    /// <summary>
    /// Just the filename without path (e.g., MERU Fuel Report APRIL 2025.xlsx)
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string FileName { get; set; } = null!;

    /// <summary>
    /// File size in bytes — used as a quick-change indicator alongside LastModified
    /// </summary>
    public long FileSizeBytes { get; set; }

    /// <summary>
    /// File's last-modified timestamp from the filesystem. Primary change detection field.
    /// If this matches what's in the tracker, the file is skipped without reading.
    /// </summary>
    public DateTime FileLastModifiedUtc { get; set; }

    /// <summary>
    /// Report type detected from folder path: "km/l" or "l/hr"
    /// </summary>
    [Required]
    [MaxLength(10)]
    public string ReportType { get; set; } = null!;

    /// <summary>
    /// Site name extracted from filename (km/l) or null (l/hr has per-row sites)
    /// </summary>
    [MaxLength(200)]
    public string? DetectedSiteName { get; set; }

    /// <summary>
    /// Month name extracted from filename (e.g., "APRIL")
    /// </summary>
    [MaxLength(20)]
    public string? DetectedMonth { get; set; }

    /// <summary>
    /// Year extracted from filename (e.g., 2025)
    /// </summary>
    public int? DetectedYear { get; set; }

    /// <summary>
    /// Resolved site ID from detected site name. Null for l/hr (per-row site resolution).
    /// </summary>
    public int? SiteId { get; set; }

    /// <summary>
    /// Processing status: Pending, Processing, Completed, Failed, Skipped
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Pending";

    /// <summary>
    /// Links to FuelReportImportHistory.ReportId for detailed import results
    /// </summary>
    [MaxLength(100)]
    public string? ImportReportId { get; set; }

    /// <summary>
    /// Total records found in the file
    /// </summary>
    public int TotalRecords { get; set; }

    /// <summary>
    /// Records successfully imported
    /// </summary>
    public int SuccessCount { get; set; }

    /// <summary>
    /// Records that failed validation or DB insert
    /// </summary>
    public int FailedCount { get; set; }

    /// <summary>
    /// Records skipped (duplicates or invalid)
    /// </summary>
    public int SkippedCount { get; set; }

    /// <summary>
    /// Duplicate records detected
    /// </summary>
    public int DuplicateCount { get; set; }

    /// <summary>
    /// Error message if status is Failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// How many times we've retried this file
    /// </summary>
    public int RetryCount { get; set; }

    /// <summary>
    /// Maximum retry attempts before giving up
    /// </summary>
    public int MaxRetries { get; set; } = 3;

    /// <summary>
    /// When this file was first discovered during a scan
    /// </summary>
    public DateTime FirstScannedAtUtc { get; set; }

    /// <summary>
    /// When this file was last processed (success or failure)
    /// </summary>
    public DateTime? LastProcessedAtUtc { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public virtual Site? Site { get; set; }
}
