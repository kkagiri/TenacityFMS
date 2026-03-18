/**
 * File: VehicleTripClusterStateMachineOptions.cs
 * Purpose: Configures real-time cluster state machine thresholds.
 * Dependencies: None.
 * Last Modified: 2026-03-12
 */
namespace FMS.Application.Features.VehicleTrips.StateMachines;

public class VehicleTripClusterStateMachineOptions
{
    public const string SectionName = "VehicleTrips:Cluster:RealTime";

    public decimal StopSpeedThresholdKph { get; set; } = 5.0m;
    public int StopDurationPoints { get; set; } = 3;
    public int MovingDurationPoints { get; set; } = 2;
    public decimal ClusterMatchRadiusKm { get; set; } = 0.15m;
}