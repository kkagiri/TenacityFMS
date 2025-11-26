using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using FMS.Domain.Entities;
using DomainDailyTankReconciliation = FMS.Domain.Entities.Dailytankreconciliation;

namespace FMS.Application.Features.TankManagement.DailyTankReconciliation.Queries;

//Cursor - Handler for generating daily reconciliation reports with analytics
public class GetDailyReconciliationReportQueryHandler : IRequestHandler<GetDailyReconciliationReportQuery, FMSResponse<DailyReconciliationReport>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetDailyReconciliationReportQueryHandler> _logger;

    public GetDailyReconciliationReportQueryHandler(
        GpsdataContext context,
        ILogger<GetDailyReconciliationReportQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<DailyReconciliationReport>> Handle(
        GetDailyReconciliationReportQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Generating daily reconciliation report for period {StartDate} to {EndDate}",
                request.StartDate, request.EndDate);

            // Validate request
            var validationErrors = ValidateRequest(request);
            if (validationErrors.Any())
            {
                return FMSResponse<DailyReconciliationReport>.ValidationFailed(validationErrors);
            }

            var report = new DailyReconciliationReport
            {
                ReportStartDate = request.StartDate,
                ReportEndDate = request.EndDate
            };

            // Build base query
            var query = _context.Dailytankreconciliations
                .Include(dtr => dtr.Tank)
                .ThenInclude(t => t.Site)
                .Where(dtr => dtr.ReconciliationDate.Date >= request.StartDate.Date &&
                    dtr.ReconciliationDate.Date <= request.EndDate.Date);

            // Apply filters
            if (request.SiteId.HasValue)
                query = query.Where(dtr => dtr.Tank.SiteId == request.SiteId.Value);

            if (request.TankId.HasValue)
                query = query.Where(dtr => dtr.TankId == request.TankId.Value);

            // Get total count for pagination
            var totalRecords = await query.CountAsync(cancellationToken);

            // Calculate summary statistics
            report.Summary = await CalculateSummaryStatistics(query, cancellationToken);

            // Apply discrepancy filter if requested
            if (request.IncludeDiscrepanciesOnly)
            {
                query = query.Where(dtr => HasDiscrepancy(dtr));
            }

            // Apply pagination and get data
            var items = await query
                .OrderByDescending(dtr => dtr.ReconciliationDate)
                .ThenBy(dtr => dtr.Tank.Site.Name)
                .ThenBy(dtr => dtr.Tank.Name)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(dtr => new DailyReconciliationReportItem
                {
                    Id = dtr.Id,
                    TankId = dtr.TankId,
                    TankName = dtr.Tank.Name ?? $"Tank {dtr.TankId}",
                    SiteName = dtr.Tank.Site.Name ?? "Unknown Site",
                    ReconciliationDate = dtr.ReconciliationDate,
                    OpeningLevel = dtr.OpeningLevel ?? 0,
                    ClosingLevel = dtr.ClosingLevel ?? 0,
                    TotalRefills = dtr.TotalRefills ?? 0,
                    TotalDeliveries = dtr.TotalDeliveries ?? 0,
                    TotalTransfersIn = dtr.TotalTransfersIn ?? 0,
                    TotalTransfersOut = dtr.TotalTransfersOut ?? 0,
                    CreatedOn = dtr.CreatedOn
                })
                .ToListAsync(cancellationToken);

            // Calculate derived fields
            foreach (var item in items)
            {
                item.CalculatedClosing = item.OpeningLevel + item.TotalDeliveries + item.TotalTransfersIn -
                    item.TotalRefills - item.TotalTransfersOut;
                item.Variance = Math.Abs(item.ClosingLevel - item.CalculatedClosing);
                item.VariancePercentage = item.OpeningLevel > 0 ? (item.Variance / item.OpeningLevel) * 100 : 0;
                item.HasDiscrepancy = item.Variance > 1.0m; // 1 liter threshold
                item.Status = item.HasDiscrepancy ? "Discrepancy Detected" : "Reconciled";
            }

            report.Items = items;

            // Generate discrepancy alerts
            report.DiscrepancyAlerts = await GenerateDiscrepancyAlerts(request, cancellationToken);

            // Set pagination info
            report.Pagination = new PaginationInfo
            {
                CurrentPage = request.PageNumber,
                PageSize = request.PageSize,
                TotalRecords = totalRecords,
                TotalPages = (int)Math.Ceiling((double)totalRecords / request.PageSize),
                HasNextPage = request.PageNumber * request.PageSize < totalRecords,
                HasPreviousPage = request.PageNumber > 1
            };

            _logger.LogInformation("Generated daily reconciliation report with {RecordCount} records", items.Count);

            return FMSResponse<DailyReconciliationReport>.Success(report,
                $"Successfully generated report with {items.Count} records");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating daily reconciliation report");
            return FMSResponse<DailyReconciliationReport>.SystemError("Failed to generate reconciliation report");
        }
    }

    //Cursor - Calculate comprehensive summary statistics
    private async Task<DailyReconciliationSummary> CalculateSummaryStatistics(
        IQueryable<DomainDailyTankReconciliation> query,
        CancellationToken cancellationToken)
    {
        var records = await query.ToListAsync(cancellationToken);

        if (!records.Any())
        {
            return new DailyReconciliationSummary();
        }

        var recordsWithVariance = records.Select(r => new
        {
            Record = r,
            CalculatedClosing = (r.OpeningLevel ?? 0) + (r.TotalDeliveries ?? 0) + (r.TotalTransfersIn ?? 0) -
                (r.TotalRefills ?? 0) - (r.TotalTransfersOut ?? 0),
            ActualClosing = r.ClosingLevel ?? 0
        }).Select(x => new
        {
            x.Record,
            Variance = Math.Abs(x.ActualClosing - x.CalculatedClosing),
            HasDiscrepancy = Math.Abs(x.ActualClosing - x.CalculatedClosing) > 1.0m
        }).ToList();

        var discrepancyRecords = recordsWithVariance.Where(r => r.HasDiscrepancy).ToList();
        var totalVariance = recordsWithVariance.Sum(r => r.Variance);

        // Find most problematic tank
        var tankVariances = recordsWithVariance
            .GroupBy(r => r.Record.TankId)
            .Select(g => new
            {
                TankId = g.Key,
                TotalVariance = g.Sum(r => r.Variance),
                TankName = g.First().Record.Tank?.Name ?? $"Tank {g.Key}"
            })
            .OrderByDescending(t => t.TotalVariance)
            .FirstOrDefault();

        return new DailyReconciliationSummary
        {
            TotalRecords = records.Count,
            TotalTanks = records.Select(r => r.TankId).Distinct().Count(),
            TotalSites = records.Select(r => r.Tank.SiteId).Distinct().Count(),
            RecordsWithDiscrepancies = discrepancyRecords.Count,
            TotalVarianceAmount = totalVariance,
            AverageVariance = records.Count > 0 ? totalVariance / records.Count : 0,
            MaxVariance = recordsWithVariance.Any() ? recordsWithVariance.Max(r => r.Variance) : 0,
            MostProblematicTank = tankVariances?.TankName ?? "None",
            DiscrepancyRate = records.Count > 0 ? (decimal)discrepancyRecords.Count / records.Count * 100 : 0
        };
    }

    //Cursor - Generate discrepancy alerts for dashboard notifications
    private async Task<List<DiscrepancyAlert>> GenerateDiscrepancyAlerts(
        GetDailyReconciliationReportQuery request,
        CancellationToken cancellationToken)
    {
        var alertQuery = _context.Dailytankreconciliations
            .Include(dtr => dtr.Tank)
            .ThenInclude(t => t.Site)
            .Where(dtr => dtr.ReconciliationDate.Date >= request.StartDate.Date &&
                dtr.ReconciliationDate.Date <= request.EndDate.Date);

        if (request.SiteId.HasValue)
            alertQuery = alertQuery.Where(dtr => dtr.Tank.SiteId == request.SiteId.Value);

        if (request.TankId.HasValue)
            alertQuery = alertQuery.Where(dtr => dtr.TankId == request.TankId.Value);

        var records = await alertQuery.ToListAsync(cancellationToken);

        var alerts = new List<DiscrepancyAlert>();

        foreach (var record in records)
        {
            var calculatedClosing = (record.OpeningLevel ?? 0) + (record.TotalDeliveries ?? 0) + (record.TotalTransfersIn ?? 0) -
                (record.TotalRefills ?? 0) - (record.TotalTransfersOut ?? 0);
            var variance = Math.Abs((record.ClosingLevel ?? 0) - calculatedClosing);

            if (variance > 1.0m) // Only create alerts for discrepancies
            {
                var severity = variance switch
                {
                    >= 100 => "Critical",
                    >= 50 => "High",
                    >= 10 => "Medium",
                    _ => "Low"
                };

                alerts.Add(new DiscrepancyAlert
                {
                    TankId = record.TankId,
                    TankName = record.Tank?.Name ?? $"Tank {record.TankId}",
                    SiteName = record.Tank?.Site?.Name ?? "Unknown Site",
                    Date = record.ReconciliationDate,
                    Variance = variance,
                    Severity = severity,
                    Message = $"Tank reconciliation variance of {variance:F2}L detected on {record.ReconciliationDate:yyyy-MM-dd}"
                });
            }
        }

        return alerts.OrderByDescending(a => a.Variance).Take(10).ToList(); // Top 10 alerts
    }

    //Cursor - Helper method to determine if a record has discrepancy
    private bool HasDiscrepancy(DomainDailyTankReconciliation record)
    {
        var calculatedClosing = (record.OpeningLevel ?? 0) + (record.TotalDeliveries ?? 0) + (record.TotalTransfersIn ?? 0) -
            (record.TotalRefills ?? 0) - (record.TotalTransfersOut ?? 0);
        var variance = Math.Abs((record.ClosingLevel ?? 0) - calculatedClosing);
        return variance > 1.0m;
    }

    //Cursor - Validate the query request
    private List<string> ValidateRequest(GetDailyReconciliationReportQuery request)
    {
        var errors = new List<string>();

        if (request.StartDate > DateTime.Now.Date)
        {
            errors.Add("Start date cannot be in the future");
        }

        if (request.EndDate < request.StartDate)
        {
            errors.Add("End date cannot be before start date");
        }

        if ((request.EndDate - request.StartDate).TotalDays > 365)
        {
            errors.Add("Date range cannot exceed 365 days");
        }

        if (request.PageNumber < 1)
        {
            errors.Add("Page number must be greater than 0");
        }

        if (request.PageSize < 1 || request.PageSize > 1000)
        {
            errors.Add("Page size must be between 1 and 1000");
        }

        return errors;
    }
}