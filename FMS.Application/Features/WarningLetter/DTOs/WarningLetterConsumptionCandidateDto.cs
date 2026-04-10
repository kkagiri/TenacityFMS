/**
 * File: WarningLetterConsumptionCandidateDto.cs
 * Purpose: Represents a suggested vehicle-consumption record that can seed a warning letter draft.
 * Dependencies: WarningLetterType
 * Last Modified: 2026-04-06
 */
using System;
using FMS.Domain.Entities.Features.WarningLetterManagement;

namespace FMS.Application.Features.WarningLetter.DTOs;

public class WarningLetterConsumptionCandidateDto
{
    public int ConsumptionId { get; set; }
    public WarningLetterType LetterType { get; set; }
    public DateTime MetricDate { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public int SiteId { get; set; }
    public string SiteName { get; set; } = string.Empty;
    public int VehicleId { get; set; }
    public string VehicleHyoungNo { get; set; } = string.Empty;
    public string? NumberPlate { get; set; }
    public int? EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public decimal? ExpectedValue { get; set; }
    public decimal? ActualValue { get; set; }
    public decimal? ExcessValue { get; set; }
    public string ViolationSummary { get; set; } = string.Empty;
    public string? GpsDriverName { get; set; }
    public bool HasExistingLetter { get; set; }
    public DateTime? ExistingLetterDate { get; set; }
}