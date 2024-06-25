using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class SalesLoyalty
{
    public int Saletag { get; set; }

    public int? BonusAmount { get; set; }

    public string? CardData { get; set; }
}
