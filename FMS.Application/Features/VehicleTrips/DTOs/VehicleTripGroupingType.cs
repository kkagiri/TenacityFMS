/**
 * File: VehicleTripGroupingType.cs
 * Purpose: Identifies how detected trip legs were grouped for reporting and orchestration.
 * Dependencies: None.
 * Last Modified: 2026-03-11
 */
namespace FMS.Application.Features.VehicleTrips.DTOs;

public enum VehicleTripGroupingType
{
    None = 0,
    SingleLeg = 1,
    RoundTrip = 2,
    LoadCycle = 3,
}
