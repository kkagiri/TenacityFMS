/**
 * File: VehicleTripSupervisorApprovalDTO.cs
 * Purpose: Carries supervisor approval data for overrides against finalized fuel-audit periods.
 * Dependencies: None.
 * Last Modified: 2026-03-11
 */
using System;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripSupervisorApprovalDTO
{
    public string ApprovedByUserId { get; set; } = string.Empty;
    public string? ApprovedByName { get; set; }
    public string ApprovalReason { get; set; } = string.Empty;
    public DateTime ApprovedAtUtc { get; set; } = DateTime.UtcNow;
}
