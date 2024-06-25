using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class Remain
{
    public int Id { get; set; }

    public int? Session { get; set; }

    public int? Productid { get; set; }

    public double? Rembegin { get; set; }

    public double? Remend { get; set; }

    public double? Price1 { get; set; }

    public double? Price2 { get; set; }
}
