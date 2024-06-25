using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class Rfindatum
{
    public int Id { get; set; }

    public int? Host { get; set; }

    public int? Session { get; set; }

    public string? Cashid { get; set; }

    public string? Name { get; set; }

    public int? Index1 { get; set; }

    public int? Index2 { get; set; }

    public int? Intvalue { get; set; }

    public double? Floatvalue { get; set; }

    public string? Stringvalue { get; set; }
}
