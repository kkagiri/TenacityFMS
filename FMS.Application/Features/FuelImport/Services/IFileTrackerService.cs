/**
 * File: IFileTrackerService.cs
 * Purpose: Interface for CRUD operations on FuelImportFileTracker entity.
 *          Provides file change detection and status management.
 * Dependencies: FuelImportFileTracker entity, FuelReportFileMetadata DTO
 * Last Modified: 2026-03-03
 *
 * Key Methods:
 * - GetNewOrChangedFiles: Compare filesystem metadata against tracker DB to find unprocessed/modified files
 * - RegisterFile: Create a new tracker record for a discovered file
 * - MarkAsProcessing/Completed/Failed: Status transitions
 * - GetPendingRetries: Find failed files eligible for retry
 */
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Domain.Entities.Features.FuelImport;

namespace FMS.Application.Features.FuelImport.Services;

public interface IFileTrackerService
{
    /// <summary>
    /// Given a list of file metadata from filesystem scan, returns only files that are
    /// new (not tracked) or changed (LastModified differs from tracked version).
    /// </summary>
    Task<List<FuelReportFileMetadata>> GetNewOrChangedFilesAsync(List<FuelReportFileMetadata> scannedFiles);

    /// <summary>
    /// Register a newly discovered file in the tracker with Pending status.
    /// If the file path already exists with a different LastModified, updates the existing record.
    /// </summary>
    Task<FuelImportFileTracker> RegisterOrUpdateFileAsync(FuelReportFileMetadata metadata);

    /// <summary>
    /// Mark a tracked file as being processed (prevents concurrent processing).
    /// </summary>
    Task MarkAsProcessingAsync(int trackerId);

    /// <summary>
    /// Mark a tracked file as successfully completed with import results.
    /// </summary>
    Task MarkAsCompletedAsync(int trackerId, string importReportId,
        int totalRecords, int successCount, int failedCount, int skippedCount, int duplicateCount);

    /// <summary>
    /// Mark a tracked file as failed with error details. Increments retry count.
    /// </summary>
    Task MarkAsFailedAsync(int trackerId, string errorMessage);

    /// <summary>
    /// Mark a tracked file as skipped (e.g., unresolvable site name).
    /// </summary>
    Task MarkAsSkippedAsync(int trackerId, string reason);

    /// <summary>
    /// Get files that failed but haven't exceeded MaxRetries.
    /// </summary>
    Task<List<FuelImportFileTracker>> GetPendingRetriesAsync();

    /// <summary>
    /// Get a tracker record by file path.
    /// </summary>
    Task<FuelImportFileTracker?> GetByFilePathAsync(string filePath);

    /// <summary>
    /// Get a tracker record by its ID.
    /// </summary>
    Task<FuelImportFileTracker?> GetByIdAsync(int id);

    /// <summary>
    /// Get summary statistics for the file tracker.
    /// </summary>
    Task<FileTrackerSummary> GetSummaryAsync();
}

/// <summary>
/// Summary statistics from the file tracker.
/// </summary>
public class FileTrackerSummary
{
    public int TotalTracked { get; set; }
    public int PendingCount { get; set; }
    public int ProcessingCount { get; set; }
    public int CompletedCount { get; set; }
    public int FailedCount { get; set; }
    public int SkippedCount { get; set; }
    public int TotalRecordsImported { get; set; }
    public DateTime? LastScanTime { get; set; }
}
