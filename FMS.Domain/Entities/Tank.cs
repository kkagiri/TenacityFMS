using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities;

public partial class Tank
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public decimal TankVolume { get; set; }

    public decimal? TankHeight { get; set; }

    public string? PtsId { get; set; }
    public sbyte? UseBookKeeping { get; set; }
    public int SiteId { get; set; }
    public decimal? DiscrepancyThreshold { get; set; }
    public decimal? TankLength { get; set; }

    public decimal? CurrentStock { get; set; }

    public DateTime LastStockUpdate { get; set; }

    public virtual ICollection<Delivery> Deliveries { get; set; } = new List<Delivery>();

    public virtual ICollection<Fuelrefil> Fuelrefils { get; set; } = new List<Fuelrefil>();

    public virtual Ptsdevice? Pts { get; set; }

    public virtual Site Site { get; set; } = null!;

    public virtual ICollection<Tankstock> Tankstocks { get; set; } = new List<Tankstock>();
    public virtual ICollection<Dailytankreconciliation> Dailytankreconciliations { get; set; } = new List<Dailytankreconciliation>();


    public virtual ICollection<TankVolumeHistory> TankVolumeHistories { get; set; } = new List<TankVolumeHistory>();
    public virtual ICollection<TankTransfer> SourceTankTransfers { get; set; } = new List<TankTransfer>();
    public virtual ICollection<TankTransfer> DestinationTankTransfers { get; set; } = new List<TankTransfer>();


}
