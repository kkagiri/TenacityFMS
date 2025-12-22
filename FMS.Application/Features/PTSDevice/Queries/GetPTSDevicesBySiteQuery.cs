using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.PTSDevice.Queries
{
    /// <summary>
    /// Query to get PTS devices filtered by site ID
    /// </summary>
    public record GetPTSDevicesBySiteQuery(int SiteId) : IRequest<List<Ptsdevice>>;

    public class GetPTSDevicesBySiteQueryHandler : IRequestHandler<GetPTSDevicesBySiteQuery, List<Ptsdevice>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetPTSDevicesBySiteQueryHandler> _logger;

        public GetPTSDevicesBySiteQueryHandler(GpsdataContext context, ILogger<GetPTSDevicesBySiteQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<Ptsdevice>> Handle(GetPTSDevicesBySiteQuery request, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Fetching PTS devices for site {SiteId}", request.SiteId);

                var devices = await _context.Ptsdevices
                    .Include(p => p.SiteNavigation)
                    .Where(p => p.Site == request.SiteId)
                    .ToListAsync(cancellationToken);

                _logger.LogInformation("Found {Count} PTS devices for site {SiteId}", devices.Count, request.SiteId);

                return devices;
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Error getting PTS devices for site {SiteId}", request.SiteId);
                throw;
            }
        }
    }
}
