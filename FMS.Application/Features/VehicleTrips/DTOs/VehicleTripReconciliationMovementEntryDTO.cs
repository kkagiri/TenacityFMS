/**
 * File: VehicleTripReconciliationMovementEntryDTO.cs
 * Purpose: Represents one movement-log row used by vehicle reconciliation consumers.
 * Dependencies: Vehicle trip status enum.
 * Last Modified: 2026-03-11
 */
using System;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripReconciliationMovementEntryDTO
{
    public int VehicleTripGroupId { get; set; }
    public int? VehicleTripId { get; set; }
    public DateTime StartTimeUtc { get; set; }
    public DateTime EndTimeUtc { get; set; }
    public string OriginDisplayName { get; set; } = "Unknown";
    public string DestinationDisplayName { get; set; } = "Unknown";
    public decimal DistanceKm { get; set; }
    public decimal DurationMinutes { get; set; }
    public decimal? FuelConsumed { get; set; }
    public int SiteVisitCountContribution { get; set; }
    public bool IsCrossSiteMovement { get; set; }
    public string HybridCategory { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}
