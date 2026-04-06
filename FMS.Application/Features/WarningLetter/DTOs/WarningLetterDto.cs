/**
 * File: WarningLetterDto.cs
 * Purpose: Represents a detailed warning letter payload for API responses.
 * Dependencies: WarningLetterStatus, WarningLetterType
 * Last Modified: 2026-04-06
 */
using System;
using FMS.Domain.Entities.Features.WarningLetterManagement;

namespace FMS.Application.Features.WarningLetter.DTOs;

public class WarningLetterDto
{
    public int Id { get; set; }
    public WarningLetterType LetterType { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string? EmployeeWorkNo { get; set; }
    public string? EmployeeEmail { get; set; }
    public string? Trade { get; set; }
    public int VehicleId { get; set; }
    public string VehicleHyoungNo { get; set; } = string.Empty;
    public string? NumberPlate { get; set; }
    public int SiteId { get; set; }
    public string SiteName { get; set; } = string.Empty;
    public DateTime LetterDate { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public string ViolationSummary { get; set; } = string.Empty;
    public decimal? ExpectedValue { get; set; }
    public decimal? ActualValue { get; set; }
    public decimal? ExcessValue { get; set; }
    public decimal? FuelPrice { get; set; }
    public decimal? ExcessCost { get; set; }
    public string IssuedByUserId { get; set; } = string.Empty;
    public string IssuedByName { get; set; } = string.Empty;
    public string? IssuedByTitle { get; set; }
    public string? PdfFilePath { get; set; }
    public DateTime? EmailSentAt { get; set; }
    public string? EmailRecipient { get; set; }
    public WarningLetterStatus Status { get; set; }
    public DateTime? EmployeeAcknowledgedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime DateCreated { get; set; }
    public DateTime? DateModified { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public string? ModifiedBy { get; set; }
}