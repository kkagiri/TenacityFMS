/**
 * File: GetFollowedIssuesQuery.cs
 * Purpose: Query to get all issues followed by a user (for dashboard ticker)
 * Dependencies: MediatR, GpsdataContext
 * Last Modified: 2026-02-05
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs;
using FMS.Application.Features.IssueTracker.Services;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Queries
{
    public record GetFollowedIssuesQuery(string UserId, int? Limit = null) : IRequest<FMSResponse<List<FollowedIssueSummaryDTO>>>;

    public class GetFollowedIssuesQueryHandler
        : IRequestHandler<GetFollowedIssuesQuery, FMSResponse<List<FollowedIssueSummaryDTO>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetFollowedIssuesQueryHandler> _logger;

        public GetFollowedIssuesQueryHandler(GpsdataContext context, ILogger<GetFollowedIssuesQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<List<FollowedIssueSummaryDTO>>> Handle(
            GetFollowedIssuesQuery request, CancellationToken cancellationToken)
        {
            try
            {
                await IssueFollowerSchemaGuard.EnsureTableExistsAsync(_context, cancellationToken);

                // Get followed issue IDs
                var followedIssueIds = await _context.IssueFollowers
                    .Where(f => f.UserId == request.UserId)
                    .Select(f => f.IssueId)
                    .ToListAsync(cancellationToken);

                if (!followedIssueIds.Any())
                {
                    return FMSResponse<List<FollowedIssueSummaryDTO>>.Success(new List<FollowedIssueSummaryDTO>());
                }

                // Get issues with their latest activity
                var issuesQuery = _context.Issuetrackers
                    .Where(i => followedIssueIds.Contains(i.Id))
                    .Select(i => new FollowedIssueSummaryDTO
                    {
                        IssueId = i.Id,
                        IssueNumber = i.Id.ToString(),
                        Title = i.ProblemTitle,
                        Status = i.StatusNavigation != null ? i.StatusNavigation.Status : null,
                        Priority = i.PriorityNavigation != null ? i.PriorityNavigation.Name : null,
                        DueDate = i.DueDate,
                        AssignedTo = i.AssignedTo ?? i.AssignTo,
                        RecentActivityCount = _context.IssueActivityLogs
                            .Count(a => a.IssueId == i.Id && a.ActivityDate > DateTime.UtcNow.AddDays(-7)),
                        LastActivityDate = _context.IssueActivityLogs
                            .Where(a => a.IssueId == i.Id)
                            .OrderByDescending(a => a.ActivityDate)
                            .Select(a => (DateTime?)a.ActivityDate)
                            .FirstOrDefault(),
                        LastActivityDescription = _context.IssueActivityLogs
                            .Where(a => a.IssueId == i.Id)
                            .OrderByDescending(a => a.ActivityDate)
                            .Select(a => a.Description)
                            .FirstOrDefault()
                    })
                    .OrderByDescending(i => i.LastActivityDate ?? DateTime.MinValue);

                var issues = request.Limit.HasValue
                    ? await issuesQuery.Take(request.Limit.Value).ToListAsync(cancellationToken)
                    : await issuesQuery.ToListAsync(cancellationToken);

                return FMSResponse<List<FollowedIssueSummaryDTO>>.Success(issues);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting followed issues for user {UserId}", request.UserId);
                return FMSResponse<List<FollowedIssueSummaryDTO>>.Failed($"Failed to get followed issues: {ex.Message}");
            }
        }
    }
}
