using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class HiddenPrice
{
    public int Productid { get; set; }

    public double? Price { get; set; }
}
