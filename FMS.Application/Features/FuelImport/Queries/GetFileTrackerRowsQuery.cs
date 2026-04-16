/**
 * File:          GetFileTrackerRowsQuery.cs
 * Purpose:       Query and handler for row-level import data shown in Import Management.
 * Dependencies:  MediatR, GpsdataContext, FileTrackerRowsResultDto
 * Last Modified: 2026-04-15
 *
 * Key Functions:
 * - Handle(): Returns imported rows, replacement-run rows, or whole-date rows for a tracked file
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelImport.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.FuelImport.Queries;

public class GetFileTrackerRowsQuery : IRequest<FMSResponse<FileTrackerRowsResultDto>>
{
    public int FileTrackerId { get; set; }
    public string ViewMode { get; set; } = "imported";
}

public class GetFileTrackerRowsQueryHandler
    : IRequestHandler<GetFileTrackerRowsQuery, FMSResponse<FileTrackerRowsResultDto>>
{
    private const string ImportedViewMode = "imported";
    private const string ReplacedViewMode = "replaced";
    private const string WholeDateViewMode = "whole-date";

    private sealed class ImportLogInfo
    {
        public string ReportId { get; set; } = string.Empty;
        public DateTime ImportDate { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? SiteId { get; set; }
    }

    private readonly GpsdataContext _context;

    public GetFileTrackerRowsQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<FileTrackerRowsResultDto>> Handle(
        GetFileTrackerRowsQuery request,
        CancellationToken cancellationToken)
    {
        var normalizedViewMode = NormalizeViewMode(request.ViewMode);

        var tracker = await _context.FuelImportFileTrackers
            .AsNoTracking()
            .Where(t => t.Id == request.FileTrackerId)
            .Select(t => new
            {
                t.Id,
                t.FileName,
                t.ImportReportId,
                t.SiteId,
                t.LastProcessedAtUtc,
                t.UpdatedAt,
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (tracker == null)
        {
            return FMSResponse<FileTrackerRowsResultDto>.Failed($"File tracker record {request.FileTrackerId} was not found.");
        }

        var result = new FileTrackerRowsResultDto
        {
            FileTrackerId = tracker.Id,
            FileName = tracker.FileName,
            ViewMode = normalizedViewMode,
        };

        if (string.IsNullOrWhiteSpace(tracker.ImportReportId))
        {
            result.Note = "No import report is linked to this tracked file yet, so row-level data is not available.";
            return FMSResponse<FileTrackerRowsResultDto>.Success(result);
        }

        var importLog = await _context.FuelReportImportHistories
            .AsNoTracking()
            .Where(log => log.ReportId == tracker.ImportReportId)
            .Select(log => new ImportLogInfo
            {
                ReportId = log.ReportId,
                ImportDate = log.ImportDate,
                StartDate = log.StartDate,
                EndDate = log.EndDate,
                SiteId = log.SiteId,
            })
            .FirstOrDefaultAsync(cancellationToken);

        var importedRows = await QueryRowsByReportIdAsync(tracker.ImportReportId, cancellationToken);

        switch (normalizedViewMode)
        {
            case ReplacedViewMode:
                {
                    var isReplacementRun = await IsPotentialReplacementRunAsync(
                        tracker.ImportReportId,
                        importedRows,
                        importLog,
                        tracker.SiteId,
                        tracker.LastProcessedAtUtc,
                        tracker.UpdatedAt,
                        cancellationToken);

                    result.IsReplacementRun = isReplacementRun;
                    result.Rows = isReplacementRun ? importedRows : new List<FileTrackerRowDetailDto>();
                    result.TotalCount = result.Rows.Count;
                    result.Note = isReplacementRun
                        ? "Historical deleted rows are not retained by the current schema. This view shows the rows written by the replacement run."
                        : "No replacement-run data could be inferred for this file. Use Imported to view the rows currently linked to this import.";
                    return FMSResponse<FileTrackerRowsResultDto>.Success(result);
                }

            case WholeDateViewMode:
                {
                    result.Rows = await QueryWholeDateRowsAsync(
                        tracker.ImportReportId,
                        importedRows,
                        importLog,
                        tracker.SiteId,
                        cancellationToken);
                    result.TotalCount = result.Rows.Count;
                    if (result.TotalCount == 0)
                    {
                        result.Note = "No persisted rows were found for this file's imported date scope.";
                    }
                    return FMSResponse<FileTrackerRowsResultDto>.Success(result);
                }

            default:
                result.Rows = importedRows;
                result.TotalCount = importedRows.Count;
                if (result.TotalCount == 0)
                {
                    result.Note = "No persisted rows were found for this import report.";
                }
                return FMSResponse<FileTrackerRowsResultDto>.Success(result);
        }
    }

    private static string NormalizeViewMode(string? viewMode)
    {
        if (string.Equals(viewMode, ReplacedViewMode, StringComparison.OrdinalIgnoreCase))
        {
            return ReplacedViewMode;
        }

        if (string.Equals(viewMode, WholeDateViewMode, StringComparison.OrdinalIgnoreCase)
            || string.Equals(viewMode, "wholedate", StringComparison.OrdinalIgnoreCase)
            || string.Equals(viewMode, "whole_date", StringComparison.OrdinalIgnoreCase))
        {
            return WholeDateViewMode;
        }

        return ImportedViewMode;
    }

    private async Task<List<FileTrackerRowDetailDto>> QueryRowsByReportIdAsync(
        string reportId,
        CancellationToken cancellationToken)
    {
        return await _context.Vehicleconsumptions
            .AsNoTracking()
            .Where(record => record.ReportId == reportId)
            .OrderByDescending(record => record.Date)
            .ThenBy(record => record.Vehicle.HyoungNo)
            .ThenBy(record => record.Id)
            .Select(record => new FileTrackerRowDetailDto
            {
                Id = record.Id,
                RecordDate = record.Date,
                VehicleId = record.VehicleId,
                VehicleLabel = !string.IsNullOrWhiteSpace(record.Vehicle.HyoungNo)
                    ? record.Vehicle.HyoungNo
                    : !string.IsNullOrWhiteSpace(record.Vehicle.NumberPlate)
                        ? record.Vehicle.NumberPlate
                        : $"Vehicle #{record.VehicleId}",
                SiteId = record.SiteId,
                SiteLabel = !string.IsNullOrWhiteSpace(record.Site.Name)
                    ? record.Site.Name
                    : $"Site #{record.SiteId}",
                ShiftLabel = record.IsNightShift == 1 ? "Night Shift" : "Day Shift",
                EmployeeName = record.EmployeeName,
                TotalFuel = record.TotalFuel,
                TotalDistance = record.TotalDistance,
                EngineHours = record.EngHours,
                FuelEfficiency = record.FuelEfficiency,
                ReportId = record.ReportId,
                IsCurrentImport = true,
                RowSource = "Imported",
            })
            .ToListAsync(cancellationToken);
    }

    private async Task<List<FileTrackerRowDetailDto>> QueryWholeDateRowsAsync(
        string currentReportId,
        IReadOnlyCollection<FileTrackerRowDetailDto> importedRows,
        ImportLogInfo? importLog,
        int? trackerSiteId,
        CancellationToken cancellationToken)
    {
        var importedDates = importedRows
            .Select(row => row.RecordDate.Date)
            .Distinct()
            .ToHashSet();

        var importedSiteIds = importedRows
            .Select(row => row.SiteId)
            .Distinct()
            .ToHashSet();

        DateTime? minDate = importedDates.Count > 0
            ? importedDates.Min()
            : importLog?.StartDate?.Date;
        DateTime? maxDate = importedDates.Count > 0
            ? importedDates.Max()
            : importLog?.EndDate?.Date;

        if (importedSiteIds.Count == 0 && trackerSiteId.HasValue)
        {
            importedSiteIds.Add(trackerSiteId.Value);
        }

        if (!minDate.HasValue || !maxDate.HasValue)
        {
            return new List<FileTrackerRowDetailDto>();
        }

        var candidateRows = await _context.Vehicleconsumptions
            .AsNoTracking()
            .Where(record => record.Date.Date >= minDate.Value && record.Date.Date <= maxDate.Value)
            .Where(record => importedSiteIds.Count == 0 || importedSiteIds.Contains(record.SiteId))
            .OrderByDescending(record => record.Date)
            .ThenBy(record => record.Vehicle.HyoungNo)
            .ThenBy(record => record.Id)
            .Select(record => new FileTrackerRowDetailDto
            {
                Id = record.Id,
                RecordDate = record.Date,
                VehicleId = record.VehicleId,
                VehicleLabel = !string.IsNullOrWhiteSpace(record.Vehicle.HyoungNo)
                    ? record.Vehicle.HyoungNo
                    : !string.IsNullOrWhiteSpace(record.Vehicle.NumberPlate)
                        ? record.Vehicle.NumberPlate
                        : $"Vehicle #{record.VehicleId}",
                SiteId = record.SiteId,
                SiteLabel = !string.IsNullOrWhiteSpace(record.Site.Name)
                    ? record.Site.Name
                    : $"Site #{record.SiteId}",
                ShiftLabel = record.IsNightShift == 1 ? "Night Shift" : "Day Shift",
                EmployeeName = record.EmployeeName,
                TotalFuel = record.TotalFuel,
                TotalDistance = record.TotalDistance,
                EngineHours = record.EngHours,
                FuelEfficiency = record.FuelEfficiency,
                ReportId = record.ReportId,
                IsCurrentImport = string.Equals(record.ReportId, currentReportId, StringComparison.OrdinalIgnoreCase),
                RowSource = string.Equals(record.ReportId, currentReportId, StringComparison.OrdinalIgnoreCase)
                    ? "Imported"
                    : "Same Date Scope",
            })
            .ToListAsync(cancellationToken);

        if (importedDates.Count == 0)
        {
            return candidateRows;
        }

        return candidateRows
            .Where(row => importedDates.Contains(row.RecordDate.Date))
            .ToList();
    }

    private async Task<bool> IsPotentialReplacementRunAsync(
        string currentReportId,
        IReadOnlyCollection<FileTrackerRowDetailDto> importedRows,
        ImportLogInfo? importLog,
        int? trackerSiteId,
        DateTime? lastProcessedAtUtc,
        DateTime updatedAt,
        CancellationToken cancellationToken)
    {
        DateTime? minDate = importedRows.Count > 0
            ? importedRows.Min(row => row.RecordDate.Date)
            : importLog?.StartDate?.Date;
        DateTime? maxDate = importedRows.Count > 0
            ? importedRows.Max(row => row.RecordDate.Date)
            : importLog?.EndDate?.Date;

        if (!minDate.HasValue || !maxDate.HasValue)
        {
            return false;
        }

        var siteIds = importedRows
            .Select(row => row.SiteId)
            .Distinct()
            .ToList();

        if (siteIds.Count == 0 && trackerSiteId.HasValue)
        {
            siteIds.Add(trackerSiteId.Value);
        }

        var importCompletedAt = importLog?.ImportDate ?? lastProcessedAtUtc ?? updatedAt;

        var priorImportQuery = _context.FuelReportImportHistories
            .AsNoTracking()
            .Where(history => history.ReportId != currentReportId)
            .Where(history => history.ImportDate < importCompletedAt)
            .Where(history => (!history.EndDate.HasValue || history.EndDate.Value.Date >= minDate.Value)
                && (!history.StartDate.HasValue || history.StartDate.Value.Date <= maxDate.Value));

        if (siteIds.Count > 0)
        {
            priorImportQuery = priorImportQuery.Where(history => !history.SiteId.HasValue || siteIds.Contains(history.SiteId.Value));
        }

        return await priorImportQuery.AnyAsync(cancellationToken);
    }
}