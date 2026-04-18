/**
 * File:          WarningLetterReportDataDto.cs
 * Purpose:       DTO for the Warning Letter Analytics report response.
 * Dependencies:  WarningLetterType, WarningLetterWorkflowStage
 * Last Modified: 2026-06-15
 *
 * Key Classes:
 * - WarningLetterReportDataDto: Top-level report envelope
 * - WarningLetterReportRecordDto: Individual warning letter row
 * - WarningLetterAnalyticsDto: Pre-computed analytics aggregations
 */
using System;
using System.Collections.Generic;
using FMS.Domain.Entities.Features.WarningLetterManagement;

namespace FMS.Application.Features.WarningLetter.DTOs;

public class WarningLetterReportDataDto
{
    public List<WarningLetterReportRecordDto> Records { get; set; } = new();
    public WarningLetterAnalyticsDto Analytics { get; set; } = new();
}

public class WarningLetterReportRecordDto
{
    public int Id { get; set; }
    public WarningLetterType LetterType { get; set; }
    public string LetterTypeName { get; set; } = string.Empty;
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public int VehicleId { get; set; }
    public string VehicleHyoungNo { get; set; } = string.Empty;
    public string NumberPlate { get; set; } = string.Empty;
    public int? VehicleTypeId { get; set; }
    public string VehicleTypeName { get; set; } = string.Empty;
    public int SiteId { get; set; }
    public string SiteName { get; set; } = string.Empty;
    public DateTime LetterDate { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public WarningLetterWorkflowStage WorkflowStage { get; set; }
    public string WorkflowStageName { get; set; } = string.Empty;
    public decimal? ExcessCost { get; set; }
    public decimal? ExcessValue { get; set; }
    public decimal? ExpectedValue { get; set; }
    public decimal? ActualValue { get; set; }
    public decimal? FuelPrice { get; set; }
    public string ViolationSummary { get; set; } = string.Empty;
    public DateTime DateCreated { get; set; }
    public DateTime? ApproveLetterUploadedAt { get; set; }
    public DateTime? SignatureRequestedAt { get; set; }
    public DateTime? SignedCopyUploadedAt { get; set; }
    public DateTime? EmployeeAcknowledgedAt { get; set; }
}

public class WarningLetterAnalyticsDto
{
    public int TotalLetters { get; set; }
    public decimal TotalDeductions { get; set; }
    public double AvgDaysToAcknowledge { get; set; }
    public int UniqueEmployees { get; set; }
    public List<StageBreakdownItem> StageBreakdown { get; set; } = new();
    public List<StageDurationItem> AverageDaysBetweenStages { get; set; } = new();
    public List<DeductionGroupItem> DeductionBySite { get; set; } = new();
    public List<DeductionGroupItem> DeductionByVehicleType { get; set; } = new();
    public List<LetterTypeBreakdownItem> LetterTypeBreakdown { get; set; } = new();
    public EmployeeWarningItem? EmployeeWithMostWarnings { get; set; }
    public List<LastWarningByEmployeeItem> LastWarningByEmployee { get; set; } = new();
    public List<MonthlyTrendItem> MonthlyTrend { get; set; } = new();
    public List<EmployeeRankingItem> EmployeeRanking { get; set; } = new();
}

public class StageBreakdownItem
{
    public string Stage { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class StageDurationItem
{
    public string Transition { get; set; } = string.Empty;
    public double AverageDays { get; set; }
}

public class DeductionGroupItem
{
    public string Name { get; set; } = string.Empty;
    public decimal TotalExcessCost { get; set; }
}

public class LetterTypeBreakdownItem
{
    public string LetterType { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class EmployeeWarningItem
{
    public string EmployeeName { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class LastWarningByEmployeeItem
{
    public string EmployeeName { get; set; } = string.Empty;
    public DateTime LastLetterDate { get; set; }
    public string LetterType { get; set; } = string.Empty;
    public string WorkflowStageName { get; set; } = string.Empty;
    public int WarningCount { get; set; }
}

public class MonthlyTrendItem
{
    public string Month { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class EmployeeRankingItem
{
    public string EmployeeName { get; set; } = string.Empty;
    public int WarningCount { get; set; }
    public decimal TotalDeduction { get; set; }
}
