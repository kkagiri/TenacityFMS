/**
 * File: FileTrackerListDto.cs
 * Purpose: DTO for listing/displaying FuelImportFileTracker records in the management UI.
 * Dependencies: None
 * Last Modified: 2026-03-03
 *
 * Key Classes:
 * - FileTrackerListDto: Individual tracked file record
 */
using System;

namespace FMS.Application.Features.FuelImport.DTOs;

public class FileTrackerListDto
{
    public int Id { get; set; }
    public string FilePath { get; set; } = null!;
    public string FileName { get; set; } = null!;
    public long FileSizeBytes { get; set; }
    public DateTime FileLastModifiedUtc { get; set; }
    public string ReportType { get; set; } = null!;
    public string? DetectedSiteName { get; set; }
    public string? DetectedMonth { get; set; }
    public int? DetectedYear { get; set; }
    public int? SiteId { get; set; }
    public string Status { get; set; } = null!;
    public string? ImportReportId { get; set; }
    public int TotalRecords { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public int SkippedCount { get; set; }
    public int DuplicateCount { get; set; }
    public string? ErrorMessage { get; set; }
    public int RetryCount { get; set; }
    public int MaxRetries { get; set; }
    public DateTime FirstScannedAtUtc { get; set; }
    public DateTime? LastProcessedAtUtc { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Whether this file can be retried (Failed + RetryCount &lt; MaxRetries)
    /// </summary>
    public bool CanRetry => Status == "Failed" && RetryCount < MaxRetries;

    /// <summary>
    /// Human-readable file size (e.g., "1.2 MB")
    /// </summary>
    public string FileSizeDisplay
    {
        get
        {
            if (FileSizeBytes < 1024) return $"{FileSizeBytes} B";
            if (FileSizeBytes < 1024 * 1024) return $"{FileSizeBytes / 1024.0:F1} KB";
            return $"{FileSizeBytes / (1024.0 * 1024):F1} MB";
        }
    }
}
