/*
 * File:          GpsGateDeviceProvider.cs
 * Purpose:       Adapts the legacy GPSGate provider to the canonical tracking provider
 *                contract used by FMS.Devices.Core provider resolution.
 * Dependencies:  GPSGateProvider, FMS.Devices.Abstractions
 * Last Modified: 2026-05-03
 *
 * Key Functions:
 * - GetVehicleLocationAsync(): Maps legacy location DTOs to canonical tracking models.
 * - GetHealthStatusAsync(): Maps legacy health responses to canonical tracking health.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.VehicleTracking.DTOs;
using FMS.Devices.Abstractions.Common;
using FMS.Devices.Abstractions.Tracking;
using LegacyTracking = FMS.Infrastructure.VehicleTracking;

namespace FMS.Devices.Tracking.Providers.GpsGate;

[Provider(GpsGateProviderConstants.Name, DeviceCategory.Tracking, "2.0.0")]
public sealed class GpsGateDeviceProvider : ITrackingProviderMarker
{
    private readonly GPSGateProvider _legacyProvider;

    public GpsGateDeviceProvider(GPSGateProvider legacyProvider)
    {
        _legacyProvider = legacyProvider ?? throw new ArgumentNullException(nameof(legacyProvider));
    }

    public string ProviderName => GpsGateProviderConstants.Name;

    public string ProviderVersion => "2.0.0";

    public ProviderMetadata Metadata { get; } = new()
    {
        Name = GpsGateProviderConstants.Name,
        DisplayName = "GPSGate Vehicle Tracker",
        Category = DeviceCategory.Tracking,
        Version = "2.0.0",
        Capabilities = ProviderCapabilities.LiveLocation
            | ProviderCapabilities.HistoricalLocation
            | ProviderCapabilities.Geofences
            | ProviderCapabilities.DeviceDiscovery
            | ProviderCapabilities.HealthCheck,
        Vendor = GpsGateProviderConstants.Name,
        Description = "GPSGate tracking provider exposed through the canonical device-provider registry.",
        DocumentationUrl = "https://gpsgate.com/",
    };

    public ProviderCapabilities Capabilities => Metadata.Capabilities;

    public async Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default)
    {
        var response = await _legacyProvider.ValidateConnectionAsync();
        return response.IsSuccess && response.Data;
    }

    public async Task<TrackingOperationResult<bool>> InitializeAsync(
        TrackingProviderConfiguration configuration,
        CancellationToken cancellationToken = default)
    {
        var response = await _legacyProvider.InitializeAsync(MapConfiguration(configuration));
        return MapResponse(response, response.Data);
    }

    public async Task<TrackingOperationResult<bool>> ShutdownAsync(CancellationToken cancellationToken = default)
    {
        var response = await _legacyProvider.ShutdownAsync();
        return MapResponse(response, response.Data);
    }

    public async Task<TrackingOperationResult<bool>> ValidateConfigurationAsync(
        TrackingProviderConfiguration configuration,
        CancellationToken cancellationToken = default)
    {
        var response = await _legacyProvider.ValidateConfigurationAsync(MapConfiguration(configuration));
        return MapResponse(response, response.Data);
    }

    public async Task<TrackingOperationResult<TrackingVehicleLocation>> GetVehicleLocationAsync(
        int vehicleId,
        CancellationToken cancellationToken = default)
    {
        var response = await _legacyProvider.GetVehicleLocationAsync(vehicleId);
        return MapResponse(response, response.Data is null ? null : MapLocation(response.Data));
    }

    public async Task<TrackingOperationResult<IReadOnlyList<TrackingVehicleLocation>>> GetAllVehicleLocationsAsync(
        bool onlineOnly = false,
        bool gpsEnabledOnly = true,
        CancellationToken cancellationToken = default)
    {
        var response = await _legacyProvider.GetAllVehicleLocationsAsync(onlineOnly, gpsEnabledOnly);
        IReadOnlyList<TrackingVehicleLocation> locations = response.Data?.Select(MapLocation).ToList()
            ?? new List<TrackingVehicleLocation>();
        return MapResponse(response, locations);
    }

    public async Task<TrackingOperationResult<TrackingVehicleOdometer>> GetVehicleOdometerAsync(
        int vehicleId,
        CancellationToken cancellationToken = default)
    {
        var response = await _legacyProvider.GetVehicleOdometerAsync(vehicleId);
        return MapResponse(response, response.Data is null ? null : MapOdometer(response.Data));
    }

    public async Task<TrackingOperationResult<bool>> IsVehicleOnlineAsync(
        int vehicleId,
        CancellationToken cancellationToken = default)
    {
        var response = await _legacyProvider.IsVehicleOnlineAsync(vehicleId);
        return MapResponse(response, response.Data);
    }

    public async Task<TrackingOperationResult<IReadOnlyList<TrackingDevice>>> GetAllDevicesAsync(
        CancellationToken cancellationToken = default)
    {
        var response = await _legacyProvider.GetAllDevicesAsync();
        IReadOnlyList<TrackingDevice> devices = response.Data?.Select(MapDevice).ToList()
            ?? new List<TrackingDevice>();
        return MapResponse(response, devices);
    }

    public async Task<TrackingOperationResult<IReadOnlyList<TrackingHistoryPoint>>> GetVehicleHistoryAsync(
        int vehicleId,
        DateTime fromUtc,
        DateTime toUtc,
        CancellationToken cancellationToken = default)
    {
        var response = await _legacyProvider.GetVehicleHistoryAsync(vehicleId, fromUtc, toUtc);
        IReadOnlyList<TrackingHistoryPoint> points = response.Data?.Select(MapHistoryPoint).ToList()
            ?? new List<TrackingHistoryPoint>();
        return MapResponse(response, points);
    }

    public async Task<TrackingOperationResult<IReadOnlyList<TrackingGeofence>>> GetGeofencesAsync(
        CancellationToken cancellationToken = default)
    {
        var response = await _legacyProvider.GetGeofencesAsync();
        IReadOnlyList<TrackingGeofence> geofences = response.Data?.Select(MapGeofence).ToList()
            ?? new List<TrackingGeofence>();
        return MapResponse(response, geofences);
    }

    public async Task<TrackingOperationResult<bool>> SubscribeToEventsAsync(
        ITrackingEventHandler eventHandler,
        CancellationToken cancellationToken = default)
    {
        var response = await _legacyProvider.SubscribeToEventsAsync(new LegacyEventHandlerAdapter(eventHandler, cancellationToken));
        return MapResponse(response, response.Data);
    }

    public async Task<TrackingOperationResult<bool>> UnsubscribeFromEventsAsync(CancellationToken cancellationToken = default)
    {
        var response = await _legacyProvider.UnsubscribeFromEventsAsync();
        return MapResponse(response, response.Data);
    }

    public async Task<TrackingOperationResult<TrackingProviderHealth>> GetHealthStatusAsync(
        CancellationToken cancellationToken = default)
    {
        var response = await _legacyProvider.GetHealthStatusAsync();
        return MapResponse(response, response.Data is null ? null : MapHealth(response.Data));
    }

    public async Task<TrackingOperationResult<bool>> ValidateConnectionAsync(CancellationToken cancellationToken = default)
    {
        var response = await _legacyProvider.ValidateConnectionAsync();
        return MapResponse(response, response.Data);
    }

    private static LegacyTracking.Models.ProviderConfiguration MapConfiguration(TrackingProviderConfiguration configuration) =>
        new()
        {
            Id = configuration.Id,
            Name = configuration.Name,
            DisplayName = configuration.DisplayName,
            Settings = configuration.Settings,
            IsEnabled = configuration.IsEnabled,
            IsDefault = configuration.IsDefault,
            Priority = configuration.Priority,
            Version = "2.0.0",
        };

    private static TrackingVehicleLocation MapLocation(VehicleLocationDTO dto) =>
        new()
        {
            VehicleId = dto.VehicleId,
            ProviderDeviceId = dto.ExternalDeviceId ?? dto.DeviceId?.ToString(),
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            Altitude = dto.Altitude,
            Speed = dto.Speed,
            Heading = dto.Heading,
            TimestampUtc = ToUtc(dto.LastUpdated),
            IsOnline = dto.IsOnline,
            AdditionalData = new Dictionary<string, object?>
            {
                ["vehicleName"] = dto.VehicleName,
                ["numberPlate"] = dto.NumberPlate,
                ["address"] = dto.Address,
                ["odometer"] = dto.Odometer,
                ["hasGpsInstalled"] = dto.HasGPSInstalled,
                ["validationStatus"] = dto.ValidationStatus.ToString(),
                ["validationStatusReason"] = dto.ValidationStatusReason,
                ["isCached"] = dto.IsCached,
            },
        };

    private static TrackingVehicleOdometer MapOdometer(VehicleOdometerDTO dto) =>
        new()
        {
            VehicleId = dto.VehicleId,
            Odometer = dto.CurrentOdometer,
            Unit = dto.Unit,
            TimestampUtc = ToUtc(dto.LastUpdated),
        };

    private static TrackingDevice MapDevice(GPSDeviceDTO dto) =>
        new()
        {
            ProviderDeviceId = dto.Id.ToString(),
            DisplayName = string.IsNullOrWhiteSpace(dto.Name) ? dto.Username : dto.Name,
            IsOnline = dto.IsOnline,
            MappedVehicleId = dto.MappedVehicleId,
            LastSeenUtc = dto.LastDeviceActivity.HasValue ? ToUtc(dto.LastDeviceActivity.Value) : null,
        };

    private static TrackingHistoryPoint MapHistoryPoint(LegacyTracking.Interfaces.VehicleHistoryPoint point) =>
        new()
        {
            TimestampUtc = ToUtc(point.Timestamp),
            Latitude = point.Latitude,
            Longitude = point.Longitude,
            Altitude = point.Altitude,
            Speed = point.Speed,
            Heading = point.Heading,
        };

    private static TrackingGeofence MapGeofence(GeofenceDTO dto) =>
        new()
        {
            ProviderGeofenceId = dto.Id.ToString(),
            Name = dto.Name,
            Points = dto.Coordinates
                .OrderBy(c => c.Order)
                .Select(c => new TrackingGeoPoint { Latitude = c.Latitude, Longitude = c.Longitude })
                .ToList(),
        };

    private static TrackingProviderHealth MapHealth(LegacyTracking.Models.ProviderHealthStatus status) =>
        new()
        {
            ProviderName = status.ProviderName,
            Status = status.Status switch
            {
                LegacyTracking.Models.HealthStatus.Healthy => TrackingHealthStatus.Healthy,
                LegacyTracking.Models.HealthStatus.Degraded => TrackingHealthStatus.Degraded,
                LegacyTracking.Models.HealthStatus.Unhealthy => TrackingHealthStatus.Unhealthy,
                _ => TrackingHealthStatus.Unknown,
            },
            CheckedAtUtc = ToUtc(status.CheckedAt),
            Message = status.Message,
            ResponseTimeMs = status.ResponseTimeMs,
        };

    private static TrackingOperationResult<T> MapResponse<T>(FMSResponse response, T? data)
    {
        if (response.IsSuccess && data is not null)
        {
            return TrackingOperationResult<T>.Success(data, response.Message);
        }

        var errors = response.ValidationErrors?.ToArray() ?? Array.Empty<string>();
        return TrackingOperationResult<T>.Failed(response.Message, errors);
    }

    private static DateTime ToUtc(DateTime value) =>
        value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc),
        };

    private sealed class LegacyEventHandlerAdapter : LegacyTracking.Interfaces.IEventHandler
    {
        private readonly ITrackingEventHandler _inner;
        private readonly CancellationToken _cancellationToken;

        public LegacyEventHandlerAdapter(ITrackingEventHandler inner, CancellationToken cancellationToken)
        {
            _inner = inner;
            _cancellationToken = cancellationToken;
        }

        public Task HandleEventAsync(string eventType, object eventData) =>
            _inner.HandleEventAsync(eventType, eventData, _cancellationToken);
    }
}
