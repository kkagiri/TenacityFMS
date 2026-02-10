/**
 * File: GetIssueActivitiesQuery.cs
 * Purpose: Query to get activity log for an issue
 * Dependencies: MediatR, GpsdataContext
 * Last Modified: 2026-02-10
 */
using System;
using System.Collections.Generic;
using System.Linq;
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
    public record GetIssueActivitiesQuery(int IssueId, int? Limit = null)
        : IRequest<FMSResponse<List<IssueActivityLogDTO>>>;

    public class GetIssueActivitiesQueryHandler
        : IRequestHandler<GetIssueActivitiesQuery, FMSResponse<List<IssueActivityLogDTO>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetIssueActivitiesQueryHandler> _logger;

        public GetIssueActivitiesQueryHandler(GpsdataContext context, ILogger<GetIssueActivitiesQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<List<IssueActivityLogDTO>>> Handle(
            GetIssueActivitiesQuery request, CancellationToken cancellationToken)
        {
            var activities = await _context.IssueActivityLogs
                .Where(a => a.IssueId == request.IssueId)
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

            var timelineFallbackEntries = await BuildTimelineFallbackEntriesAsync(request.IssueId, activities, cancellationToken);
            if (timelineFallbackEntries.Count > 0)
            {
                activities = activities
                    .Concat(timelineFallbackEntries)
                    .OrderByDescending(a => a.ActivityDate)
                    .ToList();
            }

            if (request.Limit.HasValue && request.Limit.Value > 0)
            {
                activities = activities.Take(request.Limit.Value).ToList();
            }

            return FMSResponse<List<IssueActivityLogDTO>>.Success(activities);
        }

        private async Task<List<IssueActivityLogDTO>> BuildTimelineFallbackEntriesAsync(
            int issueId,
            IReadOnlyCollection<IssueActivityLogDTO> existingActivities,
            CancellationToken cancellationToken)
        {
            var issueSnapshot = await _context.Issuetrackers
                .AsNoTracking()
                .Where(i => i.Id == issueId)
                .Select(i => new
                {
                    i.Id,
                    i.ProblemTitle,
                    i.OpenDate,
                    i.DueDate,
                    i.ClosingDate,
                    i.Openby,
                    OpenedByUserName = i.OpenbyNavigation != null ? i.OpenbyNavigation.UserName : null
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (issueSnapshot == null)
            {
                return new List<IssueActivityLogDTO>();
            }

            var fallbackEntries = new List<IssueActivityLogDTO>();
            var hasCreatedActivity = existingActivities.Any(a =>
                string.Equals(a.ActivityType, "Created", StringComparison.OrdinalIgnoreCase));
            var hasClosedActivity = existingActivities.Any(a =>
                string.Equals(a.ActivityType, "Closed", StringComparison.OrdinalIgnoreCase));
            var hasDueDateActivity = existingActivities.Any(a =>
                string.Equals(a.FieldName, "DueDate", StringComparison.OrdinalIgnoreCase)
                || (!string.IsNullOrWhiteSpace(a.Description)
                    && a.Description.Contains("due date", StringComparison.OrdinalIgnoreCase)));

            if (!hasCreatedActivity && issueSnapshot.OpenDate.HasValue)
            {
                fallbackEntries.Add(new IssueActivityLogDTO
                {
                    Id = 0,
                    IssueId = issueSnapshot.Id,
                    ActivityType = "Created",
                    FieldName = null,
                    OldValue = null,
                    NewValue = issueSnapshot.ProblemTitle,
                    Description = "Issue opened",
                    PerformedBy = issueSnapshot.Openby ?? "System",
                    PerformedByUserName = issueSnapshot.OpenedByUserName,
                    ActivityDate = issueSnapshot.OpenDate.Value,
                    Metadata = "{\"source\":\"timeline-fallback\"}"
                });
            }

            if (!hasDueDateActivity && issueSnapshot.DueDate.HasValue)
            {
                fallbackEntries.Add(new IssueActivityLogDTO
                {
                    Id = 0,
                    IssueId = issueSnapshot.Id,
                    ActivityType = "Updated",
                    FieldName = "DueDate",
                    OldValue = null,
                    NewValue = issueSnapshot.DueDate.Value.ToString("yyyy-MM-dd"),
                    Description = $"Due date set to {issueSnapshot.DueDate.Value:yyyy-MM-dd}",
                    PerformedBy = issueSnapshot.Openby ?? "System",
                    PerformedByUserName = issueSnapshot.OpenedByUserName,
                    ActivityDate = issueSnapshot.DueDate.Value,
                    Metadata = "{\"source\":\"timeline-fallback\"}"
                });
            }

            if (!hasClosedActivity && issueSnapshot.ClosingDate.HasValue)
            {
                fallbackEntries.Add(new IssueActivityLogDTO
                {
                    Id = 0,
                    IssueId = issueSnapshot.Id,
                    ActivityType = "Closed",
                    FieldName = "Status",
                    OldValue = null,
                    NewValue = "Closed",
                    Description = "Issue closed",
                    PerformedBy = issueSnapshot.Openby ?? "System",
                    PerformedByUserName = issueSnapshot.OpenedByUserName,
                    ActivityDate = issueSnapshot.ClosingDate.Value,
                    Metadata = "{\"source\":\"timeline-fallback\"}"
                });
            }

            return fallbackEntries;
        }
    }
}
