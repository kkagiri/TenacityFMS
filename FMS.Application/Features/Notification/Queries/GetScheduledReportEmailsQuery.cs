/**
 * File: GetScheduledReportEmailsQuery.cs
 * Purpose: Query and handler to retrieve scheduled report email notifications.
 * Dependencies: MediatR, GpsdataContext, NotificationDataHelper
 * Last Modified: 2026-03-05
 *
 * Key Types:
 * - GetScheduledReportEmailsQuery: Filters scheduled report emails with optional completed.
 * - GetScheduledReportEmailsQueryHandler: Queries and maps scheduled report notifications.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.Services;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.Notification.Queries
{
    public record GetScheduledReportEmailsQuery(
        bool IncludeCompleted = false,
        int Take = 100
    ) : IRequest<FMSResponse<List<ScheduledReportEmailDto>>>;

    public class GetScheduledReportEmailsQueryHandler
        : IRequestHandler<GetScheduledReportEmailsQuery, FMSResponse<List<ScheduledReportEmailDto>>>
    {
        private readonly GpsdataContext _context;

        public GetScheduledReportEmailsQueryHandler(GpsdataContext context)
        {
            _context = context;
        }

        public async Task<FMSResponse<List<ScheduledReportEmailDto>>> Handle(
            GetScheduledReportEmailsQuery request,
            CancellationToken cancellationToken)
        {
            var safeTake = Math.Max(1, Math.Min(request.Take, 500));

            var query = _context.Notifications
                .Include(n => n.Recipients)
                .ThenInclude(r => r.User)
                .Where(n =>
                    n.TriggerSource == "TransactionVolumeHistoryReportSchedule" ||
                    (n.TriggerSource != null && n.TriggerSource.EndsWith("ReportSchedule")));

            if (!request.IncludeCompleted)
            {
                query = query.Where(n =>
                    n.Status == "Scheduled" ||
                    n.Status == "Pending" ||
                    n.Status == "PartiallyFailed");
            }

            var notifications = await query
                .OrderByDescending(n => n.CreatedAt)
                .Take(safeTake)
                .ToListAsync(cancellationToken);

            var response = notifications
                .Select(NotificationDataHelper.MapScheduledReportEmail)
                .ToList();

            return FMSResponse<List<ScheduledReportEmailDto>>.Success(
                response,
                $"Retrieved {response.Count} scheduled report email records");
        }
    }
}
