using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities;

/// <summary>
/// 		
/// </summary>
public partial class Issuetracker
{
    public int Id { get; set; }

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

    public int? DeviceId { get; set; }

    public int? DeviceType { get; set; }

    public string AssignTo { get; set; } = null!;

    public virtual User AssignToNavigation { get; set; } = null!;

    public virtual Devicetype? DeviceTypeNavigation { get; set; }

    public virtual Issuecategory IssueCategory { get; set; } = null!;

    public virtual ICollection<Issueassignmenttracker> Issueassignmenttrackers { get; set; } = new List<Issueassignmenttracker>();

    public virtual User OpenbyNavigation { get; set; } = null!;

    public virtual Issuepriority? PriorityNavigation { get; set; }

    public virtual Site Site { get; set; } = null!;

    public virtual Issuestatus? StatusNavigation { get; set; }

    public virtual Vehicle Vehicle { get; set; } = null!;
}
