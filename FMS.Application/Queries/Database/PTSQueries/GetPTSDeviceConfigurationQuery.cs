using System;
using System.Reflection.Metadata.Ecma335;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.ModelsDTOs.NaftaATG;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.PTSQueries
{
    /// <summary>
    /// Get the PTS Device Configuration
    /// </summary>
    /// <param name="DeviceID"></param>
    public record GetPTSDeviceConfigurationQuery(int DeviceID) :IRequest<Ptsdevice>;

    public class GetPTSDeviceConfiguaraionQueryHandler :IRequestHandler<GetPTSDeviceConfigurationQuery, Ptsdevice>
    {
        private readonly GpsdataContext _context;
       private readonly ILogger _logger;
        public GetPTSDeviceConfiguaraionQueryHandler(GpsdataContext context, ILogger<GetPTSDeviceConfiguaraionQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Ptsdevice> Handle(GetPTSDeviceConfigurationQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var results = await _context.Ptsdevices.FirstOrDefaultAsync(x => x.Ptsid == request.DeviceID);
                return results;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                throw;
            }
            
        }

    
    }

}
