using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FMS.Application.Features.Geofence.DTOs;

/**
 * File: CreateGeofenceGroupRequestDTO.cs
 * Purpose: Captures GPSGate geofence group creation input.
 * Dependencies: System.ComponentModel.DataAnnotations.
 * Last Modified: 2026-03-10
 */
public class CreateGeofenceGroupRequestDTO
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(20)]
    public string? Colour { get; set; }

    public bool IsPinned { get; set; }

    public bool UseInGeocoding { get; set; }

    public List<int> GeofenceIds { get; set; } = new();
}
