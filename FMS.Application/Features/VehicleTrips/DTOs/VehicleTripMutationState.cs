/**
 * File: VehicleTripMutationState.cs
 * Purpose: Represents a mutable in-memory trip leg used while applying manual overrides.
 * Dependencies: VehicleTripDetectionResultDTO.
 * Last Modified: 2026-03-11
 */
namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripMutationState : VehicleTripDetectionResultDTO
{
    public int? VehicleTripId { get; set; }
}
