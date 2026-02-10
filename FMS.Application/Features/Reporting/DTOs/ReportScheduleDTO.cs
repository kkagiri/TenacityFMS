using System;

namespace FMS.Application.Features.Reporting.DTOs
{
    /// <summary>
    /// DTO for report schedule records
    /// </summary>
    public class ReportScheduleDTO
    {
        public long ReportScheduleId { get; set; }
        public string ScheduleName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string ReportSourceId { get; set; } = string.Empty;
        public string? Filters { get; set; }
        public string OutputFormat { get; set; } = "pdf";
        public string Frequency { get; set; } = "once";
        public int RepeatCount { get; set; }
        public int ExecutedCount { get; set; }
        public string? Recipients { get; set; }
        public string? ScheduleConfig { get; set; }
        public DateTime ScheduledAt { get; set; }
        public DateTime? LastExecutedAt { get; set; }
        public DateTime? NextExecutionAt { get; set; }
        public string Status { get; set; } = "active";
        public string? ErrorMessage { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// DTO for creating a report schedule
    /// </summary>
    public class CreateReportScheduleDTO
    {
        public string ScheduleName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string ReportSourceId { get; set; } = string.Empty;
        public string? Filters { get; set; }
        public string OutputFormat { get; set; } = "pdf";
        public string Frequency { get; set; } = "once";
        public int RepeatCount { get; set; } = 1;
        public string? Recipients { get; set; }
        public string? ScheduleConfig { get; set; }
        public DateTime ScheduledAt { get; set; }
    }
}
