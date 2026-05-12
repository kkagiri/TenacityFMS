using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Geofence.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.Geofence.Queries;

/// <summary>
/// Query to get all cached GPS geofence groups
/// </summary>
public record GetGeofenceGroupListQuery(bool OnlyActive = true, bool IncludeGeofences = false) : IRequest<List<GpsGeofenceGroupDTO>>;

public class GetGeofenceGroupListQueryHandler : IRequestHandler<GetGeofenceGroupListQuery, List<GpsGeofenceGroupDTO>>
{
    private readonly GpsdataContext _context;

    public GetGeofenceGroupListQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<List<GpsGeofenceGroupDTO>> Handle(GetGeofenceGroupListQuery request, CancellationToken cancellationToken)
    {
        var query = _context.GpsGeofenceGroups
            .Include(g => g.Members)
                .ThenInclude(m => m.Geofence)
            .AsQueryable();

        if (request.OnlyActive)
        {
            query = query.Where(g => g.IsActive);
        }

        var groups = await query
            .OrderBy(g => g.Name)
            .ToListAsync(cancellationToken);

        return groups.Select(g => new GpsGeofenceGroupDTO
        {
            Id = g.Id,
            ExternalGroupId = g.ExternalGroupId,
            Name = g.Name,
            Description = g.Description,
            Colour = g.Colour,
            IsPinned = g.IsPinned,
            IsActive = g.IsActive,
            IsAllowedForFueling = g.IsAllowedForFueling,
            LastSyncedAt = g.LastSyncedAt,
            CreatedAt = g.CreatedAt,
            UpdatedAt = g.UpdatedAt,
            GeofenceCount = g.Members?.Count ?? 0,
            Geofences = request.IncludeGeofences
                ? g.Members?.Select(m => new GpsGeofenceDTO
                {
                    Id = m.Geofence.Id,
                    ExternalGeofenceId = m.Geofence.ExternalGeofenceId,
                    Name = m.Geofence.Name,
                    Description = m.Geofence.Description,
                    GeofenceType = m.Geofence.GeofenceType.ToString(),
                    GeometryJson = m.Geofence.GeometryJson,
                    CenterLatitude = m.Geofence.CenterLatitude,
                    CenterLongitude = m.Geofence.CenterLongitude,
                    RadiusMeters = m.Geofence.RadiusMeters,
                    IsActive = m.Geofence.IsActive,
                    LastSyncedAt = m.Geofence.LastSyncedAt,
                    CreatedAt = m.Geofence.CreatedAt,
                    UpdatedAt = m.Geofence.UpdatedAt
                }).ToList() ?? new List<GpsGeofenceDTO>()
                : new List<GpsGeofenceDTO>()
        }).ToList();
    }
}
