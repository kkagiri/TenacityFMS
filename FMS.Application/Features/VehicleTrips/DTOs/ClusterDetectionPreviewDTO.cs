/**
 * File: ClusterDetectionPreviewDTO.cs
 * Purpose: Returns the full cluster detection analysis (stops, clusters, trip legs, track points) without persisting any data.
 * Dependencies: VehicleTripDetectedStopDTO, VehicleTripStopClusterDTO, VehicleTripDetectionResultDTO, PreviewTrackPointDTO.
 * Last Modified: 2026-06-01
 */
using System;
using System.Collections.Generic;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class ClusterDetectionPreviewDTO
{
    public int VehicleId { get; set; }
    public string VehicleName { get; set; } = string.Empty;
    public DateTime FromUtc { get; set; }
    public DateTime ToUtc { get; set; }
    public int TotalTrackPoints { get; set; }
    public int StopsDetected { get; set; }
    public int ClustersFormed { get; set; }
    public int TripLegsDetected { get; set; }
    public List<VehicleTripDetectedStopDTO> Stops { get; set; } = new();
    public List<VehicleTripStopClusterDTO> Clusters { get; set; } = new();
    public List<VehicleTripDetectionResultDTO> TripLegs { get; set; } = new();
    public List<PreviewTrackPointDTO> TrackPoints { get; set; } = new();

    // Settings that were actually used for this preview run
    public decimal SettingsStopSpeedThresholdKph { get; set; }
    public decimal SettingsMinimumStopDurationMinutes { get; set; }
    public decimal SettingsMinimumTripDistanceKm { get; set; }
    public decimal SettingsMinimumTripDurationMinutes { get; set; }
    public double SettingsClusterRadiusMeters { get; set; }
    public int SettingsMaxTrackPoints { get; set; }
}

/// <summary>
/// Lightweight projection of a track point for timeline / speed-profile visualisation.
/// </summary>
public class PreviewTrackPointDTO
{
    public DateTime Timestamp { get; set; }
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public decimal? Speed { get; set; }
    public decimal? Heading { get; set; }
    public bool? IgnitionStatus { get; set; }
}
