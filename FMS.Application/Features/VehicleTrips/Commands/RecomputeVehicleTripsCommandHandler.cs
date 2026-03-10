/**
 * File: RecomputeVehicleTripsCommandHandler.cs
 * Purpose: Rebuilds persisted trip groups and legs for a vehicle and time range.
 * Dependencies: DbContext, geofence detection service, cluster detection service, FMSResponse.
 * Last Modified: 2026-03-10
 */
using System;
using System.Collections.Generic;
using System.Linq;
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

namespace FMS.Application.Features.VehicleTrips.Commands;

public class RecomputeVehicleTripsCommandHandler : IRequestHandler<RecomputeVehicleTripsCommand, FMSResponse<VehicleTripRecomputeResultDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IVehicleTripGeofenceDetectionService _geofenceDetectionService;
    private readonly IVehicleTripClusterDetectionService _clusterDetectionService;
    private readonly ILogger<RecomputeVehicleTripsCommandHandler> _logger;

    public RecomputeVehicleTripsCommandHandler(
        GpsdataContext context,
        IVehicleTripGeofenceDetectionService geofenceDetectionService,
        IVehicleTripClusterDetectionService clusterDetectionService,
        ILogger<RecomputeVehicleTripsCommandHandler> logger)
    {
        _context = context;
        _geofenceDetectionService = geofenceDetectionService;
        _clusterDetectionService = clusterDetectionService;
        _logger = logger;
    }

    public async Task<FMSResponse<VehicleTripRecomputeResultDTO>> Handle(RecomputeVehicleTripsCommand request, CancellationToken cancellationToken)
    {
        var fromUtc = request.FromUtc?.ToUniversalTime() ?? DateTime.UtcNow.AddDays(-7);
        var toUtc = request.ToUtc?.ToUniversalTime() ?? DateTime.UtcNow;

        if (request.VehicleId <= 0)
        {
            return FMSResponse<VehicleTripRecomputeResultDTO>.ValidationFailed(new List<string> { "VehicleId is required." });
        }

        if (fromUtc >= toUtc)
        {
            return FMSResponse<VehicleTripRecomputeResultDTO>.ValidationFailed(new List<string> { "FromUtc must be earlier than ToUtc." });
        }

        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.VehicleId == request.VehicleId, cancellationToken);

        if (vehicle == null)
        {
            return FMSResponse<VehicleTripRecomputeResultDTO>.NotFound("VEHICLE_NOT_FOUND", $"Vehicle {request.VehicleId} was not found.");
        }

        try
        {
            var existingTrips = await _context.VehicleTrips
                .Where(t => t.VehicleId == request.VehicleId && t.StartTimeUtc <= toUtc && t.EndTimeUtc >= fromUtc)
                .ToListAsync(cancellationToken);

            if (existingTrips.Count > 0)
            {
                _context.VehicleTrips.RemoveRange(existingTrips);
            }

            var existingGroups = await _context.VehicleTripGroups
                .Where(g => g.VehicleId == request.VehicleId && g.StartTimeUtc <= toUtc && g.EndTimeUtc >= fromUtc)
                .ToListAsync(cancellationToken);

            if (existingGroups.Count > 0)
            {
                _context.VehicleTripGroups.RemoveRange(existingGroups);
            }

            var detectedTrips = vehicle.MovementProfile switch
            {
                VehicleMovementProfile.Cluster => await _clusterDetectionService.DetectTripsAsync(vehicle, fromUtc, toUtc, cancellationToken),
                VehicleMovementProfile.Geofence or VehicleMovementProfile.Undefined => await _geofenceDetectionService.DetectTripsAsync(vehicle, fromUtc, toUtc, cancellationToken),
                _ => throw new InvalidOperationException($"Movement profile '{vehicle.MovementProfile}' is not supported for trip recompute."),
            };

            var groupedTrips = detectedTrips
                .GroupBy(t => new
                {
                    TripDate = t.StartTimeUtc.Date,
                    t.OriginSiteId,
                    t.DestinationSiteId,
                    t.MovementProfile,
                    t.DetectionMode
                })
                .OrderBy(g => g.Key.TripDate)
                .ToList();

            var groupsCreated = 0;
            var tripsCreated = 0;

            foreach (var groupedTrip in groupedTrips)
            {
                var orderedTrips = groupedTrip.OrderBy(t => t.StartTimeUtc).ToList();
                var group = new VehicleTripGroup
                {
                    VehicleId = request.VehicleId,
                    TripDate = groupedTrip.Key.TripDate,
                    StartTimeUtc = orderedTrips.Min(t => t.StartTimeUtc),
                    EndTimeUtc = orderedTrips.Max(t => t.EndTimeUtc),
                    OriginSiteId = groupedTrip.Key.OriginSiteId,
                    DestinationSiteId = groupedTrip.Key.DestinationSiteId,
                    TripCount = orderedTrips.Count,
                    TotalDistanceKm = orderedTrips.Sum(t => t.DistanceKm),
                    TotalDurationMinutes = orderedTrips.Sum(t => t.DurationMinutes),
                    MovementProfile = groupedTrip.Key.MovementProfile,
                    DetectionMode = groupedTrip.Key.DetectionMode,
                    CreatedAtUtc = DateTime.UtcNow,
                    UpdatedAtUtc = DateTime.UtcNow,
                };

                var sequenceNo = 1;
                foreach (var detectedTrip in orderedTrips)
                {
                    group.Trips.Add(new VehicleTrip
                    {
                        VehicleId = request.VehicleId,
                        SequenceNo = sequenceNo++,
                        StartTimeUtc = detectedTrip.StartTimeUtc,
                        EndTimeUtc = detectedTrip.EndTimeUtc,
                        OriginSiteId = detectedTrip.OriginSiteId,
                        DestinationSiteId = detectedTrip.DestinationSiteId,
                        OriginGeofenceId = detectedTrip.OriginGeofenceId,
                        DestinationGeofenceId = detectedTrip.DestinationGeofenceId,
                        StartLatitude = detectedTrip.StartLatitude,
                        StartLongitude = detectedTrip.StartLongitude,
                        EndLatitude = detectedTrip.EndLatitude,
                        EndLongitude = detectedTrip.EndLongitude,
                        DistanceKm = detectedTrip.DistanceKm,
                        DurationMinutes = detectedTrip.DurationMinutes,
                        MaxSpeedKph = detectedTrip.MaxSpeedKph,
                        MovementProfile = detectedTrip.MovementProfile,
                        DetectionMode = detectedTrip.DetectionMode,
                        CreatedAtUtc = DateTime.UtcNow,
                    });
                }

                _context.VehicleTripGroups.Add(group);
                groupsCreated++;
                tripsCreated += orderedTrips.Count;
            }

            await _context.SaveChangesAsync(cancellationToken);

            return FMSResponse<VehicleTripRecomputeResultDTO>.Success(
                new VehicleTripRecomputeResultDTO
                {
                    VehicleId = request.VehicleId,
                    FromUtc = fromUtc,
                    ToUtc = toUtc,
                    GroupsCreated = groupsCreated,
                    TripsCreated = tripsCreated,
                    MovementProfile = vehicle.MovementProfile,
                },
                groupedTrips.Count == 0
                    ? "Trip recompute completed. No trips were detected for the selected period."
                    : "Trip recompute completed successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recomputing trips for vehicle {VehicleId}", request.VehicleId);
            return FMSResponse<VehicleTripRecomputeResultDTO>.SystemError($"Failed to recompute trips: {ex.Message}");
        }
    }
}
