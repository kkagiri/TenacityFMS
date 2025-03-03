using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.PTSQueries.PTSDeviceQueries
{
    public record GetPTSDeviceByIdQuery(string DeviceId) : IRequest<Ptsdevice?>;

    public class GetPTSDeviceByIdQueryHandler : IRequestHandler<GetPTSDeviceByIdQuery, Ptsdevice?>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetPTSDeviceByIdQueryHandler> _logger;

        public GetPTSDeviceByIdQueryHandler(GpsdataContext context, ILogger<GetPTSDeviceByIdQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Ptsdevice?> Handle(GetPTSDeviceByIdQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var device = await _context.Ptsdevices.FirstOrDefaultAsync(d => d.Ptsid == request.DeviceId, cancellationToken);
                return device;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving PTS device with id {DeviceId}", request.DeviceId);
                throw;
            }
        }
    }
}