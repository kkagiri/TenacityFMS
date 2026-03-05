/**
 * File: FuelAutoImportSettingsDto.cs
 * Purpose: DTO for reading and updating fuel auto-import configuration settings from SystemConfigurations table
 * Dependencies: FuelAutoImportProfileDto
 * Last Modified: 2026-03-03
 *
 * Key Properties:
 * - Enabled: Master on/off switch for the entire auto-import feature
 * - Profiles: List of independent import profiles, each with its own scan path and settings
 */
namespace FMS.Application.Features.FuelImport.DTOs;

using System.Collections.Generic;

/// <summary>
/// Aggregated settings DTO for fuel auto-import feature.
/// Contains a master toggle and a list of independently configured scan profiles.
/// Stored in SystemConfigurations as FuelAutoImport.Enabled + FuelAutoImport.Profiles (JSON).
/// </summary>
public class FuelAutoImportSettingsDto
{
    /// <summary>Master switch to enable/disable the auto-import feature globally</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>List of independently configured import profiles, each with its own scan path and settings</summary>
    public List<FuelAutoImportProfileDto> Profiles { get; set; } = new();
}
