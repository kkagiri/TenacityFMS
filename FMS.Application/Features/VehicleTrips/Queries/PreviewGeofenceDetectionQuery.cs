/**
 * File: PreviewGeofenceDetectionQuery.cs
 * Purpose: Query contract and handler for running a dry-run geofence detection preview without persisting data.
 * Dependencies: MediatR, FMSResponse, GeofenceDetectionPreviewDTO, GpsdataContext, IVehicleTripGeofenceDetectionService.
 * Last Modified: 2026-03-17
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTrips.DTOs;
using FMS.Application.Features.VehicleTrips.Services;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FMS.Application.Features.VehicleTrips.Queries;

public record PreviewGeofenceDetectionQuery : IRequest<FMSResponse<GeofenceDetectionPreviewDTO>>
{
    public int VehicleId { get; init; }
    public DateTime FromUtc { get; init; }
    public DateTime ToUtc { get; init; }

    // Optional settings overrides for playground mode.
    public decimal? MinimumTripDistanceKm { get; init; }
    public decimal? MinimumTripDurationMinutes { get; init; }
    public int? MaxTrackPoints { get; init; }

    // Optional geofence group filter — only test against sites in this group.
    public int? GeofenceGroupId { get; init; }
}

public class PreviewGeofenceDetectionQueryHandler
    : IRequestHandler<PreviewGeofenceDetectionQuery, FMSResponse<GeofenceDetectionPreviewDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IVehicleTripGeofenceDetectionService _geofenceDetectionService;
    private readonly IOptions<VehicleTripGeofenceDetectionOptions> _defaultOptions;
    private readonly ILogger<PreviewGeofenceDetectionQueryHandler> _logger;

    public PreviewGeofenceDetectionQueryHandler(
        GpsdataContext context,
        IVehicleTripGeofenceDetectionService geofenceDetectionService,
        IOptions<VehicleTripGeofenceDetectionOptions> defaultOptions,
        ILogger<PreviewGeofenceDetectionQueryHandler> logger)
    {
        _context = context;
        _geofenceDetectionService = geofenceDetectionService;
        _defaultOptions = defaultOptions;
        _logger = logger;
    }

    public async Task<FMSResponse<GeofenceDetectionPreviewDTO>> Handle(
        PreviewGeofenceDetectionQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            if (request.VehicleId <= 0)
            {
                return FMSResponse<GeofenceDetectionPreviewDTO>.Failed("Vehicle ID is required.");
            }

            if (request.FromUtc >= request.ToUtc)
            {
                return FMSResponse<GeofenceDetectionPreviewDTO>.Failed("FromUtc must be before ToUtc.");
            }

            var vehicle = await _context.Vehicles
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.VehicleId == request.VehicleId, cancellationToken);

            if (vehicle == null)
            {
                return FMSResponse<GeofenceDetectionPreviewDTO>.Failed($"Vehicle {request.VehicleId} not found.");
            }

            if (vehicle.MovementProfile != VehicleMovementProfile.Geofence)
            {
                _logger.LogWarning(
                    "Geofence detection preview requested for vehicle {VehicleId} with movement profile {Profile}. Expected Geofence.",
                    request.VehicleId, vehicle.MovementProfile);
            }

            var defaults = _defaultOptions.Value;
            var hasOverrides = request.MinimumTripDistanceKm.HasValue
                || request.MinimumTripDurationMinutes.HasValue
                || request.MaxTrackPoints.HasValue;

            VehicleTripGeofenceDetectionOptions? overrideOptions = null;
            if (hasOverrides)
            {
                overrideOptions = new VehicleTripGeofenceDetectionOptions
                {
                    MinimumTripDistanceKm = request.MinimumTripDistanceKm ?? defaults.MinimumTripDistanceKm,
                    MinimumTripDurationMinutes = request.MinimumTripDurationMinutes ?? defaults.MinimumTripDurationMinutes,
                    MaxTrackPoints = request.MaxTrackPoints ?? defaults.MaxTrackPoints,
                };
            }

            var preview = await _geofenceDetectionService.PreviewDetectionAsync(
                vehicle,
                request.FromUtc,
                request.ToUtc,
                overrideOptions,
                request.GeofenceGroupId,
                cancellationToken);

            return FMSResponse<GeofenceDetectionPreviewDTO>.Success(
                preview,
                $"Geofence detection preview completed: {preview.TotalTrackPoints} track points, {preview.SiteGeofences.Count} site geofences.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running geofence detection preview for vehicle {VehicleId}", request.VehicleId);
            return FMSResponse<GeofenceDetectionPreviewDTO>.SystemError(
                $"Geofence detection preview failed: {ex.Message}");
        }
    }
}
