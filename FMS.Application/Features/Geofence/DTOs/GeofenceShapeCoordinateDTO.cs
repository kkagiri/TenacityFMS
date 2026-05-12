using System.ComponentModel.DataAnnotations;

namespace FMS.Application.Features.Geofence.DTOs;

/**
 * File: GeofenceShapeCoordinateDTO.cs
 * Purpose: Defines a coordinate vertex for geofence create requests.
 * Dependencies: System.ComponentModel.DataAnnotations.
 * Last Modified: 2026-03-10
 */
public class GeofenceShapeCoordinateDTO
{
    [Required]
    public decimal Latitude { get; set; }

    [Required]
    public decimal Longitude { get; set; }

    public int Order { get; set; }
}
