using System;
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
 * File: CreateGeofenceCommandHandler.cs
 * Purpose: Validates and creates GPSGate geofences, then syncs them into local cache tables.
 * Dependencies: ITrackingGeofenceService, IGeofenceCacheSyncService, GpsdataContext.
 * Last Modified: 2026-03-10
 */
public class CreateGeofenceCommandHandler : IRequestHandler<CreateGeofenceCommand, FMSResponse<GpsGeofenceDTO>>
{
    private readonly ITrackingGeofenceService _gpsGateGeofenceService;
    private readonly IGeofenceCacheSyncService _cacheSyncService;
    private readonly GpsdataContext _context;
    private readonly ILogger<CreateGeofenceCommandHandler> _logger;

    public CreateGeofenceCommandHandler(
        ITrackingGeofenceService gpsGateGeofenceService,
        IGeofenceCacheSyncService cacheSyncService,
        GpsdataContext context,
        ILogger<CreateGeofenceCommandHandler> logger)
    {
        _gpsGateGeofenceService = gpsGateGeofenceService;
        _cacheSyncService = cacheSyncService;
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<GpsGeofenceDTO>> Handle(CreateGeofenceCommand request, CancellationToken cancellationToken)
    {
        var validationMessage = Validate(request.Request);
        if (!string.IsNullOrWhiteSpace(validationMessage))
        {
            return FMSResponse<GpsGeofenceDTO>.Failed(validationMessage);
        }

        var createResult = await _gpsGateGeofenceService.CreateGeofenceAsync(request.Request);
        if (!createResult.IsSuccess || createResult.Data == null)
        {
            return FMSResponse<GpsGeofenceDTO>.Failed(createResult.Message ?? "Failed to create geofence in GPSGate.");
        }

        var localGeofence = await _cacheSyncService.UpsertGeofenceAsync(createResult.Data, cancellationToken);

        // Set classification on the local entity (GPSGate doesn't have this concept)
        if (!string.IsNullOrWhiteSpace(request.Request.Classification)
            && Enum.TryParse<SiteClassification>(request.Request.Classification, true, out var classification)
            && classification != SiteClassification.Unknown)
        {
            var entity = await _context.GpsGeofences
                .FirstOrDefaultAsync(x => x.Id == localGeofence.Id, cancellationToken);
            if (entity != null)
            {
                entity.Classification = classification;
                entity.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync(cancellationToken);
                localGeofence.Classification = classification.ToString();
            }
        }

        if (request.Request.GroupIds.Count > 0)
        {
            var localGroups = await _context.GpsGeofenceGroups
                .Where(x => request.Request.GroupIds.Contains(x.Id) && x.IsActive)
                .Select(x => new { x.Id, x.ExternalGroupId })
                .ToListAsync(cancellationToken);

            foreach (var group in localGroups)
            {
                var membershipResult = await _gpsGateGeofenceService.AddGeofenceToGroupAsync(group.ExternalGroupId, createResult.Data.Id);
                if (!membershipResult.IsSuccess)
                {
                    _logger.LogWarning(
                        "Created geofence {GeofenceName} in GPSGate but failed adding it to local group {GroupId}: {Message}",
                        request.Request.Name,
                        group.Id,
                        membershipResult.Message);
                    continue;
                }

                var groupResult = await _gpsGateGeofenceService.GetGeofenceGroupByIdAsync(group.ExternalGroupId);
                if (groupResult.IsSuccess && groupResult.Data != null)
                {
                    await _cacheSyncService.UpsertGroupAsync(groupResult.Data, cancellationToken);
                    await _cacheSyncService.SyncGroupMembershipsAsync(groupResult.Data.Id, groupResult.Data.GeofenceIds, cancellationToken);
                }
            }
        }

        return FMSResponse<GpsGeofenceDTO>.Success(localGeofence, "Geofence created and synced successfully.");
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
