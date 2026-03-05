/**
 * File: AutoImportFuelReportsCommand.cs
 * Purpose: MediatR command to trigger on-demand fuel report auto-import.
 *          Wraps IFuelAutoImportService for API endpoint access.
 * Dependencies: IFuelAutoImportService, AutoImportOptions, AutoImportResult
 * Last Modified: 2026-03-03
 *
 * Key Fields:
 * - ScanPaths: Optional override for directories to scan
 * - ReportTypeFilter: Optional "km/l" or "l/hr" filter
 * - BatchSize: Max files to process (default 50)
 * - ForceReprocess: Ignore tracker state and re-process all
 */
using System.Collections.Generic;
using FMS.Application.Common;
using FMS.Application.Features.FuelImport.Services;
using MediatR;

namespace FMS.Application.Features.FuelImport.Commands;

public class AutoImportFuelReportsCommand : IRequest<FMSResponse<AutoImportResult>>
{
    /// <summary>
    /// Optional override for directories to scan. Empty = use configured defaults.
    /// </summary>
    public List<string> ScanPaths { get; set; } = new();

    /// <summary>
    /// Filter to specific report type: "km/l", "l/hr", or null for both.
    /// </summary>
    public string? ReportTypeFilter { get; set; }

    /// <summary>
    /// Maximum files to process in this run (default 50, 0 = unlimited).
    /// </summary>
    public int BatchSize { get; set; } = 50;

    /// <summary>
    /// Include failed files eligible for retry.
    /// </summary>
    public bool IncludeRetries { get; set; } = true;

    /// <summary>
    /// Force re-processing of all files regardless of tracker state.
    /// </summary>
    public bool ForceReprocess { get; set; } = false;

    /// <summary>
    /// Import a specific single file (bypasses scan).
    /// </summary>
    public string? SingleFilePath { get; set; }

    /// <summary>
    /// User ID triggering the import (set from JWT in controller).
    /// </summary>
    public string UserId { get; set; } = "SYSTEM_AUTO_IMPORT";
}
