/**
 * File: VehicleTripRuleViolationDTO.cs
 * Purpose: Represents a single trip-rule violation detected during rule-engine evaluation.
 * Dependencies: None.
 * Last Modified: 2026-03-11
 */
using System;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripRuleViolationDTO
{
    public string RuleCode { get; set; } = string.Empty;
    public string RuleName { get; set; } = string.Empty;
    public string Severity { get; set; } = "Warning";
    public int VehicleId { get; set; }
    public string VehicleLabel { get; set; } = string.Empty;
    public DateTime TripDate { get; set; }
    public int? VehicleTripGroupId { get; set; }
    public int? VehicleTripId { get; set; }
    public string? OriginDisplayName { get; set; }
    public string? DestinationDisplayName { get; set; }
    public decimal CurrentValue { get; set; }
    public decimal ThresholdValue { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
