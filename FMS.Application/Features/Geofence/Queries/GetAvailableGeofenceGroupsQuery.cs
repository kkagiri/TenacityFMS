using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.Geofence.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Geofence.Queries;

/// <summary>
/// Query to get available geofence groups from GPSGate.
/// This is a lightweight call that doesn't sync data, just shows what's available.
/// </summary>
public class GetAvailableGeofenceGroupsQuery : IRequest<FMSResponse<List<AvailableGeofenceGroupDTO>>>
{
}

public class GetAvailableGeofenceGroupsQueryHandler
    : IRequestHandler<GetAvailableGeofenceGroupsQuery, FMSResponse<List<AvailableGeofenceGroupDTO>>>
{
    private readonly GpsdataContext _context;
    private readonly IGPSGateGeofenceService _gpsGateService;
    private readonly ILogger<GetAvailableGeofenceGroupsQueryHandler> _logger;

    public GetAvailableGeofenceGroupsQueryHandler(
        GpsdataContext context,
        IGPSGateGeofenceService gpsGateService,
        ILogger<GetAvailableGeofenceGroupsQueryHandler> logger)
    {
        _context = context;
        _gpsGateService = gpsGateService;
        _logger = logger;
    }

    public async Task<FMSResponse<List<AvailableGeofenceGroupDTO>>> Handle(
        GetAvailableGeofenceGroupsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Get groups from GPSGate
            var gpsGateResult = await _gpsGateService.GetGeofenceGroupsAsync();

            if (!gpsGateResult.IsSuccess)
            {
                _logger.LogWarning("Failed to fetch groups from GPSGate: {Message}", gpsGateResult.Message);
                return FMSResponse<List<AvailableGeofenceGroupDTO>>.Failed(
                    $"Failed to fetch groups from GPSGate: {gpsGateResult.Message}");
            }

            var gpsGateGroups = gpsGateResult.Data ?? new List<Vehicle.DTOs.GeofenceGroupDTO>();

            // Get already synced groups from local database
            var syncedGroups = await _context.GpsGeofenceGroups
                .AsNoTracking()
                .Select(g => new
                {
                    g.Id,
                    g.ExternalGroupId,
                    g.IsAllowedForFueling,
                    g.LastSyncedAt
                })
                .ToListAsync(cancellationToken);

            var syncedGroupLookup = syncedGroups.ToDictionary(g => g.ExternalGroupId);

            // Build response with sync status
            var result = gpsGateGroups.Select(g =>
            {
                var isSynced = syncedGroupLookup.TryGetValue(g.Id, out var syncedGroup);

                return new AvailableGeofenceGroupDTO
                {
                    ExternalGroupId = g.Id,
                    Name = g.Name,
                    Description = g.Description,
                    Colour = g.Colour,
                    GeofenceCount = g.GeofenceCount,
                    IsSynced = isSynced,
                    LocalId = isSynced ? syncedGroup!.Id : null,
                    IsAllowedForFueling = isSynced && syncedGroup!.IsAllowedForFueling,
                    LastSyncedAt = isSynced ? syncedGroup!.LastSyncedAt : null
                };
            }).ToList();

            _logger.LogInformation("Retrieved {TotalCount} groups from GPSGate, {SyncedCount} already synced",
                result.Count, result.Count(g => g.IsSynced));

            return FMSResponse<List<AvailableGeofenceGroupDTO>>.Success(
                result,
                $"Retrieved {result.Count} groups from GPSGate");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching available geofence groups from GPSGate");
            return FMSResponse<List<AvailableGeofenceGroupDTO>>.Failed(
                $"Error fetching groups: {ex.Message}");
        }
    }
}
