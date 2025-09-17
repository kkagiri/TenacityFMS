using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities;

public partial class Issueassignmenttracker
{
    public int Id { get; set; }

    public string AssignedFrom { get; set; } = null!;

    public string AssignedTo { get; set; } = null!;

    public DateTime AssignedDate { get; set; }

    public int Issue { get; set; }

    [NotMapped]
    public virtual User AssignedFromNavigation { get; set; } = null!;
    [NotMapped]
    public virtual User AssignedToNavigation { get; set; } = null!;
    [NotMapped]

    public virtual Issuetracker IssueNavigation { get; set; } = null!;
}
