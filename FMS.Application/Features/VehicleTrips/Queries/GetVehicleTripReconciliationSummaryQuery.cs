/**
 * File: GetVehicleTripReconciliationSummaryQuery.cs
 * Purpose: Query contract for vehicle-reconciliation consumers that need trip-based movement history.
 * Dependencies: MediatR, FMSResponse, VehicleTripReconciliationSummaryDTO.
 * Last Modified: 2026-03-11
 */
using System;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTrips.DTOs;
using MediatR;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Threading;

namespace FMS.Application.Features.VehicleTrips.Queries;

public record GetVehicleTripReconciliationSummaryQuery : IRequest<FMSResponse<VehicleTripReconciliationSummaryDTO>>
{
    public int? VehicleId { get; init; }
    public DateTime? FromUtc { get; init; }
    public DateTime? ToUtc { get; init; }
}

public class GetVehicleTripReconciliationSummaryQueryHandler : IRequestHandler<GetVehicleTripReconciliationSummaryQuery, FMSResponse<VehicleTripReconciliationSummaryDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetVehicleTripReconciliationSummaryQueryHandler> _logger;

    public GetVehicleTripReconciliationSummaryQueryHandler(
        GpsdataContext context,
        ILogger<GetVehicleTripReconciliationSummaryQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<VehicleTripReconciliationSummaryDTO>> Handle(GetVehicleTripReconciliationSummaryQuery request, CancellationToken cancellationToken)
    {
        var fromUtc = request.FromUtc?.ToUniversalTime() ?? DateTime.UtcNow.AddDays(-7);
        var toUtc = request.ToUtc?.ToUniversalTime() ?? DateTime.UtcNow;

        if (request.VehicleId.HasValue && request.VehicleId.Value <= 0)
        {
            return FMSResponse<VehicleTripReconciliationSummaryDTO>.ValidationFailed(new List<string> { "VehicleId must be greater than zero." });
        }

        if (fromUtc >= toUtc)
        {
            return FMSResponse<VehicleTripReconciliationSummaryDTO>.ValidationFailed(new List<string> { "FromUtc must be earlier than ToUtc." });
        }

        try
        {
            var groupsQuery = _context.VehicleTripGroups
                .AsNoTracking()
                .Include(group => group.OriginSite)
                .Include(group => group.DestinationSite)
                .Include(group => group.Trips)
                .Where(group => group.StartTimeUtc <= toUtc && group.EndTimeUtc >= fromUtc);

            if (request.VehicleId.HasValue)
            {
                groupsQuery = groupsQuery.Where(group => group.VehicleId == request.VehicleId.Value);
            }

            var groups = await groupsQuery
                .OrderBy(group => group.StartTimeUtc)
                .ToListAsync(cancellationToken);

            var movementLog = groups
                .SelectMany(group => group.Trips.DefaultIfEmpty(), (group, trip) => new { Group = group, Trip = trip })
                .Where(item => item.Trip != null)
                .Select(item => new VehicleTripReconciliationMovementEntryDTO
                {
                    VehicleTripGroupId = item.Group.VehicleTripGroupId,
                    VehicleTripId = item.Trip!.VehicleTripId,
                    StartTimeUtc = item.Trip.StartTimeUtc,
                    EndTimeUtc = item.Trip.EndTimeUtc,
                    OriginDisplayName = item.Trip.OriginSiteId.HasValue
                        ? item.Group.OriginSite?.Name ?? $"Site {item.Trip.OriginSiteId.Value}"
                        : $"Cluster ({item.Trip.StartLatitude:F5}, {item.Trip.StartLongitude:F5})",
                    DestinationDisplayName = item.Trip.DestinationSiteId.HasValue
                        ? item.Group.DestinationSite?.Name ?? $"Site {item.Trip.DestinationSiteId.Value}"
                        : $"Cluster ({item.Trip.EndLatitude:F5}, {item.Trip.EndLongitude:F5})",
                    DistanceKm = item.Trip.DistanceKm,
                    DurationMinutes = item.Trip.DurationMinutes,
                    FuelConsumed = item.Trip.FuelConsumed,
                    SiteVisitCountContribution = (item.Trip.OriginSiteId.HasValue ? 1 : 0) + (item.Trip.DestinationSiteId.HasValue ? 1 : 0),
                    IsCrossSiteMovement = item.Trip.OriginSiteId.HasValue && item.Trip.DestinationSiteId.HasValue && item.Trip.OriginSiteId != item.Trip.DestinationSiteId,
                    HybridCategory = ResolveHybridCategory(item.Group, item.Trip),
                    Status = Enum.IsDefined(typeof(VehicleTripStatus), item.Trip.Status)
                        ? ((VehicleTripStatus)item.Trip.Status).ToString()
                        : VehicleTripStatus.Completed.ToString(),
                })
                .ToList();

            var totalFuelConsumed = movementLog.Where(entry => entry.FuelConsumed.HasValue).Sum(entry => entry.FuelConsumed ?? 0m);
            var hasFuel = movementLog.Any(entry => entry.FuelConsumed.HasValue);

            var result = new VehicleTripReconciliationSummaryDTO
            {
                VehicleId = request.VehicleId,
                FromUtc = fromUtc,
                ToUtc = toUtc,
                VehiclesReviewed = groups.Select(group => group.VehicleId).Distinct().Count(),
                TripGroupsReviewed = groups.Count,
                TripLegsReviewed = movementLog.Count,
                SiteVisitsCount = movementLog.Sum(entry => entry.SiteVisitCountContribution),
                CrossSiteMovementCount = movementLog.Count(entry => entry.IsCrossSiteMovement),
                TotalDistanceKm = movementLog.Sum(entry => entry.DistanceKm),
                TotalFuelConsumed = hasFuel ? totalFuelConsumed : null,
                GpsFleetMovements = movementLog.Count(entry => string.Equals(entry.HybridCategory, "GpsFleet", StringComparison.OrdinalIgnoreCase)),
                FullTankPolicyInputs = movementLog.Count(entry => string.Equals(entry.HybridCategory, "FullTankPolicy", StringComparison.OrdinalIgnoreCase)),
                EquipmentCycleMovements = movementLog.Count(entry => string.Equals(entry.HybridCategory, "Equipment", StringComparison.OrdinalIgnoreCase)),
                CrossSiteHybridMovements = movementLog.Count(entry => string.Equals(entry.HybridCategory, "CrossSite", StringComparison.OrdinalIgnoreCase)),
                ExternalMovements = movementLog.Count(entry => string.Equals(entry.HybridCategory, "External", StringComparison.OrdinalIgnoreCase)),
                MovementLog = movementLog,
            };

            return FMSResponse<VehicleTripReconciliationSummaryDTO>.Success(result, "Vehicle reconciliation movement summary retrieved successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading vehicle trip reconciliation summary");
            return FMSResponse<VehicleTripReconciliationSummaryDTO>.SystemError($"Failed to read reconciliation summary: {ex.Message}");
        }
    }

    private static string ResolveHybridCategory(VehicleTripGroup group, VehicleTrip trip)
    {
        if (!trip.OriginSiteId.HasValue || !trip.DestinationSiteId.HasValue)
        {
            return "External";
        }

        if (group.MovementProfile == VehicleMovementProfile.Cluster)
        {
            return "Equipment";
        }

        if (trip.FuelConsumed.HasValue)
        {
            return "FullTankPolicy";
        }

        if (trip.OriginSiteId != trip.DestinationSiteId)
        {
            return "CrossSite";
        }

        return "GpsFleet";
    }
}
