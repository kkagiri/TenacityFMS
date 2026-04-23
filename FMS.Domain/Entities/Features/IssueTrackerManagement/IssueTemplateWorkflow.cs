using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities;

public class IssueTemplateWorkflow
{
    public int Id { get; set; }

    public int IssueTemplateId { get; set; }

    public string Name { get; set; } = "Default workflow";

    public bool IsActive { get; set; } = true;

    public long RowVersion { get; set; } = 1;

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Issuetemplate IssueTemplate { get; set; } = null!;

    public virtual ICollection<IssueTemplateWorkflowStage> Stages { get; set; } = new List<IssueTemplateWorkflowStage>();
}