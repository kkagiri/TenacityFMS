/**
 * File: DeleteIssueAttachmentCommand.cs
 * Purpose: Command definition for deleting an attachment from an issue
 * Dependencies: MediatR, FMS.Application.Common
 * Last Modified: 2026-02-06
 */
using FMS.Application.Common;
using MediatR;

namespace FMS.Application.Features.IssueTracker.Commands.Attachments
{
    public record DeleteIssueAttachmentCommand(
        int IssueId,
        int AttachmentId,
        string DeletedByUserId
    ) : IRequest<FMSResponse<bool>>;
}
