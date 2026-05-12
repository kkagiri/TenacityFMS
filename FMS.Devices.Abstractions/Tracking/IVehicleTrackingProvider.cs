/*
 * File:          IVehicleTrackingProvider.cs
 * Purpose:       Canonical tracking provider contract for device provider plugins.
 * Dependencies:  FMS.Devices.Abstractions.Common, TrackingModels
 * Last Modified: 2026-05-03
 *
 * Key Functions:
 * - InitializeAsync(): Initializes a provider from tenant-scoped configuration.
 * - GetVehicleLocationAsync(): Reads current provider-neutral vehicle location.
 */
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Devices.Abstractions.Common;

namespace FMS.Devices.Abstractions.Tracking;

public interface IVehicleTrackingProvider : IDeviceProvider
{
    string ProviderName { get; }
    string ProviderVersion { get; }

    Task<TrackingOperationResult<bool>> InitializeAsync(
        TrackingProviderConfiguration configuration,
        CancellationToken cancellationToken = default);

    Task<TrackingOperationResult<bool>> ShutdownAsync(CancellationToken cancellationToken = default);

    Task<TrackingOperationResult<bool>> ValidateConfigurationAsync(
        TrackingProviderConfiguration configuration,
        CancellationToken cancellationToken = default);

    Task<TrackingOperationResult<TrackingVehicleLocation>> GetVehicleLocationAsync(
        int vehicleId,
        CancellationToken cancellationToken = default);

    Task<TrackingOperationResult<IReadOnlyList<TrackingVehicleLocation>>> GetAllVehicleLocationsAsync(
        bool onlineOnly = false,
        bool gpsEnabledOnly = true,
        CancellationToken cancellationToken = default);

    Task<TrackingOperationResult<TrackingVehicleOdometer>> GetVehicleOdometerAsync(
        int vehicleId,
        CancellationToken cancellationToken = default);

    Task<TrackingOperationResult<bool>> IsVehicleOnlineAsync(
        int vehicleId,
        CancellationToken cancellationToken = default);

    Task<TrackingOperationResult<IReadOnlyList<TrackingDevice>>> GetAllDevicesAsync(
        CancellationToken cancellationToken = default);

    Task<TrackingOperationResult<IReadOnlyList<TrackingHistoryPoint>>> GetVehicleHistoryAsync(
        int vehicleId,
        DateTime fromUtc,
        DateTime toUtc,
        CancellationToken cancellationToken = default);

    Task<TrackingOperationResult<IReadOnlyList<TrackingGeofence>>> GetGeofencesAsync(
        CancellationToken cancellationToken = default);

    Task<TrackingOperationResult<bool>> SubscribeToEventsAsync(
        ITrackingEventHandler eventHandler,
        CancellationToken cancellationToken = default);

    Task<TrackingOperationResult<bool>> UnsubscribeFromEventsAsync(CancellationToken cancellationToken = default);

    Task<TrackingOperationResult<TrackingProviderHealth>> GetHealthStatusAsync(
        CancellationToken cancellationToken = default);

    Task<TrackingOperationResult<bool>> ValidateConnectionAsync(CancellationToken cancellationToken = default);
}
