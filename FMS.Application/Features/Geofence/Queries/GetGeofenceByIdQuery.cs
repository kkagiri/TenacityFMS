using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Geofence.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.Geofence.Queries;

/// <summary>
/// Query to get a geofence by ID
/// </summary>
public record GetGeofenceByIdQuery(int GeofenceId) : IRequest<GpsGeofenceDTO?>;

public class GetGeofenceByIdQueryHandler : IRequestHandler<GetGeofenceByIdQuery, GpsGeofenceDTO?>
{
    private readonly GpsdataContext _context;

    public GetGeofenceByIdQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<GpsGeofenceDTO?> Handle(GetGeofenceByIdQuery request, CancellationToken cancellationToken)
    {
        var siteLink = await _context.Sites
            .Where(s => s.GpsGeofenceId == request.GeofenceId)
            .Select(s => new { s.Id, s.Name })
            .FirstOrDefaultAsync(cancellationToken);

        var geofence = await _context.GpsGeofences
            .Where(g => g.Id == request.GeofenceId)
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
                IsAssignedToSite = siteLink != null,
                SiteId = siteLink != null ? siteLink.Id : null,
                SiteName = siteLink != null ? siteLink.Name : null,
                LastSyncedAt = g.LastSyncedAt,
                CreatedAt = g.CreatedAt,
                UpdatedAt = g.UpdatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);

        return geofence;
    }
}
