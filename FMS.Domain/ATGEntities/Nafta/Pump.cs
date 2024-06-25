using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class Pump
{
    public int Id { get; set; }

    public int? Trk { get; set; }

    public int? Tankno { get; set; }

    public short? Nozzle { get; set; }

    public double? Counter { get; set; }

    public double? InnerCounter { get; set; }

    public double? Quality { get; set; }

    public int? Pump1 { get; set; }
}
