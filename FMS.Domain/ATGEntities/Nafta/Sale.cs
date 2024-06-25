using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class Sale
{
    public int Id { get; set; }

    public int? Host { get; set; }

    public string? Doc { get; set; }

    public int? Session { get; set; }

    public string? Createtime { get; set; }

    public int? Productid { get; set; }

    public short? Trk { get; set; }

    public short? Tankno { get; set; }

    public double? Remainder { get; set; }

    public double? Amount { get; set; }

    public double? Cash { get; set; }

    public int? Cashflag { get; set; }

    public double? Price { get; set; }

    public double? Endremainder { get; set; }

    public double? Temperature { get; set; }

    public double? Density { get; set; }

    public double? Discount { get; set; }

    public double? Cost { get; set; }

    public double? Cashcost { get; set; }

    public double? Sprice { get; set; }

    public double? Scost { get; set; }

    public int? Client { get; set; }

    public int? Saletag { get; set; }

    public int? Billnum { get; set; }

    public double? Preamount { get; set; }

    public virtual NaftaCardsTable NaftaCard {  get; set; }
}
