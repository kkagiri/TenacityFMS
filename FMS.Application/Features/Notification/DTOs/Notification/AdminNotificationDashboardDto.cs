/**
 * File: AdminNotificationDashboardDto.cs
 * Purpose: DTOs for the admin notification dashboard summary, chart series, and recent activity.
 * Dependencies: System, System.Collections.Generic
 * Last Modified: 2026-04-01
 *
 * Key Classes:
 * - AdminNotificationDashboardDto: Summary payload for the admin notification dashboard.
 * - AdminNotificationPerformancePointDto: Time-bucketed sent, delivered, and failed counts.
 * - AdminNotificationDashboardRecentDto: Lightweight recent notification row for the dashboard.
 */
using System;
using System.Collections.Generic;

namespace FMS.Application.Features.Notification.DTOs
{
    public class AdminNotificationDashboardDto
    {
        public int NotificationCount { get; set; }
        public int TotalSent { get; set; }
        public int TotalDelivered { get; set; }
        public int TotalFailed { get; set; }
        public decimal DeliveryRate { get; set; }
        public int ActivePolicies { get; set; }
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public DateTime GeneratedAt { get; set; }
        public List<AdminNotificationPerformancePointDto> PerformanceSeries { get; set; } = new();
        public List<AdminNotificationDashboardRecentDto> RecentNotifications { get; set; } = new();
    }

    public class AdminNotificationPerformancePointDto
    {
        public DateTime BucketStart { get; set; }
        public int Sent { get; set; }
        public int Delivered { get; set; }
        public int Failed { get; set; }
    }

    public class AdminNotificationDashboardRecentDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public int RecipientCount { get; set; }
        public int DeliveredCount { get; set; }
        public int FailedCount { get; set; }
        public string? PolicyName { get; set; }
    }
}