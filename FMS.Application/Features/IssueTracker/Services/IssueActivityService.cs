/**
 * File: IssueActivityService.cs
 * Purpose: Implementation of issue activity logging service
 * Dependencies: FMS.Persistence.DataAccess, FMS.Domain.Entities
 * Last Modified: 2026-02-05
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.IssueTracker.DTOs;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Services
{
    /// <summary>
    /// Service for tracking and logging issue activities
    /// </summary>
    public class IssueActivityService : IIssueActivityService
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<IssueActivityService> _logger;

        public IssueActivityService(GpsdataContext context, ILogger<IssueActivityService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task LogActivityAsync(
            int issueId,
            string activityType,
            string description,
            string performedByUserId,
            string? performedByUserName = null,
            string? fieldName = null,
            string? oldValue = null,
            string? newValue = null,
            string? metadata = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var activity = new IssueActivityLog
                {
                    IssueId = issueId,
                    ActivityType = activityType,
                    Description = description,
                    PerformedBy = performedByUserId,
                    PerformedByUserName = performedByUserName,
                    FieldName = fieldName,
                    OldValue = oldValue,
                    NewValue = newValue,
                    Metadata = metadata,
                    ActivityDate = DateTime.UtcNow
                };

                await _context.IssueActivityLogs.AddAsync(activity, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation(
                    "Logged activity {ActivityType} for issue {IssueId} by user {UserId}",
                    activityType, issueId, performedByUserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to log activity for issue {IssueId}", issueId);
                // Don't throw - activity logging should not break the main operation
            }
        }

        public async Task LogIssueCreatedAsync(
            int issueId,
            string performedByUserId,
            string performedByUserName,
            CancellationToken cancellationToken = default)
        {
            await LogActivityAsync(
                issueId,
                "Created",
                $"{performedByUserName} has Created Issues",
                performedByUserId,
                performedByUserName,
                cancellationToken: cancellationToken);
        }

        public async Task LogFieldChangeAsync(
            int issueId,
            string fieldName,
            string? oldValue,
            string? newValue,
            string performedByUserId,
            string performedByUserName,
            CancellationToken cancellationToken = default)
        {
            var description = string.IsNullOrEmpty(oldValue)
                ? $"{performedByUserName} has set {fieldName} to {newValue}"
                : $"{performedByUserName} has Updated {fieldName} from {oldValue} to {newValue}";

            await LogActivityAsync(
                issueId,
                "Updated",
                description,
                performedByUserId,
                performedByUserName,
                fieldName,
                oldValue,
                newValue,
                cancellationToken: cancellationToken);
        }

        public async Task LogStatusChangeAsync(
            int issueId,
            string? oldStatus,
            string? newStatus,
            string performedByUserId,
            string performedByUserName,
            CancellationToken cancellationToken = default)
        {
            var description = $"{performedByUserName} has Updated Status from {oldStatus ?? "None"} to {newStatus ?? "None"}";

            await LogActivityAsync(
                issueId,
                "StatusChanged",
                description,
                performedByUserId,
                performedByUserName,
                "Status",
                oldStatus,
                newStatus,
                cancellationToken: cancellationToken);
        }

        public async Task LogPriorityChangeAsync(
            int issueId,
            string? oldPriority,
            string? newPriority,
            string performedByUserId,
            string performedByUserName,
            CancellationToken cancellationToken = default)
        {
            var description = $"{performedByUserName} has Updated Priority from {oldPriority ?? "None"} to {newPriority ?? "None"}";

            await LogActivityAsync(
                issueId,
                "PriorityChanged",
                description,
                performedByUserId,
                performedByUserName,
                "Priority",
                oldPriority,
                newPriority,
                cancellationToken: cancellationToken);
        }

        public async Task LogAssignmentChangeAsync(
            int issueId,
            string? oldAssignee,
            string? newAssignee,
            string performedByUserId,
            string performedByUserName,
            CancellationToken cancellationToken = default)
        {
            var description = string.IsNullOrEmpty(oldAssignee)
                ? $"{performedByUserName} has Assigned issue to {newAssignee}"
                : $"{performedByUserName} has Reassigned issue from {oldAssignee} to {newAssignee}";

            await LogActivityAsync(
                issueId,
                "Assigned",
                description,
                performedByUserId,
                performedByUserName,
                "AssignedTo",
                oldAssignee,
                newAssignee,
                cancellationToken: cancellationToken);
        }

        public async Task LogReminderSetAsync(
            int issueId,
            string reminderType,
            string performedByUserId,
            string performedByUserName,
            CancellationToken cancellationToken = default)
        {
            await LogActivityAsync(
                issueId,
                "ReminderSet",
                $"{performedByUserName} has Updated Reminder",
                performedByUserId,
                performedByUserName,
                "Reminder",
                null,
                reminderType,
                cancellationToken: cancellationToken);
        }

        public async Task LogTagsUpdateAsync(
            int issueId,
            string? oldTags,
            string? newTags,
            string performedByUserId,
            string performedByUserName,
            CancellationToken cancellationToken = default)
        {
            var description = $"{performedByUserName} has updated Tags from {oldTags ?? "None"} to [{newTags ?? "None"}]";

            await LogActivityAsync(
                issueId,
                "TagsUpdated",
                description,
                performedByUserId,
                performedByUserName,
                "Tags",
                oldTags,
                newTags,
                cancellationToken: cancellationToken);
        }

        public async Task<List<IssueActivityLogDTO>> GetActivitiesForIssueAsync(
            int issueId,
            CancellationToken cancellationToken = default)
        {
            var activities = await _context.IssueActivityLogs
                .Where(a => a.IssueId == issueId)
                .OrderByDescending(a => a.ActivityDate)
                .Select(a => new IssueActivityLogDTO
                {
                    Id = a.Id,
                    IssueId = a.IssueId,
                    ActivityType = a.ActivityType,
                    FieldName = a.FieldName,
                    OldValue = a.OldValue,
                    NewValue = a.NewValue,
                    Description = a.Description,
                    PerformedBy = a.PerformedBy,
                    PerformedByUserName = a.PerformedByUserName,
                    ActivityDate = a.ActivityDate,
                    Metadata = a.Metadata
                })
                .ToListAsync(cancellationToken);

            return activities;
        }

        public async Task<List<IssueActivityLogDTO>> GetRecentActivitiesAsync(
            int issueId,
            int count = 10,
            CancellationToken cancellationToken = default)
        {
            var activities = await _context.IssueActivityLogs
                .Where(a => a.IssueId == issueId)
                .OrderByDescending(a => a.ActivityDate)
                .Take(count)
                .Select(a => new IssueActivityLogDTO
                {
                    Id = a.Id,
                    IssueId = a.IssueId,
                    ActivityType = a.ActivityType,
                    FieldName = a.FieldName,
                    OldValue = a.OldValue,
                    NewValue = a.NewValue,
                    Description = a.Description,
                    PerformedBy = a.PerformedBy,
                    PerformedByUserName = a.PerformedByUserName,
                    ActivityDate = a.ActivityDate,
                    Metadata = a.Metadata
                })
                .ToListAsync(cancellationToken);

            return activities;
        }
    }
}
