/**
 * File: VehicleDocumentUserPreferenceValueDto.cs
 * Purpose: Represents a single compliance-category reminder default in save requests.
 * Dependencies: Vehicle compliance enums.
 * Last Modified: 2026-03-25
 */
using FMS.Domain.Entities;

namespace FMS.Application.Features.VehicleDocumentManagement.Dtos;

public class VehicleDocumentUserPreferenceValueDto
{
    public VehicleComplianceCategory ComplianceCategory { get; set; }
    public int ReminderLeadDays { get; set; }
}