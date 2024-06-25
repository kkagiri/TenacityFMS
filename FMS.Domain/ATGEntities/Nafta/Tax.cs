using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class Tax
{
    public int Id { get; set; }

    public double? Rate { get; set; }

    public string? Name { get; set; }
}
