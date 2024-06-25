using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class Carwash
{
    public int Id { get; set; }

    public int? Counter { get; set; }

    public int? Parcial { get; set; }

    public int? Total { get; set; }

    public string Time { get; set; } = null!;

    public int TTime { get; set; }

    public int? Session { get; set; }

    public int? Sessionct { get; set; }

    public int? Sessionctparc { get; set; }
}
