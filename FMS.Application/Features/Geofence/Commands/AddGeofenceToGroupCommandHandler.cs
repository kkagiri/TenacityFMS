using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.Geofence.DTOs;
using FMS.Application.Features.Geofence.Services;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.Geofence.Commands;

/**
 * File: AddGeofenceToGroupCommandHandler.cs
 * Purpose: Adds a cached geofence to a cached GPSGate group and refreshes local membership cache.
 * Dependencies: ITrackingGeofenceService, IGeofenceCacheSyncService, GpsdataContext.
 * Last Modified: 2026-03-10
 */
public class AddGeofenceToGroupCommandHandler : IRequestHandler<AddGeofenceToGroupCommand, FMSResponse<GpsGeofenceGroupDTO>>
{
    private readonly ITrackingGeofenceService _gpsGateGeofenceService;
    private readonly IGeofenceCacheSyncService _cacheSyncService;
    private readonly GpsdataContext _context;

    public AddGeofenceToGroupCommandHandler(
        ITrackingGeofenceService gpsGateGeofenceService,
        IGeofenceCacheSyncService cacheSyncService,
        GpsdataContext context)
    {
        _gpsGateGeofenceService = gpsGateGeofenceService;
        _cacheSyncService = cacheSyncService;
        _context = context;
    }

    public async Task<FMSResponse<GpsGeofenceGroupDTO>> Handle(AddGeofenceToGroupCommand request, CancellationToken cancellationToken)
    {
        var localGroup = await _context.GpsGeofenceGroups
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.LocalGroupId && x.IsActive, cancellationToken);
        var localGeofence = await _context.GpsGeofences
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.LocalGeofenceId && x.IsActive, cancellationToken);

        if (localGroup == null || localGeofence == null)
        {
            return FMSResponse<GpsGeofenceGroupDTO>.Failed("Geofence or group was not found.");
        }

        var geofenceResult = await _gpsGateGeofenceService.GetGeofenceByIdAsync(localGeofence.ExternalGeofenceId);
        if (geofenceResult.IsSuccess && geofenceResult.Data != null)
        {
            await _cacheSyncService.UpsertGeofenceAsync(geofenceResult.Data, cancellationToken);
        }

        var membershipResult = await _gpsGateGeofenceService.AddGeofenceToGroupAsync(localGroup.ExternalGroupId, localGeofence.ExternalGeofenceId);
        if (!membershipResult.IsSuccess)
        {
            return FMSResponse<GpsGeofenceGroupDTO>.Failed(membershipResult.Message ?? "Failed to add geofence to group.");
        }

        var groupResult = await _gpsGateGeofenceService.GetGeofenceGroupByIdAsync(localGroup.ExternalGroupId);
        if (!groupResult.IsSuccess || groupResult.Data == null)
        {
            return FMSResponse<GpsGeofenceGroupDTO>.Failed(groupResult.Message ?? "Failed to refresh geofence group.");
        }

        var syncedGroup = await _cacheSyncService.UpsertGroupAsync(groupResult.Data, cancellationToken);
        await _cacheSyncService.SyncGroupMembershipsAsync(groupResult.Data.Id, groupResult.Data.GeofenceIds, cancellationToken);

        return FMSResponse<GpsGeofenceGroupDTO>.Success(syncedGroup, "Geofence added to group successfully.");
    }
}
