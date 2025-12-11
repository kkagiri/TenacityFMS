using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FMS.Domain.Entities;

/// <summary>
/// Expected Fuel Average Template - defines the expected fuel consumption benchmark
/// based on vehicle characteristics (Type, Manufacturer, Model), operating conditions
/// (Site, Route, Load), and measurement type (km/L or L/hr).
///
/// Use cases:
/// 1. KM/L vehicles (Prime Movers, Tippers):
///    - PM (Mercedes 3310, 2016) on route NAI-NVS with load 20-30t = 2.0 km/L
///    - Same vehicle returning (NVS-NAI) with same load = 1.5 km/L (uphill)
///    - Tipper (Sino SN300) at Site A Section 1 = 2.4 km/L
///
/// 2. L/hr vehicles (Generators, Excavators):
///    - Generator (CAT 3500) at Site A, Heavy usage = 15.0 L/hr
///    - Same generator at Site A, Low usage = 5.0 L/hr
/// </summary>
public class ExpectedFuelAverageTemplate
{
    public int Id { get; set; }

    /// <summary>
    /// Template name for easy identification
    /// (e.g., "PM Mercedes 3310 NAI-NVS 20-30t", "Tipper SN300 Site A")
    /// </summary>
    [MaxLength(250)]
    public string? Name { get; set; }

    /// <summary>
    /// Optional description with additional context
    /// </summary>
    [MaxLength(1000)]
    public string? Description { get; set; }

    // ========== Vehicle Criteria ==========

    /// <summary>
    /// Vehicle Type ID (e.g., PM=Prime Mover, TP=Tipper, GEN=Generator)
    /// Required - templates are always for a specific vehicle type
    /// </summary>
    public int VehicleTypeId { get; set; }

    /// <summary>
    /// Vehicle Manufacturer ID (e.g., Mercedes, Sino, CAT)
    /// Optional - can be null to apply to all manufacturers of this type
    /// </summary>
    public int? VehicleManufacturerId { get; set; }

    /// <summary>
    /// Vehicle Model ID (e.g., 3310, SN300)
    /// Optional - can be null to apply to all models of this manufacturer
    /// </summary>
    public int? VehicleModelId { get; set; }

    /// <summary>
    /// Year of manufacture (optional filter)
    /// </summary>
    [MaxLength(4)]
    public string? YearOfManufacture { get; set; }

    // ========== Operating Conditions ==========

    /// <summary>
    /// Site ID where this average applies
    /// Optional - can be null for company-wide templates
    /// </summary>
    public int? SiteId { get; set; }

    /// <summary>
    /// Route ID for km/L vehicles (e.g., NAI-NVS)
    /// Optional - null for site-based work (Tippers) or L/hr vehicles
    /// </summary>
    public int? FuelRouteId { get; set; }

    /// <summary>
    /// Load Classification ID for km/L vehicles (e.g., 20-30t)
    /// Optional - null for L/hr vehicles or when load doesn't vary
    /// </summary>
    public int? LoadClassificationId { get; set; }

    /// <summary>
    /// Usage Intensity ID for L/hr vehicles (Heavy, Mid, Low)
    /// Optional - null for km/L vehicles
    /// </summary>
    public int? UsageIntensityId { get; set; }

    // ========== Expected Values ==========

    /// <summary>
    /// True if this template uses km/L measurement, False for L/hr
    /// </summary>
    public bool IsKmPerLiter { get; set; } = true;

    /// <summary>
    /// Expected fuel average value
    /// For km/L: kilometers per liter (e.g., 2.0)
    /// For L/hr: liters per hour (e.g., 15.0)
    /// </summary>
    [Required]
    public decimal ExpectedValue { get; set; }

    /// <summary>
    /// Minimum acceptable value (lower threshold)
    /// Consumption below this might indicate data issues
    /// </summary>
    public decimal? MinThreshold { get; set; }

    /// <summary>
    /// Maximum acceptable value (upper threshold)
    /// Consumption above this triggers alerts
    /// </summary>
    public decimal? MaxThreshold { get; set; }

    /// <summary>
    /// Tolerance percentage for variance (e.g., 10 means ±10%)
    /// </summary>
    public decimal? TolerancePercent { get; set; } = 10;

    // ========== Metadata ==========

    /// <summary>
    /// Priority for template matching (higher = more specific)
    /// Used when multiple templates could apply to a vehicle
    /// </summary>
    public int Priority { get; set; } = 0;

    /// <summary>
    /// Whether this template is active and should be used for matching
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Effective start date (optional, for seasonal/time-based templates)
    /// </summary>
    public DateTime? EffectiveFrom { get; set; }

    /// <summary>
    /// Effective end date (optional, for seasonal/time-based templates)
    /// </summary>
    public DateTime? EffectiveTo { get; set; }

    /// <summary>
    /// Date the template was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// User who created this template
    /// </summary>
    [MaxLength(100)]
    public string? CreatedBy { get; set; }

    /// <summary>
    /// Date the template was last modified
    /// </summary>
    public DateTime? ModifiedAt { get; set; }

    /// <summary>
    /// User who last modified this template
    /// </summary>
    [MaxLength(100)]
    public string? ModifiedBy { get; set; }

    // ========== Navigation Properties ==========

    public virtual Vehicletype VehicleType { get; set; } = null!;
    public virtual Vehiclemanufacturer? VehicleManufacturer { get; set; }
    public virtual Vehiclemodel? VehicleModel { get; set; }
    public virtual Site? Site { get; set; }
    public virtual FuelRoute? FuelRoute { get; set; }
    public virtual LoadClassification? LoadClassification { get; set; }
    public virtual UsageIntensity? UsageIntensity { get; set; }

    /// <summary>
    /// Vehicles that are assigned this template as their default expected average
    /// </summary>
    public virtual ICollection<VehicleExpectedAverageAssignment> VehicleAssignments { get; set; } = new List<VehicleExpectedAverageAssignment>();
}
