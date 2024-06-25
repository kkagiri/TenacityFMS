using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class Rpump
{
    public int Id { get; set; }

    public int? Session { get; set; }

    public short? Tankno { get; set; }

    public short? Nozzle { get; set; }

    public int? Productid { get; set; }

    public short? Trk { get; set; }

    public double? Count1 { get; set; }

    public double? Count2 { get; set; }

    public double? InnerCount1 { get; set; }

    public double? InnerCount2 { get; set; }

    public double? Quality { get; set; }

    public short? Pump { get; set; }
}
