using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class Carwasherr
{
    public int IdAuto { get; set; }

    public int? Id { get; set; }

    public int? Errortype { get; set; }

    public int? Washnumber { get; set; }

    public int TTime { get; set; }

    public int? Session { get; set; }

    public int? Sessionct { get; set; }

    public string Time { get; set; } = null!;
}
