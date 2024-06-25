using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class NewPrice
{
    public int Id { get; set; }

    public int? FeedId { get; set; }

    public int? Productid { get; set; }

    public double? OldPrice { get; set; }

    public double? NewPrice1 { get; set; }

    public string? Createtime { get; set; }

    public string? Applydatetime { get; set; }

    public int? Processed { get; set; }

    public double? Amount { get; set; }

    public int? Docid { get; set; }

    public int? PriceType { get; set; }
}
