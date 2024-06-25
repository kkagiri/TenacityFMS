using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class Section
{
    public int Id { get; set; }

    public int? Tax { get; set; }

    public string? Name { get; set; }

    public string? Description { get; set; }

    public string? Longname { get; set; }
}
