using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities.Features.LocationValidation;

/// <summary>
/// Represents a location validation bypass for specific vehicles or users.
/// Allows admins to temporarily disable location validation for:
/// - All vehicles (system-wide) - stored in SystemConfigurations
/// - Specific vehicles (e.g., vehicles with poor GPS)
/// - Specific users (e.g., supervisors who need flexibility)
/// </summary>
[Table("location_validation_bypasses")]
public class LocationValidationBypass
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    /// <summary>
    /// Type of bypass: 'Vehicle', 'User', or 'All'
    /// </summary>
    [Column("bypass_type")]
    [Required]
    [MaxLength(20)]
    public string BypassType { get; set; } = "All";

    /// <summary>
    /// Vehicle ID if bypass is for a specific vehicle (null for user/all bypasses)
    /// </summary>
    [Column("vehicle_id")]
    public int? VehicleId { get; set; }

    /// <summary>
    /// User ID if bypass is for a specific user (null for vehicle/all bypasses)
    /// </summary>
    [Column("user_id")]
    [MaxLength(450)]
    public string? UserId { get; set; }

    /// <summary>
    /// Whether this bypass is currently active
    /// </summary>
    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// When the bypass expires (null for permanent bypasses)
    /// </summary>
    [Column("expires_at")]
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// Reason for the bypass (e.g., "Poor GPS signal", "Vehicle offline", "Field supervisor")
    /// </summary>
    [Column("reason")]
    [MaxLength(500)]
    public string? Reason { get; set; }

    /// <summary>
    /// Who enabled this bypass
    /// </summary>
    [Column("enabled_by")]
    [MaxLength(256)]
    public string? EnabledBy { get; set; }

    /// <summary>
    /// When the bypass was enabled
    /// </summary>
    [Column("enabled_at")]
    public DateTime EnabledAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Who cancelled/disabled this bypass (if cancelled before expiration)
    /// </summary>
    [Column("cancelled_by")]
    [MaxLength(256)]
    public string? CancelledBy { get; set; }

    /// <summary>
    /// When the bypass was cancelled (if cancelled before expiration)
    /// </summary>
    [Column("cancelled_at")]
    public DateTime? CancelledAt { get; set; }

    /// <summary>
    /// Additional notes or metadata
    /// </summary>
    [Column("notes")]
    [MaxLength(1000)]
    public string? Notes { get; set; }

    /// <summary>
    /// Navigation property for Vehicle
    /// </summary>
    [ForeignKey("VehicleId")]
    public virtual Vehicle? Vehicle { get; set; }

    /// <summary>
    /// Check if bypass is currently valid (active and not expired)
    /// </summary>
    public bool IsCurrentlyValid =>
        IsActive &&
        CancelledAt == null &&
        (!ExpiresAt.HasValue || ExpiresAt.Value > DateTime.UtcNow);
}

/// <summary>
/// Enum for bypass types
/// </summary>
public static class BypassType
{
    public const string Vehicle = "Vehicle";
    public const string User = "User";
    public const string All = "All";
}
