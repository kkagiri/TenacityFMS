/**
 * File: VehicleTripClusterSnapshot.cs
 * Purpose: Persists discovered cluster snapshots for cluster-mode trip detection auditability.
 * Dependencies: Vehicle, Site.
 * Last Modified: 2026-03-12
 */
using System;

namespace FMS.Domain.Entities;

public class VehicleTripClusterSnapshot
{
    public int VehicleTripClusterSnapshotId { get; set; }
    public int VehicleId { get; set; }
    public DateTime TripDate { get; set; }
    public int ClusterIndex { get; set; }
    public string Label { get; set; } = string.Empty;
    public string Classification { get; set; } = "Unknown";
    public int? MatchedSiteId { get; set; }
    public string? MatchedSiteName { get; set; }
    public decimal CentroidLatitude { get; set; }
    public decimal CentroidLongitude { get; set; }
    public int VisitCount { get; set; }
    public decimal AverageDwellMinutes { get; set; }
    public string SnapshotSource { get; set; } = "RealtimeDetector";
    public string? MetadataJson { get; set; }
    public DateTime CapturedAtUtc { get; set; } = DateTime.UtcNow;

    public virtual Vehicle Vehicle { get; set; } = null!;
    public virtual Site? MatchedSite { get; set; }
}