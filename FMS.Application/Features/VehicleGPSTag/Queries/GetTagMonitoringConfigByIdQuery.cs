using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Queries.Database.FMSQuery.TagMonitoringConfigQuery {
    public record GetTagMonitoringConfigByIdQuery (int Id) : IRequest<FMSResponseMessage<VehicleLocationTagMonitoringConfig>>;

    //Cursor
    public class GetTagMonitoringConfigByIdQueryHandler : IRequestHandler<GetTagMonitoringConfigByIdQuery, FMSResponseMessage<VehicleLocationTagMonitoringConfig>> {
        private readonly GpsdataContext _context;
        public GetTagMonitoringConfigByIdQueryHandler (GpsdataContext context) => _context = context;

        public async Task<FMSResponseMessage<VehicleLocationTagMonitoringConfig>> Handle (GetTagMonitoringConfigByIdQuery request, CancellationToken cancellationToken) {
            var config = await _context.TagMonitoringConfigs.Include (x => x.Vehicle).FirstOrDefaultAsync (x => x.Id == request.Id, cancellationToken);
            if (config == null)
                return new FMSResponseMessage<VehicleLocationTagMonitoringConfig> (false, "Config not found", null);
            return new FMSResponseMessage<VehicleLocationTagMonitoringConfig> (true, "Fetched successfully", config);
        }
    }
}