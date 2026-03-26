/**
 * File: SaveVehicleDocumentUserPreferencesDto.cs
 * Purpose: Wraps the current user's vehicle document reminder defaults for bulk save requests.
 * Dependencies: Vehicle document user preference DTOs.
 * Last Modified: 2026-03-25
 */
using System.Collections.Generic;

namespace FMS.Application.Features.VehicleDocumentManagement.Dtos;

public class SaveVehicleDocumentUserPreferencesDto
{
    public string UserId { get; set; } = string.Empty;
    public List<VehicleDocumentUserPreferenceValueDto> Preferences { get; set; } = new();
}