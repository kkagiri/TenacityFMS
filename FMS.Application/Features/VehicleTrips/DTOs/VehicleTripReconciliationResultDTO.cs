/**
 * File: VehicleTripReconciliationResultDTO.cs
 * Purpose: Returns summary statistics for reconciliation preview and future reconciliation execution.
 * Dependencies: Vehicle trip reconciliation status enum.
 * Last Modified: 2026-03-11
 */
using System;
using System.Collections.Generic;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripReconciliationResultDTO
{
    public int VehicleId { get; set; }
    public DateTime FromUtc { get; set; }
    public DateTime ToUtc { get; set; }
    public bool PreviewOnly { get; set; } = true;
    public int PersistedGroupsReviewed { get; set; }
    public int PersistedTripsReviewed { get; set; }
    public int RecomputedGroupsDetected { get; set; }
    public int RecomputedTripsDetected { get; set; }
    public int ConfirmedGroups { get; set; }
    public int SplitGroups { get; set; }
    public int MergedGroups { get; set; }
    public int AdjustedGroups { get; set; }
    public int AnomalyGroups { get; set; }
    public int GroupsUpdated { get; set; }
    public int TripsUpdated { get; set; }
    public VehicleTripReconciliationStatus OverallStatus { get; set; } = VehicleTripReconciliationStatus.Pending;
    public string Notes { get; set; } = string.Empty;
    public List<VehicleTripReconciliationGroupResultDTO> GroupResults { get; set; } = new();
    public List<VehicleTripAnomalyReportDTO> AnomalyReports { get; set; } = new();
}
