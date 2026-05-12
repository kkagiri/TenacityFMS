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
 * File: CreateGeofenceGroupCommandHandler.cs
 * Purpose: Creates GPSGate geofence groups and synchronizes them into the local cache.
 * Dependencies: ITrackingGeofenceService, IGeofenceCacheSyncService, GpsdataContext.
 * Last Modified: 2026-03-10
 */
public class CreateGeofenceGroupCommandHandler : IRequestHandler<CreateGeofenceGroupCommand, FMSResponse<GpsGeofenceGroupDTO>>
{
    private readonly ITrackingGeofenceService _gpsGateGeofenceService;
    private readonly IGeofenceCacheSyncService _cacheSyncService;
    private readonly GpsdataContext _context;

    public CreateGeofenceGroupCommandHandler(
        ITrackingGeofenceService gpsGateGeofenceService,
        IGeofenceCacheSyncService cacheSyncService,
        GpsdataContext context)
    {
        _gpsGateGeofenceService = gpsGateGeofenceService;
        _cacheSyncService = cacheSyncService;
        _context = context;
    }

    public async Task<FMSResponse<GpsGeofenceGroupDTO>> Handle(CreateGeofenceGroupCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Request.Name))
        {
            return FMSResponse<GpsGeofenceGroupDTO>.Failed("Group name is required.");
        }

        var externalGeofenceIds = await _context.GpsGeofences
            .Where(x => request.Request.GeofenceIds.Contains(x.Id) && x.IsActive)
            .Select(x => x.ExternalGeofenceId)
            .ToListAsync(cancellationToken);

        var createRequest = new CreateGeofenceGroupRequestDTO
        {
            Name = request.Request.Name,
            Description = request.Request.Description,
            Colour = request.Request.Colour,
            IsPinned = request.Request.IsPinned,
            UseInGeocoding = request.Request.UseInGeocoding,
            GeofenceIds = externalGeofenceIds
        };

        var createResult = await _gpsGateGeofenceService.CreateGeofenceGroupAsync(createRequest);
        if (!createResult.IsSuccess || createResult.Data == null)
        {
            return FMSResponse<GpsGeofenceGroupDTO>.Failed(createResult.Message ?? "Failed to create geofence group.");
        }

        var localGroup = await _cacheSyncService.UpsertGroupAsync(createResult.Data, cancellationToken);
        await _cacheSyncService.SyncGroupMembershipsAsync(createResult.Data.Id, createResult.Data.GeofenceIds, cancellationToken);

        return FMSResponse<GpsGeofenceGroupDTO>.Success(localGroup, "Geofence group created and synced successfully.");
    }
}
