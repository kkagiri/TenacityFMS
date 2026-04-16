/**
 * File:          FileTrackerRowsResultDto.cs
 * Purpose:       DTOs for row-level import data shown from Import Management.
 * Dependencies:  None
 * Last Modified: 2026-04-15
 *
 * Key Classes:
 * - FileTrackerRowsResultDto: Result payload for a file row-detail request
 * - FileTrackerRowDetailDto:  Individual persisted row details for popup display
 */
using System;
using System.Collections.Generic;

namespace FMS.Application.Features.FuelImport.DTOs;

public class FileTrackerRowsResultDto
{
    public int FileTrackerId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ViewMode { get; set; } = "imported";
    public bool IsReplacementRun { get; set; }
    public string? Note { get; set; }
    public int TotalCount { get; set; }
    public List<FileTrackerRowDetailDto> Rows { get; set; } = new();
}

public class FileTrackerRowDetailDto
{
    public int Id { get; set; }
    public DateTime RecordDate { get; set; }
    public int VehicleId { get; set; }
    public string VehicleLabel { get; set; } = string.Empty;
    public int SiteId { get; set; }
    public string SiteLabel { get; set; } = string.Empty;
    public string ShiftLabel { get; set; } = string.Empty;
    public string? EmployeeName { get; set; }
    public decimal? TotalFuel { get; set; }
    public decimal? TotalDistance { get; set; }
    public decimal? EngineHours { get; set; }
    public decimal? FuelEfficiency { get; set; }
    public string? ReportId { get; set; }
    public bool IsCurrentImport { get; set; }
    public string RowSource { get; set; } = "Imported";
}