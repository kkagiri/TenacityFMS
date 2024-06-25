using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class Product
{
    public int Productid { get; set; }

    public short? Productgroup { get; set; }

    public short? Section { get; set; }

    public short? Plu { get; set; }

    public short? Tax { get; set; }

    public string? Name { get; set; }

    public string? Barcode { get; set; }

    public string? Unit { get; set; }

    public double? Price { get; set; }

    public double? Amount { get; set; }

    public string? Createtime { get; set; }

    public string? Description { get; set; }

    public string? Package { get; set; }

    public string? Longname { get; set; }

    public int? Office { get; set; }

    public int? Type { get; set; }

    public bool? Disabled { get; set; }

    public string? Uid { get; set; }

    public int? UidChanged { get; set; }

    public int? Image { get; set; }
}
