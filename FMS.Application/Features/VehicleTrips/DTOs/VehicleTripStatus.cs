/**
 * File: VehicleTripStatus.cs
 * Purpose: Defines persisted execution status values for vehicle trips and trip groups.
 * Dependencies: None.
 * Last Modified: 2026-03-11
 */
namespace FMS.Application.Features.VehicleTrips.DTOs;

public enum VehicleTripStatus
{
    InProgress = 1,
    Completed = 2,
}
