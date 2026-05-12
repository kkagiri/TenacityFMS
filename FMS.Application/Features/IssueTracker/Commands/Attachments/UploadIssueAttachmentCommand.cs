/**
 * File: UploadIssueAttachmentCommand.cs
 * Purpose: Command definition for uploading an attachment to an issue
 * Dependencies: MediatR, FMS.Application.Common
 * Last Modified: 2026-02-06
 */
using System.IO;
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs;
using MediatR;

namespace FMS.Application.Features.IssueTracker.Commands.Attachments
{
    public class UploadIssueAttachmentCommand : IRequest<FMSResponse<IssueAttachmentDTO>>
    {
        public int IssueId { get; set; }

        /// <summary>
        /// Original file name
        /// </summary>
        public string FileName { get; set; } = null!;

        /// <summary>
        /// MIME type (e.g. "image/jpeg", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        /// </summary>
        public string ContentType { get; set; } = null!;

        /// <summary>
        /// File size in bytes
        /// </summary>
        public long FileSize { get; set; }

        /// <summary>
        /// The file content stream
        /// </summary>
        public Stream FileStream { get; set; } = null!;

        /// <summary>
        /// "Installation" | "Calibration" | "General"
        /// </summary>
        public string AttachmentCategory { get; set; } = "General";

        /// <summary>
        /// Optional description
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// User ID of uploader
        /// </summary>
        public string UploadedByUserId { get; set; } = null!;
    }
}
