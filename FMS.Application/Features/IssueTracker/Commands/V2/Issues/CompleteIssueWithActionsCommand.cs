/**
 * File: CompleteIssueWithActionsCommand.cs
 * Purpose: MediatR command for completing an issue with structured action records
 * Dependencies: MediatR, FMSResponse, IssueCompletionRecordDTOs
 * Last Modified: 2026-02-21
 *
 * Key Commands:
 * - CompleteIssueWithActionsCommand: Marks an issue as complete with one or more structured action records
 */
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs.V2;
using MediatR;

namespace FMS.Application.Features.IssueTracker.Commands.V2.Issues
{
    /// <summary>
    /// Marks an issue as complete with structured completion actions.
    /// Creates IssueCompletionRecord rows, sets issue status to complete,
    /// generates an auto-summary for backward-compatible CompletionNotes,
    /// sends completion notification to the opener, and logs activity.
    /// </summary>
    public record CompleteIssueWithActionsCommand(
        int IssueId,
        CompleteIssueWithActionsRequestDTO Request,
        string PerformedByUserId,
        string? PerformedByUserName = null
    ) : IRequest<FMSResponse<bool>>;
}
