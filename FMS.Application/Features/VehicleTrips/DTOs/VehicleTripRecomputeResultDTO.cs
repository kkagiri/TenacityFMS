/**
 * File: VehicleTripRecomputeResultDTO.cs
 * Purpose: Returns summary statistics for a manual trip recomputation run.
 * Dependencies: Vehicle movement profile enum.
 * Last Modified: 2026-03-10
 */
using System;
using FMS.Domain.Entities;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripRecomputeResultDTO
{
    public int VehicleId { get; set; }
    public DateTime FromUtc { get; set; }
    public DateTime ToUtc { get; set; }
    public int GroupsCreated { get; set; }
    public int TripsCreated { get; set; }
    public int CompletedTrips { get; set; }
    public int InProgressTrips { get; set; }
    public int RoundTripGroupsCreated { get; set; }
    public int LoadCycleGroupsCreated { get; set; }
    public int LowConfidenceTrips { get; set; }
    public int TripsWithAnomalies { get; set; }
    public decimal? TotalFuelConsumed { get; set; }
    public VehicleMovementProfile MovementProfile { get; set; }
}
