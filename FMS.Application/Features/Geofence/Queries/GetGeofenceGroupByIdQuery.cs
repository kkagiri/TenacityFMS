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
/// Query to get a geofence group by ID with its geofences
/// </summary>
public record GetGeofenceGroupByIdQuery(int GeofenceGroupId) : IRequest<GpsGeofenceGroupDTO?>;

public class GetGeofenceGroupByIdQueryHandler : IRequestHandler<GetGeofenceGroupByIdQuery, GpsGeofenceGroupDTO?>
{
    private readonly GpsdataContext _context;

    public GetGeofenceGroupByIdQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<GpsGeofenceGroupDTO?> Handle(GetGeofenceGroupByIdQuery request, CancellationToken cancellationToken)
    {
        var group = await _context.GpsGeofenceGroups
            .Include(g => g.Members)
                .ThenInclude(m => m.Geofence)
            .FirstOrDefaultAsync(g => g.Id == request.GeofenceGroupId, cancellationToken);

        if (group == null)
            return null;

        return new GpsGeofenceGroupDTO
        {
            Id = group.Id,
            ExternalGroupId = group.ExternalGroupId,
            Name = group.Name,
            Description = group.Description,
            Colour = group.Colour,
            IsPinned = group.IsPinned,
            IsActive = group.IsActive,
            IsAllowedForFueling = group.IsAllowedForFueling,
            LastSyncedAt = group.LastSyncedAt,
            CreatedAt = group.CreatedAt,
            UpdatedAt = group.UpdatedAt,
            GeofenceCount = group.Members?.Count ?? 0,
            Geofences = group.Members?.Select(m => new GpsGeofenceDTO
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
        };
    }
}
