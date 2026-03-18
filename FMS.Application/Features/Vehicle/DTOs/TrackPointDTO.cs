/**
 * File: TrackPointDTO.cs
 * Purpose: Represents a single historical GPS track point enriched for downstream detection workflows.
 * Dependencies: System.
 * Last Modified: 2026-03-11
 */
using System;

namespace FMS.Application.Features.Vehicle.DTOs
{
    /// <summary>
    /// Represents a single point in a vehicle's historical track.
    /// </summary>
    public class TrackPointDTO
    {
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public decimal? Altitude { get; set; }
        public decimal? Speed { get; set; }
        public decimal? Heading { get; set; }
        public DateTime Timestamp { get; set; }
        public string? Address { get; set; }
        public decimal? Odometer { get; set; }
        public bool IsValid { get; set; } = true;
        public int? SatelliteCount { get; set; }
        public int? TrackInfoId { get; set; }
        public decimal? FuelLevel { get; set; }
        public bool? IgnitionStatus { get; set; }
        public decimal? DistanceFromPreviousKm { get; set; }
        public int? TimeDeltaSeconds { get; set; }
        public int? ContainingSiteId { get; set; }
        public int? ContainingGeofenceId { get; set; }
        public string? ContainingSiteName { get; set; }
    }
}
