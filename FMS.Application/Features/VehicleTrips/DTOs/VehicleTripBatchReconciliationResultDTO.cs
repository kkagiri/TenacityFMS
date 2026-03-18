/**
 * File: VehicleTripBatchReconciliationResultDTO.cs
 * Purpose: Aggregated result DTO for batch trip reconciliation across multiple vehicles.
 * Dependencies: VehicleTripReconciliationResultDTO.
 * Last Modified: 2026-03-14
 */
using System;
using System.Collections.Generic;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripBatchReconciliationResultDTO
{
    public int TotalVehiclesFound { get; set; }
    public int TotalVehiclesProcessed { get; set; }
    public int TotalVehiclesFailed { get; set; }
    public bool PreviewOnly { get; set; }
    public DateTime FromUtc { get; set; }
    public DateTime ToUtc { get; set; }
    public List<VehicleTripReconciliationResultDTO> VehicleResults { get; set; } = new();
    public List<string> Errors { get; set; } = new();
}
