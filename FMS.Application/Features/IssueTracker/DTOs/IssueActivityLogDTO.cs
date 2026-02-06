/**
 * File: IssueActivityLogDTO.cs
 * Purpose: Data transfer object for issue activity log entries
 * Dependencies: None
 * Last Modified: 2026-02-05
 */
using System;

namespace FMS.Application.Features.IssueTracker.DTOs
{
    /// <summary>
    /// DTO for issue activity log entry
    /// </summary>
    public class IssueActivityLogDTO
    {
        public int Id { get; set; }
        public int IssueId { get; set; }
        public string ActivityType { get; set; } = null!;
        public string? FieldName { get; set; }
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public string Description { get; set; } = null!;
        public string PerformedBy { get; set; } = null!;
        public string? PerformedByUserName { get; set; }
        public DateTime ActivityDate { get; set; }
        public string? Metadata { get; set; }
    }

    /// <summary>
    /// DTO for creating a new activity log entry
    /// </summary>
    public class CreateIssueActivityLogDTO
    {
        public int IssueId { get; set; }
        public string ActivityType { get; set; } = null!;
        public string? FieldName { get; set; }
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public string? Description { get; set; }
        public string? Metadata { get; set; }
    }
}
