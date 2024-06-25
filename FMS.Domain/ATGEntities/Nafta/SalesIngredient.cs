using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class SalesIngredient
{
    public int Id { get; set; }

    public int? HostId { get; set; }

    public int? IngrId { get; set; }

    public int? ProductId { get; set; }

    public double? Amount { get; set; }

    public double? Price { get; set; }

    public int? SessionId { get; set; }

    public int? SaleId { get; set; }

    public string? Createtime { get; set; }
}
