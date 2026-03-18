/**
 * File: PreviewClusterDetectionQuery.cs
 * Purpose: Query contract and handler for running a dry-run cluster detection preview without persisting data.
 * Dependencies: MediatR, FMSResponse, ClusterDetectionPreviewDTO, GpsdataContext, IVehicleTripClusterDetectionService.
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

public record PreviewClusterDetectionQuery : IRequest<FMSResponse<ClusterDetectionPreviewDTO>>
{
    public int VehicleId { get; init; }
    public DateTime FromUtc { get; init; }
    public DateTime ToUtc { get; init; }

    // Optional settings overrides for playground mode.
    // When null, the saved/default IOptions values are used.
    public decimal? StopSpeedThresholdKph { get; init; }
    public decimal? MinimumStopDurationMinutes { get; init; }
    public decimal? MinimumTripDistanceKm { get; init; }
    public decimal? MinimumTripDurationMinutes { get; init; }
    public double? ClusterRadiusMeters { get; init; }
    public int? MaxTrackPoints { get; init; }
}

public class PreviewClusterDetectionQueryHandler
    : IRequestHandler<PreviewClusterDetectionQuery, FMSResponse<ClusterDetectionPreviewDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IVehicleTripClusterDetectionService _clusterDetectionService;
    private readonly IOptions<VehicleTripClusterDetectionOptions> _defaultOptions;
    private readonly ILogger<PreviewClusterDetectionQueryHandler> _logger;

    public PreviewClusterDetectionQueryHandler(
        GpsdataContext context,
        IVehicleTripClusterDetectionService clusterDetectionService,
        IOptions<VehicleTripClusterDetectionOptions> defaultOptions,
        ILogger<PreviewClusterDetectionQueryHandler> logger)
    {
        _context = context;
        _clusterDetectionService = clusterDetectionService;
        _defaultOptions = defaultOptions;
        _logger = logger;
    }

    public async Task<FMSResponse<ClusterDetectionPreviewDTO>> Handle(
        PreviewClusterDetectionQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            if (request.VehicleId <= 0)
            {
                return FMSResponse<ClusterDetectionPreviewDTO>.Failed("Vehicle ID is required.");
            }

            if (request.FromUtc >= request.ToUtc)
            {
                return FMSResponse<ClusterDetectionPreviewDTO>.Failed("FromUtc must be before ToUtc.");
            }

            var vehicle = await _context.Vehicles
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.VehicleId == request.VehicleId, cancellationToken);

            if (vehicle == null)
            {
                return FMSResponse<ClusterDetectionPreviewDTO>.Failed($"Vehicle {request.VehicleId} not found.");
            }

            if (vehicle.MovementProfile != VehicleMovementProfile.Cluster)
            {
                _logger.LogWarning(
                    "Cluster detection preview requested for vehicle {VehicleId} with movement profile {Profile}. Expected Cluster.",
                    request.VehicleId, vehicle.MovementProfile);
            }

            var defaults = _defaultOptions.Value;
            var hasOverrides = request.StopSpeedThresholdKph.HasValue
                || request.MinimumStopDurationMinutes.HasValue
                || request.MinimumTripDistanceKm.HasValue
                || request.MinimumTripDurationMinutes.HasValue
                || request.ClusterRadiusMeters.HasValue
                || request.MaxTrackPoints.HasValue;

            if (hasOverrides)
            {
                var overrideOptions = new VehicleTripClusterDetectionOptions
                {
                    StopSpeedThresholdKph = request.StopSpeedThresholdKph ?? defaults.StopSpeedThresholdKph,
                    MinimumStopDurationMinutes = request.MinimumStopDurationMinutes ?? defaults.MinimumStopDurationMinutes,
                    MinimumTripDistanceKm = request.MinimumTripDistanceKm ?? defaults.MinimumTripDistanceKm,
                    MinimumTripDurationMinutes = request.MinimumTripDurationMinutes ?? defaults.MinimumTripDurationMinutes,
                    ClusterRadiusMeters = request.ClusterRadiusMeters ?? defaults.ClusterRadiusMeters,
                    MaxTrackPoints = request.MaxTrackPoints ?? defaults.MaxTrackPoints,
                };

                var preview = await _clusterDetectionService.PreviewDetectionAsync(
                    vehicle,
                    request.FromUtc,
                    request.ToUtc,
                    overrideOptions,
                    cancellationToken);

                return FMSResponse<ClusterDetectionPreviewDTO>.Success(
                    preview,
                    $"Cluster detection preview completed: {preview.StopsDetected} stops, {preview.ClustersFormed} clusters, {preview.TripLegsDetected} trip legs.");
            }

            var defaultPreview = await _clusterDetectionService.PreviewDetectionAsync(
                vehicle,
                request.FromUtc,
                request.ToUtc,
                cancellationToken);

            return FMSResponse<ClusterDetectionPreviewDTO>.Success(
                defaultPreview,
                $"Cluster detection preview completed: {defaultPreview.StopsDetected} stops, {defaultPreview.ClustersFormed} clusters, {defaultPreview.TripLegsDetected} trip legs.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running cluster detection preview for vehicle {VehicleId}", request.VehicleId);
            return FMSResponse<ClusterDetectionPreviewDTO>.SystemError(
                $"Cluster detection preview failed: {ex.Message}");
        }
    }
}
