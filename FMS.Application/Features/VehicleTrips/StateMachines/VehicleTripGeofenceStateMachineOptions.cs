/**
 * File: VehicleTripGeofenceStateMachineOptions.cs
 * Purpose: Configures real-time geofence state machine thresholds.
 * Dependencies: None.
 * Last Modified: 2026-03-12
 */
namespace FMS.Application.Features.VehicleTrips.StateMachines;

public class VehicleTripGeofenceStateMachineOptions
{
    public const string SectionName = "VehicleTrips:Geofence:RealTime";

    public int DepartureConsecutiveThreshold { get; set; } = 3;
    public int ArrivalConsecutiveThreshold { get; set; } = 2;
    public decimal GpsGapThresholdMinutes { get; set; } = 10m;
}