using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate user status response model
    /// Matches the actual API response: GET /applications/{appId}/users/{userId}
    /// </summary>
    public class GPSGateUserStatus
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("username")]
        public string? Username { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("surname")]
        public string? Surname { get; set; }

        [JsonPropertyName("email")]
        public string? Email { get; set; }

        /// <summary>
        /// Track point containing position, velocity, utc, and valid flag
        /// </summary>
        [JsonPropertyName("trackPoint")]
        public GPSGateTrackPointInfo? TrackPoint { get; set; }

        /// <summary>
        /// Calculated speed from provider
        /// </summary>
        [JsonPropertyName("calculatedSpeed")]
        public double? CalculatedSpeed { get; set; }

        /// <summary>
        /// Last device activity timestamp - CRITICAL for validation
        /// </summary>
        [JsonPropertyName("deviceActivity")]
        public DateTime? DeviceActivity { get; set; }

        /// <summary>
        /// Last transport method used (tcp, udp, etc.)
        /// </summary>
        [JsonPropertyName("lastTransport")]
        public string? LastTransport { get; set; }

        /// <summary>
        /// User template ID
        /// </summary>
        [JsonPropertyName("userTemplateID")]
        public int? UserTemplateId { get; set; }

        /// <summary>
        /// List of devices associated with this user
        /// </summary>
        [JsonPropertyName("devices")]
        public List<GPSGateDeviceInfo>? Devices { get; set; }

        #region Legacy Properties (for backward compatibility)

        /// <summary>
        /// Legacy UTC field - use TrackPoint.Utc instead
        /// </summary>
        [JsonPropertyName("uTC")]
        public string? UTC { get; set; }

        /// <summary>
        /// Legacy position field - use TrackPoint.Position instead
        /// </summary>
        [JsonPropertyName("position")]
        public GPSGatePosition? Position { get; set; }

        /// <summary>
        /// Legacy velocity field - use TrackPoint.Velocity instead
        /// </summary>
        [JsonPropertyName("velocity")]
        public GPSGateVelocity? Velocity { get; set; }

        #endregion

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
        /// If false, need to check deviceActivity to determine if fueling is allowed
        /// </summary>
        [JsonPropertyName("valid")]
        public bool Valid { get; set; }
    }
}
