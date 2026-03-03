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
