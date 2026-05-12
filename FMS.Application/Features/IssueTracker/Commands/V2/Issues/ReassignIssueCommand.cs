/**
 * File: ReassignIssueCommand.cs
 * Purpose: MediatR command for reassigning an issue to a different user
 * Dependencies: MediatR, FMSResponse, ReassignIssueRequestDTO
 * Last Modified: 2026-02-21
 *
 * Key Commands:
 * - ReassignIssueCommand: Reassigns the issue, creates assignment tracking record,
 *   sends notification to the NEW assignee only, and logs activity
 */
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs.V2;
using MediatR;

namespace FMS.Application.Features.IssueTracker.Commands.V2.Issues
{
    /// <summary>
    /// Reassigns an issue to a new user.
    /// Updates issue.AssignTo, creates an Issueassignmenttracker record,
    /// notifies ONLY the new assignee, and logs the assignment change.
    /// </summary>
    public record ReassignIssueCommand(
        int IssueId,
        ReassignIssueRequestDTO Request,
        string PerformedByUserId,
        string? PerformedByUserName = null
    ) : IRequest<FMSResponse<bool>>;
}
