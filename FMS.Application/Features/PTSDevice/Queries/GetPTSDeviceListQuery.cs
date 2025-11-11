using System;
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
    public record GetPTSDeviceListQuery : IRequest<List<Ptsdevice>>;

    public class GetPTSDeviceListQueryHandler : IRequestHandler<GetPTSDeviceListQuery, List<Ptsdevice>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetPTSDeviceListQueryHandler> _logger;

        public GetPTSDeviceListQueryHandler(GpsdataContext context, ILogger<GetPTSDeviceListQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<Ptsdevice>> Handle(GetPTSDeviceListQuery request, CancellationToken cancellationToken)
        {
            try
            {
                // Include Site navigation to get site name
                return await _context.Ptsdevices
                    .Include(p => p.SiteNavigation)
                    .ToListAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting PTS device list");
                throw;
            }
        }
    }
}