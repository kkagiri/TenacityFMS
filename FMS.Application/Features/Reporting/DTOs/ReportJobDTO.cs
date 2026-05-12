/**
 * File: ReportJobDTO.cs
 * Purpose: DTOs for async report generation job tracking.
 *          Represents job state, progress, and delivery options.
 * Dependencies: None
 * Last Modified: 2026-02-24
 *
 * Key Classes:
 * - ReportJobDTO: Full job state including progress and result info
 * - SubmitReportJobDTO: Request to submit a new async report job
 * - ReportJobProgressDTO: Lightweight progress update broadcast via SignalR
 */

using System;
using System.Collections.Generic;

namespace FMS.Application.Features.Reporting.DTOs
{
    /// <summary>
    /// Status of an async report generation job
    /// </summary>
    public enum ReportJobStatus
    {
        Queued = 0,
        FetchingData = 1,
        Rendering = 2,
        Completed = 3,
        Failed = 4,
        Cancelled = 5,
        EmailSent = 6
    }

    /// <summary>
    /// Full state of an async report generation job
    /// </summary>
    public class ReportJobDTO
    {
        public string JobId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public ReportJobStatus Status { get; set; } = ReportJobStatus.Queued;
        public int ProgressPercent { get; set; }
        public string StatusMessage { get; set; } = string.Empty;
        public string TemplateName { get; set; } = string.Empty;
        public string OutputFormat { get; set; } = "pdf";
        public string ReportTitle { get; set; } = string.Empty;

        /// <summary>When true, the finished PDF is emailed to the user</summary>
        public bool DeliverByEmail { get; set; }
        public string EmailAddress { get; set; } = string.Empty;

        /// <summary>Number of data records in the report</summary>
        public int RecordCount { get; set; }

        /// <summary>File size in bytes once generated</summary>
        public long FileSizeBytes { get; set; }

        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAtUtc { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;

        /// <summary>Seconds elapsed since job was submitted</summary>
        public double ElapsedSeconds =>
            (CompletedAtUtc ?? DateTime.UtcNow).Subtract(CreatedAtUtc).TotalSeconds;
    }

    /// <summary>
    /// Request DTO for submitting a new async report job
    /// </summary>
    public class SubmitReportJobDTO
    {
        /// <summary>Report source id (e.g., "tank-volume-history")</summary>
        public string SourceId { get; set; } = string.Empty;

        /// <summary>JsReport template name</summary>
        public string TemplateName { get; set; } = string.Empty;

        /// <summary>Output format: pdf, excel, csv</summary>
        public string OutputFormat { get; set; } = "pdf";

        /// <summary>Report title for header/email subject</summary>
        public string ReportTitle { get; set; } = string.Empty;

        /// <summary>Query parameters that will be forwarded to the data endpoint</summary>
        public Dictionary<string, object> Parameters { get; set; } = new();

        /// <summary>When true, email the finished report to the user</summary>
        public bool DeliverByEmail { get; set; }

        /// <summary>Email address to deliver to (defaults to user's email)</summary>
        public string EmailAddress { get; set; } = string.Empty;
    }

    /// <summary>
    /// Lightweight progress payload broadcast via SignalR
    /// </summary>
    public class ReportJobProgressDTO
    {
        public string JobId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public ReportJobStatus Status { get; set; }
        public int ProgressPercent { get; set; }
        public string StatusMessage { get; set; } = string.Empty;
        public string ReportTitle { get; set; } = string.Empty;
        public int RecordCount { get; set; }
        public long FileSizeBytes { get; set; }
        public double ElapsedSeconds { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
