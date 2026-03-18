/**
 * File: VehicleTripBatchRecomputeResultDTO.cs
 * Purpose: Aggregated result DTO for batch trip recomputation across multiple vehicles.
 * Dependencies: VehicleTripRecomputeResultDTO.
 * Last Modified: 2026-03-14
 */
using System;
using System.Collections.Generic;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripBatchRecomputeResultDTO
{
    public int TotalVehiclesFound { get; set; }
    public int TotalVehiclesProcessed { get; set; }
    public int TotalVehiclesFailed { get; set; }
    public DateTime FromUtc { get; set; }
    public DateTime ToUtc { get; set; }
    public List<VehicleTripRecomputeResultDTO> VehicleResults { get; set; } = new();
    public List<string> Errors { get; set; } = new();
}
