/*
 * File: RespondToIssueAssignmentCommandHandler.cs
 * Purpose: Handles issue assignment acknowledgement and scheduling responses from assigned workers
 * Dependencies: MediatR, Entity Framework Core, GpsdataContext, FMSResponse
 * Last Modified: 2026-02-03
 */
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Commands.Issues;

public class RespondToIssueAssignmentCommandHandler : IRequestHandler<RespondToIssueAssignmentCommand, FMSResponse<bool>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<RespondToIssueAssignmentCommandHandler> _logger;

    public RespondToIssueAssignmentCommandHandler(
        GpsdataContext context,
        ILogger<RespondToIssueAssignmentCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<bool>> Handle(RespondToIssueAssignmentCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var request = command.Request;
            var normalizedAction = request.Action?.Trim().ToLowerInvariant();

            if (normalizedAction != "confirm" && normalizedAction != "schedule")
            {
                return FMSResponse<bool>.Failed("Action must be either 'confirm' or 'schedule'.");
            }

            if (string.IsNullOrWhiteSpace(request.RespondedByUserId))
            {
                return FMSResponse<bool>.Failed("Authenticated user is required.");
            }

            var issue = await _context.Issuetrackers
                .FirstOrDefaultAsync(i => i.Id == command.IssueId, cancellationToken);

            if (issue == null)
            {
                return FMSResponse<bool>.NotFound($"Issue with ID {command.IssueId} was not found.");
            }

            var responderUserId = request.RespondedByUserId;
            if (!string.Equals(issue.AssignTo, responderUserId, StringComparison.OrdinalIgnoreCase))
            {
                var responder = await _context.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u =>
                        u.Id == responderUserId ||
                        u.UserName == responderUserId,
                        cancellationToken);

                if (responder == null || !string.Equals(issue.AssignTo, responder.Id, StringComparison.OrdinalIgnoreCase))
                {
                    return FMSResponse<bool>.Failed("Only the assigned worker can respond to this issue.");
                }

                request.RespondedByUserId = responder.Id;
            }

            if (normalizedAction == "schedule")
            {
                if (!request.ScheduledDate.HasValue)
                {
                    return FMSResponse<bool>.Failed("Scheduled date is required when action is 'schedule'.");
                }

                var scheduledDate = request.ScheduledDate.Value.Date;
                var today = DateTime.UtcNow.Date;

                if (scheduledDate < today)
                {
                    return FMSResponse<bool>.Failed("Scheduled date cannot be in the past.");
                }

                if (issue.DueDate.HasValue && scheduledDate > issue.DueDate.Value.Date)
                {
                    return FMSResponse<bool>.Failed("Scheduled date must be on or before the current due date.");
                }

                issue.DueDate = scheduledDate;
            }

            if (!string.IsNullOrWhiteSpace(request.Note))
            {
                var notePrefix = normalizedAction == "schedule" ? "[Schedule Note]" : "[Assignment Note]";
                var noteText = request.Note.Trim();
                issue.ProblemDescription = string.IsNullOrWhiteSpace(issue.ProblemDescription)
                    ? $"{notePrefix} {noteText}"
                    : $"{issue.ProblemDescription}\n\n{notePrefix} {noteText}";
            }

            var inProgressStatusId = await ResolveInProgressStatusIdAsync(cancellationToken);
            if (inProgressStatusId.HasValue)
            {
                issue.Status = inProgressStatusId.Value;
            }

            issue.LastModfield = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            var responseMessage = normalizedAction == "confirm"
                ? "Issue assignment confirmed successfully. Status updated to In Progress."
                : $"Issue scheduled successfully for {issue.DueDate:yyyy-MM-dd}. Status updated to In Progress.";

            _logger.LogInformation(
                "Issue assignment response processed. IssueId: {IssueId}, Action: {Action}, RespondedBy: {UserId}",
                issue.Id,
                normalizedAction,
                request.RespondedByUserId);

            return FMSResponse<bool>.Success(true, responseMessage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error responding to issue assignment for issue {IssueId}", command.IssueId);
            return FMSResponse<bool>.Failed($"Failed to process issue assignment response: {ex.Message}");
        }
    }

    private async Task<int?> ResolveInProgressStatusIdAsync(CancellationToken cancellationToken)
    {
        var statusIds = await _context.Issuestatuses
            .Where(s => s.Status != null)
            .Select(s => new { s.Id, s.Status })
            .ToListAsync(cancellationToken);

        var preferredNames = new[]
        {
            "In Progress",
            "InProgress",
            "Working",
            "Assigned"
        };

        foreach (var preferredName in preferredNames)
        {
            var match = statusIds.FirstOrDefault(s =>
                string.Equals(s.Status, preferredName, StringComparison.OrdinalIgnoreCase));
            if (match != null)
            {
                return match.Id;
            }
        }

        return null;
    }
}
