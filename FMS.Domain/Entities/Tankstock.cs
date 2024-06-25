using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities;

public partial class Tankstock
{
    public string EntryType { get; set; } = null!;

    public int EntryId { get; set; }

    public int TankId { get; set; }

    public DateTime EntryDate { get; set; }


    public decimal? ManualStartLevel { get; set; }

    public decimal? ManualEndLevel { get; set; }

    public decimal? ManualDeliveryAmount { get; set; }

    public decimal? SensorStartLevel { get; set; }

    public decimal? SensorEndLevel { get; set; }

    public decimal? SensorDeliveryAmount { get; set; }

    public decimal? DeliveryTemperature { get; set; }

    public decimal? DeliveryDensity { get; set; }

    public decimal? DeliveryMass { get; set; }

    public string RecordedBy { get; set; } = null!;

    public string Product { get; set; } = null!;  
    public int SiteId { get; set; }

    public virtual User RecordedByNavigation { get; set; } = null!;

    public virtual Site Site { get; set; } = null!;

    public virtual Tank Tank { get; set; } = null!;
}
