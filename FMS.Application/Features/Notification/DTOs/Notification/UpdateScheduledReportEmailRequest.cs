/**
 * File: UpdateScheduledReportEmailRequest.cs
 * Purpose: Request DTO for adjusting/canceling scheduled report email execution metadata.
 * Dependencies: System, System.Collections.Generic
 * Last Modified: 2026-02-07
 *
 * Key Types:
 * - UpdateScheduledReportEmailRequest: Captures editable schedule fields from admin settings.
 */
using System;
using System.Collections.Generic;

namespace FMS.Application.Features.Notification.DTOs
{
    public class UpdateScheduledReportEmailRequest
    {
        public string? ScheduleName { get; set; }
        public DateTime? ScheduledAtUtc { get; set; }
        public string? ScheduleType { get; set; }
        public List<string>? DaysOfWeek { get; set; }
        public List<string>? WeeksOfMonth { get; set; }
        public string? WeekOfMonth { get; set; }
        public string? ScheduleTimeOfDay { get; set; }
        public string? TimeZone { get; set; }
        public bool? Enabled { get; set; }
        public int? DayOfMonth { get; set; }

        /// <summary>
        /// Number of days before the report execution date to start the data window.
        /// Defaults to 1 (start from previous day). Only applies to daily/weekly/once schedules.
        /// </summary>
        public int? OffsetDays { get; set; }

        /// <summary>
        /// Number of days of data to include in the report window.
        /// Defaults to 1. Only applies to daily/weekly/once schedules.
        /// </summary>
        public int? WindowDays { get; set; }

        /// <summary>
        /// Report output format (PDF, Excel, HTML). Persisted in metadata.
        /// </summary>
        public string? Format { get; set; }

        /// <summary>
        /// Report source identifier (e.g. "fuel-refill", "pump-transaction").
        /// Persisted in metadata for reliable backend resolution.
        /// </summary>
        public string? SourceId { get; set; }

        /// <summary>
        /// Optional JSON object of report filter parameters to persist
        /// (e.g. {"siteId":[5],"tankId":[],"dateFrom":"...","dateTo":"..."}).
        /// </summary>
        public object? Filters { get; set; }

        /// <summary>
        /// Recipient email addresses to update on the notification.
        /// </summary>
        public List<string>? RecipientEmails { get; set; }
    }
}
