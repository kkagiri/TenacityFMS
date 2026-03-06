/**
 * File: DeleteScheduledReportEmailCommand.cs
 * Purpose: Command and handler to permanently delete a scheduled report email and its recipients.
 * Dependencies: MediatR, GpsdataContext
 * Last Modified: 2026-03-05
 *
 * Key Types:
 * - DeleteScheduledReportEmailCommand: Identifies the notification to permanently remove.
 * - DeleteScheduledReportEmailCommandHandler: Removes recipients then the notification entity.
 */
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Notification.Commands.ScheduledReport
{
    public record DeleteScheduledReportEmailCommand(int NotificationId) : IRequest<FMSResponse<bool>>;

    public class DeleteScheduledReportEmailCommandHandler
        : IRequestHandler<DeleteScheduledReportEmailCommand, FMSResponse<bool>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<DeleteScheduledReportEmailCommandHandler> _logger;

        public DeleteScheduledReportEmailCommandHandler(
            GpsdataContext context,
            ILogger<DeleteScheduledReportEmailCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<bool>> Handle(
            DeleteScheduledReportEmailCommand command,
            CancellationToken cancellationToken)
        {
            var notification = await _context.Notifications
                .Include(n => n.Recipients)
                .FirstOrDefaultAsync(n => n.Id == command.NotificationId, cancellationToken);

            if (notification == null)
            {
                return FMSResponse<bool>.Failed("Scheduled report notification not found");
            }

            // Remove associated recipients first
            if (notification.Recipients?.Any() == true)
            {
                _context.NotificationRecipients.RemoveRange(notification.Recipients);
            }

            // Remove the notification itself
            _context.Notifications.Remove(notification);

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Permanently deleted scheduled report email {NotificationId} (DB ID: {Id})",
                notification.NotificationId, command.NotificationId);

            return FMSResponse<bool>.Success(true, "Scheduled report email deleted permanently");
        }
    }
}
