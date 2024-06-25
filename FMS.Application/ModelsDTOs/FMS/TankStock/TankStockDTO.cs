using System;
using System.ComponentModel;
namespace FMS.Application.ModelsDTOs.FMS.TankStock;

public enum EntryType
{
    [Description("Tank Reconciliation")]
    TankReconciliation,

    [Description("Delivery")]
    Delivery
}

public class TankStockDTO
{
    public EntryType? EntryType { get; set; }
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

}
