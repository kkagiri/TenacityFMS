using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FMS.Domain.Entities;

/// <summary>
/// Represents usage intensity classification for L/hr based vehicles (generators, heavy equipment).
/// Categories: Heavy, Mid, Low usage to define expected fuel consumption rates.
/// </summary>
public class UsageIntensity
{
    public int Id { get; set; }

    /// <summary>
    /// Usage intensity name (e.g., "Heavy", "Mid", "Low", "Idle")
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = null!;

    /// <summary>
    /// Optional description of the usage intensity
    /// </summary>
    [MaxLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// Typical hours per day for this usage intensity
    /// </summary>
    public decimal? TypicalHoursPerDay { get; set; }

    /// <summary>
    /// Sort order for display purposes (1=Low, 2=Mid, 3=Heavy)
    /// </summary>
    public int SortOrder { get; set; } = 0;

    /// <summary>
    /// Whether this intensity is active and available for selection
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Date the intensity was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// User who created this intensity
    /// </summary>
    [MaxLength(100)]
    public string? CreatedBy { get; set; }

    // Navigation Properties
    public virtual ICollection<ExpectedFuelAverageTemplate> ExpectedFuelAverageTemplates { get; set; } = new List<ExpectedFuelAverageTemplate>();
}
