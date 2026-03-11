/**
 * File: GetVehicleTripsQueryHandler.cs
 * Purpose: Reads persisted trip groups for the trip management workbench.
 * Dependencies: DbContext, FMSResponse, VehicleTripListItemDTO.
 * Last Modified: 2026-03-10
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTrips.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleTrips.Queries;

public class GetVehicleTripsQueryHandler : IRequestHandler<GetVehicleTripsQuery, FMSResponse<List<VehicleTripListItemDTO>>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetVehicleTripsQueryHandler> _logger;

    public GetVehicleTripsQueryHandler(GpsdataContext context, ILogger<GetVehicleTripsQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<List<VehicleTripListItemDTO>>> Handle(GetVehicleTripsQuery request, CancellationToken cancellationToken)
    {
        var fromUtc = request.FromUtc?.ToUniversalTime() ?? DateTime.UtcNow.AddDays(-7);
        var toUtc = request.ToUtc?.ToUniversalTime() ?? DateTime.UtcNow;

        if (request.VehicleId.HasValue && request.VehicleId.Value <= 0)
        {
            return FMSResponse<List<VehicleTripListItemDTO>>.ValidationFailed(new List<string> { "VehicleId must be greater than zero." });
        }

        if (fromUtc >= toUtc)
        {
            return FMSResponse<List<VehicleTripListItemDTO>>.ValidationFailed(new List<string> { "FromUtc must be earlier than ToUtc." });
        }

        try
        {
            var query = _context.VehicleTripGroups
                .AsNoTracking()
                .Include(g => g.Vehicle)
                .Include(g => g.OriginSite)
                .Include(g => g.DestinationSite)
                .Include(g => g.Trips)
                .Where(g => g.StartTimeUtc <= toUtc && g.EndTimeUtc >= fromUtc);

            if (request.VehicleId.HasValue)
            {
                query = query.Where(g => g.VehicleId == request.VehicleId.Value);
            }

            if (request.MovementProfile.HasValue)
            {
                query = query.Where(g => g.MovementProfile == request.MovementProfile.Value);
            }

            if (!string.IsNullOrWhiteSpace(request.DetectionMode))
            {
                var normalizedMode = request.DetectionMode.Trim();
                query = query.Where(g => g.DetectionMode == normalizedMode);
            }

            var persistedGroups = await query
                .OrderByDescending(g => g.StartTimeUtc)
                .Take(500)
                .ToListAsync(cancellationToken);

            var results = persistedGroups
                .Select(g =>
                {
                    var firstTrip = g.Trips
                        .OrderBy(t => t.SequenceNo)
                        .FirstOrDefault();
                    var lastTrip = g.Trips
                        .OrderByDescending(t => t.SequenceNo)
                        .FirstOrDefault();

                    var originDisplayName = g.OriginSite != null
                        ? g.OriginSite.Name
                        : firstTrip != null
                            ? $"Cluster ({firstTrip.StartLatitude:F5}, {firstTrip.StartLongitude:F5})"
                            : "Unknown";

                    var destinationDisplayName = g.DestinationSite != null
                        ? g.DestinationSite.Name
                        : lastTrip != null
                            ? $"Cluster ({lastTrip.EndLatitude:F5}, {lastTrip.EndLongitude:F5})"
                            : "Unknown";

                    var vehicleLabel = !string.IsNullOrWhiteSpace(g.Vehicle.NumberPlate)
                        ? $"{g.Vehicle.HyoungNo} / {g.Vehicle.NumberPlate}"
                        : g.Vehicle.HyoungNo;

                    return new VehicleTripListItemDTO
                    {
                        VehicleTripGroupId = g.VehicleTripGroupId,
                        VehicleId = g.VehicleId,
                        VehicleLabel = vehicleLabel,
                        NumberPlate = g.Vehicle.NumberPlate,
                        TripDate = g.TripDate,
                        StartTimeUtc = g.StartTimeUtc,
                        EndTimeUtc = g.EndTimeUtc,
                        OriginDisplayName = originDisplayName,
                        DestinationDisplayName = destinationDisplayName,
                        TripCount = g.TripCount,
                        TotalDistanceKm = g.TotalDistanceKm,
                        TotalDurationMinutes = g.TotalDurationMinutes,
                        MovementProfile = g.MovementProfile,
                        DetectionMode = g.DetectionMode,
                    };
                })
                .ToList();

            return FMSResponse<List<VehicleTripListItemDTO>>.Success(results, "Vehicle trips retrieved successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading vehicle trips for trip management page");
            return FMSResponse<List<VehicleTripListItemDTO>>.SystemError($"Failed to read vehicle trips: {ex.Message}");
        }
    }
}