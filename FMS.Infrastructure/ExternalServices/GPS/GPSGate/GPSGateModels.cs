using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate
{
    /// <summary>
    /// GPSGate API response model for user status
    /// </summary>
    public class GPSGateUserStatus
    {
        public int Id { get; set; }
        public string? Username { get; set; }
        public string? UTC { get; set; }
        public GPSGatePosition? Position { get; set; }
        public GPSGateVelocity? Velocity { get; set; }
        public List<GPSGateVariable>? Variables { get; set; }

        /// <summary>
        /// Track point containing position, velocity, utc, and valid flag (new API structure)
        /// </summary>
        [JsonPropertyName("trackPoint")]
        public GPSGateTrackPointInfo? TrackPoint { get; set; }

        /// <summary>
        /// Last device activity timestamp - CRITICAL for validation
        /// </summary>
        [JsonPropertyName("deviceActivity")]
        public DateTime? DeviceActivity { get; set; }

        #region Computed Properties

        /// <summary>
        /// Gets the effective position - prefers TrackPoint, falls back to legacy Position
        /// </summary>
        [JsonIgnore]
        public GPSGatePosition? EffectivePosition => TrackPoint?.Position ?? Position;

        /// <summary>
        /// Gets the effective velocity - prefers TrackPoint, falls back to legacy Velocity
        /// </summary>
        [JsonIgnore]
        public GPSGateVelocity? EffectiveVelocity => TrackPoint?.Velocity ?? Velocity;

        /// <summary>
        /// Gets the effective UTC timestamp - prefers TrackPoint, falls back to legacy UTC
        /// </summary>
        [JsonIgnore]
        public string? EffectiveUtc => TrackPoint?.Utc ?? UTC;

        /// <summary>
        /// Gets whether the GPS position is valid (from TrackPoint.Valid)
        /// </summary>
        [JsonIgnore]
        public bool IsGPSValid => TrackPoint?.Valid ?? (EffectivePosition != null);

        #endregion
    }

    /// <summary>
    /// Track point information containing position, velocity, and validity status
    /// </summary>
    public class GPSGateTrackPointInfo
    {
        [JsonPropertyName("position")]
        public GPSGatePosition? Position { get; set; }

        [JsonPropertyName("velocity")]
        public GPSGateVelocity? Velocity { get; set; }

        /// <summary>
        /// UTC timestamp of this track point
        /// </summary>
        [JsonPropertyName("utc")]
        public string? Utc { get; set; }

        /// <summary>
        /// Whether the GPS position is valid - CRITICAL for location validation
        /// </summary>
        [JsonPropertyName("valid")]
        public bool Valid { get; set; }
    }

    /// <summary>
    /// GPSGate API position data model
    /// </summary>
    public class GPSGatePosition
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double? Altitude { get; set; }
    }

    /// <summary>
    /// GPSGate API velocity data model
    /// </summary>
    public class GPSGateVelocity
    {
        public double? GroundSpeed { get; set; }
        public double? Heading { get; set; }
    }

    /// <summary>
    /// GPSGate API accumulator data model (for odometer readings)
    /// </summary>
    public class GPSGateAccumulator
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int AccumulatorTypeId { get; set; }
        public double? Value { get; set; }
        public string? Timestamp { get; set; }
    }
}
