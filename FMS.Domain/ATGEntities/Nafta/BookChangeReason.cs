using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class BookChangeReason
{
    public int Id { get; set; }

    public string? ReasonText { get; set; }

    public string? Createtime { get; set; }
}
