using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Queries.Database.FMSQuery.TagMonitoringConfigQuery {
    public record GetTagMonitoringConfigsQuery () : IRequest<FMSResponseMessage<List<TagMonitoringConfig>>>;

    //Cursor
    public class GetTagMonitoringConfigsQueryHandler : IRequestHandler<GetTagMonitoringConfigsQuery, FMSResponseMessage<List<TagMonitoringConfig>>> {
        private readonly GpsdataContext _context;
        public GetTagMonitoringConfigsQueryHandler (GpsdataContext context) => _context = context;

        public async Task<FMSResponseMessage<List<TagMonitoringConfig>>> Handle (GetTagMonitoringConfigsQuery request, CancellationToken cancellationToken) {
            var configs = await _context.TagMonitoringConfigs.Include (x => x.Vehicle).ToListAsync (cancellationToken);
            return new FMSResponseMessage<List<TagMonitoringConfig>> (true, "Fetched successfully", configs);
        }
    }
}