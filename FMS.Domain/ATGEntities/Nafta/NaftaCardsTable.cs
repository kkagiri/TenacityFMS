using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class NaftaCardsTable
{
    public int Id { get; set; }

    public long Saletag { get; set; }

    public long RecNo { get; set; }

    public int CardId { get; set; }

    public string Cardcode { get; set; } = null!;

    public string Cardext { get; set; } = null!;

    public int FirmId { get; set; }

    public string Firm { get; set; } = null!;

    public int HolderId { get; set; }

    public string Holder { get; set; } = null!;

    public int Type { get; set; }

    public string TypeStr { get; set; } = null!;

    public double Balance { get; set; }

    public int Limited { get; set; }

    public string RecNoStr { get; set; } = null!;

    public virtual ICollection<Sale> Sales { get; set; }
}
