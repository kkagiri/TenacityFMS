/**
 * File: IssueAttachmentDTO.cs
 * Purpose: Data transfer object for issue attachments
 * Dependencies: None
 * Last Modified: 2026-02-06
 */
using System;

namespace FMS.Application.Features.IssueTracker.DTOs
{
    public class IssueAttachmentDTO
    {
        public int Id { get; set; }
        public int IssueId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSize { get; set; }

        /// <summary>
        /// "Installation" | "Calibration" | "General"
        /// </summary>
        public string AttachmentCategory { get; set; } = "General";

        public string? Description { get; set; }
        public string UploadedBy { get; set; } = string.Empty;
        public string? UploadedByUserName { get; set; }
        public DateTime UploadedAt { get; set; }

        /// <summary>
        /// Relative URL to download/view the attachment
        /// </summary>
        public string? DownloadUrl { get; set; }
    }
}
