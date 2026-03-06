/**
 * File: CancelScheduledReportEmailCommand.cs
 * Purpose: Command and handler to cancel a scheduled report email notification.
 * Dependencies: MediatR, GpsdataContext, NotificationDataHelper, Newtonsoft.Json
 * Last Modified: 2026-03-05
 *
 * Key Types:
 * - CancelScheduledReportEmailCommand: Identifies the notification to cancel by ID.
 * - CancelScheduledReportEmailCommandHandler: Disables recurring schedule and sets Cancelled status.
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.Services;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Features.Notification.Commands.ScheduledReport
{
    public record CancelScheduledReportEmailCommand(int NotificationId) : IRequest<FMSResponse<bool>>;

    public class CancelScheduledReportEmailCommandHandler
        : IRequestHandler<CancelScheduledReportEmailCommand, FMSResponse<bool>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<CancelScheduledReportEmailCommandHandler> _logger;

        public CancelScheduledReportEmailCommandHandler(
            GpsdataContext context,
            ILogger<CancelScheduledReportEmailCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<bool>> Handle(
            CancelScheduledReportEmailCommand command,
            CancellationToken cancellationToken)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == command.NotificationId, cancellationToken);

            if (notification == null)
            {
                return FMSResponse<bool>.Failed("Scheduled report notification not found");
            }

            if (string.Equals(notification.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
            {
                return FMSResponse<bool>.Success(true, "Schedule already cancelled");
            }

            var root = NotificationDataHelper.ParseNotificationData(notification.Data);
            var recurringSchedule = root["recurringSchedule"] as JObject ?? new JObject();
            recurringSchedule["enabled"] = false;
            recurringSchedule["cancelledAtUtc"] = DateTime.UtcNow.ToString("o");
            root["recurringSchedule"] = recurringSchedule;

            notification.Status = "Cancelled";
            notification.ScheduledAt = null;
            notification.ErrorMessage = "Schedule cancelled by administrator";
            notification.Data = root.ToString(Formatting.None);

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Cancelled scheduled report email {NotificationId}", command.NotificationId);

            return FMSResponse<bool>.Success(true, "Scheduled report email cancelled successfully");
        }
    }
}
