using System;

namespace FMS.Domain.Entities;

public partial class Issuetemplate
{
    public int Id { get; set; }

    public int DeviceTypeId { get; set; }

    public string Name { get; set; } = null!;

    public string? TitleTemplate { get; set; }

    public string? DescriptionTemplate { get; set; }

    public int? DefaultPriorityId { get; set; }

    public int? DefaultStatusId { get; set; }

    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Whether issues can be auto-created from monitoring based on this template
    /// </summary>
    public bool CanAutoCreate { get; set; }

    /// <summary>
    /// Device offline threshold in minutes for auto-creating issues
    /// </summary>
    public int? OfflineThresholdMinutes { get; set; }

    /// <summary>
    /// Default user/role to assign auto-created issues to
    /// </summary>
    public string? DefaultAssignee { get; set; }

    /// <summary>
    /// Cooldown period in minutes after an issue is closed before a new one
    /// can be auto-created for the same device/vehicle. Prevents rapid re-triggering.
    /// Default: null (no cooldown — only checks for open issues).
    /// </summary>
    public int? CooldownMinutes { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Devicetype DeviceType { get; set; } = null!;

    public virtual Issuepriority? DefaultPriority { get; set; }

    public virtual Issuestatus? DefaultStatus { get; set; }

    public virtual Issueautocloseconfig? AutoCloseConfig { get; set; }
    /// <summary>
    /// Categories/Tags associated with this template (many-to-many)
    /// </summary>
    public virtual ICollection<Issuecategory> Categories { get; set; } = new List<Issuecategory>();

    /// <summary>
    /// Admin-configurable completion actions for this template
    /// </summary>
    public virtual ICollection<IssueTemplateAction> TemplateActions { get; set; } = new List<IssueTemplateAction>();

    /// <summary>
    /// Future staged workflow definition for completion actions.
    /// </summary>
    public virtual IssueTemplateWorkflow? Workflow { get; set; }
}
