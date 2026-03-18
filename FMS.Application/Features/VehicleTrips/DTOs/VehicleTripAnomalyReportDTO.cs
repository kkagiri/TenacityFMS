/**
 * File: VehicleTripAnomalyReportDTO.cs
 * Purpose: Returns anomaly details identified during trip reconciliation.
 * Dependencies: Reconciliation and anomaly enums.
 * Last Modified: 2026-03-11
 */
using System;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripAnomalyReportDTO
{
    public int VehicleTripGroupId { get; set; }
    public DateTime PersistedStartTimeUtc { get; set; }
    public DateTime PersistedEndTimeUtc { get; set; }
    public VehicleTripReconciliationStatus ReconciliationStatus { get; set; } = VehicleTripReconciliationStatus.Pending;
    public VehicleTripAnomalyType AnomalyFlags { get; set; } = VehicleTripAnomalyType.None;
    public decimal PersistedConfidenceScore { get; set; }
    public decimal? RecomputedConfidenceScore { get; set; }
    public string Summary { get; set; } = string.Empty;
}
