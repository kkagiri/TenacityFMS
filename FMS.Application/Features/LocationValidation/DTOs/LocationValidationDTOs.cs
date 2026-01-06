using System;

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
        (IsCached ? " [cached]" : "");
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
