/**
 * File:          WarningLetterAnalyticsReportDataBuilder.cs
 * Purpose:       Builds normalized jsreport payloads for warning letter analytics reports.
 * Dependencies:  WarningLetterReportDataDto, WarningLetterType, JsonSerializer
 * Last Modified: 2026-04-17
 *
 * Key Functions:
 * - Build(): Maps warning letter analytics query results into the HTML/PDF/Excel template payload
 */
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.Json;
using FMS.Application.Features.WarningLetter.DTOs;

namespace FMS.WebClient.Services.Reporting;

internal static class WarningLetterAnalyticsReportDataBuilder
{
    public static object Build(
        WarningLetterReportDataDto dto,
        string reportTitle,
        DateTime referenceDate)
    {
        var stageBreakdown = BuildWorkflowStages(dto.Analytics.StageBreakdown)
            .Select(item => new
            {
                label = item.Label,
                description = item.Description,
                color = item.Color,
                tint = item.Tint,
                borderColor = item.BorderColor,
                stage = item.Label,
                count = item.Count,
            })
            .ToList();

        var letterTypeBreakdown = dto.Analytics.LetterTypeBreakdown
            .Select(item => new
            {
                letterType = FormatLetterTypeName(item.LetterType),
                count = item.Count,
            })
            .ToList();

        var monthlyTrend = dto.Analytics.MonthlyTrend
            .Select(item => new TrendItemPayload(item.Month, item.Count))
            .ToList();

        var trendAxis = BuildTrendAxis(monthlyTrend, referenceDate);

        var deductionBySite = dto.Analytics.DeductionBySite
            .Select(item => new
            {
                name = string.IsNullOrWhiteSpace(item.Name) ? "-" : item.Name,
                totalExcessCost = item.TotalExcessCost,
                totalExcessCostFormatted = item.TotalExcessCost.ToString("N2", CultureInfo.InvariantCulture),
            })
            .ToList();

        var deductionByVehicleType = dto.Analytics.DeductionByVehicleType
            .Select(item => new
            {
                name = string.IsNullOrWhiteSpace(item.Name) ? "-" : item.Name,
                totalExcessCost = item.TotalExcessCost,
                totalExcessCostFormatted = item.TotalExcessCost.ToString("N2", CultureInfo.InvariantCulture),
            })
            .ToList();

        var averageDaysBetweenStages = dto.Analytics.AverageDaysBetweenStages
            .Select(item => new
            {
                transition = item.Transition,
                averageDays = Math.Round(item.AverageDays, 1),
            })
            .ToList();

        var employeeRankingBase = dto.Analytics.EmployeeRanking
            .Select(item => new
            {
                employeeName = string.IsNullOrWhiteSpace(item.EmployeeName) ? "-" : item.EmployeeName,
                warningCount = item.WarningCount,
                totalDeduction = item.TotalDeduction,
                totalDeductionFormatted = item.TotalDeduction.ToString("N2", CultureInfo.InvariantCulture),
            })
            .ToList();

        var maxWarningCount = employeeRankingBase.Count == 0
            ? 1
            : employeeRankingBase.Max(item => item.warningCount);

        var employeeRanking = employeeRankingBase
            .Select(item => new
            {
                item.employeeName,
                item.warningCount,
                item.totalDeduction,
                item.totalDeductionFormatted,
                widthPercent = Math.Max(8, (int)Math.Round(item.warningCount / (double)maxWarningCount * 100d)),
            })
            .ToList();

        var lastWarningByEmployee = dto.Analytics.LastWarningByEmployee
            .Select(item =>
            {
                var stageMeta = GetWorkflowStagePayload(item.WorkflowStageName);
                return new
                {
                    employeeName = string.IsNullOrWhiteSpace(item.EmployeeName) ? "-" : item.EmployeeName,
                    lastLetterDate = item.LastLetterDate,
                    lastLetterDateFormatted = item.LastLetterDate.ToString("yyyy-MM-dd"),
                    letterType = FormatLetterTypeName(item.LetterType),
                    workflowStageName = stageMeta.Label,
                    workflowStageColor = stageMeta.Color,
                    workflowStageTint = stageMeta.Tint,
                    workflowStageBorderColor = stageMeta.BorderColor,
                    warningCount = item.WarningCount,
                };
            })
            .ToList();

        var employeeWithMostWarnings = dto.Analytics.EmployeeWithMostWarnings == null
            ? new { employeeName = "-", count = 0 }
            : new
            {
                employeeName = string.IsNullOrWhiteSpace(dto.Analytics.EmployeeWithMostWarnings.EmployeeName)
                    ? "-"
                    : dto.Analytics.EmployeeWithMostWarnings.EmployeeName,
                count = dto.Analytics.EmployeeWithMostWarnings.Count,
            };

        var records = dto.Records
            .Select((record, index) =>
            {
                var stageMeta = GetWorkflowStagePayload(record.WorkflowStageName);
                var letterTypeName = FormatLetterTypeName(record.LetterTypeName);
                return new
                {
                    rowNumber = index + 1,
                    record.Id,
                    letterTypeName,
                    employeeName = string.IsNullOrWhiteSpace(record.EmployeeName) ? "-" : record.EmployeeName,
                    vehicleHyoungNo = string.IsNullOrWhiteSpace(record.VehicleHyoungNo) ? "-" : record.VehicleHyoungNo,
                    numberPlate = string.IsNullOrWhiteSpace(record.NumberPlate) ? "-" : record.NumberPlate,
                    vehicleTypeName = string.IsNullOrWhiteSpace(record.VehicleTypeName) ? "-" : record.VehicleTypeName,
                    siteName = string.IsNullOrWhiteSpace(record.SiteName) ? "-" : record.SiteName,
                    letterDate = record.LetterDate.ToString("yyyy-MM-dd"),
                    letterDateFormatted = record.LetterDate.ToString("yyyy-MM-dd"),
                    periodStart = record.PeriodStart.ToString("yyyy-MM-dd"),
                    periodEnd = record.PeriodEnd.ToString("yyyy-MM-dd"),
                    workflowStageName = stageMeta.Label,
                    workflowStageColor = stageMeta.Color,
                    workflowStageTint = stageMeta.Tint,
                    workflowStageBorderColor = stageMeta.BorderColor,
                    excessCost = record.ExcessCost,
                    excessCostFormatted = FormatExcessCostValue(record.ExcessCost, letterTypeName),
                    excessValue = (record.ExcessValue ?? 0m).ToString("N2", CultureInfo.InvariantCulture),
                    expectedValue = (record.ExpectedValue ?? 0m).ToString("N2", CultureInfo.InvariantCulture),
                    actualValue = (record.ActualValue ?? 0m).ToString("N2", CultureInfo.InvariantCulture),
                    violationSummary = record.ViolationSummary,
                };
            })
            .ToList();

        var analytics = new
        {
            totalLetters = dto.Analytics.TotalLetters,
            totalDeductions = dto.Analytics.TotalDeductions,
            totalDeductionsFormatted = dto.Analytics.TotalDeductions.ToString("N2", CultureInfo.InvariantCulture),
            avgDaysToAcknowledge = Math.Round(dto.Analytics.AvgDaysToAcknowledge, 1),
            uniqueEmployees = dto.Analytics.UniqueEmployees,
            stageBreakdown,
            workflowStages = stageBreakdown,
            letterTypeBreakdown,
            monthlyTrend,
            deductionBySite,
            deductionByVehicleType,
            averageDaysBetweenStages,
            employeeRanking,
            employeeWithMostWarnings,
            lastWarningByEmployee,
        };

        var analyticsJson = JsonSerializer.Serialize(new
        {
            stageBreakdown = new
            {
                labels = stageBreakdown.Select(item => item.stage).ToList(),
                data = stageBreakdown.Select(item => item.count).ToList(),
                colors = stageBreakdown.Select(item => item.color).ToList(),
            },
            letterTypeBreakdown = new
            {
                labels = letterTypeBreakdown.Select(item => item.letterType).ToList(),
                data = letterTypeBreakdown.Select(item => item.count).ToList(),
            },
            monthlyTrend = new
            {
                points = trendAxis.Points,
                tickValues = trendAxis.TickValues,
                monthStartLabel = trendAxis.MonthStartLabel,
                todayOffset = trendAxis.TodayOffset,
                minOffset = trendAxis.MinOffset,
                maxOffset = trendAxis.MaxOffset,
            },
            deductionBySite = new
            {
                labels = deductionBySite.Select(item => item.name).ToList(),
                data = deductionBySite.Select(item => item.totalExcessCost).ToList(),
            },
            deductionByVehicleType = new
            {
                labels = deductionByVehicleType.Select(item => item.name).ToList(),
                data = deductionByVehicleType.Select(item => item.totalExcessCost).ToList(),
            },
        });

        return new
        {
            reportTitle,
            generatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
            generatedBy = "System",
            reportId = $"RPT-{DateTime.UtcNow:yyyyMMddHHmmss}",
            records,
            data = records,
            items = records,
            transactions = records,
            analytics,
            analyticsJson,
            summary = new
            {
                totalRecords = records.Count,
                totalLetters = analytics.totalLetters,
                totalDeductions = analytics.totalDeductionsFormatted,
                uniqueEmployees = dto.Analytics.UniqueEmployees,
            },
        };
    }

    private static List<WorkflowStagePayload> BuildWorkflowStages(IEnumerable<StageBreakdownItem> stageBreakdown)
    {
        var counts = stageBreakdown.ToDictionary(
            item => NormalizeWorkflowStageName(item.Stage),
            item => item.Count,
            StringComparer.OrdinalIgnoreCase);

        return new List<WorkflowStagePayload>
        {
            GetWorkflowStagePayload("Draft", counts.TryGetValue("Draft", out var draftCount) ? draftCount : 0),
            GetWorkflowStagePayload("Approved", counts.TryGetValue("Approved", out var approvedCount) ? approvedCount : 0),
            GetWorkflowStagePayload("Pending Signed", counts.TryGetValue("Pending Signed", out var pendingSignedCount) ? pendingSignedCount : 0),
            GetWorkflowStagePayload("Signed", counts.TryGetValue("Signed", out var signedCount) ? signedCount : 0),
            GetWorkflowStagePayload("Acknowledged", counts.TryGetValue("Acknowledged", out var acknowledgedCount) ? acknowledgedCount : 0),
        };
    }

    private static WorkflowStagePayload GetWorkflowStagePayload(string? stageName, int count = 0)
    {
        var normalized = NormalizeWorkflowStageName(stageName);

        return normalized switch
        {
            "Approved" => new WorkflowStagePayload("Approved", "Approved by HR.", "#0078D4", "rgba(0, 120, 212, 0.12)", "rgba(0, 120, 212, 0.35)", count),
            "Pending Signed" => new WorkflowStagePayload("Pending Signed", "Driver to sign.", "#D97706", "rgba(217, 119, 6, 0.12)", "rgba(217, 119, 6, 0.35)", count),
            "Signed" => new WorkflowStagePayload("Signed", "Driver has signed and site admin uploaded.", "#0F766E", "rgba(15, 118, 110, 0.12)", "rgba(15, 118, 110, 0.35)", count),
            "Acknowledged" => new WorkflowStagePayload("Acknowledged", "File is saved.", "#107C10", "rgba(16, 124, 16, 0.12)", "rgba(16, 124, 16, 0.35)", count),
            _ => new WorkflowStagePayload("Draft", "Initial draft pending HR approval.", "#9CA3AF", "rgba(156, 163, 175, 0.12)", "rgba(156, 163, 175, 0.35)", count),
        };
    }

    private static string NormalizeWorkflowStageName(string? stageName)
    {
        var normalized = (stageName ?? string.Empty)
            .Replace("_", " ", StringComparison.Ordinal)
            .Replace("-", " ", StringComparison.Ordinal)
            .Trim();

        return normalized.ToLowerInvariant() switch
        {
            "approved" => "Approved",
            "pending signed" => "Pending Signed",
            "pendingsigned" => "Pending Signed",
            "signed" => "Signed",
            "acknowledged" => "Acknowledged",
            _ => "Draft",
        };
    }

    private static string FormatLetterTypeName(string? value)
    {
        var normalized = (value ?? string.Empty).Trim();

        return normalized.ToLowerInvariant() switch
        {
            "excessfuelconsumption" => "Excess Fuel",
            "excess fuel consumption" => "Excess Fuel",
            "excess fuel" => "Excess Fuel",
            "excessivespeed" => "Excessive Speed",
            "excessive speed" => "Excessive Speed",
            "excessiveidling" => "Excessive Idling",
            "excessive idling" => "Excessive Idling",
            _ => string.IsNullOrWhiteSpace(normalized)
                ? "Unknown"
                : normalized.Replace("PendingSigned", "Pending Signed", StringComparison.Ordinal)
        };
    }

    private static DateTime? ParseTrendDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return DateTime.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed)
            ? parsed
            : null;
    }

    private static TrendAxisPayload BuildTrendAxis(IEnumerable<TrendItemPayload> trendItems, DateTime referenceDate)
    {
        var monthStart = new DateTime(referenceDate.Year, referenceDate.Month, 1);

        var points = trendItems
            .Select(item =>
            {
                var trendDate = ParseTrendDate(item.DateKey);
                if (!trendDate.HasValue)
                {
                    return null;
                }

                var dayOffset = (int)Math.Round((trendDate.Value.Date - monthStart.Date).TotalDays);
                return new TrendPoint(dayOffset, item.Count);
            })
            .OfType<TrendPoint>()
            .ToList();

        var todayOffset = Math.Max(0, (int)Math.Round((referenceDate.Date - monthStart.Date).TotalDays));
        var minPointOffset = points.Count == 0 ? 0 : points.Min(item => item.x);
        var minOffset = Math.Min(-30, minPointOffset);
        var midpointOffset = todayOffset > 0 ? (int)Math.Round(todayOffset / 2d) : 0;
        var tickValues = new[] { minOffset, -15, 0, midpointOffset, todayOffset }
            .Where(value => value >= minOffset && value <= todayOffset)
            .Distinct()
            .OrderBy(value => value)
            .ToList();

        return new TrendAxisPayload(
            points,
            tickValues,
            monthStart.ToString("dd MMM", CultureInfo.InvariantCulture),
            todayOffset,
            minOffset,
            todayOffset);
    }

    private static string FormatExcessCostValue(decimal? excessCost, string letterTypeName)
    {
        if (string.Equals(letterTypeName, "Excessive Speed", StringComparison.OrdinalIgnoreCase))
        {
            return "-";
        }

        return excessCost.HasValue
            ? excessCost.Value.ToString("N2", CultureInfo.InvariantCulture)
            : "-";
    }

    private sealed record WorkflowStagePayload(
        string Label,
        string Description,
        string Color,
        string Tint,
        string BorderColor,
        int Count);

    private sealed record TrendItemPayload(string DateKey, int Count);

    private sealed record TrendPoint(int x, int y);

    private sealed record TrendAxisPayload(
        List<TrendPoint> Points,
        List<int> TickValues,
        string MonthStartLabel,
        int TodayOffset,
        int MinOffset,
        int MaxOffset);
}