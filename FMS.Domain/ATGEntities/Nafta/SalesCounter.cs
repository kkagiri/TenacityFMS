using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class SalesCounter
{
    public int Id { get; set; }

    public int? Saletag { get; set; }

    public string? Ident { get; set; }

    public int? Session { get; set; }

    public int? Trk { get; set; }

    public int? Tankno { get; set; }

    public short? Nozzle { get; set; }

    public double? CounterStart { get; set; }

    public double? CounterEnd { get; set; }

    public double? InnerCounterStart { get; set; }

    public double? InnerCounterEnd { get; set; }

    public double? Quality { get; set; }
}
