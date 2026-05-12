using System;

namespace FMS.Domain.Entities.Features.TankStockManagement;

/// <summary>
/// Time-series record of probe readings received via UploadStatus packets.
/// Unlike Tankmeasurement (which only fires on volume change from PTS firmware),
/// this captures periodic probe data from every UploadStatus packet for historical analysis.
/// </summary>
public partial class UploadStatusProbeReading
{
    public int Id { get; set; }

    public DateTime DateTime { get; set; }

    public string DeviceId { get; set; } = null!;

    public int ProbeNumber { get; set; }

    public double? ProductHeight { get; set; }

    public double? WaterHeight { get; set; }

    public double? Temperature { get; set; }

    public double? ProductVolume { get; set; }

    public double? WaterVolume { get; set; }

    public double? ProductTcvolume { get; set; }

    public double? ProductDensity { get; set; }

    public double? ProductMass { get; set; }

    public int? TankFillingPercentage { get; set; }

    public double? ProductUllage { get; set; }

    public int? TankId { get; set; }

    public int? SiteId { get; set; }

    public int? FuelGradeId { get; set; }

    public string? FuelGradeName { get; set; }

    public virtual Tank? TankNavigation { get; set; }
}
