using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class Nakreg
{
    public int Id { get; set; }

    public int? Client { get; set; }

    public string? Doc { get; set; }

    public int? Cashform { get; set; }

    public DateTime? Createtime { get; set; }

    public string? Name { get; set; }

    public string? Productname { get; set; }

    public string? Unit { get; set; }

    public double? Price { get; set; }

    public double? Discount { get; set; }

    public double? Amount { get; set; }

    public double? Cost { get; set; }
}
