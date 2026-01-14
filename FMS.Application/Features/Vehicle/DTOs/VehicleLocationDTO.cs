using System;

namespace FMS.Application.Features.Vehicle.DTOs
{
    /// <summary>
    /// GPS validation status for location validation during fueling
    /// </summary>
    public enum GPSValidationStatus
    {
        /// <summary>GPS is valid and location can be used for validation</summary>
        Valid,

        /// <summary>GPS is invalid but device was active recently (within 2 hours) - fueling allowed</summary>
        InvalidButRecentActivity,

        /// <summary>GPS is valid but device has been inactive for over 1 month - fueling blocked, requires notification</summary>
        ValidButStaleDevice,

        /// <summary>GPS is invalid and device has been inactive too long - fueling blocked</summary>
        InvalidAndStale,

        /// <summary>No GPS data available</summary>
        NoData,

        /// <summary>Vehicle has no GPS installed - bypass validation</summary>
        NoGPSInstalled,

        /// <summary>Using cached location because live GPS is unavailable</summary>
        CachedLocation
    }

    public class VehicleLocationDTO
    {
        public int VehicleId { get; set; }
        public string VehicleName { get; set; } = null!;
        public string? NumberPlate { get; set; }
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public DateTime LastUpdated { get; set; }
        public decimal? Speed { get; set; }
        public decimal? Heading { get; set; }
        public decimal? Altitude { get; set; }
        public decimal? Odometer { get; set; }
        public bool IsOnline { get; set; }
        public string? Address { get; set; }
        public bool HasGPSInstalled { get; set; }
        public int? DeviceId { get; set; }

        #region GPS Validation Properties (for Location Validation during Fueling)

        /// <summary>
        /// Whether the GPS position is valid (from GPSGate TrackPoint.Valid)
        /// </summary>
        public bool IsGPSValid { get; set; } = true;

        /// <summary>
        /// Last device activity timestamp from GPS provider
        /// Used to determine if device is stale even when GPS is valid
        /// </summary>
        public DateTime? DeviceActivityTime { get; set; }

        /// <summary>
        /// GPS validation status for fueling operations
        /// </summary>
        public GPSValidationStatus ValidationStatus { get; set; } = GPSValidationStatus.Valid;

        /// <summary>
        /// External device ID from VehicleProviderMapping (the actual ID used to query GPS provider)
        /// </summary>
        public string? ExternalDeviceId { get; set; }

        /// <summary>
        /// Reason for validation status (for logging/debugging)
        /// </summary>
        public string? ValidationStatusReason { get; set; }

        /// <summary>
        /// Indicates this location is from cache (not live GPS)
        /// </summary>
        public bool IsCached { get; set; }

        #endregion

        // Status properties
        public string Status => IsOnline ? "Online" : "Offline";
        public bool IsMoving => Speed.HasValue && Speed > 5; // Moving if speed > 5 km/h

        /// <summary>
        /// Determines if this location can be used for fueling validation
        /// Returns true for Valid, InvalidButRecentActivity, NoGPSInstalled, or CachedLocation statuses
        /// </summary>
        public bool CanFuel => ValidationStatus == GPSValidationStatus.Valid ||
                               ValidationStatus == GPSValidationStatus.InvalidButRecentActivity ||
                               ValidationStatus == GPSValidationStatus.NoGPSInstalled ||
                               ValidationStatus == GPSValidationStatus.CachedLocation;

        /// <summary>
        /// Indicates if a notification should be created for device issues
        /// </summary>
        public bool RequiresDeviceIssueNotification => ValidationStatus == GPSValidationStatus.ValidButStaleDevice;
    }
}