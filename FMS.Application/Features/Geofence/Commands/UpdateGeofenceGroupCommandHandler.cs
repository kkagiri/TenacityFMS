using System.Linq;
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
 * File: UpdateGeofenceGroupCommandHandler.cs
 * Purpose: Updates a synced GPSGate geofence group and refreshes its local cache record.
 * Dependencies: IGPSGateGeofenceService, IGeofenceCacheSyncService, GpsdataContext.
 * Last Modified: 2026-03-10
 */
public class UpdateGeofenceGroupCommandHandler : IRequestHandler<UpdateGeofenceGroupCommand, FMSResponse<GpsGeofenceGroupDTO>>
{
    private readonly IGPSGateGeofenceService _gpsGateGeofenceService;
    private readonly IGeofenceCacheSyncService _cacheSyncService;
    private readonly GpsdataContext _context;

    public UpdateGeofenceGroupCommandHandler(
        IGPSGateGeofenceService gpsGateGeofenceService,
        IGeofenceCacheSyncService cacheSyncService,
        GpsdataContext context)
    {
        _gpsGateGeofenceService = gpsGateGeofenceService;
        _cacheSyncService = cacheSyncService;
        _context = context;
    }

    public async Task<FMSResponse<GpsGeofenceGroupDTO>> Handle(UpdateGeofenceGroupCommand request, CancellationToken cancellationToken)
    {
        var localGroup = await _context.GpsGeofenceGroups
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.LocalGroupId && x.IsActive, cancellationToken);

        if (localGroup == null)
        {
            return FMSResponse<GpsGeofenceGroupDTO>.Failed("Geofence group not found.");
        }

        var externalGeofenceIds = await _context.GpsGeofences
            .Where(x => request.Request.GeofenceIds.Contains(x.Id) && x.IsActive)
            .Select(x => x.ExternalGeofenceId)
            .ToListAsync(cancellationToken);

        var updateRequest = new UpdateGeofenceGroupRequestDTO
        {
            Name = request.Request.Name,
            Description = request.Request.Description,
            Colour = request.Request.Colour,
            IsPinned = request.Request.IsPinned,
            UseInGeocoding = request.Request.UseInGeocoding,
            GeofenceIds = externalGeofenceIds
        };

        var updateResult = await _gpsGateGeofenceService.UpdateGeofenceGroupAsync(localGroup.ExternalGroupId, updateRequest);
        if (!updateResult.IsSuccess || updateResult.Data == null)
        {
            return FMSResponse<GpsGeofenceGroupDTO>.Failed(updateResult.Message ?? "Failed to update geofence group.");
        }

        var syncedGroup = await _cacheSyncService.UpsertGroupAsync(updateResult.Data, cancellationToken);
        await _cacheSyncService.SyncGroupMembershipsAsync(updateResult.Data.Id, updateResult.Data.GeofenceIds, cancellationToken);

        return FMSResponse<GpsGeofenceGroupDTO>.Success(syncedGroup, "Geofence group updated successfully.");
    }
}
