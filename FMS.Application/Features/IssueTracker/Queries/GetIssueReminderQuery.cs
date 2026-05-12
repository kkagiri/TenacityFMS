/**
 * File: GetIssueReminderQuery.cs
 * Purpose: Query to get reminder for an issue
 * Dependencies: MediatR, GpsdataContext
 * Last Modified: 2026-02-05
 */
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Queries
{
    public record GetIssueReminderQuery(int IssueId) : IRequest<FMSResponse<IssueReminderDTO?>>;

    public class GetIssueReminderQueryHandler
        : IRequestHandler<GetIssueReminderQuery, FMSResponse<IssueReminderDTO?>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetIssueReminderQueryHandler> _logger;

        public GetIssueReminderQueryHandler(GpsdataContext context, ILogger<GetIssueReminderQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<IssueReminderDTO?>> Handle(
            GetIssueReminderQuery request, CancellationToken cancellationToken)
        {
            var reminder = await _context.IssueReminders
                .FirstOrDefaultAsync(r => r.IssueId == request.IssueId && r.IsActive, cancellationToken);

            if (reminder == null)
            {
                return FMSResponse<IssueReminderDTO?>.Success(null, "No active reminder found");
            }

            // Get creator username
            string? creatorUserName = null;
            if (!string.IsNullOrEmpty(reminder.CreatedBy))
            {
                var creator = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == reminder.CreatedBy, cancellationToken);
                creatorUserName = creator?.UserName;
            }

            var dto = new IssueReminderDTO
            {
                Id = reminder.Id,
                IssueId = reminder.IssueId,
                ReminderType = reminder.ReminderType,
                DaysBefore = reminder.DaysBefore,
                ReminderTime = reminder.ReminderTime?.ToString(@"hh\:mm"),
                RecipientUserIds = !string.IsNullOrEmpty(reminder.RecipientUserIds)
                    ? JsonSerializer.Deserialize<System.Collections.Generic.List<string>>(reminder.RecipientUserIds)
                    : null,
                NotifyAssignee = reminder.NotifyAssignee,
                NotifyOpener = reminder.NotifyOpener,
                CustomMessage = reminder.CustomMessage,
                IsActive = reminder.IsActive,
                LastSentDate = reminder.LastSentDate,
                NextReminderDate = reminder.NextReminderDate,
                CreatedBy = creatorUserName ?? reminder.CreatedBy,
                CreatedDate = reminder.CreatedDate
            };

            return FMSResponse<IssueReminderDTO?>.Success(dto);
        }
    }
}
