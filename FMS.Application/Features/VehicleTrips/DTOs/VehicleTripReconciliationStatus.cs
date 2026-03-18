/**
 * File: VehicleTripReconciliationStatus.cs
 * Purpose: Represents trip reconciliation outcome state for scaffolding and future persistence.
 * Dependencies: None.
 * Last Modified: 2026-03-11
 */
namespace FMS.Application.Features.VehicleTrips.DTOs;

public enum VehicleTripReconciliationStatus
{
    Pending = 0,
    Confirmed = 1,
    Split = 2,
    Merged = 3,
    Adjusted = 4,
    Anomaly = 5,
}
