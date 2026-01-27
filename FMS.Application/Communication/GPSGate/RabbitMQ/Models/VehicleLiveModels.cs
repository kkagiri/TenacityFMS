using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace FMS.Application.Communication.GPSGate.RabbitMQ.Models
{
    /// <summary>
    /// Live vehicle location update - sent via SignalR to frontend clients
    /// This is the unified format for real-time vehicle tracking
    /// </summary>
    public class VehicleLiveLocation
    {
        /// <summary>
        /// FMS Vehicle ID (mapped from GPSGate userId via VehicleProviderMapping)
        /// </summary>
        public int VehicleId { get; set; }

        /// <summary>
        /// GPSGate User ID (external device identifier)
        /// </summary>
        public int GpsGateUserId { get; set; }

        /// <summary>
        /// Vehicle registration/number plate
        /// </summary>
        public string? NumberPlate { get; set; }

        /// <summary>
        /// Hyoung number (vehicle identifier)
        /// </summary>
        public string? HyoungNo { get; set; }

        /// <summary>
        /// Driver name (if assigned)
        /// </summary>
        public string? DriverName { get; set; }

        /// <summary>
        /// GPS Position
        /// </summary>
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double? Altitude { get; set; }

        /// <summary>
        /// Speed in km/h
        /// </summary>
        public double SpeedKmh { get; set; }

        /// <summary>
        /// Heading/bearing in degrees (0-360)
        /// </summary>
        public double Heading { get; set; }

        /// <summary>
        /// Whether the GPS position is valid
        /// </summary>
        public bool IsValidGps { get; set; }

        /// <summary>
        /// Whether the vehicle is currently online/connected
        /// </summary>
        public bool IsOnline { get; set; }

        /// <summary>
        /// Ignition status
        /// </summary>
        public bool IgnitionOn { get; set; }

        /// <summary>
        /// Last timestamp from GPS device
        /// </summary>
        public DateTime GpsTimestamp { get; set; }

        /// <summary>
        /// Server receive timestamp
        /// </summary>
        public DateTime ServerTimestamp { get; set; }

        /// <summary>
        /// Odometer reading in km (if available)
        /// </summary>
        public double? OdometerKm { get; set; }

        /// <summary>
        /// Engine hours (if available)
        /// </summary>
        public double? EngineHours { get; set; }

        /// <summary>
        /// Fuel level percentage (if available)
        /// </summary>
        public double? FuelLevelPercent { get; set; }

        /// <summary>
        /// Current geofence (if in any)
        /// </summary>
        public string? CurrentGeofence { get; set; }

        /// <summary>
        /// Device IMEI (from GPSGate)
        /// </summary>
        public string? Imei { get; set; }
    }

    /// <summary>
    /// Vehicle event notification - sent via SignalR for important events
    /// </summary>
    public class VehicleEventNotification
    {
        public int VehicleId { get; set; }
        public string? NumberPlate { get; set; }
        public string? HyoungNo { get; set; }

        public long EventId { get; set; }
        public string EventType { get; set; } = string.Empty;
        public string EventName { get; set; } = string.Empty;
        public string? Description { get; set; }

        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        public DateTime EventTimestamp { get; set; }
        public bool IsOngoing { get; set; }

        /// <summary>
        /// Event severity: Info, Warning, Critical
        /// </summary>
        public string Severity { get; set; } = "Info";

        /// <summary>
        /// Event-specific data
        /// </summary>
        public Dictionary<string, object?>? EventData { get; set; }
    }

    /// <summary>
    /// Vehicle connection status change
    /// </summary>
    public class VehicleConnectionStatus
    {
        public int VehicleId { get; set; }
        public string? NumberPlate { get; set; }
        public string? HyoungNo { get; set; }

        public bool IsOnline { get; set; }
        public string Status { get; set; } = string.Empty; // "Connected", "Disconnected", "Sending", etc.
        public DateTime StatusChangedAt { get; set; }
        public DateTime? LastDataReceived { get; set; }
    }
}
