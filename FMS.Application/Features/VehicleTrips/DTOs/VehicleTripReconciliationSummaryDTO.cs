/**
 * File: VehicleTripReconciliationSummaryDTO.cs
 * Purpose: Returns trip-derived vehicle reconciliation inputs and cross-site movement history.
 * Dependencies: VehicleTripReconciliationMovementEntryDTO.
 * Last Modified: 2026-03-11
 */
using System;
using System.Collections.Generic;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripReconciliationSummaryDTO
{
    public int? VehicleId { get; set; }
    public DateTime FromUtc { get; set; }
    public DateTime ToUtc { get; set; }
    public int VehiclesReviewed { get; set; }
    public int TripGroupsReviewed { get; set; }
    public int TripLegsReviewed { get; set; }
    public int SiteVisitsCount { get; set; }
    public int CrossSiteMovementCount { get; set; }
    public decimal TotalDistanceKm { get; set; }
    public decimal? TotalFuelConsumed { get; set; }
    public int GpsFleetMovements { get; set; }
    public int FullTankPolicyInputs { get; set; }
    public int EquipmentCycleMovements { get; set; }
    public int CrossSiteHybridMovements { get; set; }
    public int ExternalMovements { get; set; }
    public List<VehicleTripReconciliationMovementEntryDTO> MovementLog { get; set; } = new();
}
