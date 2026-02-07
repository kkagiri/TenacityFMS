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
    }
}
