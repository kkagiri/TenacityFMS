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
 * File: DeleteGeofenceCommandHandler.cs
 * Purpose: Deletes a synced GPSGate geofence and marks its local cache entry inactive.
 * Dependencies: IGPSGateGeofenceService, IGeofenceCacheSyncService, GpsdataContext.
 * Last Modified: 2026-03-10
 */
public class DeleteGeofenceCommandHandler : IRequestHandler<DeleteGeofenceCommand, FMSResponse<bool>>
{
    private readonly IGPSGateGeofenceService _gpsGateGeofenceService;
    private readonly IGeofenceCacheSyncService _cacheSyncService;
    private readonly GpsdataContext _context;

    public DeleteGeofenceCommandHandler(
        IGPSGateGeofenceService gpsGateGeofenceService,
        IGeofenceCacheSyncService cacheSyncService,
        GpsdataContext context)
    {
        _gpsGateGeofenceService = gpsGateGeofenceService;
        _cacheSyncService = cacheSyncService;
        _context = context;
    }

    public async Task<FMSResponse<bool>> Handle(DeleteGeofenceCommand request, CancellationToken cancellationToken)
    {
        var localGeofence = await _context.GpsGeofences
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.LocalGeofenceId && x.IsActive, cancellationToken);

        if (localGeofence == null)
        {
            return FMSResponse<bool>.Failed("Geofence not found.");
        }

        var deleteResult = await _gpsGateGeofenceService.DeleteGeofenceAsync(localGeofence.ExternalGeofenceId);
        if (!deleteResult.IsSuccess)
        {
            return FMSResponse<bool>.Failed(deleteResult.Message ?? "Failed to delete geofence.");
        }

        await _cacheSyncService.MarkGeofenceInactiveAsync(localGeofence.ExternalGeofenceId, cancellationToken);
        return FMSResponse<bool>.Success(true, "Geofence deleted successfully.");
    }
}