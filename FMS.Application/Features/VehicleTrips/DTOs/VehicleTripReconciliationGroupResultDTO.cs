/**
 * File: VehicleTripReconciliationGroupResultDTO.cs
 * Purpose: Returns per-group reconciliation comparison details and write-back status.
 * Dependencies: Trip status, anomaly, and reconciliation enums.
 * Last Modified: 2026-03-11
 */
using System;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripReconciliationGroupResultDTO
{
    public int VehicleTripGroupId { get; set; }
    public DateTime PersistedStartTimeUtc { get; set; }
    public DateTime PersistedEndTimeUtc { get; set; }
    public int PersistedTripCount { get; set; }
    public int? RecomputedTripCount { get; set; }
    public VehicleTripStatus PersistedStatus { get; set; } = VehicleTripStatus.Completed;
    public VehicleTripStatus? RecomputedStatus { get; set; }
    public decimal PersistedConfidenceScore { get; set; }
    public decimal? RecomputedConfidenceScore { get; set; }
    public string PersistedConfidenceBand { get; set; } = string.Empty;
    public string? RecomputedConfidenceBand { get; set; }
    public decimal? PersistedTotalFuelConsumed { get; set; }
    public decimal? RecomputedTotalFuelConsumed { get; set; }
    public VehicleTripAnomalyType AnomalyFlags { get; set; } = VehicleTripAnomalyType.None;
    public VehicleTripReconciliationStatus ReconciliationStatus { get; set; } = VehicleTripReconciliationStatus.Pending;
    public string Notes { get; set; } = string.Empty;
}
