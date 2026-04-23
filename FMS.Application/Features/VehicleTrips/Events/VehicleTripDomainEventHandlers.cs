/**
 * File: VehicleTripDomainEventHandlers.cs
 * Purpose: MediatR notification handlers for vehicle trip domain events.
 *          Logs realtime trip lifecycle events without persisting start/end notifications.
 * Dependencies: ILogger, MediatR.
 * Last Modified: 2026-04-23
 *
 * Key Handlers:
 * - VehicleTripStartedEventHandler: Logs + persists a notification when a trip begins.
 * - VehicleTripInProgressEventHandler: Logs only (high-frequency, no persistence).
 * - VehicleTripCompletedEventHandler: Logs + persists a notification when a trip finishes.
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleTrips.Events;

// ── Trip Started ──

public class VehicleTripStartedEventHandler : INotificationHandler<VehicleTripStartedEvent>
{
    private readonly ILogger<VehicleTripStartedEventHandler> _logger;

    public VehicleTripStartedEventHandler(
        ILogger<VehicleTripStartedEventHandler> logger)
    {
        _logger = logger;
    }

    public async Task Handle(VehicleTripStartedEvent notification, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation(
                "Trip started for vehicle {VehicleId}, group {GroupId}, origin {OriginSite} at {StartTime:u}",
                notification.VehicleId,
                notification.VehicleTripGroupId,
                notification.OriginSiteName ?? "Unknown",
                notification.StartTimeUtc);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling VehicleTripStartedEvent for vehicle {VehicleId}", notification.VehicleId);
        }
    }
}

// ── Trip In-Progress (logging only — fires frequently) ──

public class VehicleTripInProgressEventHandler : INotificationHandler<VehicleTripInProgressEvent>
{
    private readonly ILogger<VehicleTripInProgressEventHandler> _logger;

    public VehicleTripInProgressEventHandler(ILogger<VehicleTripInProgressEventHandler> logger)
    {
        _logger = logger;
    }

    public Task Handle(VehicleTripInProgressEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogDebug(
            "Trip in-progress: vehicle {VehicleId}, group {GroupId}, distance {Distance:F2} km, speed {Speed:F1} kph at {Timestamp:u}",
            notification.VehicleId,
            notification.VehicleTripGroupId,
            notification.DistanceSoFarKm,
            notification.CurrentSpeedKph,
            notification.TimestampUtc);

        return Task.CompletedTask;
    }
}

// ── Trip Completed ──

public class VehicleTripCompletedEventHandler : INotificationHandler<VehicleTripCompletedEvent>
{
    private readonly ILogger<VehicleTripCompletedEventHandler> _logger;

    public VehicleTripCompletedEventHandler(
        ILogger<VehicleTripCompletedEventHandler> logger)
    {
        _logger = logger;
    }

    public async Task Handle(VehicleTripCompletedEvent notification, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation(
                "Trip completed for vehicle {VehicleId}, group {GroupId}: {Origin} → {Destination}, {Distance:F2} km in {Duration}",
                notification.VehicleId,
                notification.VehicleTripGroupId,
                notification.OriginSiteName ?? "Unknown",
                notification.DestinationSiteName ?? "Unknown",
                notification.DistanceKm,
                notification.Duration);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling VehicleTripCompletedEvent for vehicle {VehicleId}", notification.VehicleId);
        }
    }
}
