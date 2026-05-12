using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities;

public partial class Issuepriority
{
    public int Id { get; set; }

    public string? Name { get; set; }

    public virtual ICollection<Issuetracker> Issuetrackers { get; set; } = new List<Issuetracker>();
}
