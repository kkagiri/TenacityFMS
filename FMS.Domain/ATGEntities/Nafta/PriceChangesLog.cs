using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class PriceChangesLog
{
    public int Id { get; set; }

    public int? FeedId { get; set; }

    public int? Productid { get; set; }

    public double? OldPrice { get; set; }

    public double? NewPrice { get; set; }

    public string? Createtime { get; set; }

    public string? Targettime { get; set; }

    public int? Session { get; set; }

    public int? Errorid { get; set; }

    public double? Amount { get; set; }

    public int? Npid { get; set; }
}
