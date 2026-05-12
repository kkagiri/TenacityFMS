using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.Geofence.Services;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.Geofence.Commands;

/**
 * File: DeleteGeofenceGroupCommandHandler.cs
 * Purpose: Deletes a GPSGate geofence group and marks its local cache entry inactive.
 * Dependencies: ITrackingGeofenceService, IGeofenceCacheSyncService, GpsdataContext.
 * Last Modified: 2026-03-10
 */
public class DeleteGeofenceGroupCommandHandler : IRequestHandler<DeleteGeofenceGroupCommand, FMSResponse<bool>>
{
    private readonly ITrackingGeofenceService _gpsGateGeofenceService;
    private readonly IGeofenceCacheSyncService _cacheSyncService;
    private readonly GpsdataContext _context;

    public DeleteGeofenceGroupCommandHandler(
        ITrackingGeofenceService gpsGateGeofenceService,
        IGeofenceCacheSyncService cacheSyncService,
        GpsdataContext context)
    {
        _gpsGateGeofenceService = gpsGateGeofenceService;
        _cacheSyncService = cacheSyncService;
        _context = context;
    }

    public async Task<FMSResponse<bool>> Handle(DeleteGeofenceGroupCommand request, CancellationToken cancellationToken)
    {
        var localGroup = await _context.GpsGeofenceGroups
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.LocalGroupId && x.IsActive, cancellationToken);

        if (localGroup == null)
        {
            return FMSResponse<bool>.Failed("Geofence group not found.");
        }

        var deleteResult = await _gpsGateGeofenceService.DeleteGeofenceGroupAsync(localGroup.ExternalGroupId);
        if (!deleteResult.IsSuccess)
        {
            return FMSResponse<bool>.Failed(deleteResult.Message ?? "Failed to delete geofence group.");
        }

        await _cacheSyncService.MarkGroupInactiveAsync(localGroup.ExternalGroupId, cancellationToken);
        return FMSResponse<bool>.Success(true, "Geofence group deleted successfully.");
    }
}
