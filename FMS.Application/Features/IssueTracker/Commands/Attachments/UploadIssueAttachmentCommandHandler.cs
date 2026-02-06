/**
 * File: UploadIssueAttachmentCommandHandler.cs
 * Purpose: Handles saving an uploaded file to storage and recording it in the database
 * Dependencies: GpsdataContext, IIssueAttachmentStorageService, IIssueActivityService
 * Last Modified: 2026-02-06
 *
 * Key Logic:
 * - Validates attachment category is one of: Installation, Calibration, General
 * - Validates file size (max 25 MB)
 * - Generates unique stored filename to avoid collisions
 * - Saves file to disk via storage service
 * - Creates IssueAttachment entity in DB
 * - Logs activity
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs;
using FMS.Application.Features.IssueTracker.Services;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Commands.Attachments
{
    public class UploadIssueAttachmentCommandHandler : IRequestHandler<UploadIssueAttachmentCommand, FMSResponse<IssueAttachmentDTO>>
    {
        private const long MaxFileSizeBytes = 25 * 1024 * 1024; // 25 MB

        private static readonly HashSet<string> ValidCategories = new(StringComparer.OrdinalIgnoreCase)
        {
            "Installation",
            "Calibration",
            "General"
        };

        private readonly GpsdataContext _context;
        private readonly IIssueAttachmentStorageService _storageService;
        private readonly IIssueActivityService _activityService;
        private readonly ILogger<UploadIssueAttachmentCommandHandler> _logger;

        public UploadIssueAttachmentCommandHandler(
            GpsdataContext context,
            IIssueAttachmentStorageService storageService,
            IIssueActivityService activityService,
            ILogger<UploadIssueAttachmentCommandHandler> logger)
        {
            _context = context;
            _storageService = storageService;
            _activityService = activityService;
            _logger = logger;
        }

        public async Task<FMSResponse<IssueAttachmentDTO>> Handle(UploadIssueAttachmentCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Validate issue exists
                var issueExists = await _context.Issuetrackers.AnyAsync(i => i.Id == request.IssueId, cancellationToken);
                if (!issueExists)
                {
                    return FMSResponse<IssueAttachmentDTO>.Failed($"Issue with ID {request.IssueId} not found.");
                }

                // Validate category
                if (!ValidCategories.Contains(request.AttachmentCategory))
                {
                    return FMSResponse<IssueAttachmentDTO>.Failed(
                        $"Invalid attachment category '{request.AttachmentCategory}'. Allowed: Installation, Calibration, General.");
                }

                // Validate file size
                if (request.FileSize > MaxFileSizeBytes)
                {
                    return FMSResponse<IssueAttachmentDTO>.Failed(
                        $"File size ({request.FileSize / (1024 * 1024)} MB) exceeds the maximum allowed size of {MaxFileSizeBytes / (1024 * 1024)} MB.");
                }

                // Validate file name
                if (string.IsNullOrWhiteSpace(request.FileName))
                {
                    return FMSResponse<IssueAttachmentDTO>.Failed("File name is required.");
                }

                // Generate unique stored filename
                var fileExtension = System.IO.Path.GetExtension(request.FileName);
                var storedFileName = $"{Guid.NewGuid():N}{fileExtension}";

                // Save file to storage
                var relativePath = await _storageService.SaveFileAsync(
                    request.IssueId, storedFileName, request.FileStream, cancellationToken);

                // Create entity
                var attachment = new IssueAttachment
                {
                    IssueId = request.IssueId,
                    FileName = request.FileName,
                    StoredFileName = storedFileName,
                    FilePath = relativePath,
                    ContentType = request.ContentType,
                    FileSize = request.FileSize,
                    AttachmentCategory = request.AttachmentCategory,
                    Description = request.Description,
                    UploadedBy = request.UploadedByUserId,
                    UploadedAt = DateTime.UtcNow
                };

                await _context.IssueAttachments.AddAsync(attachment, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);

                // Resolve uploader username for the DTO
                var uploaderName = await _context.Users
                    .Where(u => u.Id == request.UploadedByUserId)
                    .Select(u => u.UserName)
                    .FirstOrDefaultAsync(cancellationToken);

                // Log activity
                await _activityService.LogActivityAsync(
                    request.IssueId,
                    "AttachmentAdded",
                    $"Attachment '{request.FileName}' ({request.AttachmentCategory}) uploaded",
                    request.UploadedByUserId,
                    uploaderName,
                    fieldName: "Attachment",
                    newValue: request.FileName,
                    cancellationToken: cancellationToken);

                var dto = new IssueAttachmentDTO
                {
                    Id = attachment.Id,
                    IssueId = attachment.IssueId,
                    FileName = attachment.FileName,
                    ContentType = attachment.ContentType,
                    FileSize = attachment.FileSize,
                    AttachmentCategory = attachment.AttachmentCategory,
                    Description = attachment.Description,
                    UploadedBy = attachment.UploadedBy,
                    UploadedByUserName = uploaderName,
                    UploadedAt = attachment.UploadedAt,
                    DownloadUrl = $"/api/v1/issuetracker/{request.IssueId}/attachments/{attachment.Id}/download"
                };

                _logger.LogInformation(
                    "Attachment {AttachmentId} ({Category}: {FileName}) uploaded for issue {IssueId} by {User}",
                    attachment.Id, attachment.AttachmentCategory, attachment.FileName, request.IssueId, uploaderName);

                return FMSResponse<IssueAttachmentDTO>.Success(dto, "Attachment uploaded successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading attachment for issue {IssueId}", request.IssueId);
                return FMSResponse<IssueAttachmentDTO>.Failed($"Error uploading attachment: {ex.Message}");
            }
        }
    }
}
