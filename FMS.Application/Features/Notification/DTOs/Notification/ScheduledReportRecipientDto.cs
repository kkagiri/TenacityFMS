/**
 * File: ScheduledReportRecipientDto.cs
 * Purpose: DTO for recipient-level delivery status of scheduled report notifications.
 * Dependencies: System
 * Last Modified: 2026-02-07
 *
 * Key Types:
 * - ScheduledReportRecipientDto: Represents recipient, channel, and delivery outcome.
 */
using System;

namespace FMS.Application.Features.Notification.DTOs
{
    public class ScheduledReportRecipientDto
    {
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string DeliveryMethod { get; set; } = string.Empty;
        public string RecipientAddress { get; set; } = string.Empty;
        public string DeliveryStatus { get; set; } = string.Empty;
        public DateTime? SentAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public string? DeliveryError { get; set; }
    }
}
