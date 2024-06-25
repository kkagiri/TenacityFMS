using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities;

public partial class Asset
{
    public string AssetId { get; set; } = null!;

    public string? SiteId { get; set; }

    public string? AssetName { get; set; }

    public sbyte? IsActive { get; set; }
}
