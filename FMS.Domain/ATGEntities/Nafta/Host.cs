using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class Host
{
    public int Id { get; set; }

    public long? Ip { get; set; }

    public string? Cashid { get; set; }

    public string? Name { get; set; }
}
