using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class Rtank
{
    public int Id { get; set; }

    public int? Session { get; set; }

    public short? Tankno { get; set; }

    public int? Productid { get; set; }

    public double? Amount1 { get; set; }

    public double? Amount2 { get; set; }

    public double? Amountmm1 { get; set; }

    public double? Amountmm2 { get; set; }

    public double? Book1 { get; set; }

    public double? Book2 { get; set; }

    public double? Water1 { get; set; }

    public double? Water2 { get; set; }

    public double? Watermm1 { get; set; }

    public double? Watermm2 { get; set; }

    public double? Temp1 { get; set; }

    public double? Temp2 { get; set; }

    public double? Density1 { get; set; }

    public double? Density2 { get; set; }

    public double? Mass1 { get; set; }

    public double? Mass2 { get; set; }

    public double? Temp15volume1 { get; set; }

    public double? Temp15volume2 { get; set; }

    public double? Temp15dens1 { get; set; }

    public double? Temp15dens2 { get; set; }
}
