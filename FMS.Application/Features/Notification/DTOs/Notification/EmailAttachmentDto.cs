/**
 * File: EmailAttachmentDto.cs
 * Purpose: Represents binary email attachment payload for notification delivery.
 * Dependencies: System
 * Last Modified: 2026-02-07
 *
 * Key Types:
 * - EmailAttachmentDto: Attachment filename, mime type, and byte content.
 */
using System;

namespace FMS.Application.Features.Notification.DTOs
{
    public class EmailAttachmentDto
    {
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = "application/octet-stream";
        public byte[] Content { get; set; } = Array.Empty<byte>();
    }
}
