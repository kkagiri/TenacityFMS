using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;

namespace FMS.Application.Command.DatabaseCommand.TagMonitoringConfigCmd {
    public record CreateTagMonitoringConfigCommand (VehicleLocationTagMonitoringConfig Config) : IRequest<FMSResponseMessage<VehicleLocationTagMonitoringConfig>>;

    //Cursor
    public class CreateTagMonitoringConfigCommandHandler : IRequestHandler<CreateTagMonitoringConfigCommand, FMSResponseMessage<VehicleLocationTagMonitoringConfig>> {
        private readonly GpsdataContext _context;
        public CreateTagMonitoringConfigCommandHandler (GpsdataContext context) => _context = context;

        public async Task<FMSResponseMessage<VehicleLocationTagMonitoringConfig>> Handle (CreateTagMonitoringConfigCommand request, CancellationToken cancellationToken) {
            _context.TagMonitoringConfigs.Add (request.Config);
            await _context.SaveChangesAsync (cancellationToken);
            return new FMSResponseMessage<VehicleLocationTagMonitoringConfig> (true, "Created successfully", request.Config);
        }
    }
}