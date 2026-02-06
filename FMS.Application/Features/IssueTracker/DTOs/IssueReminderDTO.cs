/**
 * File: IssueReminderDTO.cs
 * Purpose: Data transfer objects for issue reminders
 * Dependencies: None
 * Last Modified: 2026-02-05
 */
using System;
using System.Collections.Generic;

namespace FMS.Application.Features.IssueTracker.DTOs
{
    /// <summary>
    /// DTO for issue reminder
    /// </summary>
    public class IssueReminderDTO
    {
        public int Id { get; set; }
        public int IssueId { get; set; }
        public string ReminderType { get; set; } = "Daily";
        public int DaysBefore { get; set; } = 1;
        public string? ReminderTime { get; set; }
        public List<string>? RecipientUserIds { get; set; }
        public bool NotifyAssignee { get; set; } = true;
        public bool NotifyOpener { get; set; } = false;
        public string? CustomMessage { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime? LastSentDate { get; set; }
        public DateTime? NextReminderDate { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? CreatedDate { get; set; }
    }

    /// <summary>
    /// DTO for creating a new reminder
    /// </summary>
    public class CreateIssueReminderDTO
    {
        public int IssueId { get; set; }

        /// <summary>
        /// Reminder type: Daily, Weekly, OnceBeforeDue, Custom
        /// </summary>
        public string ReminderType { get; set; } = "Daily";

        /// <summary>
        /// Number of days before due date to start reminding
        /// </summary>
        public int DaysBefore { get; set; } = 1;

        /// <summary>
        /// Time of day for the reminder (HH:mm format)
        /// </summary>
        public string? ReminderTime { get; set; }

        /// <summary>
        /// List of user IDs to receive the reminder
        /// </summary>
        public List<string>? RecipientUserIds { get; set; }

        /// <summary>
        /// Whether to notify the issue assignee
        /// </summary>
        public bool NotifyAssignee { get; set; } = true;

        /// <summary>
        /// Whether to notify the issue opener
        /// </summary>
        public bool NotifyOpener { get; set; } = false;

        /// <summary>
        /// Custom message to include in the reminder
        /// </summary>
        public string? CustomMessage { get; set; }
    }

    /// <summary>
    /// DTO for updating an existing reminder
    /// </summary>
    public class UpdateIssueReminderDTO
    {
        public int Id { get; set; }
        public string? ReminderType { get; set; }
        public int? DaysBefore { get; set; }
        public string? ReminderTime { get; set; }
        public List<string>? RecipientUserIds { get; set; }
        public bool? NotifyAssignee { get; set; }
        public bool? NotifyOpener { get; set; }
        public string? CustomMessage { get; set; }
        public bool? IsActive { get; set; }
    }
}
