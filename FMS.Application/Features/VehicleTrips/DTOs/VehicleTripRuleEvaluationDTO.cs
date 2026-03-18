/**
 * File: VehicleTripRuleEvaluationDTO.cs
 * Purpose: Summarises trip rule-engine evaluation output for a date range.
 * Dependencies: VehicleTripRuleViolationDTO.
 * Last Modified: 2026-03-11
 */
using System;
using System.Collections.Generic;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripRuleEvaluationDTO
{
    public DateTime FromUtc { get; set; }
    public DateTime ToUtc { get; set; }
    public int EvaluatedVehicles { get; set; }
    public int TripGroupsReviewed { get; set; }
    public int TripLegsReviewed { get; set; }
    public int ViolationsDetected { get; set; }
    public List<VehicleTripRuleViolationDTO> Violations { get; set; } = new();
}
