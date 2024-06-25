using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class Cashformsumhost
{
    public int? Host { get; set; }

    public int? Session { get; set; }

    public int? CashForm { get; set; }

    public string? CashName { get; set; }

    public double? Summ { get; set; }
}
