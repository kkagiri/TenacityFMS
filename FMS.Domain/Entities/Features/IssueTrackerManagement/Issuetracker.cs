using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities;

/// <summary>
/// Issue Tracker entity - tracks issues related to vehicles and devices
/// </summary>
public partial class Issuetracker
{
    public int Id { get; set; }

    // Legacy category (still supported)
    public int IssueCategoryId { get; set; }

    public int SiteId { get; set; }

    public string Openby { get; set; } = null!;

    public int? RelatedIssue { get; set; }

    public string ProblemDescription { get; set; } = null!;

    public string ProblemTitle { get; set; } = null!;

    public int? Status { get; set; }

    public int? Priority { get; set; }

    public DateTime? DueDate { get; set; }

    public DateTime? OpenDate { get; set; }

    public DateTime? ClosingDate { get; set; }

    public DateTime? LastModfield { get; set; }

    public int VehicleId { get; set; }

    //public int? DeviceId { get; set; }

    public int? DeviceType { get; set; }

    public string AssignTo { get; set; } = null!;

    /// <summary>
    /// Active alarm ID if this issue was created from an active alarm
    /// </summary>
    public int? ActiveAlarmId { get; set; }

    // ========== V2 Template-based fields ==========

    /// <summary>
    /// Issue Template ID (v2) - links to template that defines issue type
    /// </summary>
    public int? IssueTemplateId { get; set; }

    /// <summary>
    /// Device Type ID (v2) - foreign key to devicetype table
    /// </summary>
    public int? DeviceTypeId { get; set; }

    /// <summary>
    /// Whether this issue can be auto-closed (v2)
    /// </summary>
    public bool CanAutoClose { get; set; }

    /// <summary>
    /// Reason for auto-close (v2) - e.g., "Device came back online"
    /// </summary>
    public string? AutoCloseReason { get; set; }

    /// <summary>
    /// Whether this issue was auto-created from alarm/monitoring (v2)
    /// </summary>
    public bool IsAutoCreated { get; set; }

    /// <summary>
    /// Related entity ID for auto-created issues (device ID, vehicle ID, etc.)
    /// </summary>
    public int? RelatedEntityId { get; set; }

    /// <summary>
    /// Related entity type for auto-created issues (tank_monitor, vehicle, pts, etc.)
    /// </summary>
    public string? RelatedEntityType { get; set; }

    /// <summary>
    /// User or role the issue is assigned to
    /// </summary>
    public string? AssignedTo { get; set; }

    /// <summary>
    /// User or system that reported the issue
    /// </summary>
    public string? ReportedBy { get; set; }

    [NotMapped]
    public virtual User AssignToNavigation { get; set; } = null!;

    //public virtual GPSDevicetype? DeviceTypeNavigation { get; set; }

    public virtual Issuecategory IssueCategory { get; set; } = null!;

    public virtual ActiveAlarm? ActiveAlarm { get; set; }

    // V2 Navigation Properties
    public virtual Issuetemplate? IssueTemplate { get; set; }
    public virtual Devicetype? DeviceTypeNavigation { get; set; }

    public virtual ICollection<Issueassignmenttracker> Issueassignmenttrackers { get; set; } = new List<Issueassignmenttracker>();

    public virtual ICollection<IssueAttachment> Attachments { get; set; } = new List<IssueAttachment>();

    [NotMapped]

    public virtual User OpenbyNavigation { get; set; } = null!;

    public virtual Issuepriority? PriorityNavigation { get; set; }

    public virtual Site Site { get; set; } = null!;

    public virtual Issuestatus? StatusNavigation { get; set; }

    public virtual Vehicle Vehicle { get; set; } = null!;
}