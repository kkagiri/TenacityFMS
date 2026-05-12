using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities;

public partial class Devicetype
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public bool IsMonitored { get; set; }

    public string? MonitoringEndpoint { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<Issuetemplate> Issuetemplates { get; set; } = new List<Issuetemplate>();
}
