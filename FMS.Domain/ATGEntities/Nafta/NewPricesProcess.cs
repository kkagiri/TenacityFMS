using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class NewPricesProcess
{
    public int Id { get; set; }

    public string? Createtime { get; set; }

    public int? Processed { get; set; }
}
