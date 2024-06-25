using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class Barcode
{
    public int Id { get; set; }

    public int? Productid { get; set; }

    public string? Barcode1 { get; set; }

    public string? Mask { get; set; }
}
