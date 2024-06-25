using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class Session
{
    public int Session1 { get; set; }

    public DateTime? Dt1 { get; set; }

    public DateTime? Dt2 { get; set; }

    public string? Sessionname { get; set; }

    public int? Userid { get; set; }

    public int? Operator { get; set; }

    public int? Rep { get; set; }

    public string? Datetime1 { get; set; }

    public string? Datetime2 { get; set; }
}
