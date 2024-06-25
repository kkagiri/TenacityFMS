using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class TalonsBlacklist
{
    public string? Barcode1 { get; set; }

    public string? Barcode2 { get; set; }

    public DateTime Createtime { get; set; }
}
