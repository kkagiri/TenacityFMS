using FMS.Domain.Entities.enums;
using System;
using System.ComponentModel;
namespace FMS.Application.ModelsDTOs.FMS.TankStock;


public class TankStockDTO
{
    public int EntryId { get; set; }

    public int TankId { get; set; }

    public DateTime CreatedOn { get; set; }
    public DateTime EntryDate { get; set; }

    public decimal? ManualOpeningLevel { get; set; }

    public decimal? ManualClosingLevel { get; set; }

    public decimal? ManualAmount { get; set; }

    public decimal? ManualCalculatedUsage { get; set; }

    public decimal? SensorOpeningLevel { get; set; }

    public decimal? ExpectedClosingLevel { get; set; }
    public decimal? Discrepancy { get; set; }

    public decimal? SensorClosingLevel { get; set; }

    public string RecordedBy { get; set; } = null!;

    public int SiteId { get; set; }

    public decimal? SensorCalculatedUsage { get; set; }

    public string? Comment { get; set; }
    public string EntryType { get; set; }

    public decimal? SensorDiscrepancy { get; set; }


}
