using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class NaftaCardsRefill
{
    public int Id { get; set; }

    public long Session { get; set; }

    public DateTime Date { get; set; }

    public string DateStr { get; set; } = null!;

    public int CardId { get; set; }

    public string Cardext { get; set; } = null!;

    public int AccId { get; set; }

    public int Type { get; set; }

    public string TypeStr { get; set; } = null!;

    public int ProdId { get; set; }

    public int CashFlag { get; set; }

    public double Amount { get; set; }

    public double Price { get; set; }

    public double Cost { get; set; }
}
