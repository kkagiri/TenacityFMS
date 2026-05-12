/**
 * File: IssueReminder.cs
 * Purpose: Stores reminder configurations for issues - supports daily/weekly reminders before due date
 * Dependencies: FMS.Domain.Entities
 * Last Modified: 2026-02-05
 *
 * Key Properties:
 * - IssueId: Reference to the issue this reminder belongs to
 * - ReminderType: Daily, Weekly, OnceBeforeDue, Custom
 * - DaysBefore: Number of days before due date to start reminding
 * - ReminderTime: Time of day to send reminders
 * - Recipients: JSON array of user IDs to notify
 */
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities;

/// <summary>
/// Configures reminders for an issue based on due date
/// </summary>
public class IssueReminder
{
    public int Id { get; set; }

    /// <summary>
    /// Reference to the issue this reminder belongs to
    /// </summary>
    public int IssueId { get; set; }

    /// <summary>
    /// Type of reminder: Daily, Weekly, OnceBeforeDue, Custom
    /// </summary>
    public string ReminderType { get; set; } = "Daily";

    /// <summary>
    /// Number of days before due date to start sending reminders
    /// </summary>
    public int DaysBefore { get; set; } = 1;

    /// <summary>
    /// Time of day to send the reminder (e.g., "09:00")
    /// </summary>
    public TimeSpan? ReminderTime { get; set; }

    /// <summary>
    /// JSON array of user IDs to receive this reminder
    /// </summary>
    public string? RecipientUserIds { get; set; }

    /// <summary>
    /// Whether to notify the issue assignee
    /// </summary>
    public bool NotifyAssignee { get; set; } = true;

    /// <summary>
    /// Whether to notify the issue opener
    /// </summary>
    public bool NotifyOpener { get; set; } = false;

    /// <summary>
    /// Custom message to include in the reminder notification
    /// </summary>
    public string? CustomMessage { get; set; }

    /// <summary>
    /// Whether the reminder is active
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Last time this reminder was sent
    /// </summary>
    public DateTime? LastSentDate { get; set; }

    /// <summary>
    /// Next scheduled reminder date
    /// </summary>
    public DateTime? NextReminderDate { get; set; }

    /// <summary>
    /// User who created this reminder
    /// </summary>
    public string CreatedBy { get; set; } = null!;

    /// <summary>
    /// Date/time when the reminder was created
    /// </summary>
    public DateTime CreatedDate { get; set; }

    // Navigation properties
    [NotMapped]
    public virtual Issuetracker Issue { get; set; } = null!;

    [NotMapped]
    public virtual User CreatedByNavigation { get; set; } = null!;
}
