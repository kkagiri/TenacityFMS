/**
 * File:          WarningLetterCandidatesReportDataDto.cs
 * Purpose:       DTO for the Warning Letter Candidates (Not Generated) report response.
 * Dependencies:  WarningLetterType
 * Last Modified: 2026-06-15
 *
 * Key Classes:
 * - WarningLetterCandidatesReportDataDto: Top-level report envelope
 * - WarningLetterCandidateReportRecordDto: Individual candidate row
 * - CandidatesReportSummaryDto: Pre-computed summary
 */
using System;
using System.Collections.Generic;
using FMS.Domain.Entities.Features.WarningLetterManagement;

namespace FMS.Application.Features.WarningLetter.DTOs;

public class WarningLetterCandidatesReportDataDto
{
    public List<WarningLetterCandidateReportRecordDto> Records { get; set; } = new();
    public CandidatesReportSummaryDto Summary { get; set; } = new();
}

public class WarningLetterCandidateReportRecordDto
{
    public int ConsumptionId { get; set; }
    public WarningLetterType LetterType { get; set; }
    public string LetterTypeName { get; set; } = string.Empty;
    public string MetricDate { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public string SiteName { get; set; } = string.Empty;
    public string VehicleCode { get; set; } = string.Empty;
    public string NumberPlate { get; set; } = string.Empty;
    public string VehicleTypeName { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public decimal ExpectedValue { get; set; }
    public decimal ActualValue { get; set; }
    public decimal ExcessValue { get; set; }
    public decimal? FuelPrice { get; set; }
    public decimal? ExcessCost { get; set; }
    public string ViolationSummary { get; set; } = string.Empty;
    public bool HasExistingLetter { get; set; }
}

public class CandidatesReportSummaryDto
{
    public int TotalCandidates { get; set; }
    public int ExcessFuelCount { get; set; }
    public int ExcessiveSpeedCount { get; set; }
    public int ExcessiveIdlingCount { get; set; }
    public int UniqueSites { get; set; }
    public int UniqueVehicles { get; set; }
    public int UniqueEmployees { get; set; }
}
