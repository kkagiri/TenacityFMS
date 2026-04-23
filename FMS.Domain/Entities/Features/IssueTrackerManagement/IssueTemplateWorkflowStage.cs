using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities;

public class IssueTemplateWorkflowStage
{
    public int Id { get; set; }

    public int WorkflowId { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public string? Color { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual IssueTemplateWorkflow Workflow { get; set; } = null!;

    public virtual ICollection<IssueTemplateAction> Actions { get; set; } = new List<IssueTemplateAction>();
}