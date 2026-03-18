using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FMS.Application.Features.Geofence.DTOs;

/**
 * File: CreateGeofenceRequestDTO.cs
 * Purpose: Captures GPSGate geofence creation input from the admin workbench.
 * Dependencies: GeofenceShapeCoordinateDTO, System.ComponentModel.DataAnnotations.
 * Last Modified: 2026-03-10
 */
public class CreateGeofenceRequestDTO
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    [RegularExpression("Circle|Polygon|Route")]
    public string GeofenceType { get; set; } = "Circle";

    public decimal? CenterLatitude { get; set; }

    public decimal? CenterLongitude { get; set; }

    public decimal? RadiusMeters { get; set; }

    public List<GeofenceShapeCoordinateDTO> Coordinates { get; set; } = new();

    public List<int> GroupIds { get; set; } = new();

    /// <summary>
    /// Operational classification: Unknown, Parking, Load, Dump, Fuel, Workshop.
    /// </summary>
    [RegularExpression("Unknown|Parking|Load|Dump|Fuel|Workshop")]
    public string? Classification { get; set; }
}
