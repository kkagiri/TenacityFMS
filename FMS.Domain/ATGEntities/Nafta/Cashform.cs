using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class Cashform
{
    public int Id { get; set; }

    public string? Name { get; set; }

    public byte[]? Picture { get; set; }
}
