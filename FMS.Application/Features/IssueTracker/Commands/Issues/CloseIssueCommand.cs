/**
 * File: CloseIssueCommand.cs
 * Purpose: Command definition for closing/approving an issue (requires approver - not the assignee)
 * Dependencies: MediatR, FMS.Application.Common
 * Last Modified: 2026-02-06
 */
using FMS.Application.Common;
using MediatR;

namespace FMS.Application.Features.IssueTracker.Commands.Issues
{
    public class CloseIssueCommand : IRequest<FMSResponse<bool>>
    {
        /// <summary>
        /// The issue to close
        /// </summary>
        public int IssueId { get; set; }

        /// <summary>
        /// User ID of the person closing the issue (must have Approve permission)
        /// </summary>
        public string ClosedByUserId { get; set; } = null!;

        /// <summary>
        /// Optional notes from the approver
        /// </summary>
        public string? ClosingNotes { get; set; }
    }
}
