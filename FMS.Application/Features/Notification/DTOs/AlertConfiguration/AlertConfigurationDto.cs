/**
 * File: AlertConfigurationDto.cs
 * Purpose: DTOs for alert configuration API responses
 * Dependencies: None
 * Last Modified: 2026-02-07
 */

using System.Collections.Generic;

namespace FMS.Application.Features.Notification.DTOs.AlertConfiguration
{
    /// <summary>
    /// DTO for a single alert type configuration (API response)
    /// </summary>
    public class AlertConfigurationDto
    {
        public string Key { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Group { get; set; } = string.Empty;
        public bool Enabled { get; set; } = true;
        public List<AlertParameterDto> Parameters { get; set; } = new();
    }

    /// <summary>
    /// DTO for a single parameter within an alert type
    /// </summary>
    public class AlertParameterDto
    {
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string DataType { get; set; } = "string";
        public string? Unit { get; set; }
        public bool Required { get; set; }
        public string? CurrentValue { get; set; }
        public string? DefaultValue { get; set; }
        public string? Description { get; set; }
    }
}
