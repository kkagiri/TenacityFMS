/*
 * File:          TrackingModels.cs
 * Purpose:       Provider-neutral models used by tracking provider plugins.
 * Dependencies:  None
 * Last Modified: 2026-05-03
 *
 * Key Functions:
 * - TrackingOperationResult<T>: Carries success, message, and provider data.
 */
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Devices.Abstractions.Tracking;

public sealed class TrackingOperationResult<T>
{
    public bool IsSuccess { get; init; }
    public string Message { get; init; } = string.Empty;
    public T? Data { get; init; }
    public IReadOnlyList<string> Errors { get; init; } = Array.Empty<string>();

    public static TrackingOperationResult<T> Success(T data, string message = "") =>
        new() { IsSuccess = true, Data = data, Message = message };

    public static TrackingOperationResult<T> Failed(string message, params string[] errors) =>
        new() { IsSuccess = false, Message = message, Errors = errors };
}

public sealed class TrackingProviderConfiguration
{
    public int Id { get; init; }
    public Guid TenantId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string Settings { get; init; } = "{}";
    public bool IsEnabled { get; init; }
    public bool IsDefault { get; init; }
    public int Priority { get; init; } = 999;
}

public sealed class TrackingVehicleLocation
{
    public int VehicleId { get; init; }
    public string? ProviderDeviceId { get; init; }
    public decimal Latitude { get; init; }
    public decimal Longitude { get; init; }
    public decimal? Altitude { get; init; }
    public decimal? Speed { get; init; }
    public decimal? Heading { get; init; }
    public DateTime TimestampUtc { get; init; }
    public bool IsOnline { get; init; }
    public IReadOnlyDictionary<string, object?> AdditionalData { get; init; } =
        new Dictionary<string, object?>();
}

public sealed class TrackingVehicleOdometer
{
    public int VehicleId { get; init; }
    public decimal? Odometer { get; init; }
    public string Unit { get; init; } = "km";
    public DateTime? TimestampUtc { get; init; }
}

public sealed class TrackingDevice
{
    public string ProviderDeviceId { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public bool IsOnline { get; init; }
    public int? MappedVehicleId { get; init; }
    public DateTime? LastSeenUtc { get; init; }
}

public sealed class TrackingHistoryPoint
{
    public DateTime TimestampUtc { get; init; }
    public decimal Latitude { get; init; }
    public decimal Longitude { get; init; }
    public decimal? Altitude { get; init; }
    public decimal? Speed { get; init; }
    public decimal? Heading { get; init; }
}

public sealed class TrackingGeofence
{
    public string ProviderGeofenceId { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public IReadOnlyList<TrackingGeoPoint> Points { get; init; } = Array.Empty<TrackingGeoPoint>();
}

public sealed class TrackingGeoPoint
{
    public decimal Latitude { get; init; }
    public decimal Longitude { get; init; }
}

public sealed class TrackingProviderHealth
{
    public string ProviderName { get; init; } = string.Empty;
    public TrackingHealthStatus Status { get; init; } = TrackingHealthStatus.Unknown;
    public DateTime CheckedAtUtc { get; init; }
    public string Message { get; init; } = string.Empty;
    public int ResponseTimeMs { get; init; }
}

public enum TrackingHealthStatus
{
    Healthy = 0,
    Degraded = 1,
    Unhealthy = 2,
    Unknown = 3
}

public interface ITrackingEventHandler
{
    Task HandleEventAsync(string eventType, object eventData, CancellationToken cancellationToken = default);
}
