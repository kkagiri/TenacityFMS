using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FMS.Domain.Entities;

/// <summary>
/// Represents a fuel route for tracking expected fuel averages between locations.
/// Routes are directional - the same physical path may have different averages based on direction
/// (e.g., Nairobi to Naivasha vs Naivasha to Nairobi due to elevation changes).
/// </summary>
public class FuelRoute
{
    public int Id { get; set; }

    /// <summary>
    /// Route name/code (e.g., "NAI-NVS", "Section A")
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = null!;

    /// <summary>
    /// Optional description of the route
    /// </summary>
    [MaxLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// Starting location name (e.g., "Nairobi", "Section A Start")
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string FromLocation { get; set; } = null!;

    /// <summary>
    /// Destination location name (e.g., "Naivasha", "Section A End")
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string ToLocation { get; set; } = null!;

    /// <summary>
    /// Approximate distance in kilometers (optional)
    /// </summary>
    public decimal? DistanceKm { get; set; }

    /// <summary>
    /// Elevation change indicator: Positive = uphill, Negative = downhill, 0 = flat
    /// This helps explain why return routes may have different fuel consumption
    /// </summary>
    public int? ElevationChange { get; set; }

    /// <summary>
    /// Route type: Highway, City, Mixed, OffRoad, Site
    /// </summary>
    [MaxLength(50)]
    public string? RouteType { get; set; }

    /// <summary>
    /// Site ID if this route is associated with a specific working site
    /// </summary>
    public int? SiteId { get; set; }

    /// <summary>
    /// Whether this route is active and available for selection
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Date the route was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// User who created this route
    /// </summary>
    [MaxLength(100)]
    public string? CreatedBy { get; set; }

    /// <summary>
    /// Date the route was last modified
    /// </summary>
    public DateTime? ModifiedAt { get; set; }

    /// <summary>
    /// User who last modified this route
    /// </summary>
    [MaxLength(100)]
    public string? ModifiedBy { get; set; }

    // Navigation Properties
    public virtual Site? Site { get; set; }

    public virtual ICollection<ExpectedFuelAverageTemplate> ExpectedFuelAverageTemplates { get; set; } = new List<ExpectedFuelAverageTemplate>();
}
