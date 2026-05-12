using System.ComponentModel.DataAnnotations;

namespace FMS.Application.Features.Geofence.DTOs;

/**
 * File: GeofenceGroupMembershipRequestDTO.cs
 * Purpose: Represents a request to add an existing geofence into a GPSGate group.
 * Dependencies: System.ComponentModel.DataAnnotations.
 * Last Modified: 2026-03-10
 */
public class GeofenceGroupMembershipRequestDTO
{
    [Required]
    public int GeofenceId { get; set; }
}
