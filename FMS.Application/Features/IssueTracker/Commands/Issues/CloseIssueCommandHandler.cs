/**
 * File: CloseIssueCommandHandler.cs
 * Purpose: Handles closing an issue with approver permission check (four-eyes principle)
 * Dependencies: GpsdataContext, IIssueActivityService
 * Last Modified: 2026-02-06
 *
 * Key Rules:
 * - The user closing the issue must NOT be the assignee (approver != field agent)
 * - Finds the "closed/completed/done" status automatically
 * - Sets ClosingDate to UTC now
 * - Logs activity with approver details
 */
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.Services;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Commands.Issues
{
    public class CloseIssueCommandHandler : IRequestHandler<CloseIssueCommand, FMSResponse<bool>>
    {
        private readonly GpsdataContext _context;
        private readonly IIssueActivityService _activityService;
        private readonly ILogger<CloseIssueCommandHandler> _logger;

        public CloseIssueCommandHandler(
            GpsdataContext context,
            IIssueActivityService activityService,
            ILogger<CloseIssueCommandHandler> logger)
        {
            _context = context;
            _activityService = activityService;
            _logger = logger;
        }

        public async Task<FMSResponse<bool>> Handle(CloseIssueCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Fetch issue
                var issue = await _context.Issuetrackers
                    .FirstOrDefaultAsync(i => i.Id == request.IssueId, cancellationToken);

                if (issue == null)
                {
                    return FMSResponse<bool>.Failed($"Issue with ID {request.IssueId} not found.");
                }

                // ========== APPROVER PERMISSION CHECK ==========
                // The user closing the issue must NOT be the assignee (four-eyes principle)
                if (string.Equals(issue.AssignTo, request.ClosedByUserId, StringComparison.OrdinalIgnoreCase))
                {
                    return FMSResponse<bool>.Failed(
                        "The assigned field agent cannot close their own issue. An approver (supervisor/manager) must close it.");
                }

                // Find a "closed" status
                var closedStatus = await _context.Issuestatuses
                    .Where(s => s.Status != null &&
                        (s.Status.ToLower().Contains("closed") ||
                         s.Status.ToLower().Contains("complete") ||
                         s.Status.ToLower().Contains("resolved") ||
                         s.Status.ToLower().Contains("done")))
                    .FirstOrDefaultAsync(cancellationToken);

                if (closedStatus == null)
                {
                    return FMSResponse<bool>.Failed(
                        "No closed/completed status is configured. Please create a status with 'Closed', 'Completed', 'Resolved', or 'Done' in its name.");
                }

                // Resolve approver username
                var approverUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == request.ClosedByUserId, cancellationToken);

                var previousStatusId = issue.Status;
                var previousStatusName = previousStatusId.HasValue
                    ? await _context.Issuestatuses
                        .Where(s => s.Id == previousStatusId.Value)
                        .Select(s => s.Status)
                        .FirstOrDefaultAsync(cancellationToken)
                    : null;

                // Update issue
                issue.Status = closedStatus.Id;
                issue.ClosingDate = DateTime.UtcNow;
                issue.LastModfield = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);

                // Log activity
                await _activityService.LogActivityAsync(
                    issue.Id,
                    "IssueClosed",
                    $"Issue closed by approver {approverUser?.UserName ?? request.ClosedByUserId}" +
                        (string.IsNullOrWhiteSpace(request.ClosingNotes) ? "" : $". Notes: {request.ClosingNotes}"),
                    request.ClosedByUserId,
                    approverUser?.UserName,
                    fieldName: "Status",
                    oldValue: previousStatusName ?? previousStatusId?.ToString(),
                    newValue: closedStatus.Status,
                    cancellationToken: cancellationToken);

                _logger.LogInformation(
                    "Issue {IssueId} closed by approver {ApproverUserId} ({ApproverName})",
                    issue.Id, request.ClosedByUserId, approverUser?.UserName);

                return FMSResponse<bool>.Success(true, "Issue closed successfully by approver.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error closing issue {IssueId}", request.IssueId);
                return FMSResponse<bool>.Failed($"Error closing issue: {ex.Message}");
            }
        }
    }
}
