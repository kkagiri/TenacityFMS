using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities;

public partial class Tank
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public decimal? TankVolume { get; set; }

    public decimal? TankHeight { get; set; }

    public decimal? TankLength { get; set; }
    public int? PtsId { get; set; }

    public int? SiteId { get; set; }

    public virtual Ptsdevice PtsDevice { get; set; } = null!;

    public virtual Site Site { get; set; } = null!;

    public virtual ICollection<Tankstock> Tankstocks { get; set; } = new List<Tankstock>();

    public virtual ICollection<Fuelrefil> Fuelrefils { get; set; } = new List<Fuelrefil>();
}
