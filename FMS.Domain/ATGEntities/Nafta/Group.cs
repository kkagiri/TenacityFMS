using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class Group
{
    public int Id { get; set; }

    public string? Name { get; set; }

    public string? Description { get; set; }

    public short? ExciseCodePresent { get; set; }

    public string? UidGroup { get; set; }

    public int? Image { get; set; }
}
