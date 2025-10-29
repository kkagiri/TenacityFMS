using System;
using System.Collections.Generic;

namespace FMS.Application.Features.VehicleTracking.DTOs
{
    /// <summary>
    /// Represents a GPS device/user from the tracking provider system
    /// </summary>
    public class GPSDeviceDTO
    {
        /// <summary>
        /// Provider's device/user ID (ExternalDeviceId)
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Username in the provider system
        /// </summary>
        public string Username { get; set; } = string.Empty;

        /// <summary>
        /// Display name
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Surname/additional name
        /// </summary>
        public string? Surname { get; set; }

        /// <summary>
        /// Email address
        /// </summary>
        public string? Email { get; set; }

        /// <summary>
        /// Device IMEI number
        /// </summary>
        public string? IMEI { get; set; }

        /// <summary>
        /// Device phone number
        /// </summary>
        public string? PhoneNumber { get; set; }

        /// <summary>
        /// Device type/model name
        /// </summary>
        public string? DeviceType { get; set; }

        /// <summary>
        /// Protocol used by device
        /// </summary>
        public string? Protocol { get; set; }

        /// <summary>
        /// Last known latitude
        /// </summary>
        public decimal? Latitude { get; set; }

        /// <summary>
        /// Last known longitude
        /// </summary>
        public decimal? Longitude { get; set; }

        /// <summary>
        /// Last known altitude
        /// </summary>
        public decimal? Altitude { get; set; }

        /// <summary>
        /// Last known speed
        /// </summary>
        public decimal? Speed { get; set; }

        /// <summary>
        /// Last known heading/direction
        /// </summary>
        public decimal? Heading { get; set; }

        /// <summary>
        /// Last position update timestamp
        /// </summary>
        public DateTime? LastPositionUpdate { get; set; }

        /// <summary>
        /// Last device activity timestamp
        /// </summary>
        public DateTime? LastDeviceActivity { get; set; }

        /// <summary>
        /// Whether the device is currently online
        /// </summary>
        public bool IsOnline { get; set; }

        /// <summary>
        /// Whether the last position is valid
        /// </summary>
        public bool IsPositionValid { get; set; }

        /// <summary>
        /// Mapped FMS vehicle ID (if mapped)
        /// </summary>
        public int? MappedVehicleId { get; set; }

        /// <summary>
        /// Mapped FMS vehicle name (if mapped)
        /// </summary>
        public string? MappedVehicleName { get; set; }

        /// <summary>
        /// Mapped FMS vehicle number plate (if mapped)
        /// </summary>
        public string? MappedVehicleNumberPlate { get; set; }

        /// <summary>
        /// Whether device is currently mapped to a vehicle
        /// </summary>
        public bool IsMapped { get; set; }

        /// <summary>
        /// Provider name (GPSGate, Geotab, etc.)
        /// </summary>
        public string? ProviderName { get; set; }

        /// <summary>
        /// Additional metadata from provider
        /// </summary>
        public Dictionary<string, object>? AdditionalData { get; set; }

        /// <summary>
        /// Display text for UI
        /// </summary>
        public string DisplayText => $"{Name} ({Username}) - IMEI: {IMEI ?? "N/A"}";

        /// <summary>
        /// Status text for UI
        /// </summary>
        public string StatusText => IsMapped ? $"Mapped to {MappedVehicleName}" : "Unmapped";
    }

    /// <summary>
    /// Device mapping request
    /// </summary>
    public class MapDeviceToVehicleRequest
    {
        /// <summary>
        /// FMS Vehicle ID
        /// </summary>
        public int VehicleId { get; set; }

        /// <summary>
        /// Provider name
        /// </summary>
        public string ProviderName { get; set; } = string.Empty;

        /// <summary>
        /// External device ID from provider
        /// </summary>
        public string ExternalDeviceId { get; set; } = string.Empty;

        /// <summary>
        /// Device IMEI (optional metadata)
        /// </summary>
        public string? DeviceIMEI { get; set; }

        /// <summary>
        /// Device name (optional metadata)
        /// </summary>
        public string? DeviceName { get; set; }

        /// <summary>
        /// Device type/model (optional metadata)
        /// </summary>
        public string? DeviceType { get; set; }

        /// <summary>
        /// Additional metadata to store in JSON
        /// </summary>
        public Dictionary<string, object>? Metadata { get; set; }
    }

    /// <summary>
    /// Response for device mapping operations
    /// </summary>
    public class DeviceMappingResponse
    {
        public int VehicleId { get; set; }
        public string VehicleName { get; set; } = string.Empty;
        public string ProviderName { get; set; } = string.Empty;
        public string ExternalDeviceId { get; set; } = string.Empty;
        public string? DeviceIMEI { get; set; }
        public bool IsActive { get; set; }
        public DateTime? MappedAt { get; set; }
        public string? MappedBy { get; set; }
    }
}
