using System;
using FMS.Application.Features.Vehicle.DTOs;

namespace FMS.Application.Features.LocationValidation.DTOs;

/// <summary>
/// Represents a geographic location with latitude and longitude coordinates
/// </summary>
public record GeoLocation
{
    /// <summary>
    /// Latitude coordinate in decimal degrees (-90 to 90)
    /// </summary>
    public decimal Latitude { get; init; }

    /// <summary>
    /// Longitude coordinate in decimal degrees (-180 to 180)
    /// </summary>
    public decimal Longitude { get; init; }

    /// <summary>
    /// Optional: GPS accuracy in meters (lower is better)
    /// </summary>
    public decimal? Accuracy { get; init; }

    /// <summary>
    /// Optional: Source of the location data
    /// </summary>
    public string? Source { get; init; }

    /// <summary>
    /// Optional: Timestamp when this location was recorded
    /// </summary>
    public DateTime? Timestamp { get; init; }

    /// <summary>
    /// Whether this location was retrieved from cache (offline mode)
    /// </summary>
    public bool IsCached { get; init; }

    #region GPS Validation Properties (for Location Validation during Fueling)

    /// <summary>
    /// Whether the GPS position is valid (from GPSGate TrackPoint.Valid)
    /// </summary>
    public bool IsGPSValid { get; init; } = true;

    /// <summary>
    /// Last device activity timestamp from GPS provider.
    /// Used to determine if device is stale even when GPS is valid.
    /// </summary>
    public DateTime? DeviceActivityTime { get; init; }

    /// <summary>
    /// GPS validation status for fueling operations
    /// </summary>
    public GPSValidationStatus ValidationStatus { get; init; } = GPSValidationStatus.Valid;

    /// <summary>
    /// Reason for the validation status (for logging/debugging)
    /// </summary>
    public string? ValidationStatusReason { get; init; }

    #endregion

    public GeoLocation() { }

    public GeoLocation(decimal latitude, decimal longitude)
    {
        Latitude = latitude;
        Longitude = longitude;
    }

    public GeoLocation(decimal latitude, decimal longitude, decimal? accuracy)
    {
        Latitude = latitude;
        Longitude = longitude;
        Accuracy = accuracy;
    }

    /// <summary>
    /// Checks if this location has valid coordinates
    /// </summary>
    public bool IsValid =>
        Latitude >= -90 && Latitude <= 90 &&
        Longitude >= -180 && Longitude <= 180 &&
        (Latitude != 0 || Longitude != 0);

    /// <summary>
    /// Determines if this location can be used for fueling validation.
    /// Returns true for Valid or InvalidButRecentActivity statuses.
    /// </summary>
    public bool CanFuel => ValidationStatus == GPSValidationStatus.Valid ||
                           ValidationStatus == GPSValidationStatus.InvalidButRecentActivity ||
                           ValidationStatus == GPSValidationStatus.NoGPSInstalled;

    /// <summary>
    /// Indicates if a notification should be created for device issues
    /// </summary>
    public bool RequiresDeviceIssueNotification => ValidationStatus == GPSValidationStatus.ValidButStaleDevice;

    /// <summary>
    /// Checks if GPS accuracy meets the threshold (lower accuracy value = better)
    /// </summary>
    /// <param name="thresholdMeters">Maximum acceptable accuracy in meters</param>
    /// <returns>True if accuracy is acceptable or not specified</returns>
    public bool MeetsAccuracyThreshold(int thresholdMeters)
    {
        // If no accuracy data, assume it's acceptable
        if (!Accuracy.HasValue)
            return true;

        // Lower accuracy value = more accurate
        return Accuracy.Value <= thresholdMeters;
    }

    /// <summary>
    /// Gets a warning message if accuracy is poor but still acceptable
    /// </summary>
    /// <param name="warningThreshold">Threshold above which to warn (default 10m)</param>
    /// <returns>Warning message or null if accuracy is good</returns>
    public string? GetAccuracyWarning(int warningThreshold = 10)
    {
        if (!Accuracy.HasValue)
            return null;

        if (Accuracy.Value > warningThreshold)
            return $"GPS accuracy is {Accuracy.Value:F0}m - location may not be precise";

        return null;
    }

    public override string ToString() =>
        $"({Latitude:F6}, {Longitude:F6})" +
        (Accuracy.HasValue ? $" ±{Accuracy}m" : "") +
        (IsCached ? " [cached]" : "") +
        (!IsGPSValid ? " [invalid GPS]" : "") +
        (ValidationStatus != GPSValidationStatus.Valid ? $" [{ValidationStatus}]" : "");
}

/// <summary>
/// Result of vehicle location validation for fueling operations.
/// Contains both the location data and validation status.
/// </summary>
public class VehicleLocationValidationResult
{
    /// <summary>
    /// Vehicle ID
    /// </summary>
    public int VehicleId { get; init; }

    /// <summary>
    /// Whether a GPS location was retrieved
    /// </summary>
    public bool HasLocation { get; init; }

    /// <summary>
    /// The GPS location if available
    /// </summary>
    public GeoLocation? Location { get; init; }

    /// <summary>
    /// Whether this vehicle can proceed with fueling based on GPS validation rules.
    /// True if GPS is valid, or invalid but device was active recently.
    /// </summary>
    public bool CanFuel { get; init; }

    /// <summary>
    /// Whether a notification should be created for device issues (stale device).
    /// </summary>
    public bool RequiresNotification { get; init; }

    /// <summary>
    /// GPS validation status
    /// </summary>
    public GPSValidationStatus ValidationStatus { get; init; }

    /// <summary>
    /// Detailed reason for the validation status
    /// </summary>
    public string? ValidationStatusReason { get; init; }

    /// <summary>
    /// Last device activity timestamp
    /// </summary>
    public DateTime? DeviceActivityTime { get; init; }

    /// <summary>
    /// Failure reason if CanFuel is false
    /// </summary>
    public string? FailureReason { get; init; }
}

/// <summary>
/// Request for location-based validation during fueling authorization
/// </summary>
public record LocationValidationRequest
{
    /// <summary>
    /// The tank/dispenser being used for fueling
    /// </summary>
    public int TankId { get; init; }

    /// <summary>
    /// The PTS device ID managing the tank
    /// </summary>
    public string? PtsId { get; init; }

    /// <summary>
    /// The vehicle receiving fuel (optional for tank transfers)
    /// </summary>
    public int? VehicleId { get; init; }

    /// <summary>
    /// Location from the mobile app operator's device
    /// </summary>
    public GeoLocation? MobileAppLocation { get; init; }

    /// <summary>
    /// User ID for audit logging
    /// </summary>
    public string? UserId { get; init; }

    /// <summary>
    /// Transaction ID if already created
    /// </summary>
    public int? TransactionId { get; init; }
}

/// <summary>
/// Result of location validation check
/// </summary>
public record LocationValidationResult
{
    /// <summary>
    /// Overall validation result - true if all required checks passed
    /// </summary>
    public bool IsValid { get; init; }

    /// <summary>
    /// Whether location validation was actually performed
    /// </summary>
    public bool ValidationPerformed { get; init; }

    /// <summary>
    /// Result of vehicle proximity check
    /// </summary>
    public ProximityCheckResult? VehicleProximity { get; init; }

    /// <summary>
    /// Result of mobile app proximity check
    /// </summary>
    public ProximityCheckResult? MobileProximity { get; init; }

    /// <summary>
    /// The tank/dispenser location used for validation
    /// </summary>
    public GeoLocation? TankLocation { get; init; }

    /// <summary>
    /// Source of tank location (Static, LinkedVehicle, RFIDAssociation)
    /// </summary>
    public string? TankLocationSource { get; init; }

    /// <summary>
    /// Overall validation outcome
    /// </summary>
    public ValidationOutcome Outcome { get; init; }

    /// <summary>
    /// Human-readable failure reason if validation failed
    /// </summary>
    public string? FailureReason { get; init; }

    /// <summary>
    /// Whether validation was bypassed due to GPS failure
    /// </summary>
    public bool WasBypassedDueToGPSFailure { get; init; }

    /// <summary>
    /// Creates a successful validation result
    /// </summary>
    public static LocationValidationResult Success(
        GeoLocation? tankLocation = null,
        string? tankLocationSource = null,
        ProximityCheckResult? vehicleProximity = null,
        ProximityCheckResult? mobileProximity = null)
    {
        return new LocationValidationResult
        {
            IsValid = true,
            ValidationPerformed = true,
            Outcome = ValidationOutcome.Passed,
            TankLocation = tankLocation,
            TankLocationSource = tankLocationSource,
            VehicleProximity = vehicleProximity,
            MobileProximity = mobileProximity
        };
    }

    /// <summary>
    /// Creates a failed validation result
    /// </summary>
    public static LocationValidationResult Failed(
        string reason,
        GeoLocation? tankLocation = null,
        ProximityCheckResult? vehicleProximity = null,
        ProximityCheckResult? mobileProximity = null)
    {
        return new LocationValidationResult
        {
            IsValid = false,
            ValidationPerformed = true,
            Outcome = ValidationOutcome.Failed,
            FailureReason = reason,
            TankLocation = tankLocation,
            VehicleProximity = vehicleProximity,
            MobileProximity = mobileProximity
        };
    }

    /// <summary>
    /// Creates a skipped validation result (location validation not enabled)
    /// </summary>
    public static LocationValidationResult Skipped(string reason = "Location validation not enabled")
    {
        return new LocationValidationResult
        {
            IsValid = true,
            ValidationPerformed = false,
            Outcome = ValidationOutcome.Skipped,
            FailureReason = reason
        };
    }

    /// <summary>
    /// Creates a bypassed validation result (GPS failure with bypass enabled)
    /// </summary>
    public static LocationValidationResult Bypassed(string reason)
    {
        return new LocationValidationResult
        {
            IsValid = true,
            ValidationPerformed = true,
            Outcome = ValidationOutcome.Bypassed,
            WasBypassedDueToGPSFailure = true,
            FailureReason = reason
        };
    }
}

/// <summary>
/// Result of a single proximity check (vehicle or mobile app)
/// </summary>
public record ProximityCheckResult
{
    /// <summary>
    /// Whether this proximity check was required
    /// </summary>
    public bool WasRequired { get; init; }

    /// <summary>
    /// Whether this proximity check passed
    /// </summary>
    public bool IsValid { get; init; }

    /// <summary>
    /// The location that was checked
    /// </summary>
    public GeoLocation? Location { get; init; }

    /// <summary>
    /// Distance to tank in meters
    /// </summary>
    public double? DistanceMeters { get; init; }

    /// <summary>
    /// Maximum allowed distance in meters
    /// </summary>
    public int? AllowedRadiusMeters { get; init; }

    /// <summary>
    /// Reason for failure or skip
    /// </summary>
    public string? Reason { get; init; }

    /// <summary>
    /// Whether this check was bypassed due to GPS being unavailable.
    /// When true, allowBypassOnGPSFailure was used to pass the check.
    /// When false, GPS was available and actual distance was calculated.
    /// </summary>
    public bool WasBypassedDueToGPSFailure { get; init; }

    /// <summary>
    /// GPS validation status for the vehicle's GPS device.
    /// Indicates whether GPS data is valid, stale, or has issues.
    /// </summary>
    public GPSValidationStatus GPSValidationStatus { get; init; } = GPSValidationStatus.Valid;

    /// <summary>
    /// Whether the vehicle's GPS device requires issue notification.
    /// True when GPS is valid but device activity is stale (>30 days).
    /// </summary>
    public bool RequiresDeviceIssueNotification { get; init; }

    /// <summary>
    /// Additional information about the GPS validation status.
    /// </summary>
    public string? GPSValidationReason { get; init; }
}

/// <summary>
/// Outcome of location validation
/// </summary>
public enum ValidationOutcome
{
    /// <summary>
    /// All required proximity checks passed
    /// </summary>
    Passed,

    /// <summary>
    /// One or more proximity checks failed
    /// </summary>
    Failed,

    /// <summary>
    /// Validation was skipped (not enabled)
    /// </summary>
    Skipped,

    /// <summary>
    /// Validation was bypassed due to GPS failure
    /// </summary>
    Bypassed
}

#region Geofence Validation DTOs

/// <summary>
/// Request to validate if a fueling operation is within allowed geofences
/// </summary>
public record GeofenceValidationRequest
{
    /// <summary>
    /// The fueling rule set ID containing geofence assignments
    /// </summary>
    public int FuelingRuleSetId { get; init; }

    /// <summary>
    /// Tank/tanker location (required if RequireTankerInGeofence is true)
    /// </summary>
    public GeoLocation? TankerLocation { get; init; }

    /// <summary>
    /// Mobile app operator location (required if RequireOperatorInGeofence is true)
    /// </summary>
    public GeoLocation? OperatorLocation { get; init; }

    /// <summary>
    /// Vehicle being fueled location (required if RequireVehicleInGeofence is true)
    /// </summary>
    public GeoLocation? VehicleLocation { get; init; }

    /// <summary>
    /// Vehicle ID being fueled
    /// </summary>
    public int? VehicleId { get; init; }

    /// <summary>
    /// PTS device ID performing the fueling
    /// </summary>
    public string? PtsId { get; init; }

    /// <summary>
    /// Indicates if the vehicle has GPS installed. If false, vehicle geofence check will be bypassed.
    /// </summary>
    public bool? VehicleHasGPS { get; init; }
}

/// <summary>
/// Settings for mobile location validation, loaded from system configuration
/// </summary>
public record MobileLocationValidationSettings
{
    /// <summary>
    /// Whether mobile location is required for fueling authorization.
    /// Default: true (when RequireOperatorInGeofence is enabled)
    /// </summary>
    public bool RequireMobileLocation { get; init; } = true;

    /// <summary>
    /// Maximum age of mobile location in seconds before it's considered stale.
    /// Default: 60 seconds
    /// </summary>
    public int MaxLocationAgeSeconds { get; init; } = 60;

    /// <summary>
    /// Maximum acceptable GPS accuracy in meters.
    /// Default: 500 meters (for mobile proximity, not exact positioning)
    /// </summary>
    public int MaxLocationAccuracyMeters { get; init; } = 500;

    /// <summary>
    /// Whether to reject cached/stale locations from mobile devices.
    /// Default: true (always require fresh GPS fix)
    /// </summary>
    public bool RejectCachedLocation { get; init; } = true;
}

/// <summary>
/// Result of geofence validation
/// </summary>
public record GeofenceValidationResult
{
    /// <summary>
    /// Overall validation outcome
    /// </summary>
    public ValidationOutcome Outcome { get; init; }

    /// <summary>
    /// Whether geofence validation was enabled
    /// </summary>
    public bool WasEnabled { get; init; }

    /// <summary>
    /// Whether tanker was within allowed geofence (if required)
    /// </summary>
    public bool? TankerInGeofence { get; init; }

    /// <summary>
    /// The geofence ID tanker was found in
    /// </summary>
    public int? TankerGeofenceId { get; init; }

    /// <summary>
    /// The geofence name tanker was found in
    /// </summary>
    public string? TankerGeofenceName { get; init; }

    /// <summary>
    /// Whether operator was within allowed geofence (if required)
    /// </summary>
    public bool? OperatorInGeofence { get; init; }

    /// <summary>
    /// The geofence ID operator was found in
    /// </summary>
    public int? OperatorGeofenceId { get; init; }

    /// <summary>
    /// The geofence name operator was found in
    /// </summary>
    public string? OperatorGeofenceName { get; init; }

    /// <summary>
    /// Whether vehicle was within allowed geofence (if required)
    /// </summary>
    public bool? VehicleInGeofence { get; init; }

    /// <summary>
    /// The geofence ID vehicle was found in
    /// </summary>
    public int? VehicleGeofenceId { get; init; }

    /// <summary>
    /// The geofence name vehicle was found in
    /// </summary>
    public string? VehicleGeofenceName { get; init; }

    /// <summary>
    /// Number of geofences checked
    /// </summary>
    public int GeofencesChecked { get; init; }

    /// <summary>
    /// Reason for failure or skip
    /// </summary>
    public string? Reason { get; init; }

    /// <summary>
    /// Create a passed validation result
    /// </summary>
    public static GeofenceValidationResult Passed(string reason = "All required parties within allowed geofences")
    {
        return new GeofenceValidationResult
        {
            Outcome = ValidationOutcome.Passed,
            WasEnabled = true,
            Reason = reason
        };
    }

    /// <summary>
    /// Create a failed validation result
    /// </summary>
    public static GeofenceValidationResult Failed(string reason)
    {
        return new GeofenceValidationResult
        {
            Outcome = ValidationOutcome.Failed,
            WasEnabled = true,
            Reason = reason
        };
    }

    /// <summary>
    /// Create a skipped validation result
    /// </summary>
    public static GeofenceValidationResult Skipped(string reason)
    {
        return new GeofenceValidationResult
        {
            Outcome = ValidationOutcome.Skipped,
            WasEnabled = false,
            Reason = reason
        };
    }
}

/// <summary>
/// Result of fixed location validation
/// </summary>
public record FixedLocationValidationResult
{
    /// <summary>
    /// Overall validation outcome
    /// </summary>
    public ValidationOutcome Outcome { get; init; }

    /// <summary>
    /// Whether the vehicle is configured as a fixed location asset
    /// </summary>
    public bool IsFixedLocation { get; init; }

    /// <summary>
    /// Whether proximity validation is required for this vehicle
    /// </summary>
    public bool RequiresProximityValidation { get; init; }

    /// <summary>
    /// The vehicle's registered fixed location
    /// </summary>
    public GeoLocation? FixedLocation { get; init; }

    /// <summary>
    /// The actual fueling location being validated
    /// </summary>
    public GeoLocation? FuelingLocation { get; init; }

    /// <summary>
    /// Distance between fixed location and fueling location in meters
    /// </summary>
    public double? DistanceMeters { get; init; }

    /// <summary>
    /// Allowed radius in meters
    /// </summary>
    public decimal? AllowedRadiusMeters { get; init; }

    /// <summary>
    /// Name of the fixed location
    /// </summary>
    public string? FixedLocationName { get; init; }

    /// <summary>
    /// Reason for failure, skip, or bypass
    /// </summary>
    public string? Reason { get; init; }

    /// <summary>
    /// Create a passed validation result
    /// </summary>
    public static FixedLocationValidationResult Passed(double distanceMeters, decimal allowedRadius, string locationName = "")
    {
        return new FixedLocationValidationResult
        {
            Outcome = ValidationOutcome.Passed,
            IsFixedLocation = true,
            RequiresProximityValidation = true,
            DistanceMeters = distanceMeters,
            AllowedRadiusMeters = allowedRadius,
            FixedLocationName = locationName,
            Reason = $"Fueling location within {distanceMeters:F1}m of registered location (allowed: {allowedRadius}m)"
        };
    }

    /// <summary>
    /// Create a failed validation result
    /// </summary>
    public static FixedLocationValidationResult Failed(double distanceMeters, decimal allowedRadius, string locationName = "")
    {
        return new FixedLocationValidationResult
        {
            Outcome = ValidationOutcome.Failed,
            IsFixedLocation = true,
            RequiresProximityValidation = true,
            DistanceMeters = distanceMeters,
            AllowedRadiusMeters = allowedRadius,
            FixedLocationName = locationName,
            Reason = $"Fueling location too far from registered location ({distanceMeters:F1}m, max allowed: {allowedRadius}m)"
        };
    }

    /// <summary>
    /// Create a skipped validation result (not a fixed location vehicle)
    /// </summary>
    public static FixedLocationValidationResult Skipped(string reason)
    {
        return new FixedLocationValidationResult
        {
            Outcome = ValidationOutcome.Skipped,
            IsFixedLocation = false,
            Reason = reason
        };
    }
}

#endregion
