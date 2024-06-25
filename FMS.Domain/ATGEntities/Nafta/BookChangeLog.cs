using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class BookChangeLog
{
    public int Id { get; set; }

    public int? Tankno { get; set; }

    public double? Book1 { get; set; }

    public double? Book2 { get; set; }

    public double? Bookcorr { get; set; }

    public string? Createtime { get; set; }

    public int? Sessionid { get; set; }

    public int? Reasonid { get; set; }
}
