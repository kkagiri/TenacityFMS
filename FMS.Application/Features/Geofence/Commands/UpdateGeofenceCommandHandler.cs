using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.Geofence.DTOs;
using FMS.Application.Features.Geofence.Services;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Geofence.Commands;

/**
 * File: UpdateGeofenceCommandHandler.cs
 * Purpose: Validates and updates a GPSGate geofence, then syncs the change into local cache tables.
 * Dependencies: IGPSGateGeofenceService, IGeofenceCacheSyncService, GpsdataContext.
 * Last Modified: 2026-06-14
 */
public class UpdateGeofenceCommandHandler : IRequestHandler<UpdateGeofenceCommand, FMSResponse<GpsGeofenceDTO>>
{
    private readonly IGPSGateGeofenceService _gpsGateGeofenceService;
    private readonly IGeofenceCacheSyncService _cacheSyncService;
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateGeofenceCommandHandler> _logger;

    public UpdateGeofenceCommandHandler(
        IGPSGateGeofenceService gpsGateGeofenceService,
        IGeofenceCacheSyncService cacheSyncService,
        GpsdataContext context,
        ILogger<UpdateGeofenceCommandHandler> logger)
    {
        _gpsGateGeofenceService = gpsGateGeofenceService;
        _cacheSyncService = cacheSyncService;
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<GpsGeofenceDTO>> Handle(UpdateGeofenceCommand request, CancellationToken cancellationToken)
    {
        var validationMessage = Validate(request.Request);
        if (!string.IsNullOrWhiteSpace(validationMessage))
        {
            return FMSResponse<GpsGeofenceDTO>.Failed(validationMessage);
        }

        var localGeofence = await _context.GpsGeofences
            .FirstOrDefaultAsync(x => x.Id == request.GeofenceId && x.IsActive, cancellationToken);

        if (localGeofence == null)
        {
            return FMSResponse<GpsGeofenceDTO>.Failed("Geofence not found.");
        }

        var updateResult = await _gpsGateGeofenceService.UpdateGeofenceAsync(localGeofence.ExternalGeofenceId, request.Request);
        if (!updateResult.IsSuccess || updateResult.Data == null)
        {
            return FMSResponse<GpsGeofenceDTO>.Failed(updateResult.Message ?? "Failed to update geofence in GPSGate.");
        }

        var syncedGeofence = await _cacheSyncService.UpsertGeofenceAsync(updateResult.Data, cancellationToken);

        // Update classification on the local entity (GPSGate doesn't have this concept)
        if (!string.IsNullOrWhiteSpace(request.Request.Classification)
            && Enum.TryParse<SiteClassification>(request.Request.Classification, true, out var classification))
        {
            var entity = await _context.GpsGeofences
                .FirstOrDefaultAsync(x => x.Id == localGeofence.Id, cancellationToken);
            if (entity != null)
            {
                entity.Classification = classification;
                entity.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync(cancellationToken);
                syncedGeofence.Classification = classification.ToString();
            }
        }

        // Reconcile group memberships
        await ReconcileGroupMembershipsAsync(localGeofence.Id, localGeofence.ExternalGeofenceId, request.Request.GroupIds, cancellationToken);

        return FMSResponse<GpsGeofenceDTO>.Success(syncedGeofence, "Geofence updated and synced successfully.");
    }

    private async Task ReconcileGroupMembershipsAsync(int localGeofenceId, int externalGeofenceId, List<int> desiredGroupIds, CancellationToken cancellationToken)
    {
        // Find current group memberships
        var currentMemberships = await _context.GpsGeofenceGroupMembers
            .Where(x => x.GeofenceId == localGeofenceId)
            .Select(x => x.GroupId)
            .ToListAsync(cancellationToken);

        var currentGroupIds = new HashSet<int>(currentMemberships);
        var desiredGroupIdSet = new HashSet<int>(desiredGroupIds ?? new List<int>());

        // Groups to add
        var groupsToAdd = desiredGroupIdSet.Except(currentGroupIds).ToList();
        // Groups to remove
        var groupsToRemove = currentGroupIds.Except(desiredGroupIdSet).ToList();

        // Add to new groups
        foreach (var groupId in groupsToAdd)
        {
            var localGroup = await _context.GpsGeofenceGroups
                .Where(x => x.Id == groupId && x.IsActive)
                .Select(x => new { x.Id, x.ExternalGroupId })
                .FirstOrDefaultAsync(cancellationToken);

            if (localGroup == null) continue;

            var membershipResult = await _gpsGateGeofenceService.AddGeofenceToGroupAsync(localGroup.ExternalGroupId, externalGeofenceId);
            if (!membershipResult.IsSuccess)
            {
                _logger.LogWarning("Failed adding geofence {GeofenceId} to group {GroupId}: {Message}",
                    localGeofenceId, groupId, membershipResult.Message);
                continue;
            }

            await SyncGroupAsync(localGroup.ExternalGroupId, cancellationToken);
        }

        // Remove from old groups
        foreach (var groupId in groupsToRemove)
        {
            var localGroup = await _context.GpsGeofenceGroups
                .Where(x => x.Id == groupId && x.IsActive)
                .Select(x => new { x.Id, x.ExternalGroupId })
                .FirstOrDefaultAsync(cancellationToken);

            if (localGroup == null) continue;

            var membershipResult = await _gpsGateGeofenceService.RemoveGeofenceFromGroupAsync(localGroup.ExternalGroupId, externalGeofenceId);
            if (!membershipResult.IsSuccess)
            {
                _logger.LogWarning("Failed removing geofence {GeofenceId} from group {GroupId}: {Message}",
                    localGeofenceId, groupId, membershipResult.Message);
                continue;
            }

            await SyncGroupAsync(localGroup.ExternalGroupId, cancellationToken);
        }
    }

    private async Task SyncGroupAsync(int externalGroupId, CancellationToken cancellationToken)
    {
        var groupResult = await _gpsGateGeofenceService.GetGeofenceGroupByIdAsync(externalGroupId);
        if (groupResult.IsSuccess && groupResult.Data != null)
        {
            await _cacheSyncService.UpsertGroupAsync(groupResult.Data, cancellationToken);
            await _cacheSyncService.SyncGroupMembershipsAsync(groupResult.Data.Id, groupResult.Data.GeofenceIds, cancellationToken);
        }
    }

    private static string? Validate(CreateGeofenceRequestDTO request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return "Geofence name is required.";
        }

        if (request.GeofenceType.Equals("Circle", StringComparison.OrdinalIgnoreCase))
        {
            if (!request.CenterLatitude.HasValue || !request.CenterLongitude.HasValue)
            {
                return "Circle geofences require a center latitude and longitude.";
            }

            if (!request.RadiusMeters.HasValue || request.RadiusMeters.Value <= 0)
            {
                return "Circle geofences require a radius greater than zero.";
            }

            return null;
        }

        if (request.Coordinates.Count < 2)
        {
            return request.GeofenceType.Equals("Route", StringComparison.OrdinalIgnoreCase)
                ? "Route geofences require at least two coordinates."
                : "Polygon geofences require at least three coordinates.";
        }

        if (request.GeofenceType.Equals("Polygon", StringComparison.OrdinalIgnoreCase) && request.Coordinates.Count < 3)
        {
            return "Polygon geofences require at least three coordinates.";
        }

        if (request.GeofenceType.Equals("Route", StringComparison.OrdinalIgnoreCase) && (!request.RadiusMeters.HasValue || request.RadiusMeters.Value <= 0))
        {
            return "Route geofences require a corridor width greater than zero.";
        }

        return null;
    }
}
