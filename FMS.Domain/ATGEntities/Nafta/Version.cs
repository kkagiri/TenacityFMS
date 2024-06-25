using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class VersionTable
{
    public int Id { get; set; }

    public string? Name { get; set; }

    public int? Vers { get; set; }
}
