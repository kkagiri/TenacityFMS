using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class Sheet
{
    public int Id { get; set; }

    public int? Client { get; set; }

    public string? Doc { get; set; }

    public int? Cashflag { get; set; }

    public int? Productid { get; set; }

    public string? Name { get; set; }

    public double? Discount { get; set; }

    public double? Price { get; set; }

    public double? Amount { get; set; }

    public double? Credit { get; set; }

    public double? Debit { get; set; }

    public int? Tankno { get; set; }

    public int? Flag { get; set; }

    public byte[]? Addition { get; set; }

    public string? Createtime { get; set; }
}
