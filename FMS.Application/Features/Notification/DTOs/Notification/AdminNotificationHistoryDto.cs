/**
 * File: AdminNotificationHistoryDto.cs
 * Purpose: DTO for admin notification history that includes all system notifications
 *          with recipient details, email body (HTML), and delivery metadata.
 * Dependencies: None
 * Last Modified: 2026-02-25
 *
 * Key Classes:
 * - AdminNotificationHistoryDto: Flat DTO for admin history grid
 */
using System;
using System.Collections.Generic;

namespace FMS.Application.Features.Notification.DTOs
{
    public class AdminNotificationHistoryDto
    {
        public int Id { get; set; }
        public string NotificationId { get; set; } = null!;
        public string Type { get; set; } = null!;
        public string Category { get; set; } = null!;
        public string Priority { get; set; } = null!;
        public string Title { get; set; } = null!;

        /// <summary>
        /// Plain-text message content
        /// </summary>
        public string Message { get; set; } = null!;

        /// <summary>
        /// Raw HTML body (from email template) — rendered in admin detail popup
        /// </summary>
        public string? HtmlBody { get; set; }

        public string? Data { get; set; }
        public string Status { get; set; } = null!;
        public string TriggerSource { get; set; } = null!;
        public string? TriggeredBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? SentAt { get; set; }
        public int SendAttempts { get; set; }
        public string? ErrorMessage { get; set; }

        // Related entity names
        public string? SiteName { get; set; }
        public string? TankName { get; set; }
        public string? VehicleName { get; set; }
        public string? PtsDeviceName { get; set; }
        public string? PolicyName { get; set; }
        public string? CategoryName { get; set; }

        // Recipient summary
        public int RecipientCount { get; set; }
        public int DeliveredCount { get; set; }
        public int FailedCount { get; set; }
        public List<AdminNotificationRecipientDto> Recipients { get; set; } = new();
    }

    public class AdminNotificationRecipientDto
    {
        public string? UserId { get; set; }
        public string? UserName { get; set; }
        public string? Email { get; set; }
        public string? DeliveryMethod { get; set; }
        public string? DeliveryStatus { get; set; }
        public bool IsRead { get; set; }
        public bool IsAcknowledged { get; set; }
        public DateTime? ReadAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
    }
}
