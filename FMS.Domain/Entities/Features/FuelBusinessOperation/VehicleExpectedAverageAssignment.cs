using System;
using System.ComponentModel.DataAnnotations;

namespace FMS.Domain.Entities;

/// <summary>
/// Links a vehicle to its assigned Expected Fuel Average Template.
/// A vehicle can have multiple assignments (e.g., different routes/loads),
/// but only one can be the default at a time.
/// </summary>
public class VehicleExpectedAverageAssignment
{
    public int Id { get; set; }

    /// <summary>
    /// The vehicle being assigned an expected average
    /// </summary>
    [Required]
    public int VehicleId { get; set; }

    /// <summary>
    /// The expected fuel average template being assigned
    /// </summary>
    [Required]
    public int ExpectedFuelAverageTemplateId { get; set; }

    /// <summary>
    /// Whether this is the default/primary expected average for the vehicle
    /// Only one assignment per vehicle should be marked as default
    /// </summary>
    public bool IsDefault { get; set; } = false;

    /// <summary>
    /// Optional override of the template's expected value for this specific vehicle
    /// If null, uses the template's ExpectedValue
    /// </summary>
    public decimal? OverrideExpectedValue { get; set; }

    /// <summary>
    /// Optional override of the tolerance percentage
    /// </summary>
    public decimal? OverrideTolerancePercent { get; set; }

    /// <summary>
    /// Notes about this assignment (e.g., "Based on last 3 months data")
    /// </summary>
    [MaxLength(500)]
    public string? Notes { get; set; }

    /// <summary>
    /// Whether this assignment is active
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Date the assignment was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// User who created this assignment
    /// </summary>
    [MaxLength(100)]
    public string? CreatedBy { get; set; }

    /// <summary>
    /// Date the assignment was last modified
    /// </summary>
    public DateTime? ModifiedAt { get; set; }

    /// <summary>
    /// User who last modified this assignment
    /// </summary>
    [MaxLength(100)]
    public string? ModifiedBy { get; set; }

    // ========== Navigation Properties ==========

    public virtual Vehicle Vehicle { get; set; } = null!;
    public virtual ExpectedFuelAverageTemplate ExpectedFuelAverageTemplate { get; set; } = null!;
}
