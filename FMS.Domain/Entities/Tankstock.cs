using FMS.Domain.Entities.enums;
using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities;

/// <summary>
/// Represents the tank's stock levels at specific points in time, typically at the start and end of a day or shift.
/// </summary>
public partial class Tankstock
{
    public int EntryId { get; set; }

    public int TankId { get; set; }

    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
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

    public VolumeChangeReasonEnum EntryType { get; set; }

    public decimal? SensorDiscrepancy { get; set; }

    public virtual User RecordedByNavigation { get; set; } = null!;

    public virtual Site Site { get; set; } = null!;

    public virtual Tank Tank { get; set; } = null!;
}
