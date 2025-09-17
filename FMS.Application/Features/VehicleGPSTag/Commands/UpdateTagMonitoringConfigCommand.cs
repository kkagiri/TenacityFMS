using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;

namespace FMS.Application.Command.DatabaseCommand.TagMonitoringConfigCmd {
    public record UpdateTagMonitoringConfigCommand (VehicleLocationTagMonitoringConfig Config) : IRequest<FMSResponseMessage<VehicleLocationTagMonitoringConfig>>;

    //Cursor
    public class UpdateTagMonitoringConfigCommandHandler : IRequestHandler<UpdateTagMonitoringConfigCommand, FMSResponseMessage<VehicleLocationTagMonitoringConfig>> {
        private readonly GpsdataContext _context;
        public UpdateTagMonitoringConfigCommandHandler (GpsdataContext context) => _context = context;

        public async Task<FMSResponseMessage<VehicleLocationTagMonitoringConfig>> Handle (UpdateTagMonitoringConfigCommand request, CancellationToken cancellationToken) {
            _context.Entry (request.Config).State = Microsoft.EntityFrameworkCore.EntityState.Modified;
            await _context.SaveChangesAsync (cancellationToken);
            return new FMSResponseMessage<VehicleLocationTagMonitoringConfig> (true, "Updated successfully", request.Config);
        }
    }
}