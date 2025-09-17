using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;

namespace FMS.Application.Command.DatabaseCommand.TagMonitoringConfigCmd {
    public record DeleteTagMonitoringConfigCommand (int Id) : IRequest<FMSResponseMessage>;

    //Cursor
    public class DeleteTagMonitoringConfigCommandHandler : IRequestHandler<DeleteTagMonitoringConfigCommand, FMSResponseMessage> {
        private readonly GpsdataContext _context;
        public DeleteTagMonitoringConfigCommandHandler (GpsdataContext context) => _context = context;

        public async Task<FMSResponseMessage> Handle (DeleteTagMonitoringConfigCommand request, CancellationToken cancellationToken) {
            var config = await _context.TagMonitoringConfigs.FindAsync (new object[] { request.Id }, cancellationToken);
            if (config == null)
                return new FMSResponseMessage (false, "Config not found");
            _context.TagMonitoringConfigs.Remove (config);
            await _context.SaveChangesAsync (cancellationToken);
            return new FMSResponseMessage (true, "Deleted successfully");
        }
    }
}