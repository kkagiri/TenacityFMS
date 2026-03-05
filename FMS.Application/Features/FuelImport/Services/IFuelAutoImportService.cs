/**
 * File: IFuelAutoImportService.cs
 * Purpose: Interface for the auto-import orchestrator that ties together
 *          file scanning, tracking, parsing, and import dispatch.
 * Dependencies: IExcelParsingService, IFileTrackerService, ImportFuelReportCommand
 * Last Modified: 2026-03-03
 *
 * Key Methods:
 * - ScanAndImportAsync: Full pipeline — scan directories → detect changes → parse → import → track results
 * - ImportSingleFileAsync: Process one specific file (for testing/retries)
 */
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FMS.Application.Features.FuelImport.Services;

/// <summary>
/// Result of a full auto-import scan cycle.
/// </summary>
public class AutoImportResult
{
    public int FilesScanned { get; set; }
    public int FilesNew { get; set; }
    public int FilesChanged { get; set; }
    public int FilesSkippedUnchanged { get; set; }
    public int FilesProcessed { get; set; }
    public int FilesSucceeded { get; set; }
    public int FilesFailed { get; set; }
    public int FilesSkippedNoSite { get; set; }
    public int TotalRecordsImported { get; set; }
    public int TotalDuplicatesSkipped { get; set; }
    public List<string> Errors { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
    public TimeSpan Duration { get; set; }
}

/// <summary>
/// Options for controlling an auto-import run.
/// </summary>
public class AutoImportOptions
{
    /// <summary>
    /// Root directories to scan (defaults to configured paths if empty).
    /// </summary>
    public List<string> ScanPaths { get; set; } = new();

    /// <summary>
    /// Filter to specific report type: "km/l", "l/hr", or null for both.
    /// </summary>
    public string? ReportTypeFilter { get; set; }

    /// <summary>
    /// Maximum files to process in a single run (0 = unlimited).
    /// </summary>
    public int BatchSize { get; set; } = 50;

    /// <summary>
    /// Whether to include failed files eligible for retry.
    /// </summary>
    public bool IncludeRetries { get; set; } = true;

    /// <summary>
    /// User ID to attribute the imports to.
    /// </summary>
    public string UserId { get; set; } = "SYSTEM_AUTO_IMPORT";

    /// <summary>
    /// Whether to force re-processing of all files regardless of tracker state.
    /// </summary>
    public bool ForceReprocess { get; set; } = false;
}

/// <summary>
/// Orchestrates the auto-import pipeline: scan → track → parse → import → update tracker.
/// </summary>
public interface IFuelAutoImportService
{
    /// <summary>
    /// Run the full scan-and-import pipeline for configured directories.
    /// </summary>
    Task<AutoImportResult> ScanAndImportAsync(AutoImportOptions? options = null);

    /// <summary>
    /// Import a single file by path. Useful for testing or manual retries.
    /// </summary>
    Task<AutoImportResult> ImportSingleFileAsync(string filePath, string userId = "SYSTEM_AUTO_IMPORT");
}
