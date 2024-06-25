using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class Talon
{
    public int? Id { get; set; }

    public int? Session { get; set; }

    public int? Productid { get; set; }

    public int? Host { get; set; }

    public int? Trk { get; set; }

    public int? Type { get; set; }

    public int? Flags { get; set; }

    public string? Transact { get; set; }

    public string? Barcode { get; set; }

    public int? Nominal { get; set; }

    public double? Volume { get; set; }

    public double? Returnvol { get; set; }

    public DateTime Createtime { get; set; }

    public string? Dtime { get; set; }

    public string? Emitent { get; set; }

    public string? Emitentname { get; set; }
}
