/**
 * File: VehicleTripManualOverrideAction.cs
 * Purpose: Enumerates supported manual trip override operations.
 * Dependencies: None.
 * Last Modified: 2026-03-11
 */
namespace FMS.Application.Features.VehicleTrips.DTOs;

public enum VehicleTripManualOverrideAction
{
    Split = 1,
    Merge = 2,
    ReassignSite = 3,
    Add = 4,
    Delete = 5,
    AdjustTimes = 6,
}
