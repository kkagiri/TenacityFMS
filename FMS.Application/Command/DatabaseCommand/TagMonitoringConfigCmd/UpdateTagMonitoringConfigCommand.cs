using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;

namespace FMS.Application.Command.DatabaseCommand.TagMonitoringConfigCmd {
    public record UpdateTagMonitoringConfigCommand (TagMonitoringConfig Config) : IRequest<FMSResponseMessage<TagMonitoringConfig>>;

    //Cursor
    public class UpdateTagMonitoringConfigCommandHandler : IRequestHandler<UpdateTagMonitoringConfigCommand, FMSResponseMessage<TagMonitoringConfig>> {
        private readonly GpsdataContext _context;
        public UpdateTagMonitoringConfigCommandHandler (GpsdataContext context) => _context = context;

        public async Task<FMSResponseMessage<TagMonitoringConfig>> Handle (UpdateTagMonitoringConfigCommand request, CancellationToken cancellationToken) {
            _context.Entry (request.Config).State = Microsoft.EntityFrameworkCore.EntityState.Modified;
            await _context.SaveChangesAsync (cancellationToken);
            return new FMSResponseMessage<TagMonitoringConfig> (true, "Updated successfully", request.Config);
        }
    }
}