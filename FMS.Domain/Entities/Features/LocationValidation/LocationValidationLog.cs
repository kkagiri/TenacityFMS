using FMS.Domain.Entities.Enums;

namespace FMS.Domain.Entities.Features.LocationValidation;

/// <summary>
/// Audit log entry for location validation attempts during fueling operations.
/// Records all pass/fail/bypass outcomes for compliance and troubleshooting.
/// </summary>
public class LocationValidationLog
{
    public int Id { get; set; }

    /// <summary>
    /// When the validation occurred
    /// </summary>
    public DateTime ValidationTime { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// PTS device ID that processed the request
    /// </summary>
    public string PtsId { get; set; } = null!;

    /// <summary>
    /// Tank/dispenser being used for fueling
    /// </summary>
    public int TankId { get; set; }

    /// <summary>
    /// Vehicle receiving fuel (if applicable)
    /// </summary>
    public int? VehicleId { get; set; }

    /// <summary>
    /// Type of tank (Stationary or MobileTanker)
    /// </summary>
    public TankType TankType { get; set; }

    // =====================================================
    // Tank/Dispenser Location
    // =====================================================

    public decimal? TankLatitude { get; set; }
    public decimal? TankLongitude { get; set; }

    /// <summary>
    /// Source of tank location: Static, LinkedVehicle, RFIDAssociation
    /// </summary>
    public string? TankLocationSource { get; set; }

    // =====================================================
    // Vehicle Location (if applicable)
    // =====================================================

    public decimal? VehicleLatitude { get; set; }
    public decimal? VehicleLongitude { get; set; }

    /// <summary>
    /// GPS accuracy of vehicle location in meters
    /// </summary>
    public decimal? VehicleGPSAccuracy { get; set; }

    /// <summary>
    /// Distance from vehicle to tank in meters
    /// </summary>
    public decimal? VehicleDistanceMeters { get; set; }

    /// <summary>
    /// Whether vehicle proximity check was required
    /// </summary>
    public bool VehicleProximityRequired { get; set; }

    /// <summary>
    /// Whether vehicle proximity check passed
    /// </summary>
    public bool? VehicleProximityValid { get; set; }

    // =====================================================
    // Mobile App Location (if applicable)
    // =====================================================

    public decimal? MobileLatitude { get; set; }
    public decimal? MobileLongitude { get; set; }

    /// <summary>
    /// GPS accuracy of mobile location in meters
    /// </summary>
    public decimal? MobileAccuracy { get; set; }

    /// <summary>
    /// Distance from mobile device to tank in meters
    /// </summary>
    public decimal? MobileDistanceMeters { get; set; }

    /// <summary>
    /// Whether mobile proximity check was required
    /// </summary>
    public bool MobileProximityRequired { get; set; }

    /// <summary>
    /// Whether mobile proximity check passed
    /// </summary>
    public bool? MobileProximityValid { get; set; }

    // =====================================================
    // GPS Accuracy Validation
    // =====================================================

    /// <summary>
    /// Minimum GPS accuracy threshold that was applied (in meters)
    /// </summary>
    public int? MinimumGPSAccuracyRequired { get; set; }

    /// <summary>
    /// Whether GPS accuracy met the threshold
    /// </summary>
    public bool? GPSAccuracyValid { get; set; }

    // =====================================================
    // Validation Result
    // =====================================================

    /// <summary>
    /// Overall validation result - true if all required checks passed
    /// </summary>
    public bool IsValid { get; set; }

    /// <summary>
    /// Result outcome: Passed, Failed, Bypassed, Skipped
    /// </summary>
    public string ValidationResult { get; set; } = null!;

    /// <summary>
    /// Reason for failure (if failed)
    /// </summary>
    public string? FailureReason { get; set; }

    // =====================================================
    // Settings Used
    // =====================================================

    /// <summary>
    /// Vehicle proximity radius that was applied (meters)
    /// </summary>
    public int? VehicleRadiusUsed { get; set; }

    /// <summary>
    /// Mobile app proximity radius that was applied (meters)
    /// </summary>
    public int? MobileRadiusUsed { get; set; }

    /// <summary>
    /// Grace period tolerance that was applied (meters)
    /// </summary>
    public int? GracePeriodMetersUsed { get; set; }

    /// <summary>
    /// Whether validation was bypassed due to GPS failure
    /// </summary>
    public bool WasBypassedDueToGPSFailure { get; set; }

    // =====================================================
    // Context
    // =====================================================

    /// <summary>
    /// User who initiated the fueling request
    /// </summary>
    public string? UserId { get; set; }

    /// <summary>
    /// Associated pump transaction ID (if created)
    /// </summary>
    public int? TransactionId { get; set; }
}
