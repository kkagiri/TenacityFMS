/**
 * File: VehicleTripLiveOperationsReportDTO.cs
 * Purpose: Root payload for the live trip operations report.
 * Dependencies: Live trip operations DTOs.
 * Last Modified: 2026-03-13
 */
using System;
using System.Collections.Generic;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripLiveOperationsReportDTO
{
    public DateTime StartUtc { get; set; }
    public DateTime EndUtc { get; set; }
    public int IdleThresholdMinutes { get; set; }
    public List<VehicleTripLiveActiveTripDTO> Records { get; set; } = new();
    public List<VehicleTripLiveTravelingVehicleDTO> VehiclesCurrentlyTraveling { get; set; } = new();
    public List<VehicleTripLiveActiveTripDTO> ActiveTripsInProgress { get; set; } = new();
    public List<VehicleTripLiveVehicleCountDTO> TripCountsPerVehicle { get; set; } = new();
    public List<VehicleTripLiveTipperCycleDTO> LiveTipperCycleCounts { get; set; } = new();
    public List<VehicleTripLiveIdleOutsideZoneDTO> VehiclesIdleOutsideWorkZones { get; set; } = new();
    public VehicleTripLiveOperationsSummaryDTO Summary { get; set; } = new();
}