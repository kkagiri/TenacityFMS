using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities;

public partial class Navigationitem
{
    public int Id { get; set; }

    public string Page { get; set; } = null!;

    public string Link { get; set; } = null!;
     public int? ParentId { get; set; }

     public string Icon { get; set; } = string.Empty;

    public virtual ICollection<Rolenavigation> Rolenavigations { get; set; } = new List<Rolenavigation>();
}
