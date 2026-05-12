/*
 * File:          ITrackingProviderMarker.cs
 * Purpose:       Compatibility alias for tracking provider plugins while legacy consumers
 *                still migrate from FMS.Infrastructure.VehicleTracking.Interfaces.
 * Dependencies:  IVehicleTrackingProvider
 * Last Modified: 2026-05-03
 */
namespace FMS.Devices.Abstractions.Tracking;

/// <summary>
/// Compatibility alias for the canonical tracking provider contract.
/// </summary>
public interface ITrackingProviderMarker : IVehicleTrackingProvider
{
}
