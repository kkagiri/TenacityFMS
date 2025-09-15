using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.Dashboard {
    // Delete Widget Instance Command
    public record DeleteWidgetInstanceCommand (
        string UserId,
        int WidgetInstanceId,
        string Actor) : IRequest<FMSResponseMessage<bool>>;

    public class DeleteWidgetInstanceCommandHandler : IRequestHandler<DeleteWidgetInstanceCommand, FMSResponseMessage<bool>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<DeleteWidgetInstanceCommandHandler> _logger;

        public DeleteWidgetInstanceCommandHandler (
            GpsdataContext context,
            ILogger<DeleteWidgetInstanceCommandHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponseMessage<bool>> Handle (
            DeleteWidgetInstanceCommand request,
            CancellationToken cancellationToken) {
            try {
                var widgetInstance = await _context.DashboardWidgetInstances
                    .FirstOrDefaultAsync (w => w.Id == request.WidgetInstanceId && w.UserId == request.UserId, cancellationToken);

                if (widgetInstance == null) {
                    return new FMSResponseMessage<bool> (
                        false, "Widget instance not found", false);
                }

                _context.DashboardWidgetInstances.Remove (widgetInstance);
                await _context.SaveChangesAsync (cancellationToken);

                return new FMSResponseMessage<bool> (
                    true, "Widget instance deleted successfully", true);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error deleting widget instance {WidgetId} for user {UserId}",
                    request.WidgetInstanceId, request.UserId);
                return new FMSResponseMessage<bool> (
                    false, ex.Message, false);
            }
        }
    }
}