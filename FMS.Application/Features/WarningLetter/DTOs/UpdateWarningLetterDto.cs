/**
 * File: UpdateWarningLetterDto.cs
 * Purpose: Captures editable draft fields for warning letter updates.
 * Dependencies: WarningLetterType
 * Last Modified: 2026-04-06
 */
using System;
using System.Collections.Generic;
using FMS.Domain.Entities.Features.WarningLetterManagement;

namespace FMS.Application.Features.WarningLetter.DTOs;

public class UpdateWarningLetterDto
{
    public int Id { get; set; }
    public WarningLetterType LetterType { get; set; }
    public int EmployeeId { get; set; }
    public int VehicleId { get; set; }
    public int SiteId { get; set; }
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
    public string? EmailRecipient { get; set; }
    public string? SignatureRequestRecipientUserId { get; set; }
    public List<string> SignatureRequestCcUserIds { get; set; } = new();
    public string? Notes { get; set; }
}