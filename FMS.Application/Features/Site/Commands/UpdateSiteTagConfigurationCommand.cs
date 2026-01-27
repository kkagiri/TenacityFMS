using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Site.Commands;

/// <summary>
/// DTO for updating a site's GPSGate tag configuration
/// </summary>
public class UpdateSiteTagDto
{
    public int SiteId { get; set; }
    public int? GpsGateTagId { get; set; }
    public string? GpsGateTagName { get; set; }
    public bool AutoUpdateGpsGateTag { get; set; } = true;
}

/// <summary>
/// Command to update a site's GPSGate tag configuration
/// </summary>
public record UpdateSiteTagConfigurationCommand(UpdateSiteTagDto SiteTag, string? UserId) : IRequest<FMSResponse<bool>>;

public class UpdateSiteTagConfigurationCommandHandler : IRequestHandler<UpdateSiteTagConfigurationCommand, FMSResponse<bool>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateSiteTagConfigurationCommandHandler> _logger;

    public UpdateSiteTagConfigurationCommandHandler(GpsdataContext context, ILogger<UpdateSiteTagConfigurationCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<bool>> Handle(UpdateSiteTagConfigurationCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var site = await _context.Sites
                .FirstOrDefaultAsync(s => s.Id == request.SiteTag.SiteId, cancellationToken);

            if (site == null)
            {
                return FMSResponse<bool>.Failed($"Site with ID {request.SiteTag.SiteId} not found", "NOT_FOUND");
            }

            site.GpsGateTagId = request.SiteTag.GpsGateTagId;
            site.GpsGateTagName = request.SiteTag.GpsGateTagName;
            site.AutoUpdateGpsGateTag = request.SiteTag.AutoUpdateGpsGateTag;

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Updated GPSGate tag configuration for site {SiteId} ({SiteName}): TagId={TagId}, TagName={TagName}, AutoUpdate={AutoUpdate}",
                site.Id, site.Name, site.GpsGateTagId, site.GpsGateTagName, site.AutoUpdateGpsGateTag);

            return FMSResponse<bool>.Success(true, $"Site '{site.Name}' tag configuration updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating site tag configuration for site {SiteId}", request.SiteTag.SiteId);
            return FMSResponse<bool>.Failed($"Error updating site configuration: {ex.Message}");
        }
    }
}
