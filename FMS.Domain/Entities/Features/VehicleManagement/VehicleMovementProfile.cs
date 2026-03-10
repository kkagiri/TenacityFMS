/**
 * File: VehicleMovementProfile.cs
 * Purpose: Defines which trip detection strategy applies to a vehicle.
 * Dependencies: None.
 * Last Modified: 2026-03-10
 */
namespace FMS.Domain.Entities;

/// <summary>
/// Trip detection profile assigned to a vehicle.
/// </summary>
public enum VehicleMovementProfile
{
    /// <summary>
    /// Trip mode has not been explicitly classified yet.
    /// </summary>
    Undefined = 0,

    /// <summary>
    /// Vehicle trips should be detected from known site/geofence transitions.
    /// </summary>
    Geofence = 1,

    /// <summary>
    /// Vehicle trips should be detected from clustered stop behaviour.
    /// </summary>
    Cluster = 2
}