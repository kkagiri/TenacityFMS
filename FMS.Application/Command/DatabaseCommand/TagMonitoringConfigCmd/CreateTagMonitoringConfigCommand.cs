using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;

namespace FMS.Application.Command.DatabaseCommand.TagMonitoringConfigCmd {
    public record CreateTagMonitoringConfigCommand (TagMonitoringConfig Config) : IRequest<FMSResponseMessage<TagMonitoringConfig>>;

    //Cursor
    public class CreateTagMonitoringConfigCommandHandler : IRequestHandler<CreateTagMonitoringConfigCommand, FMSResponseMessage<TagMonitoringConfig>> {
        private readonly GpsdataContext _context;
        public CreateTagMonitoringConfigCommandHandler (GpsdataContext context) => _context = context;

        public async Task<FMSResponseMessage<TagMonitoringConfig>> Handle (CreateTagMonitoringConfigCommand request, CancellationToken cancellationToken) {
            _context.TagMonitoringConfigs.Add (request.Config);
            await _context.SaveChangesAsync (cancellationToken);
            return new FMSResponseMessage<TagMonitoringConfig> (true, "Created successfully", request.Config);
        }
    }
}