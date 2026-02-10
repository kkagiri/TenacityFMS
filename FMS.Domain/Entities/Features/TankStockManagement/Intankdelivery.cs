using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using FMS.Domain.Entities.Features.TankStockManagement;

namespace FMS.Domain.Entities;

public partial class Intankdelivery
{

    public int DeliveryId { get; set; }

    public int Tank { get; set; }

    public int FuelGradeId { get; set; }

    public string? FuelGradeName { get; set; }

    public DateTime? StartDateTime { get; set; }

    public float? StartProductHeight { get; set; }

    public float? StartWaterHeight { get; set; }

    public float? StartTemperature { get; set; }

    public float? StartProductVolume { get; set; }

    public float? StartProductTcvolume { get; set; }

    public float? StartProductDensity { get; set; }

    public float? StartProductMass { get; set; }

    public DateTime? EndDateTime { get; set; }

    public float? EndProductHeight { get; set; }

    public float? EndWaterHeight { get; set; }

    public float? EndTemperature { get; set; }

    public float? EndProductVolume { get; set; }

    public float? EndProductTcvolume { get; set; }

    public float? EndProductDensity { get; set; }

    public float? EndProductMass { get; set; }

    public float? AbsoluteProductHeight { get; set; }

    public float? AbsoluteWaterHeight { get; set; }

    public float? AbsoluteTemperature { get; set; }

    public float? AbsoluteProductVolume { get; set; }

    public float? AbsoluteProductTcvolume { get; set; }

    public float? AbsoluteProductDensity { get; set; }

    public float? AbsoluteProductMass { get; set; }

    public float? PumpsDispensedVolume { get; set; }

    public string? ConfigurationId { get; set; }

    public string Ptsid { get; set; } = null!;

    public int PacketId { get; set; }

    /// <summary>FK to Tank table (resolved from PtsId + probe number)</summary>
    public int? TankId { get; set; }

    /// <summary>FK to Site table (resolved from Tank)</summary>
    public int? SiteId { get; set; }

    /// <summary>Detection status: Detected, BelowThreshold, Matched, Unmatched, Confirmed, Rejected</summary>
    public string? Status { get; set; }

    /// <summary>FK to manual Delivery if this ITD was matched to one</summary>
    public int? MatchedDeliveryId { get; set; }

    /// <summary>Whether a TankVolumeHistory ledger entry was created</summary>
    public bool IsProcessed { get; set; }

    /// <summary>When the system received and processed this record</summary>
    public DateTime? DetectedAt { get; set; }

    // Navigation properties
    public virtual Ptsdevice Pts { get; set; } = null!;
    public virtual Tank? TankNavigation { get; set; }
    public virtual Delivery? MatchedDelivery { get; set; }
}
