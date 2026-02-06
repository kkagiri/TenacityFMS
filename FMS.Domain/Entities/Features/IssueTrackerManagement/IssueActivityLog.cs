/**
 * File: IssueActivityLog.cs
 * Purpose: Stores activity/audit log entries for issue tracker - tracks all changes and actions
 * Dependencies: FMS.Domain.Entities
 * Last Modified: 2026-02-05
 *
 * Key Properties:
 * - IssueId: Reference to the issue this activity belongs to
 * - ActivityType: Type of activity (Created, Updated, StatusChange, etc.)
 * - FieldName: Name of the field that was changed (for Update activities)
 * - OldValue/NewValue: Previous and new values for tracking changes
 * - PerformedBy: User ID who performed the action
 */
using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities;

/// <summary>
/// Tracks all activity/changes on an issue for audit trail and activity stream display
/// </summary>
public class IssueActivityLog
{
    public int Id { get; set; }

    /// <summary>
    /// Reference to the issue this activity belongs to
    /// </summary>
    public int IssueId { get; set; }

    /// <summary>
    /// Type of activity: Created, Updated, StatusChanged, PriorityChanged, Assigned,
    /// Commented, Closed, Reopened, ReminderSet, Escalated, etc.
    /// </summary>
    public string ActivityType { get; set; } = null!;

    /// <summary>
    /// Name of the field that was changed (for Update type activities)
    /// </summary>
    public string? FieldName { get; set; }

    /// <summary>
    /// Previous value before the change
    /// </summary>
    public string? OldValue { get; set; }

    /// <summary>
    /// New value after the change
    /// </summary>
    public string? NewValue { get; set; }

    /// <summary>
    /// Human-readable description of the activity
    /// </summary>
    public string Description { get; set; } = null!;

    /// <summary>
    /// User ID who performed this action
    /// </summary>
    public string PerformedBy { get; set; } = null!;

    /// <summary>
    /// Username of the user who performed this action (denormalized for display)
    /// </summary>
    public string? PerformedByUserName { get; set; }

    /// <summary>
    /// Timestamp when the activity occurred
    /// </summary>
    public DateTime ActivityDate { get; set; }

    /// <summary>
    /// Optional additional metadata in JSON format
    /// </summary>
    public string? Metadata { get; set; }

    // Navigation properties
    [NotMapped]
    public virtual Issuetracker Issue { get; set; } = null!;

    [NotMapped]
    public virtual User PerformedByNavigation { get; set; } = null!;
}
