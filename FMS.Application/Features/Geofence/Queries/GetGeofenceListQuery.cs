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

        return geofences;
    }
}
