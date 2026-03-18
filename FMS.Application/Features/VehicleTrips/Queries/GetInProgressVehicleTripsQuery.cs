/**
 * File: GetInProgressVehicleTripsQuery.cs
 * Purpose: Query contract for reading persisted in-progress trips across the fleet.
 * Dependencies: MediatR, FMSResponse, VehicleTripInProgressDTO.
 * Last Modified: 2026-03-11
 */
using System.Collections.Generic;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTrips.DTOs;
using MediatR;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Linq;
using System.Threading.Tasks;
using System.Threading;
using System;

namespace FMS.Application.Features.VehicleTrips.Queries;

public record GetInProgressVehicleTripsQuery : IRequest<FMSResponse<List<VehicleTripInProgressDTO>>>
{
    public int? VehicleId { get; init; }
    public int? SiteId { get; init; }
}

public class GetInProgressVehicleTripsQueryHandler : IRequestHandler<GetInProgressVehicleTripsQuery, FMSResponse<List<VehicleTripInProgressDTO>>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetInProgressVehicleTripsQueryHandler> _logger;

    public GetInProgressVehicleTripsQueryHandler(
        GpsdataContext context,
        ILogger<GetInProgressVehicleTripsQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<List<VehicleTripInProgressDTO>>> Handle(GetInProgressVehicleTripsQuery request, CancellationToken cancellationToken)
    {
        if (request.VehicleId.HasValue && request.VehicleId.Value <= 0)
        {
            return FMSResponse<List<VehicleTripInProgressDTO>>.ValidationFailed(new List<string> { "VehicleId must be greater than zero." });
        }

        if (request.SiteId.HasValue && request.SiteId.Value <= 0)
        {
            return FMSResponse<List<VehicleTripInProgressDTO>>.ValidationFailed(new List<string> { "SiteId must be greater than zero." });
        }

        try
        {
            var query = _context.VehicleTripGroups
                .AsNoTracking()
                .Include(group => group.Vehicle)
                .Include(group => group.OriginSite)
                .Include(group => group.DestinationSite)
                .Include(group => group.Trips)
                    .ThenInclude(trip => trip.DestinationSite)
                .Where(group => group.Status == (int)VehicleTripStatus.InProgress);

            if (request.VehicleId.HasValue)
            {
                query = query.Where(group => group.VehicleId == request.VehicleId.Value);
            }

            if (request.SiteId.HasValue)
            {
                query = query.Where(group => group.OriginSiteId == request.SiteId.Value || group.DestinationSiteId == request.SiteId.Value);
            }

            var groups = await query
                .OrderByDescending(group => group.StartTimeUtc)
                .ToListAsync(cancellationToken);

            var result = groups
                .Select(group =>
                {
                    var currentTrip = group.Trips
                        .OrderByDescending(trip => trip.SequenceNo)
                        .FirstOrDefault(trip => trip.Status == (int)VehicleTripStatus.InProgress)
                        ?? group.Trips.OrderByDescending(trip => trip.SequenceNo).FirstOrDefault();

                    var vehicleLabel = !string.IsNullOrWhiteSpace(group.Vehicle.NumberPlate)
                        ? $"{group.Vehicle.HyoungNo} / {group.Vehicle.NumberPlate}"
                        : group.Vehicle.HyoungNo;

                    return new VehicleTripInProgressDTO
                    {
                        VehicleTripGroupId = group.VehicleTripGroupId,
                        VehicleTripId = currentTrip?.VehicleTripId ?? 0,
                        VehicleId = group.VehicleId,
                        VehicleLabel = vehicleLabel,
                        NumberPlate = group.Vehicle.NumberPlate,
                        TripDate = group.TripDate,
                        StartedAtUtc = group.StartTimeUtc,
                        LastUpdatedAtUtc = currentTrip?.EndTimeUtc ?? group.UpdatedAtUtc ?? group.StartTimeUtc,
                        OriginSiteId = group.OriginSiteId,
                        OriginSiteName = group.OriginSite?.Name,
                        OriginDisplayName = group.OriginSite?.Name ?? (currentTrip != null ? $"Cluster ({currentTrip.StartLatitude:F5}, {currentTrip.StartLongitude:F5})" : "Unknown"),
                        EstimatedDestinationSiteId = group.DestinationSiteId,
                        EstimatedDestinationSiteName = group.DestinationSite?.Name ?? currentTrip?.DestinationSite?.Name,
                        CurrentLatitude = currentTrip?.EndLatitude ?? 0m,
                        CurrentLongitude = currentTrip?.EndLongitude ?? 0m,
                        DistanceKm = currentTrip?.DistanceKm ?? group.TotalDistanceKm,
                        DurationMinutes = currentTrip?.DurationMinutes ?? group.TotalDurationMinutes,
                        MaxSpeedKph = currentTrip?.MaxSpeedKph,
                        FuelAtDeparture = currentTrip?.FuelAtDeparture,
                        FuelAtArrival = currentTrip?.FuelAtArrival,
                        FuelConsumed = currentTrip?.FuelConsumed,
                        Status = VehicleTripStatus.InProgress,
                        MovementProfile = group.MovementProfile,
                        DetectionMode = group.DetectionMode,
                        ConfidenceScore = currentTrip?.ConfidenceScore ?? group.ConfidenceScore,
                        ConfidenceBand = currentTrip?.ConfidenceBand ?? group.ConfidenceBand,
                        AnomalyFlags = currentTrip != null ? (VehicleTripAnomalyType)currentTrip.AnomalyFlags : (VehicleTripAnomalyType)group.AnomalyFlags,
                        ReconciliationStatus = (VehicleTripReconciliationStatus)group.ReconciliationStatus,
                        IsOutOfBounds = currentTrip?.IsOutOfBounds ?? group.IsOutOfBounds,
                        IsProductiveMovement = currentTrip?.IsProductiveMovement ?? group.IsProductiveMovement,
                        PlanningMatchStatus = currentTrip?.PlanningMatchStatus ?? group.PlanningMatchStatus,
                    };
                })
                .Where(item => item.VehicleTripId > 0)
                .ToList();

            return FMSResponse<List<VehicleTripInProgressDTO>>.Success(result, "In-progress trips retrieved successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading in-progress vehicle trips");
            return FMSResponse<List<VehicleTripInProgressDTO>>.SystemError($"Failed to read in-progress trips: {ex.Message}");
        }
    }
}
