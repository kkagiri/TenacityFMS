using System;

namespace FMS.Domain.Entities;

public partial class Issueautocloseconfig
{
    public int Id { get; set; }

    public int IssueTemplateId { get; set; }

    public bool IsEnabled { get; set; }

    public string CheckerType { get; set; } = null!;

    public int? CheckIntervalSeconds { get; set; }

    public string? CheckerConfigJson { get; set; }

    public bool AutoCloseWhenSatisfied { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Issuetemplate IssueTemplate { get; set; } = null!;
}
