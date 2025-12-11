using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FMS.Domain.Entities;

/// <summary>
/// Represents load classification for vehicles - used for km/L based vehicles
/// where fuel consumption varies by cargo load (e.g., 20-30t, Empty, Full Load).
/// </summary>
public class LoadClassification
{
    public int Id { get; set; }

    /// <summary>
    /// Load classification name (e.g., "Empty", "Light Load", "20-30t", "Full Load")
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = null!;

    /// <summary>
    /// Optional description of the load classification
    /// </summary>
    [MaxLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// Minimum weight in tonnes (optional, for range-based classifications)
    /// </summary>
    public decimal? MinWeightTonnes { get; set; }

    /// <summary>
    /// Maximum weight in tonnes (optional, for range-based classifications)
    /// </summary>
    public decimal? MaxWeightTonnes { get; set; }

    /// <summary>
    /// Sort order for display purposes
    /// </summary>
    public int SortOrder { get; set; } = 0;

    /// <summary>
    /// Whether this classification is active and available for selection
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Date the classification was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// User who created this classification
    /// </summary>
    [MaxLength(100)]
    public string? CreatedBy { get; set; }

    // Navigation Properties
    public virtual ICollection<ExpectedFuelAverageTemplate> ExpectedFuelAverageTemplates { get; set; } = new List<ExpectedFuelAverageTemplate>();
}
