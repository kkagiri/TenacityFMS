using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Application.Features.Geofence.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.Geofence.Queries;

/// <summary>
/// Query to get all cached GPS geofences
/// </summary>
public record GetGeofenceListQuery(bool OnlyActive = true) : IRequest<List<GpsGeofenceDTO>>;

public class GetGeofenceListQueryHandler : IRequestHandler<GetGeofenceListQuery, List<GpsGeofenceDTO>>
{
    private readonly GpsdataContext _context;

    public GetGeofenceListQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<List<GpsGeofenceDTO>> Handle(GetGeofenceListQuery request, CancellationToken cancellationToken)
    {
        var query = _context.GpsGeofences.AsQueryable();

        if (request.OnlyActive)
        {
            query = query.Where(g => g.IsActive);
        }

        var siteLinks = await _context.Sites
            .Where(s => s.GpsGeofenceId != null)
            .Select(s => new { s.Id, s.Name, GpsGeofenceId = s.GpsGeofenceId!.Value })
            .ToListAsync(cancellationToken);

        var geofences = await query
            .OrderBy(g => g.Name)
            .Select(g => new GpsGeofenceDTO
            {
                Id = g.Id,
                ExternalGeofenceId = g.ExternalGeofenceId,
                Name = g.Name,
                Description = g.Description,
                GeofenceType = g.GeofenceType.ToString(),
                GeometryJson = g.GeometryJson,
                CenterLatitude = g.CenterLatitude,
                CenterLongitude = g.CenterLongitude,
                RadiusMeters = g.RadiusMeters,
                IsActive = g.IsActive,
                LastSyncedAt = g.LastSyncedAt,
                CreatedAt = g.CreatedAt,
                UpdatedAt = g.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        foreach (var geofence in geofences)
        {
            var siteLink = siteLinks.FirstOrDefault(x => x.GpsGeofenceId == geofence.Id);
            if (siteLink == null)
            {
                continue;
            }

            geofence.IsAssignedToSite = true;
            geofence.SiteId = siteLink.Id;
            geofence.SiteName = siteLink.Name;
        }

        return geofences;
    }
}
