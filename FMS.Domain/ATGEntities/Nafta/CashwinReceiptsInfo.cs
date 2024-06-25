using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class CashwinReceiptsInfo
{
    /// <summary>
    /// record id
    /// </summary>
    public long Id { get; set; }

    /// <summary>
    /// from sales.saletag
    /// </summary>
    public long SaleTag { get; set; }
}
