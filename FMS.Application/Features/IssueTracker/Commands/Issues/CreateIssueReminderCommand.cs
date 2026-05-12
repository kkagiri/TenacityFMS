/**
 * File: CreateIssueReminderCommand.cs
 * Purpose: Command to create a new issue reminder
 * Dependencies: MediatR, GpsdataContext, IIssueActivityService
 * Last Modified: 2026-02-05
 */
using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs;
using FMS.Application.Features.IssueTracker.Services;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Commands.Issues
{
    public record CreateIssueReminderCommand(CreateIssueReminderDTO ReminderDto, string CurrentUserId, string CurrentUserName)
        : IRequest<FMSResponse<IssueReminderDTO>>;

    public class CreateIssueReminderCommandHandler : IRequestHandler<CreateIssueReminderCommand, FMSResponse<IssueReminderDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly IIssueActivityService _activityService;
        private readonly ILogger<CreateIssueReminderCommandHandler> _logger;

        public CreateIssueReminderCommandHandler(
            GpsdataContext context,
            IIssueActivityService activityService,
            ILogger<CreateIssueReminderCommandHandler> logger)
        {
            _context = context;
            _activityService = activityService;
            _logger = logger;
        }

        public async Task<FMSResponse<IssueReminderDTO>> Handle(CreateIssueReminderCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Validate issue exists
                var issue = await _context.Issuetrackers.FindAsync(new object[] { request.ReminderDto.IssueId }, cancellationToken);
                if (issue == null)
                {
                    return FMSResponse<IssueReminderDTO>.Failed($"Issue with ID {request.ReminderDto.IssueId} not found");
                }

                // Check for existing active reminder
                var existingReminder = await _context.IssueReminders
                    .FirstOrDefaultAsync(r => r.IssueId == request.ReminderDto.IssueId && r.IsActive, cancellationToken);

                if (existingReminder != null)
                {
                    // Deactivate existing reminder
                    existingReminder.IsActive = false;
                }

                // Parse reminder time
                TimeSpan? reminderTime = null;
                if (!string.IsNullOrEmpty(request.ReminderDto.ReminderTime))
                {
                    if (TimeSpan.TryParse(request.ReminderDto.ReminderTime, out var parsedTime))
                    {
                        reminderTime = parsedTime;
                    }
                }

                // Calculate next reminder date based on due date
                DateTime? nextReminderDate = null;
                if (issue.DueDate.HasValue)
                {
                    nextReminderDate = issue.DueDate.Value.AddDays(-request.ReminderDto.DaysBefore);
                    if (reminderTime.HasValue)
                    {
                        nextReminderDate = nextReminderDate.Value.Date + reminderTime.Value;
                    }
                    // If next reminder is in the past, set it to now
                    if (nextReminderDate < DateTime.UtcNow)
                    {
                        nextReminderDate = DateTime.UtcNow;
                    }
                }

                // Create the reminder
                var reminder = new IssueReminder
                {
                    IssueId = request.ReminderDto.IssueId,
                    ReminderType = request.ReminderDto.ReminderType,
                    DaysBefore = request.ReminderDto.DaysBefore,
                    ReminderTime = reminderTime,
                    RecipientUserIds = request.ReminderDto.RecipientUserIds != null
                        ? JsonSerializer.Serialize(request.ReminderDto.RecipientUserIds)
                        : null,
                    NotifyAssignee = request.ReminderDto.NotifyAssignee,
                    NotifyOpener = request.ReminderDto.NotifyOpener,
                    CustomMessage = request.ReminderDto.CustomMessage,
                    IsActive = true,
                    NextReminderDate = nextReminderDate,
                    CreatedBy = request.CurrentUserId,
                    CreatedDate = DateTime.UtcNow
                };

                await _context.IssueReminders.AddAsync(reminder, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);

                // Log activity
                await _activityService.LogReminderSetAsync(
                    request.ReminderDto.IssueId,
                    request.ReminderDto.ReminderType,
                    request.CurrentUserId,
                    request.CurrentUserName,
                    cancellationToken);

                // Return the created reminder
                var result = new IssueReminderDTO
                {
                    Id = reminder.Id,
                    IssueId = reminder.IssueId,
                    ReminderType = reminder.ReminderType,
                    DaysBefore = reminder.DaysBefore,
                    ReminderTime = reminder.ReminderTime?.ToString(@"hh\:mm"),
                    RecipientUserIds = request.ReminderDto.RecipientUserIds,
                    NotifyAssignee = reminder.NotifyAssignee,
                    NotifyOpener = reminder.NotifyOpener,
                    CustomMessage = reminder.CustomMessage,
                    IsActive = reminder.IsActive,
                    NextReminderDate = reminder.NextReminderDate,
                    CreatedBy = request.CurrentUserName,
                    CreatedDate = reminder.CreatedDate
                };

                return FMSResponse<IssueReminderDTO>.Success(result, "Reminder created successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating reminder for issue {IssueId}", request.ReminderDto.IssueId);
                return FMSResponse<IssueReminderDTO>.Failed("Failed to create reminder");
            }
        }
    }
}
