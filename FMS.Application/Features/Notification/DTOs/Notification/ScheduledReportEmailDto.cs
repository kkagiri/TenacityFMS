/**
 * File: ScheduledReportEmailDto.cs
 * Purpose: DTO for scheduled report notification rows and delivery summary metadata.
 * Dependencies: System, System.Collections.Generic
 * Last Modified: 2026-02-07
 *
 * Key Types:
 * - ScheduledReportEmailDto: Represents one scheduled report notification entry.
 */
using System;
using System.Collections.Generic;

namespace FMS.Application.Features.Notification.DTOs
{
    public class ScheduledReportEmailDto
    {
        public int Id { get; set; }
        public string NotificationId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string TriggerSource { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? ScheduledAt { get; set; }
        public DateTime? SentAt { get; set; }

        public string? ReportType { get; set; }
        public string? ReportTemplateName { get; set; }
        public string? Format { get; set; }
        public string? PeriodType { get; set; }
        public string? RequestedBy { get; set; }
        public string? ReportDescription { get; set; }

        public string? ReportViewPath { get; set; }
        public string? ReportViewUrl { get; set; }
        public List<int> SiteIds { get; set; } = new List<int>();
        public List<int> TankIds { get; set; } = new List<int>();

        public string? TimeZone { get; set; }
        public string? ScheduleType { get; set; }
        public string? ScheduleTimeOfDay { get; set; }
        public string? ScheduleWeekOfMonth { get; set; }
        public List<string> ScheduleWeeksOfMonth { get; set; } = new List<string>();
        public List<string> ScheduleDaysOfWeek { get; set; } = new List<string>();
        public DateTime? NextRunAtUtc { get; set; }
        public DateTime? LastProcessedAtUtc { get; set; }

        public string? EffectiveStartDate { get; set; }
        public string? EffectiveEndDate { get; set; }

        /// <summary>
        /// Number of days before execution date to start the data window (default 1).
        /// </summary>
        public int OffsetDays { get; set; } = 1;

        /// <summary>
        /// Number of days of data to include in the report window (default 1).
        /// </summary>
        public int WindowDays { get; set; } = 1;

        public List<string> SiteNames { get; set; } = new List<string>();
        public List<string> TankNames { get; set; } = new List<string>();

        /// <summary>
        /// Raw JSON string of filter parameters used when the schedule was created
        /// (e.g. {"siteId":[5],"tankId":[],"dateFrom":"...","dateTo":"..."}).
        /// </summary>
        public string? Filters { get; set; }

        public int RecipientCount { get; set; }
        public int DeliveredCount { get; set; }
        public int PendingCount { get; set; }
        public int FailedCount { get; set; }

        public List<ScheduledReportRecipientDto> Recipients { get; set; } = new List<ScheduledReportRecipientDto>();
    }
}
