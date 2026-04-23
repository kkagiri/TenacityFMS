/**
 * File: VehicleTripDomainEventHandlers.cs
 * Purpose: MediatR notification handlers for vehicle trip domain events.
 *          Persists notification records (Started/Completed) and logs all events.
 * Dependencies: INotificationService, ILogger, MediatR.
 * Last Modified: 2026-03-17
 *
 * Key Handlers:
 * - VehicleTripStartedEventHandler: Logs + persists a notification when a trip begins.
 * - VehicleTripInProgressEventHandler: Logs only (high-frequency, no persistence).
 * - VehicleTripCompletedEventHandler: Logs + persists a notification when a trip finishes.
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.Enums;
using FMS.Application.Features.Notification.Services;
using FMS.Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleTrips.Events;

// ── Trip Started ──

public class VehicleTripStartedEventHandler : INotificationHandler<VehicleTripStartedEvent>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<VehicleTripStartedEventHandler> _logger;

    public VehicleTripStartedEventHandler(
        INotificationService notificationService,
        ILogger<VehicleTripStartedEventHandler> logger)
    {
        _notificationService = notificationService;
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

            var tripLink = NotificationLinkBuilder.ForVehicleTrip(notification.VehicleTripGroupId);
            var request = new CreateNotificationRequest
            {
                Type = NotificationType.Info,
                CategoryId = (int)WellKnownCategories.Generic,
                Priority = NotificationPriority.Low,
                Title = "Vehicle Trip Started",
                Message = $"Vehicle {notification.VehicleId} departed from {notification.OriginSiteName ?? "unknown location"} at {notification.StartTimeUtc:u}.",
                Link = tripLink.Link,
                LinkLabel = tripLink.Label,
                TriggerSource = "VehicleTripDetection",
                VehicleId = notification.VehicleId,
                DisableFallbackAllUsers = true,
                Data = new
                {
                    notification.VehicleTripGroupId,
                    notification.VehicleId,
                    notification.OriginSiteId,
                    notification.OriginSiteName,
                    notification.StartTimeUtc,
                    notification.StartLatitude,
                    notification.StartLongitude,
                },
            };

            var result = await _notificationService.CreateNotificationAsync(request, cancellationToken);
            if (!result.IsSuccess)
            {
                _logger.LogWarning("Failed to persist TripStarted notification for vehicle {VehicleId}: {Message}",
                    notification.VehicleId, result.Message);
            }
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
    private readonly INotificationService _notificationService;
    private readonly ILogger<VehicleTripCompletedEventHandler> _logger;

    public VehicleTripCompletedEventHandler(
        INotificationService notificationService,
        ILogger<VehicleTripCompletedEventHandler> logger)
    {
        _notificationService = notificationService;
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

            var tripLink = NotificationLinkBuilder.ForVehicleTrip(notification.VehicleTripGroupId);
            var request = new CreateNotificationRequest
            {
                Type = NotificationType.Info,
                CategoryId = (int)WellKnownCategories.Generic,
                Priority = NotificationPriority.Low,
                Title = "Vehicle Trip Completed",
                Message = $"Vehicle {notification.VehicleId} completed trip from {notification.OriginSiteName ?? "Unknown"} to {notification.DestinationSiteName ?? "Unknown"} — {notification.DistanceKm:F2} km in {notification.Duration:hh\\:mm\\:ss}.",
                Link = tripLink.Link,
                LinkLabel = tripLink.Label,
                TriggerSource = "VehicleTripDetection",
                VehicleId = notification.VehicleId,
                DisableFallbackAllUsers = true,
                Data = new
                {
                    notification.VehicleTripGroupId,
                    notification.VehicleId,
                    notification.OriginSiteId,
                    notification.OriginSiteName,
                    notification.DestinationSiteId,
                    notification.DestinationSiteName,
                    notification.StartTimeUtc,
                    notification.EndTimeUtc,
                    notification.DistanceKm,
                    notification.MaxSpeedKph,
                    DurationMinutes = notification.Duration.TotalMinutes,
                },
            };

            var result = await _notificationService.CreateNotificationAsync(request, cancellationToken);
            if (!result.IsSuccess)
            {
                _logger.LogWarning("Failed to persist TripCompleted notification for vehicle {VehicleId}: {Message}",
                    notification.VehicleId, result.Message);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling VehicleTripCompletedEvent for vehicle {VehicleId}", notification.VehicleId);
        }
    }
}
