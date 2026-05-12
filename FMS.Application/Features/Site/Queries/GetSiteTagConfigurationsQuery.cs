using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.Site.Queries;

/// <summary>
/// DTO for site GPSGate tag configuration
/// </summary>
public class SiteTagConfigurationDto
{
    public int SiteId { get; set; }
    public string SiteName { get; set; } = string.Empty;
    public int? GpsGateTagId { get; set; }
    public string? GpsGateTagName { get; set; }
    public bool AutoUpdateGpsGateTag { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>
/// Query to get all sites with their GPSGate tag configurations
/// </summary>
public record GetSiteTagConfigurationsQuery : IRequest<FMSResponse<List<SiteTagConfigurationDto>>>;

public class GetSiteTagConfigurationsQueryHandler : IRequestHandler<GetSiteTagConfigurationsQuery, FMSResponse<List<SiteTagConfigurationDto>>>
{
    private readonly GpsdataContext _context;

    public GetSiteTagConfigurationsQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<List<SiteTagConfigurationDto>>> Handle(GetSiteTagConfigurationsQuery request, CancellationToken cancellationToken)
    {
        var sites = await _context.Sites
            .OrderBy(s => s.Name)
            .Select(s => new SiteTagConfigurationDto
            {
                SiteId = s.Id,
                SiteName = s.Name,
                GpsGateTagId = s.GpsGateTagId,
                GpsGateTagName = s.GpsGateTagName,
                AutoUpdateGpsGateTag = s.AutoUpdateGpsGateTag,
                IsActive = s.IsActive
            })
            .ToListAsync(cancellationToken);

        return FMSResponse<List<SiteTagConfigurationDto>>.Success(sites, $"Retrieved {sites.Count} site configurations");
    }
}
