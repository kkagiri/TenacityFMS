/**
 * File: GetFileTrackerListQuery.cs
 * Purpose: MediatR query to return a filtered, paginated list of FuelImportFileTracker records.
 * Dependencies: MediatR, FMSResponse, FileTrackerListDto
 * Last Modified: 2026-03-03
 *
 * Key Fields:
 * - Status: Filter by tracker status (Pending, Completed, Failed, Skipped)
 * - ReportType: Filter by report type (km/l, l/hr)
 * - Search: Search by filename
 * - Page/PageSize: Pagination controls
 */
using System.Collections.Generic;
using FMS.Application.Common;
using FMS.Application.Features.FuelImport.DTOs;
using MediatR;

namespace FMS.Application.Features.FuelImport.Queries;

public class GetFileTrackerListQuery : IRequest<FMSResponse<FileTrackerListResult>>
{
    /// <summary>Filter by status: Pending, Processing, Completed, Failed, Skipped</summary>
    public string? Status { get; set; }

    /// <summary>Filter by report type: km/l, l/hr</summary>
    public string? ReportType { get; set; }

    /// <summary>Search by filename (partial match)</summary>
    public string? Search { get; set; }

    /// <summary>Page number (1-based)</summary>
    public int Page { get; set; } = 1;

    /// <summary>Page size (default 50)</summary>
    public int PageSize { get; set; } = 50;

    /// <summary>Sort field: FileName, Status, UpdatedAt, CreatedAt (default: UpdatedAt)</summary>
    public string SortBy { get; set; } = "UpdatedAt";

    /// <summary>Sort direction: asc, desc (default: desc)</summary>
    public string SortDirection { get; set; } = "desc";
}

/// <summary>
/// Paginated result with summary stats.
/// </summary>
public class FileTrackerListResult
{
    public List<FileTrackerListDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }

    // Summary stats (same as FileTrackerSummary but included inline)
    public int PendingCount { get; set; }
    public int ProcessingCount { get; set; }
    public int CompletedCount { get; set; }
    public int FailedCount { get; set; }
    public int SkippedCount { get; set; }
}
