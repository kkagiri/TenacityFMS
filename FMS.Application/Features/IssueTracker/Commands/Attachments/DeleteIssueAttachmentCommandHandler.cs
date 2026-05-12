/**
 * File: DeleteIssueAttachmentCommandHandler.cs
 * Purpose: Deletes an attachment record and its stored file from disk
 * Dependencies: GpsdataContext, IIssueAttachmentStorageService, IIssueActivityService
 * Last Modified: 2026-02-06
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

namespace FMS.Application.Features.IssueTracker.Commands.Attachments
{
    public class DeleteIssueAttachmentCommandHandler : IRequestHandler<DeleteIssueAttachmentCommand, FMSResponse<bool>>
    {
        private readonly GpsdataContext _context;
        private readonly IIssueAttachmentStorageService _storageService;
        private readonly IIssueActivityService _activityService;
        private readonly ILogger<DeleteIssueAttachmentCommandHandler> _logger;

        public DeleteIssueAttachmentCommandHandler(
            GpsdataContext context,
            IIssueAttachmentStorageService storageService,
            IIssueActivityService activityService,
            ILogger<DeleteIssueAttachmentCommandHandler> logger)
        {
            _context = context;
            _storageService = storageService;
            _activityService = activityService;
            _logger = logger;
        }

        public async Task<FMSResponse<bool>> Handle(DeleteIssueAttachmentCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var attachment = await _context.IssueAttachments
                    .FirstOrDefaultAsync(a => a.Id == request.AttachmentId && a.IssueId == request.IssueId, cancellationToken);

                if (attachment == null)
                {
                    return FMSResponse<bool>.Failed($"Attachment {request.AttachmentId} not found for issue {request.IssueId}.");
                }

                // Delete file from storage
                await _storageService.DeleteFileAsync(attachment.FilePath, cancellationToken);

                // Remove DB record
                _context.IssueAttachments.Remove(attachment);
                await _context.SaveChangesAsync(cancellationToken);

                // Resolve username for activity log
                var userName = await _context.Users
                    .Where(u => u.Id == request.DeletedByUserId)
                    .Select(u => u.UserName)
                    .FirstOrDefaultAsync(cancellationToken);

                // Log activity
                await _activityService.LogActivityAsync(
                    request.IssueId,
                    "AttachmentRemoved",
                    $"Attachment '{attachment.FileName}' ({attachment.AttachmentCategory}) removed",
                    request.DeletedByUserId,
                    userName,
                    fieldName: "Attachment",
                    oldValue: attachment.FileName,
                    cancellationToken: cancellationToken);

                _logger.LogInformation(
                    "Attachment {AttachmentId} ({FileName}) deleted from issue {IssueId} by {User}",
                    request.AttachmentId, attachment.FileName, request.IssueId, userName);

                return FMSResponse<bool>.Success(true, "Attachment deleted successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting attachment {AttachmentId} from issue {IssueId}", request.AttachmentId, request.IssueId);
                return FMSResponse<bool>.Failed($"Error deleting attachment: {ex.Message}");
            }
        }
    }
}
