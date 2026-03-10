/**
 * File: GetVehicleTripHistoryQueryHandler.cs
 * Purpose: Reads persisted vehicle trip groups for vehicle details and reporting screens.
 * Dependencies: DbContext, FMSResponse, VehicleTripGroupDTO.
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

public class GetVehicleTripHistoryQueryHandler : IRequestHandler<GetVehicleTripHistoryQuery, FMSResponse<List<VehicleTripGroupDTO>>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetVehicleTripHistoryQueryHandler> _logger;

    public GetVehicleTripHistoryQueryHandler(GpsdataContext context, ILogger<GetVehicleTripHistoryQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<List<VehicleTripGroupDTO>>> Handle(GetVehicleTripHistoryQuery request, CancellationToken cancellationToken)
    {
        var fromUtc = request.FromUtc?.ToUniversalTime() ?? DateTime.UtcNow.AddDays(-30);
        var toUtc = request.ToUtc?.ToUniversalTime() ?? DateTime.UtcNow;

        if (request.VehicleId <= 0)
        {
            return FMSResponse<List<VehicleTripGroupDTO>>.ValidationFailed(new List<string> { "VehicleId is required." });
        }

        if (fromUtc >= toUtc)
        {
            return FMSResponse<List<VehicleTripGroupDTO>>.ValidationFailed(new List<string> { "FromUtc must be earlier than ToUtc." });
        }

        try
        {
            var persistedGroups = await _context.VehicleTripGroups
                .AsNoTracking()
                .Include(g => g.OriginSite)
                .Include(g => g.DestinationSite)
                .Include(g => g.Trips)
                .Where(g => g.VehicleId == request.VehicleId && g.StartTimeUtc <= toUtc && g.EndTimeUtc >= fromUtc)
                .OrderByDescending(g => g.StartTimeUtc)
                .ToListAsync(cancellationToken);

            var groups = persistedGroups
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

                    return new VehicleTripGroupDTO
                    {
                        VehicleTripGroupId = g.VehicleTripGroupId,
                        VehicleId = g.VehicleId,
                        TripDate = g.TripDate,
                        StartTimeUtc = g.StartTimeUtc,
                        EndTimeUtc = g.EndTimeUtc,
                        OriginSiteId = g.OriginSiteId,
                        OriginSiteName = g.OriginSite != null ? g.OriginSite.Name : null,
                        OriginDisplayName = originDisplayName,
                        DestinationSiteId = g.DestinationSiteId,
                        DestinationSiteName = g.DestinationSite != null ? g.DestinationSite.Name : null,
                        DestinationDisplayName = destinationDisplayName,
                        TripCount = g.TripCount,
                        TotalDistanceKm = g.TotalDistanceKm,
                        TotalDurationMinutes = g.TotalDurationMinutes,
                        MovementProfile = g.MovementProfile,
                        DetectionMode = g.DetectionMode,
                    };
                })
                .ToList();

            return FMSResponse<List<VehicleTripGroupDTO>>.Success(groups, "Vehicle trip history retrieved successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading vehicle trip history for vehicle {VehicleId}", request.VehicleId);
            return FMSResponse<List<VehicleTripGroupDTO>>.SystemError($"Failed to read trip history: {ex.Message}");
        }
    }
}
