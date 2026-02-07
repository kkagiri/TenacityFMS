using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities;

public partial class Issuecategory
{
    public int Id { get; set; }

    public string? Name { get; set; }

    public string? Description { get; set; }

    public virtual ICollection<Issuetracker> Issuetrackers { get; set; } = new List<Issuetracker>();

    /// <summary>
    /// Issue Templates that use this category as a tag (many-to-many)
    /// </summary>
    public virtual ICollection<Issuetemplate> IssueTemplates { get; set; } = new List<Issuetemplate>();
}
