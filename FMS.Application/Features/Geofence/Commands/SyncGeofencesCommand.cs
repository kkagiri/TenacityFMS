using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.Geofence.DTOs;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Domain.Entities.Features.GPSIntergration.GpsGate;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Geofence.Commands;

/// <summary>
/// Command to sync geofences and geofence groups from GPSGate
/// </summary>
public class SyncGeofencesCommand : IRequest<FMSResponse<SyncGeofencesResponseDTO>>
{
    public bool ForceFullSync { get; set; }
}

public class SyncGeofencesCommandHandler : IRequestHandler<SyncGeofencesCommand, FMSResponse<SyncGeofencesResponseDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ITrackingGeofenceService _geofenceService;
    private readonly ILogger<SyncGeofencesCommandHandler> _logger;

    public SyncGeofencesCommandHandler(
        GpsdataContext context,
        ITrackingGeofenceService geofenceService,
        ILogger<SyncGeofencesCommandHandler> logger)
    {
        _context = context;
        _geofenceService = geofenceService;
        _logger = logger;
    }

    public async Task<FMSResponse<SyncGeofencesResponseDTO>> Handle(SyncGeofencesCommand request, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Starting geofence sync from GPSGate. ForceFullSync: {ForceFullSync}", request.ForceFullSync);

            int geofencesSynced = 0;
            int groupsSynced = 0;

            // Sync all geofences from GPSGate
            var geofenceResponse = await _geofenceService.GetAllGeofencesAsync();
            if (geofenceResponse != null && geofenceResponse.IsSuccess && geofenceResponse.Data != null)
            {
                foreach (var externalGf in geofenceResponse.Data)
                {
                    var existingGeofence = await _context.GpsGeofences
                        .FirstOrDefaultAsync(g => g.ExternalGeofenceId == externalGf.Id, cancellationToken);

                    // Get center coordinates from first coordinate if available
                    var firstCoord = externalGf.Coordinates?.FirstOrDefault();
                    decimal? centerLat = firstCoord?.Latitude;
                    decimal? centerLng = firstCoord?.Longitude;

                    if (existingGeofence == null)
                    {
                        var newGeofence = new GpsGeofence
                        {
                            ExternalGeofenceId = externalGf.Id,
                            Name = externalGf.Name ?? $"Geofence_{externalGf.Id}",
                            Description = externalGf.Description,
                            GeofenceType = MapToGeofenceType(externalGf.Type),
                            CenterLatitude = centerLat,
                            CenterLongitude = centerLng,
                            RadiusMeters = externalGf.Radius.HasValue ? (int?)decimal.ToInt32(externalGf.Radius.Value) : null,
                            GeometryJson = externalGf.GeometryJson, // ✅ Save polygon/route geometry
                            IsActive = externalGf.IsActive,
                            LastSyncedAt = DateTime.UtcNow,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.GpsGeofences.Add(newGeofence);
                        _logger.LogDebug("Creating geofence {Id} '{Name}', Type: {Type}, HasGeometry: {HasGeometry}",
                            externalGf.Id, externalGf.Name, externalGf.Type, !string.IsNullOrEmpty(externalGf.GeometryJson));
                    }
                    else
                    {
                        existingGeofence.Name = externalGf.Name ?? existingGeofence.Name;
                        existingGeofence.Description = externalGf.Description;
                        existingGeofence.GeofenceType = MapToGeofenceType(externalGf.Type);
                        existingGeofence.CenterLatitude = centerLat ?? existingGeofence.CenterLatitude;
                        existingGeofence.CenterLongitude = centerLng ?? existingGeofence.CenterLongitude;
                        existingGeofence.RadiusMeters = externalGf.Radius.HasValue ? (int?)decimal.ToInt32(externalGf.Radius.Value) : existingGeofence.RadiusMeters;
                        existingGeofence.GeometryJson = externalGf.GeometryJson ?? existingGeofence.GeometryJson; // ✅ Update polygon/route geometry
                        existingGeofence.IsActive = externalGf.IsActive;
                        existingGeofence.LastSyncedAt = DateTime.UtcNow;
                        existingGeofence.UpdatedAt = DateTime.UtcNow;
                        _logger.LogDebug("Updating geofence {Id} '{Name}', Type: {Type}, HasGeometry: {HasGeometry}",
                            externalGf.Id, externalGf.Name, externalGf.Type, !string.IsNullOrEmpty(externalGf.GeometryJson));
                    }
                    geofencesSynced++;
                }
            }

            // Sync all geofence groups from GPSGate
            var groupResponse = await _geofenceService.GetGeofenceGroupsAsync();
            if (groupResponse != null && groupResponse.IsSuccess && groupResponse.Data != null)
            {
                foreach (var externalGroup in groupResponse.Data)
                {
                    var existingGroup = await _context.GpsGeofenceGroups
                        .FirstOrDefaultAsync(g => g.ExternalGroupId == externalGroup.Id, cancellationToken);

                    if (existingGroup == null)
                    {
                        var newGroup = new GpsGeofenceGroup
                        {
                            ExternalGroupId = externalGroup.Id,
                            Name = externalGroup.Name ?? $"Group_{externalGroup.Id}",
                            Description = externalGroup.Description,
                            Colour = externalGroup.Colour,
                            IsPinned = externalGroup.IsPinned,
                            IsActive = true,
                            LastSyncedAt = DateTime.UtcNow,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.GpsGeofenceGroups.Add(newGroup);
                        await _context.SaveChangesAsync(cancellationToken);

                        // Sync group members
                        await SyncGroupMembersAsync(newGroup, externalGroup.Id, cancellationToken);
                    }
                    else
                    {
                        existingGroup.Name = externalGroup.Name ?? existingGroup.Name;
                        existingGroup.Description = externalGroup.Description;
                        existingGroup.Colour = externalGroup.Colour;
                        existingGroup.IsPinned = externalGroup.IsPinned;
                        existingGroup.LastSyncedAt = DateTime.UtcNow;
                        existingGroup.UpdatedAt = DateTime.UtcNow;

                        if (request.ForceFullSync)
                        {
                            await SyncGroupMembersAsync(existingGroup, externalGroup.Id, cancellationToken);
                        }
                    }
                    groupsSynced++;
                }
            }

            await _context.SaveChangesAsync(cancellationToken);

            var response = new SyncGeofencesResponseDTO
            {
                GeofencesSynced = geofencesSynced,
                GroupsSynced = groupsSynced,
                SyncedAt = DateTime.UtcNow,
                Message = $"Successfully synced {geofencesSynced} geofences and {groupsSynced} groups from GPSGate"
            };

            _logger.LogInformation("Geofence sync completed. Geofences: {GeofencesSynced}, Groups: {GroupsSynced}", geofencesSynced, groupsSynced);

            return FMSResponse<SyncGeofencesResponseDTO>.Success(response, response.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing geofences from GPSGate");
            return FMSResponse<SyncGeofencesResponseDTO>.SystemError("Failed to sync geofences from GPSGate: " + ex.Message);
        }
    }

    private async Task SyncGroupMembersAsync(GpsGeofenceGroup group, int externalGroupId, CancellationToken cancellationToken)
    {
        try
        {
            var geofencesResponse = await _geofenceService.GetGeofencesInGroupAsync(externalGroupId);
            if (geofencesResponse == null || !geofencesResponse.IsSuccess || geofencesResponse.Data == null) return;

            // Remove existing members
            var existingMembers = await _context.GpsGeofenceGroupMembers
                .Where(m => m.GroupId == group.Id)
                .ToListAsync(cancellationToken);
            _context.GpsGeofenceGroupMembers.RemoveRange(existingMembers);

            // Add new members
            foreach (var geofence in geofencesResponse.Data)
            {
                var cachedGeofence = await _context.GpsGeofences
                    .FirstOrDefaultAsync(g => g.ExternalGeofenceId == geofence.Id, cancellationToken);

                if (cachedGeofence != null)
                {
                    _context.GpsGeofenceGroupMembers.Add(new GpsGeofenceGroupMember
                    {
                        GroupId = group.Id,
                        GeofenceId = cachedGeofence.Id,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to sync members for group {GroupId}", externalGroupId);
        }
    }

    /// <summary>
    /// Maps GeofenceType enum from DTO to domain entity
    /// </summary>
    private static GpsGeofenceType MapToGeofenceType(GeofenceType type)
    {
        // Note: DTO enum values differ from domain enum values
        // DTO: Circle=1, Polygon=2, Route=3
        // Domain: Polygon=1, Circle=2, Route=3
        return type switch
        {
            GeofenceType.Polygon => GpsGeofenceType.Polygon,
            GeofenceType.Circle => GpsGeofenceType.Circle,
            GeofenceType.Route => GpsGeofenceType.Route,
            _ => GpsGeofenceType.Polygon
        };
    }
}
