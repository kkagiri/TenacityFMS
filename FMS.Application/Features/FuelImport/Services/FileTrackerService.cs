/**
 * File: FileTrackerService.cs
 * Purpose: Manages FuelImportFileTracker records — change detection, status transitions, and retry logic.
 *          Uses (FilePath + FileLastModifiedUtc) for change detection, NOT file content hashing.
 * Dependencies: GpsdataContext, FuelImportFileTracker entity
 * Last Modified: 2026-03-03
 *
 * Key Functions:
 * - GetNewOrChangedFilesAsync: Compares scanned files against tracker DB
 * - RegisterOrUpdateFileAsync: Upserts tracker records
 * - MarkAsProcessing/Completed/Failed: Status transitions with timestamp updates
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Domain.Entities.Features.FuelImport;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelImport.Services;

public class FileTrackerService : IFileTrackerService
{
    private readonly GpsdataContext _context;
    private readonly ILogger<FileTrackerService> _logger;

    public FileTrackerService(GpsdataContext context, ILogger<FileTrackerService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<FuelReportFileMetadata>> GetNewOrChangedFilesAsync(List<FuelReportFileMetadata> scannedFiles)
    {
        if (!scannedFiles.Any())
            return new List<FuelReportFileMetadata>();

        // Load all tracked file paths with their LastModified timestamps
        var trackedFiles = await _context.FuelImportFileTrackers
            .Where(t => t.Status != "Processing") // Don't re-process files currently being processed
            .Select(t => new { t.FilePath, t.FileLastModifiedUtc, t.Status })
            .ToListAsync();

        var trackedLookup = trackedFiles.ToDictionary(
            t => t.FilePath,
            t => new { t.FileLastModifiedUtc, t.Status },
            StringComparer.OrdinalIgnoreCase);

        var newOrChanged = new List<FuelReportFileMetadata>();

        foreach (var file in scannedFiles)
        {
            if (!trackedLookup.TryGetValue(file.FilePath, out var tracked))
            {
                // New file — never seen before
                newOrChanged.Add(file);
            }
            else if (Math.Abs((file.FileLastModifiedUtc - tracked.FileLastModifiedUtc).TotalSeconds) > 1)
            {
                // File has been modified since last tracked (1-second tolerance for filesystem granularity)
                newOrChanged.Add(file);
            }
            // else: unchanged — skip without reading file
        }

        _logger.LogInformation(
            "File scan: {Total} files scanned, {New} new/changed, {Unchanged} unchanged",
            scannedFiles.Count, newOrChanged.Count, scannedFiles.Count - newOrChanged.Count);

        return newOrChanged;
    }

    public async Task<FuelImportFileTracker> RegisterOrUpdateFileAsync(FuelReportFileMetadata metadata)
    {
        var existing = await _context.FuelImportFileTrackers
            .FirstOrDefaultAsync(t => t.FilePath == metadata.FilePath);

        if (existing != null)
        {
            // Update existing tracker for re-processing
            existing.FileSizeBytes = metadata.FileSizeBytes;
            existing.FileLastModifiedUtc = metadata.FileLastModifiedUtc;
            existing.ReportType = metadata.ReportType;
            existing.DetectedSiteName = metadata.DetectedSiteName;
            existing.DetectedMonth = metadata.DetectedMonth;
            existing.DetectedYear = metadata.DetectedYear;
            existing.Status = "Pending";
            existing.ErrorMessage = null;
            existing.UpdatedAt = DateTime.UtcNow;

            _context.FuelImportFileTrackers.Update(existing);
            await _context.SaveChangesAsync();
            return existing;
        }

        var tracker = new FuelImportFileTracker
        {
            FilePath = metadata.FilePath,
            FileName = metadata.FileName,
            FileSizeBytes = metadata.FileSizeBytes,
            FileLastModifiedUtc = metadata.FileLastModifiedUtc,
            ReportType = metadata.ReportType,
            DetectedSiteName = metadata.DetectedSiteName,
            DetectedMonth = metadata.DetectedMonth,
            DetectedYear = metadata.DetectedYear,
            Status = "Pending",
            FirstScannedAtUtc = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.FuelImportFileTrackers.Add(tracker);
        await _context.SaveChangesAsync();
        return tracker;
    }

    public async Task MarkAsProcessingAsync(int trackerId)
    {
        var tracker = await _context.FuelImportFileTrackers.FindAsync(trackerId);
        if (tracker == null) return;

        tracker.Status = "Processing";
        tracker.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task MarkAsCompletedAsync(int trackerId, string importReportId,
        int totalRecords, int successCount, int failedCount, int skippedCount, int duplicateCount)
    {
        var tracker = await _context.FuelImportFileTrackers.FindAsync(trackerId);
        if (tracker == null) return;

        tracker.Status = "Completed";
        tracker.ImportReportId = importReportId;
        tracker.TotalRecords = totalRecords;
        tracker.SuccessCount = successCount;
        tracker.FailedCount = failedCount;
        tracker.SkippedCount = skippedCount;
        tracker.DuplicateCount = duplicateCount;
        tracker.LastProcessedAtUtc = DateTime.UtcNow;
        tracker.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task MarkAsFailedAsync(int trackerId, string errorMessage)
    {
        var tracker = await _context.FuelImportFileTrackers.FindAsync(trackerId);
        if (tracker == null) return;

        tracker.Status = "Failed";
        tracker.ErrorMessage = errorMessage;
        tracker.RetryCount++;
        tracker.LastProcessedAtUtc = DateTime.UtcNow;
        tracker.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task MarkAsSkippedAsync(int trackerId, string reason)
    {
        var tracker = await _context.FuelImportFileTrackers.FindAsync(trackerId);
        if (tracker == null) return;

        tracker.Status = "Skipped";
        tracker.ErrorMessage = reason;
        tracker.LastProcessedAtUtc = DateTime.UtcNow;
        tracker.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task<List<FuelImportFileTracker>> GetPendingRetriesAsync()
    {
        return await _context.FuelImportFileTrackers
            .Where(t => t.Status == "Failed" && t.RetryCount < t.MaxRetries)
            .OrderBy(t => t.RetryCount)
            .ThenBy(t => t.LastProcessedAtUtc)
            .ToListAsync();
    }

    public async Task<FuelImportFileTracker?> GetByFilePathAsync(string filePath)
    {
        return await _context.FuelImportFileTrackers
            .FirstOrDefaultAsync(t => t.FilePath == filePath);
    }

    public async Task<FuelImportFileTracker?> GetByIdAsync(int id)
    {
        return await _context.FuelImportFileTrackers.FindAsync(id);
    }

    public async Task<FileTrackerSummary> GetSummaryAsync()
    {
        var trackers = await _context.FuelImportFileTrackers
            .GroupBy(_ => 1)
            .Select(g => new FileTrackerSummary
            {
                TotalTracked = g.Count(),
                PendingCount = g.Count(t => t.Status == "Pending"),
                ProcessingCount = g.Count(t => t.Status == "Processing"),
                CompletedCount = g.Count(t => t.Status == "Completed"),
                FailedCount = g.Count(t => t.Status == "Failed"),
                SkippedCount = g.Count(t => t.Status == "Skipped"),
                TotalRecordsImported = g.Sum(t => t.SuccessCount),
                LastScanTime = g.Max(t => t.UpdatedAt)
            })
            .FirstOrDefaultAsync();

        return trackers ?? new FileTrackerSummary();
    }
}
