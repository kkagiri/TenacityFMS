using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Geofence.DTOs;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Domain.Entities.Features.GPSIntergration.GpsGate;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.Geofence.Services;

/**
 * File: GeofenceCacheSyncService.cs
 * Purpose: Applies targeted geofence and group updates to the local GPSGate cache tables.
 * Dependencies: GpsdataContext, GPSGate domain cache entities, geofence DTOs.
 * Last Modified: 2026-03-10
 */
public class GeofenceCacheSyncService : IGeofenceCacheSyncService
{
    private readonly GpsdataContext _context;

    public GeofenceCacheSyncService(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<GpsGeofenceDTO> UpsertGeofenceAsync(GeofenceDTO geofence, CancellationToken cancellationToken)
    {
        var entity = await _context.GpsGeofences
            .FirstOrDefaultAsync(x => x.ExternalGeofenceId == geofence.Id, cancellationToken);

        if (entity == null)
        {
            entity = new GpsGeofence
            {
                ExternalGeofenceId = geofence.Id,
                CreatedAt = DateTime.UtcNow
            };
            _context.GpsGeofences.Add(entity);
        }

        var center = ResolveCenter(geofence);

        entity.Name = geofence.Name;
        entity.Description = string.IsNullOrWhiteSpace(geofence.Description) ? null : geofence.Description;
        entity.GeofenceType = MapGeofenceType(geofence.Type);
        entity.GeometryJson = string.IsNullOrWhiteSpace(geofence.GeometryJson) ? null : geofence.GeometryJson;
        entity.CenterLatitude = center?.Latitude;
        entity.CenterLongitude = center?.Longitude;
        entity.RadiusMeters = geofence.Radius.HasValue ? (int?)Math.Round(geofence.Radius.Value) : null;
        entity.IsActive = geofence.IsActive;
        entity.LastSyncedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return MapGeofence(entity);
    }

    public async Task<GpsGeofenceGroupDTO> UpsertGroupAsync(GeofenceGroupDTO group, CancellationToken cancellationToken)
    {
        var entity = await _context.GpsGeofenceGroups
            .Include(x => x.Members)
            .FirstOrDefaultAsync(x => x.ExternalGroupId == group.Id, cancellationToken);

        var existingFuelingFlag = entity?.IsAllowedForFueling ?? false;

        if (entity == null)
        {
            entity = new GpsGeofenceGroup
            {
                ExternalGroupId = group.Id,
                CreatedAt = DateTime.UtcNow
            };
            _context.GpsGeofenceGroups.Add(entity);
        }

        entity.Name = group.Name;
        entity.Description = string.IsNullOrWhiteSpace(group.Description) ? null : group.Description;
        entity.Colour = string.IsNullOrWhiteSpace(group.Colour) ? null : group.Colour;
        entity.IsPinned = group.IsPinned;
        entity.IsActive = group.IsActive;
        entity.IsAllowedForFueling = existingFuelingFlag;
        entity.LastSyncedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return await BuildGroupDtoAsync(entity.Id, cancellationToken) ?? MapGroup(entity, new List<GpsGeofenceDTO>());
    }

    public async Task SyncGroupMembershipsAsync(int externalGroupId, IReadOnlyCollection<int> externalGeofenceIds, CancellationToken cancellationToken)
    {
        var group = await _context.GpsGeofenceGroups
            .FirstOrDefaultAsync(x => x.ExternalGroupId == externalGroupId, cancellationToken);

        if (group == null)
        {
            return;
        }

        var existingMembers = await _context.GpsGeofenceGroupMembers
            .Where(x => x.GroupId == group.Id)
            .ToListAsync(cancellationToken);

        _context.GpsGeofenceGroupMembers.RemoveRange(existingMembers);

        if (externalGeofenceIds.Count > 0)
        {
            var geofences = await _context.GpsGeofences
                .Where(x => externalGeofenceIds.Contains(x.ExternalGeofenceId))
                .Select(x => new { x.Id, x.ExternalGeofenceId })
                .ToListAsync(cancellationToken);

            foreach (var geofence in geofences)
            {
                _context.GpsGeofenceGroupMembers.Add(new GpsGeofenceGroupMember
                {
                    GroupId = group.Id,
                    GeofenceId = geofence.Id,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        group.LastSyncedAt = DateTime.UtcNow;
        group.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task MarkGroupInactiveAsync(int externalGroupId, CancellationToken cancellationToken)
    {
        var group = await _context.GpsGeofenceGroups
            .FirstOrDefaultAsync(x => x.ExternalGroupId == externalGroupId, cancellationToken);

        if (group == null)
        {
            return;
        }

        var existingMembers = await _context.GpsGeofenceGroupMembers
            .Where(x => x.GroupId == group.Id)
            .ToListAsync(cancellationToken);

        if (existingMembers.Count > 0)
        {
            _context.GpsGeofenceGroupMembers.RemoveRange(existingMembers);
        }

        group.IsActive = false;
        group.LastSyncedAt = DateTime.UtcNow;
        group.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task MarkGeofenceInactiveAsync(int externalGeofenceId, CancellationToken cancellationToken)
    {
        var geofence = await _context.GpsGeofences
            .FirstOrDefaultAsync(x => x.ExternalGeofenceId == externalGeofenceId, cancellationToken);

        if (geofence == null)
        {
            return;
        }

        var memberships = await _context.GpsGeofenceGroupMembers
            .Where(x => x.GeofenceId == geofence.Id)
            .ToListAsync(cancellationToken);

        if (memberships.Count > 0)
        {
            _context.GpsGeofenceGroupMembers.RemoveRange(memberships);
        }

        var linkedSites = await _context.Sites
            .Where(x => x.GpsGeofenceId == geofence.Id)
            .ToListAsync(cancellationToken);

        foreach (var site in linkedSites)
        {
            site.GpsGeofenceId = null;
            site.GpsGeofenceName = null;
            site.GpsGeofenceType = null;
            site.GpsGeofenceCenterLatitude = null;
            site.GpsGeofenceCenterLongitude = null;
        }

        geofence.IsActive = false;
        geofence.LastSyncedAt = DateTime.UtcNow;
        geofence.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task<GpsGeofenceGroupDTO?> BuildGroupDtoAsync(int localGroupId, CancellationToken cancellationToken)
    {
        var group = await _context.GpsGeofenceGroups
            .Include(x => x.Members)
                .ThenInclude(x => x.Geofence)
            .FirstOrDefaultAsync(x => x.Id == localGroupId, cancellationToken);

        if (group == null)
        {
            return null;
        }

        var geofences = group.Members
            .Where(x => x.Geofence != null)
            .Select(x => MapGeofence(x.Geofence!))
            .OrderBy(x => x.Name)
            .ToList();

        return MapGroup(group, geofences);
    }

    private static GpsGeofenceDTO MapGeofence(GpsGeofence entity)
    {
        return new GpsGeofenceDTO
        {
            Id = entity.Id,
            ExternalGeofenceId = entity.ExternalGeofenceId,
            Name = entity.Name,
            Description = entity.Description,
            GeofenceType = entity.GeofenceType.ToString(),
            GeometryJson = entity.GeometryJson,
            CenterLatitude = entity.CenterLatitude,
            CenterLongitude = entity.CenterLongitude,
            RadiusMeters = entity.RadiusMeters,
            IsActive = entity.IsActive,
            LastSyncedAt = entity.LastSyncedAt,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }

    private static GpsGeofenceGroupDTO MapGroup(GpsGeofenceGroup entity, List<GpsGeofenceDTO> geofences)
    {
        return new GpsGeofenceGroupDTO
        {
            Id = entity.Id,
            ExternalGroupId = entity.ExternalGroupId,
            Name = entity.Name,
            Description = entity.Description,
            Colour = entity.Colour,
            IsPinned = entity.IsPinned,
            IsActive = entity.IsActive,
            IsAllowedForFueling = entity.IsAllowedForFueling,
            LastSyncedAt = entity.LastSyncedAt,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt,
            GeofenceCount = geofences.Count,
            Geofences = geofences
        };
    }

    private static GpsGeofenceType MapGeofenceType(GeofenceType geofenceType)
    {
        return geofenceType switch
        {
            GeofenceType.Circle => GpsGeofenceType.Circle,
            GeofenceType.Route => GpsGeofenceType.Route,
            _ => GpsGeofenceType.Polygon
        };
    }

    private static GeofenceCoordinate? ResolveCenter(GeofenceDTO geofence)
    {
        if (geofence.Coordinates.Count == 0)
        {
            return null;
        }

        if (geofence.Type == GeofenceType.Circle)
        {
            return geofence.Coordinates.OrderBy(x => x.Order).FirstOrDefault();
        }

        var latitude = geofence.Coordinates.Average(x => x.Latitude);
        var longitude = geofence.Coordinates.Average(x => x.Longitude);

        return new GeofenceCoordinate
        {
            Latitude = latitude,
            Longitude = longitude,
            Order = 0
        };
    }
}
