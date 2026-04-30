/*
 * File:          ITrackingProviderMarker.cs
 * Purpose:       Temporary marker contract for tracking provider plugins. Phase 1 keeps
 *                the existing FMS.Infrastructure.VehicleTracking.Interfaces.IVehicleTrackingProvider
 *                in place to avoid Application-layer breakage. T1.4 will move that interface
 *                into FMS.Devices.Abstractions.Tracking in a follow-up step.
 * Dependencies:  IDeviceProvider
 * Last Modified: 2026-04-29
 */
using FMS.Devices.Abstractions.Common;

namespace FMS.Devices.Abstractions.Tracking;

/// <summary>
/// Marker for tracking provider plugins. Implementations also implement
/// <c>FMS.Infrastructure.VehicleTracking.Interfaces.IVehicleTrackingProvider</c> until
/// the contract is migrated into this namespace (TASKS.md T1.4).
/// </summary>
public interface ITrackingProviderMarker : IDeviceProvider
{
}
