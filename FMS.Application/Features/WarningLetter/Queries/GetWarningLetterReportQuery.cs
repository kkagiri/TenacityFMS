/**
 * File:          GetWarningLetterReportQuery.cs
 * Purpose:       CQRS query returning warning letter analytics report data with server-side aggregations.
 * Dependencies:  MediatR, GpsdataContext, FMSResponse, WarningLetterReportDataDto
 * Last Modified: 2026-06-15
 *
 * Key Functions:
 * - Handle(): Fetches filtered warning letters and computes analytics
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.WarningLetter.DTOs;
using FMS.Application.Services.Configuration;
using FMS.Domain.Entities.Features.WarningLetterManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.WarningLetter.Queries;

public class GetWarningLetterReportQuery : IRequest<FMSResponse<WarningLetterReportDataDto>>
{
    public int? SiteId { get; set; }
    public List<int>? VehicleIds { get; set; }
    public int? VehicleTypeId { get; set; }
    public List<int>? EmployeeIds { get; set; }
    public WarningLetterType? LetterType { get; set; }
    public WarningLetterWorkflowStage? WorkflowStage { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class GetWarningLetterReportQueryHandler : IRequestHandler<GetWarningLetterReportQuery, FMSResponse<WarningLetterReportDataDto>>
{
    private readonly GpsdataContext _context;
    private readonly ISystemConfigurationService _systemConfigurationService;

    public GetWarningLetterReportQueryHandler(GpsdataContext context, ISystemConfigurationService systemConfigurationService)
    {
        _context = context;
        _systemConfigurationService = systemConfigurationService;
    }

    public async Task<FMSResponse<WarningLetterReportDataDto>> Handle(GetWarningLetterReportQuery request, CancellationToken cancellationToken)
    {
        // Enforce the system-in-place date: analytics ignore letters issued prior to the effective start date.
        var effectiveStartDate = await GetWarningLetterSettingsQueryHandler.GetEffectiveStartDateAsync(
            _systemConfigurationService, cancellationToken);

        var scopedQuery = _context.WarningLetters
            .AsNoTracking()
            .Include(w => w.Employee)
            .Include(w => w.Vehicle)
                .ThenInclude(v => v.VehicleType)
            .Include(w => w.Site)
            .Where(w => w.LetterDate >= effectiveStartDate)
            .AsQueryable();

        if (request.SiteId.HasValue)
            scopedQuery = scopedQuery.Where(w => w.SiteId == request.SiteId.Value);

        if (request.VehicleIds is { Count: > 0 })
            scopedQuery = scopedQuery.Where(w => request.VehicleIds.Contains(w.VehicleId));

        if (request.VehicleTypeId.HasValue)
            scopedQuery = scopedQuery.Where(w => w.Vehicle.VehicleTypeId == request.VehicleTypeId.Value);

        if (request.EmployeeIds is { Count: > 0 })
            scopedQuery = scopedQuery.Where(w => request.EmployeeIds.Contains(w.EmployeeId));

        if (request.LetterType.HasValue)
            scopedQuery = scopedQuery.Where(w => w.LetterType == request.LetterType.Value);

        if (request.WorkflowStage.HasValue)
        {
            scopedQuery = request.WorkflowStage.Value switch
            {
                WarningLetterWorkflowStage.Draft => scopedQuery.Where(w => w.ApproveLetterUploadedAt == null && w.SignatureRequestedAt == null && w.SignedCopyUploadedAt == null && w.EmployeeAcknowledgedAt == null),
                WarningLetterWorkflowStage.Approved => scopedQuery.Where(w => w.ApproveLetterUploadedAt != null && w.SignatureRequestedAt == null && w.SignedCopyUploadedAt == null && w.EmployeeAcknowledgedAt == null),
                WarningLetterWorkflowStage.PendingSigned => scopedQuery.Where(w => w.SignatureRequestedAt != null && w.SignedCopyUploadedAt == null && w.EmployeeAcknowledgedAt == null),
                WarningLetterWorkflowStage.Signed => scopedQuery.Where(w => w.SignedCopyUploadedAt != null && w.EmployeeAcknowledgedAt == null && w.Status != WarningLetterStatus.Acknowledged),
                WarningLetterWorkflowStage.Acknowledged => scopedQuery.Where(w => w.EmployeeAcknowledgedAt != null || w.Status == WarningLetterStatus.Acknowledged),
                _ => scopedQuery
            };
        }

        var monthlyTrendDates = await scopedQuery
            .Select(w => w.LetterDate)
            .ToListAsync(cancellationToken);

        var query = scopedQuery;

        // Clamp the requested start date to the effective start date (user-selected start is
        // allowed to be earlier, but the backend enforces the cutoff above).
        if (request.StartDate.HasValue && request.StartDate.Value > effectiveStartDate)
            query = query.Where(w => w.LetterDate >= request.StartDate.Value);

        if (request.EndDate.HasValue)
            query = query.Where(w => w.LetterDate <= request.EndDate.Value);

        var letters = await query
            .OrderByDescending(w => w.LetterDate)
            .ThenByDescending(w => w.DateCreated)
            .ToListAsync(cancellationToken);

        var records = letters.Select(w => new WarningLetterReportRecordDto
        {
            Id = w.Id,
            LetterType = w.LetterType,
            LetterTypeName = FormatLetterTypeName(w.LetterType),
            EmployeeId = w.EmployeeId,
            EmployeeName = w.Employee?.FullName ?? string.Empty,
            VehicleId = w.VehicleId,
            VehicleCode = w.Vehicle?.VehicleCode ?? string.Empty,
            NumberPlate = w.Vehicle?.NumberPlate ?? string.Empty,
            VehicleTypeId = w.Vehicle?.VehicleTypeId,
            VehicleTypeName = w.Vehicle?.VehicleType?.Name ?? "Unknown",
            SiteId = w.SiteId,
            SiteName = w.Site?.Name ?? string.Empty,
            LetterDate = w.LetterDate,
            PeriodStart = w.PeriodStart,
            PeriodEnd = w.PeriodEnd,
            WorkflowStage = WarningLetterWorkflowStageResolver.Resolve(w),
            WorkflowStageName = FormatWorkflowStageName(WarningLetterWorkflowStageResolver.Resolve(w)),
            ExcessCost = w.ExcessCost,
            ExcessValue = w.ExcessValue,
            ExpectedValue = w.ExpectedValue,
            ActualValue = w.ActualValue,
            FuelPrice = w.FuelPrice,
            ViolationSummary = w.ViolationSummary,
            DateCreated = w.DateCreated,
            ApproveLetterUploadedAt = w.ApproveLetterUploadedAt,
            SignatureRequestedAt = w.SignatureRequestedAt,
            SignedCopyUploadedAt = w.SignedCopyUploadedAt,
            EmployeeAcknowledgedAt = w.EmployeeAcknowledgedAt,
        }).ToList();

        var analytics = BuildAnalytics(records, letters, monthlyTrendDates);

        return FMSResponse<WarningLetterReportDataDto>.Success(new WarningLetterReportDataDto
        {
            Records = records,
            Analytics = analytics,
        });
    }

    private static WarningLetterAnalyticsDto BuildAnalytics(
        List<WarningLetterReportRecordDto> records,
        List<Domain.Entities.Features.WarningLetterManagement.WarningLetter> letters,
        List<DateTime> monthlyTrendDates)
    {
        var analytics = new WarningLetterAnalyticsDto
        {
            TotalLetters = records.Count,
            TotalDeductions = records.Sum(r => r.ExcessCost ?? 0),
            UniqueEmployees = records.Select(r => r.EmployeeId).Distinct().Count(),
        };

        // Stage breakdown
        analytics.StageBreakdown = Enum.GetValues<WarningLetterWorkflowStage>()
            .Select(stage => new StageBreakdownItem
            {
                Stage = FormatWorkflowStageName(stage),
                Count = records.Count(r => r.WorkflowStage == stage),
            })
            .ToList();

        // Letter type breakdown
        analytics.LetterTypeBreakdown = records
            .GroupBy(r => r.LetterTypeName)
            .Select(g => new LetterTypeBreakdownItem { LetterType = g.Key, Count = g.Count() })
            .OrderByDescending(l => l.Count)
            .ToList();

        // Average days between stages
        analytics.AverageDaysBetweenStages = ComputeStageDurations(letters);

        // Average days to acknowledge
        var acknowledgedLetters = letters.Where(w => w.EmployeeAcknowledgedAt.HasValue).ToList();
        if (acknowledgedLetters.Count > 0)
        {
            analytics.AvgDaysToAcknowledge = acknowledgedLetters
                .Average(w => (w.EmployeeAcknowledgedAt!.Value - w.DateCreated).TotalDays);
        }

        // Deductions by site
        analytics.DeductionBySite = records
            .GroupBy(r => r.SiteName)
            .Select(g => new DeductionGroupItem { Name = g.Key, TotalExcessCost = g.Sum(r => r.ExcessCost ?? 0) })
            .OrderByDescending(d => d.TotalExcessCost)
            .ToList();

        // Deductions by vehicle type
        analytics.DeductionByVehicleType = records
            .GroupBy(r => r.VehicleTypeName)
            .Select(g => new DeductionGroupItem { Name = g.Key, TotalExcessCost = g.Sum(r => r.ExcessCost ?? 0) })
            .OrderByDescending(d => d.TotalExcessCost)
            .ToList();

        // Employee with most warnings
        var topEmployee = records
            .GroupBy(r => new { r.EmployeeId, r.EmployeeName })
            .OrderByDescending(g => g.Count())
            .ThenByDescending(g => g.Max(r => r.LetterDate))
            .ThenBy(g => g.Key.EmployeeName)
            .FirstOrDefault();
        if (topEmployee != null)
        {
            analytics.EmployeeWithMostWarnings = new EmployeeWarningItem
            {
                EmployeeName = topEmployee.Key.EmployeeName,
                Count = topEmployee.Count(),
            };
        }

        // Employee ranking (top 10)
        analytics.EmployeeRanking = records
            .GroupBy(r => new { r.EmployeeId, r.EmployeeName })
            .Select(g => new EmployeeRankingItem
            {
                EmployeeName = g.Key.EmployeeName,
                WarningCount = g.Count(),
                TotalDeduction = g.Sum(r => r.ExcessCost ?? 0),
            })
            .OrderByDescending(e => e.WarningCount)
            .ThenBy(e => e.EmployeeName)
            .Take(10)
            .ToList();

        // Last warning by employee (top 10)
        analytics.LastWarningByEmployee = records
            .GroupBy(r => new { r.EmployeeId, r.EmployeeName })
            .Select(g =>
            {
                var latest = g.OrderByDescending(r => r.LetterDate).First();
                return new LastWarningByEmployeeItem
                {
                    EmployeeName = g.Key.EmployeeName,
                    LastLetterDate = latest.LetterDate,
                    LetterType = latest.LetterTypeName,
                    WorkflowStageName = latest.WorkflowStageName,
                    WarningCount = g.Count(),
                };
            })
            .OrderByDescending(l => l.LastLetterDate)
            .Take(10)
            .ToList();

        // Monthly trend
        analytics.MonthlyTrend = monthlyTrendDates
            .GroupBy(letterDate => letterDate.Date)
            .Select(g => new MonthlyTrendItem { Month = g.Key.ToString("yyyy-MM-dd"), Count = g.Count() })
            .OrderBy(m => m.Month)
            .ToList();

        return analytics;
    }

    private static List<StageDurationItem> ComputeStageDurations(
        List<Domain.Entities.Features.WarningLetterManagement.WarningLetter> letters)
    {
        var result = new List<StageDurationItem>();

        var withApproved = letters.Where(w => w.ApproveLetterUploadedAt.HasValue).ToList();
        if (withApproved.Count > 0)
        {
            result.Add(new StageDurationItem
            {
                Transition = "Draft → Approved",
                AverageDays = Math.Round(withApproved.Average(w => (w.ApproveLetterUploadedAt!.Value - w.DateCreated).TotalDays), 1),
            });
        }

        var withPendingSigned = letters.Where(w => w.ApproveLetterUploadedAt.HasValue && w.SignatureRequestedAt.HasValue).ToList();
        if (withPendingSigned.Count > 0)
        {
            result.Add(new StageDurationItem
            {
                Transition = "Approved → Pending Signed",
                AverageDays = Math.Round(withPendingSigned.Average(w => (w.SignatureRequestedAt!.Value - w.ApproveLetterUploadedAt!.Value).TotalDays), 1),
            });
        }

        var withSigned = letters.Where(w => w.SignatureRequestedAt.HasValue && w.SignedCopyUploadedAt.HasValue).ToList();
        if (withSigned.Count > 0)
        {
            result.Add(new StageDurationItem
            {
                Transition = "Pending Signed → Signed",
                AverageDays = Math.Round(withSigned.Average(w => (w.SignedCopyUploadedAt!.Value - w.SignatureRequestedAt!.Value).TotalDays), 1),
            });
        }

        var withAcknowledged = letters.Where(w => w.SignedCopyUploadedAt.HasValue && w.EmployeeAcknowledgedAt.HasValue).ToList();
        if (withAcknowledged.Count > 0)
        {
            result.Add(new StageDurationItem
            {
                Transition = "Signed → Acknowledged",
                AverageDays = Math.Round(withAcknowledged.Average(w => (w.EmployeeAcknowledgedAt!.Value - w.SignedCopyUploadedAt!.Value).TotalDays), 1),
            });
        }

        return result;
    }

    private static string FormatWorkflowStageName(WarningLetterWorkflowStage stage)
        => stage switch
        {
            WarningLetterWorkflowStage.PendingSigned => "Pending Signed",
            _ => stage.ToString()
        };

    private static string FormatLetterTypeName(WarningLetterType letterType)
        => letterType switch
        {
            WarningLetterType.ExcessFuelConsumption => "Excess Fuel",
            WarningLetterType.ExcessiveSpeed => "Excessive Speed",
            WarningLetterType.ExcessiveIdling => "Excessive Idling",
            _ => letterType.ToString()
        };
}
