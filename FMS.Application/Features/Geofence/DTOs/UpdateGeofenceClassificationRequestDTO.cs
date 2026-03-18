using System.ComponentModel.DataAnnotations;

namespace FMS.Application.Features.Geofence.DTOs;

/// <summary>
/// Request DTO for updating a geofence's operational classification.
/// </summary>
public class UpdateGeofenceClassificationRequestDTO
{
    [Required]
    [RegularExpression("Unknown|Parking|Load|Dump|Fuel|Workshop")]
    public string Classification { get; set; } = "Unknown";
}
