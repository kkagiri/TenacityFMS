/*
 * File:          GpsWoxProvider.cs
 * Purpose:       Stub plugin used to prove the multi-device seam in Phase 2.
 *                The full GpsWox transport, mapping, and channels will be implemented
 *                in Phase 6 (T6.1). For now this exists so IProviderRegistry can
 *                discover a second tracking provider alongside GPSGate.
 * Dependencies:  FMS.Devices.Abstractions
 * Last Modified: 2026-04-30
 */
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Devices.Abstractions.Common;
using FMS.Devices.Abstractions.Tracking;

namespace FMS.Devices.Tracking.Providers.GpsWox;

/// <summary>
/// Phase 2 stub of the GpsWox tracking provider. Registers via the
/// <see cref="ProviderAttribute"/> scan and exposes empty capabilities so consumer
/// code branches on <c>Capabilities.HasFlag(...)</c> rather than provider name.
/// All operational members throw <see cref="NotImplementedException"/> until T6.1.
/// </summary>
[Provider("GpsWox", DeviceCategory.Tracking, "0.1.0-stub")]
public sealed class GpsWoxProvider : ITrackingProviderMarker
{
    public string ProviderName => "GpsWox";

    public string ProviderVersion => "0.1.0-stub";

    public ProviderMetadata Metadata { get; } = new()
    {
        Name = "GpsWox",
        DisplayName = "GPS-Wox",
        Category = DeviceCategory.Tracking,
        Version = "0.1.0-stub",
        Capabilities = ProviderCapabilities.None,
        Vendor = "GPS-Wox",
        Description = "Phase 2 stub. Real implementation lands in Phase 6 (T6.1).",
        DocumentationUrl = "https://www.gpswox.com/",
    };

    public ProviderCapabilities Capabilities => ProviderCapabilities.None;

    public Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult(false);

    public Task<TrackingOperationResult<bool>> InitializeAsync(
        TrackingProviderConfiguration configuration,
        CancellationToken cancellationToken = default) =>
        throw NotSupported();

    public Task<TrackingOperationResult<bool>> ShutdownAsync(CancellationToken cancellationToken = default) =>
        throw NotSupported();

    public Task<TrackingOperationResult<bool>> ValidateConfigurationAsync(
        TrackingProviderConfiguration configuration,
        CancellationToken cancellationToken = default) =>
        throw NotSupported();

    public Task<TrackingOperationResult<TrackingVehicleLocation>> GetVehicleLocationAsync(
        int vehicleId,
        CancellationToken cancellationToken = default) =>
        throw NotSupported();

    public Task<TrackingOperationResult<IReadOnlyList<TrackingVehicleLocation>>> GetAllVehicleLocationsAsync(
        bool onlineOnly = false,
        bool gpsEnabledOnly = true,
        CancellationToken cancellationToken = default) =>
        throw NotSupported();

    public Task<TrackingOperationResult<TrackingVehicleOdometer>> GetVehicleOdometerAsync(
        int vehicleId,
        CancellationToken cancellationToken = default) =>
        throw NotSupported();

    public Task<TrackingOperationResult<bool>> IsVehicleOnlineAsync(
        int vehicleId,
        CancellationToken cancellationToken = default) =>
        throw NotSupported();

    public Task<TrackingOperationResult<IReadOnlyList<TrackingDevice>>> GetAllDevicesAsync(
        CancellationToken cancellationToken = default) =>
        throw NotSupported();

    public Task<TrackingOperationResult<IReadOnlyList<TrackingHistoryPoint>>> GetVehicleHistoryAsync(
        int vehicleId,
        DateTime fromUtc,
        DateTime toUtc,
        CancellationToken cancellationToken = default) =>
        throw NotSupported();

    public Task<TrackingOperationResult<IReadOnlyList<TrackingGeofence>>> GetGeofencesAsync(
        CancellationToken cancellationToken = default) =>
        throw NotSupported();

    public Task<TrackingOperationResult<bool>> SubscribeToEventsAsync(
        ITrackingEventHandler eventHandler,
        CancellationToken cancellationToken = default) =>
        throw NotSupported();

    public Task<TrackingOperationResult<bool>> UnsubscribeFromEventsAsync(CancellationToken cancellationToken = default) =>
        throw NotSupported();

    public Task<TrackingOperationResult<TrackingProviderHealth>> GetHealthStatusAsync(
        CancellationToken cancellationToken = default) =>
        throw NotSupported();

    public Task<TrackingOperationResult<bool>> ValidateConnectionAsync(CancellationToken cancellationToken = default) =>
        throw NotSupported();

    private static NotSupportedException NotSupported() =>
        new("GpsWox provider is a Phase 2 registry stub. Full tracking support is scheduled for T6.1.");
}
