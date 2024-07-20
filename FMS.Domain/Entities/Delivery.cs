using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities;

/// <summary>
/// 		
/// </summary>
public partial class Delivery
{
    public int Id { get; set; }

    public int TankId { get; set; }

    public DateTime DeliveryDate { get; set; }

    public decimal ManualDeliveryAmount { get; set; }

    public decimal? SensorDeliveryAmount { get; set; }

    public decimal DeliveryTemperature { get; set; }

    public decimal DeliveryDensity { get; set; }

    public decimal? DeliveryMass { get; set; }

    public decimal StockBeforeDelivery { get; set; }

    public decimal StockAfterDelivery { get; set; }

    public int SiteId { get; set; }

    public string RecordedBy { get; set; } = null!;

    public int SupplierId { get; set; }

    public string Lponumber { get; set; } = null!;

    public string Product { get; set; } = null!;

    public virtual User RecordedByNavigation { get; set; } = null!;

    public virtual Site Site { get; set; } = null!;

    public virtual Supplier Supplier { get; set; } = null!;

    public virtual Tank Tank { get; set; } = null!;
}
