/**
 * File: GetIssueAttachmentsQueryHandler.cs
 * Purpose: Returns all attachments for an issue, grouped by category
 * Dependencies: GpsdataContext
 * Last Modified: 2026-02-06
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

namespace FMS.Application.Features.IssueTracker.Queries.Attachments
{
    public class GetIssueAttachmentsQueryHandler : IRequestHandler<GetIssueAttachmentsQuery, FMSResponse<List<IssueAttachmentDTO>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetIssueAttachmentsQueryHandler> _logger;

        public GetIssueAttachmentsQueryHandler(GpsdataContext context, ILogger<GetIssueAttachmentsQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<List<IssueAttachmentDTO>>> Handle(GetIssueAttachmentsQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var issueExists = await _context.Issuetrackers.AnyAsync(i => i.Id == request.IssueId, cancellationToken);
                if (!issueExists)
                {
                    return FMSResponse<List<IssueAttachmentDTO>>.Failed($"Issue with ID {request.IssueId} not found.");
                }

                var attachments = await _context.IssueAttachments
                    .Where(a => a.IssueId == request.IssueId)
                    .OrderByDescending(a => a.UploadedAt)
                    .Select(a => new IssueAttachmentDTO
                    {
                        Id = a.Id,
                        IssueId = a.IssueId,
                        FileName = a.FileName,
                        ContentType = a.ContentType,
                        FileSize = a.FileSize,
                        AttachmentCategory = a.AttachmentCategory,
                        Description = a.Description,
                        UploadedBy = a.UploadedBy,
                        UploadedAt = a.UploadedAt,
                        DownloadUrl = $"/api/v1/issuetracker/{a.IssueId}/attachments/{a.Id}/download"
                    })
                    .ToListAsync(cancellationToken);

                // Resolve usernames in a single query
                var uploaderIds = attachments.Select(a => a.UploadedBy).Distinct().ToList();
                var userNames = await _context.Users
                    .Where(u => uploaderIds.Contains(u.Id))
                    .Select(u => new { u.Id, u.UserName })
                    .ToDictionaryAsync(u => u.Id, u => u.UserName, cancellationToken);

                foreach (var att in attachments)
                {
                    if (userNames.TryGetValue(att.UploadedBy, out var name))
                    {
                        att.UploadedByUserName = name;
                    }
                }

                return FMSResponse<List<IssueAttachmentDTO>>.Success(attachments,
                    $"Found {attachments.Count} attachment(s) for issue {request.IssueId}.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving attachments for issue {IssueId}", request.IssueId);
                return FMSResponse<List<IssueAttachmentDTO>>.Failed($"Error retrieving attachments: {ex.Message}");
            }
        }
    }
}
