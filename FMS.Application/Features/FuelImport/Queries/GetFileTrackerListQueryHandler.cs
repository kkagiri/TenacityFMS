/**
 * File: GetFileTrackerListQueryHandler.cs
 * Purpose: Handles the GetFileTrackerListQuery — returns paginated, filtered file tracker records.
 * Dependencies: GpsdataContext, FileTrackerListDto, MediatR
 * Last Modified: 2026-04-01
 *
 * Key Functions:
 * - Handle: Builds query with filters, applies pagination, returns FileTrackerListResult
 */
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelImport.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.FuelImport.Queries;

public class GetFileTrackerListQueryHandler
    : IRequestHandler<GetFileTrackerListQuery, FMSResponse<FileTrackerListResult>>
{
    private readonly GpsdataContext _context;

    public GetFileTrackerListQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<FileTrackerListResult>> Handle(
        GetFileTrackerListQuery request, CancellationToken cancellationToken)
    {
        var query = _context.FuelImportFileTrackers.AsNoTracking().AsQueryable();

        // ── Filters ──
        if (!string.IsNullOrWhiteSpace(request.Status))
            query = query.Where(t => t.Status == request.Status);

        if (!string.IsNullOrWhiteSpace(request.ReportType))
            query = query.Where(t => t.ReportType == request.ReportType);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(t =>
                t.FileName.Contains(search) ||
                (t.DetectedSiteName != null && t.DetectedSiteName.Contains(search)));
        }

        if (request.DateFrom.HasValue)
            query = query.Where(t => t.UpdatedAt >= request.DateFrom.Value);

        if (request.DateTo.HasValue)
        {
            // Include the entire day for DateTo
            var dateTo = request.DateTo.Value.Date.AddDays(1);
            query = query.Where(t => t.UpdatedAt < dateTo);
        }

        // ── Summary stats (across all records, ignoring status filter) ──
        var allQuery = _context.FuelImportFileTrackers.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(request.ReportType))
            allQuery = allQuery.Where(t => t.ReportType == request.ReportType);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            allQuery = allQuery.Where(t =>
                t.FileName.Contains(search) ||
                (t.DetectedSiteName != null && t.DetectedSiteName.Contains(search)));
        }

        if (request.DateFrom.HasValue)
            allQuery = allQuery.Where(t => t.UpdatedAt >= request.DateFrom.Value);

        if (request.DateTo.HasValue)
        {
            var dateTo = request.DateTo.Value.Date.AddDays(1);
            allQuery = allQuery.Where(t => t.UpdatedAt < dateTo);
        }

        var stats = await allQuery
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Pending = g.Count(t => t.Status == "Pending"),
                Processing = g.Count(t => t.Status == "Processing"),
                Completed = g.Count(t => t.Status == "Completed"),
                Failed = g.Count(t => t.Status == "Failed"),
                Skipped = g.Count(t => t.Status == "Skipped"),
            })
            .FirstOrDefaultAsync(cancellationToken);

        // ── Sorting ──
        var sortDesc = string.Equals(request.SortDirection, "desc", StringComparison.OrdinalIgnoreCase);
        query = request.SortBy?.ToLower() switch
        {
            "filename" => sortDesc ? query.OrderByDescending(t => t.FileName) : query.OrderBy(t => t.FileName),
            "status" => sortDesc ? query.OrderByDescending(t => t.Status) : query.OrderBy(t => t.Status),
            "createdat" => sortDesc ? query.OrderByDescending(t => t.CreatedAt) : query.OrderBy(t => t.CreatedAt),
            "reporttype" => sortDesc ? query.OrderByDescending(t => t.ReportType) : query.OrderBy(t => t.ReportType),
            _ => sortDesc ? query.OrderByDescending(t => t.UpdatedAt) : query.OrderBy(t => t.UpdatedAt),
        };

        // ── Pagination ──
        var totalCount = await query.CountAsync(cancellationToken);
        var page = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 200);
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new FileTrackerListDto
            {
                Id = t.Id,
                FilePath = t.FilePath,
                FileName = t.FileName,
                FileSizeBytes = t.FileSizeBytes,
                FileLastModifiedUtc = t.FileLastModifiedUtc,
                ReportType = t.ReportType,
                DetectedSiteName = t.DetectedSiteName,
                DetectedMonth = t.DetectedMonth,
                DetectedYear = t.DetectedYear,
                SiteId = t.SiteId,
                Status = t.Status,
                ImportReportId = t.ImportReportId,
                TotalRecords = t.TotalRecords,
                SuccessCount = t.SuccessCount,
                FailedCount = t.FailedCount,
                SkippedCount = t.SkippedCount,
                DuplicateCount = t.DuplicateCount,
                ErrorMessage = t.ErrorMessage,
                RetryCount = t.RetryCount,
                MaxRetries = t.MaxRetries,
                FirstScannedAtUtc = t.FirstScannedAtUtc,
                LastProcessedAtUtc = t.LastProcessedAtUtc,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
            })
            .ToListAsync(cancellationToken);

        var importReportIds = items
            .Where(item => !string.IsNullOrWhiteSpace(item.ImportReportId))
            .Select(item => item.ImportReportId!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (importReportIds.Count > 0)
        {
            var latestPersistedRows = await _context.Vehicleconsumptions
                .AsNoTracking()
                .Where(record => record.ReportId != null && importReportIds.Contains(record.ReportId))
                .OrderByDescending(record => record.Date)
                .ThenByDescending(record => record.Id)
                .Select(record => new
                {
                    ReportId = record.ReportId!,
                    RecordDate = record.Date,
                    record.VehicleId,
                    VehicleHyoungNo = record.Vehicle.HyoungNo,
                    VehicleNumberPlate = record.Vehicle.NumberPlate,
                    record.SiteId,
                    SiteName = record.Site.Name,
                    record.IsNightShift,
                    record.EmployeeName,
                    record.TotalFuel,
                    record.TotalDistance,
                    EngineHours = record.EngHours,
                    record.FuelEfficiency,
                })
                .ToListAsync(cancellationToken);

            var latestPersistedLookup = latestPersistedRows
                .GroupBy(row => row.ReportId, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(group => group.Key, group => group.First(), StringComparer.OrdinalIgnoreCase);

            foreach (var item in items)
            {
                if (string.IsNullOrWhiteSpace(item.ImportReportId)
                    || !latestPersistedLookup.TryGetValue(item.ImportReportId, out var latestRow))
                {
                    continue;
                }

                item.LatestPersistedRecord = new FileTrackerLatestRecordDto
                {
                    RecordDate = latestRow.RecordDate,
                    VehicleId = latestRow.VehicleId,
                    VehicleLabel = !string.IsNullOrWhiteSpace(latestRow.VehicleHyoungNo)
                        ? latestRow.VehicleHyoungNo
                        : !string.IsNullOrWhiteSpace(latestRow.VehicleNumberPlate)
                            ? latestRow.VehicleNumberPlate
                            : $"Vehicle #{latestRow.VehicleId}",
                    SiteId = latestRow.SiteId,
                    SiteLabel = !string.IsNullOrWhiteSpace(latestRow.SiteName)
                        ? latestRow.SiteName
                        : $"Site #{latestRow.SiteId}",
                    ShiftLabel = latestRow.IsNightShift == 1 ? "Night Shift" : "Day Shift",
                    EmployeeName = latestRow.EmployeeName,
                    TotalFuel = latestRow.TotalFuel,
                    TotalDistance = latestRow.TotalDistance,
                    EngineHours = latestRow.EngineHours,
                    FuelEfficiency = latestRow.FuelEfficiency,
                };
            }
        }

        var result = new FileTrackerListResult
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = totalPages,
            PendingCount = stats?.Pending ?? 0,
            ProcessingCount = stats?.Processing ?? 0,
            CompletedCount = stats?.Completed ?? 0,
            FailedCount = stats?.Failed ?? 0,
            SkippedCount = stats?.Skipped ?? 0,
        };

        return FMSResponse<FileTrackerListResult>.Success(result);
    }
}
