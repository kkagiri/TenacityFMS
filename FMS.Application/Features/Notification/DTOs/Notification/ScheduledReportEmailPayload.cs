/**
 * File: ScheduledReportEmailPayload.cs
 * Purpose: Encapsulates rendered scheduled report email content and optional attachments.
 * Dependencies: EmailAttachmentDto
 * Last Modified: 2026-02-07
 *
 * Key Types:
 * - ScheduledReportEmailPayload: Subject/body/html flag plus generated report attachments.
 */
using System.Collections.Generic;

namespace FMS.Application.Features.Notification.DTOs
{
    public class ScheduledReportEmailPayload
    {
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public bool IsHtml { get; set; } = true;
        public List<EmailAttachmentDto> Attachments { get; set; } = new List<EmailAttachmentDto>();
    }
}
