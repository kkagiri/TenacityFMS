/**
 * File: VehicleDocumentUserPreferenceDto.cs
 * Purpose: Transfers per-user vehicle document reminder defaults between API and UI.
 * Dependencies: Vehicle compliance enums.
 * Last Modified: 2026-03-25
 */
using System;
using FMS.Domain.Entities;

namespace FMS.Application.Features.VehicleDocumentManagement.Dtos;

public class VehicleDocumentUserPreferenceDto
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public VehicleComplianceCategory ComplianceCategory { get; set; }
    public string ComplianceCategoryName { get; set; } = string.Empty;
    public int ReminderLeadDays { get; set; }
}