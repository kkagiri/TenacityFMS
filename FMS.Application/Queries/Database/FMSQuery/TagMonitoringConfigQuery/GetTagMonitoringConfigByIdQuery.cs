using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Queries.Database.FMSQuery.TagMonitoringConfigQuery {
    public record GetTagMonitoringConfigByIdQuery (int Id) : IRequest<FMSResponseMessage<TagMonitoringConfig>>;

    //Cursor
    public class GetTagMonitoringConfigByIdQueryHandler : IRequestHandler<GetTagMonitoringConfigByIdQuery, FMSResponseMessage<TagMonitoringConfig>> {
        private readonly GpsdataContext _context;
        public GetTagMonitoringConfigByIdQueryHandler (GpsdataContext context) => _context = context;

        public async Task<FMSResponseMessage<TagMonitoringConfig>> Handle (GetTagMonitoringConfigByIdQuery request, CancellationToken cancellationToken) {
            var config = await _context.TagMonitoringConfigs.Include (x => x.Vehicle).FirstOrDefaultAsync (x => x.Id == request.Id, cancellationToken);
            if (config == null)
                return new FMSResponseMessage<TagMonitoringConfig> (false, "Config not found", null);
            return new FMSResponseMessage<TagMonitoringConfig> (true, "Fetched successfully", config);
        }
    }
}