/**
 * File: VehicleTripDetectedStopDTO.cs
 * Purpose: Represents an extracted low-speed dwell stop used by cluster-mode trip detection.
 * Dependencies: None.
 * Last Modified: 2026-03-10
 */
using System;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripDetectedStopDTO
{
    public int SequenceNo { get; set; }
    public int StartTrackIndex { get; set; }
    public int EndTrackIndex { get; set; }
    public DateTime StartTimeUtc { get; set; }
    public DateTime EndTimeUtc { get; set; }
    public decimal DurationMinutes { get; set; }
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public string? Address { get; set; }
    public int? ClusterId { get; set; }
    public string? ClusterLabel { get; set; }
    public string? ClusterType { get; set; }
    public int? SiteId { get; set; }
    public int? GeofenceId { get; set; }
}