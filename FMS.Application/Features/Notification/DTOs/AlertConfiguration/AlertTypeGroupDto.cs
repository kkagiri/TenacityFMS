/**
 * File: AlertTypeGroupDto.cs
 * Purpose: DTO for grouped alert configurations (for management UI)
 * Dependencies: AlertConfigurationDto
 * Last Modified: 2026-02-07
 */

using System.Collections.Generic;

namespace FMS.Application.Features.Notification.DTOs.AlertConfiguration
{
    /// <summary>
    /// Groups alert configurations by category for the management UI
    /// </summary>
    public class AlertTypeGroupDto
    {
        public string GroupName { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int TotalAlerts { get; set; }
        public int EnabledAlerts { get; set; }
        public List<AlertConfigurationDto> AlertTypes { get; set; } = new();
    }

    /// <summary>
    /// Request DTO for updating an alert type's configuration
    /// </summary>
    public class UpdateAlertConfigurationRequestDto
    {
        /// <summary>
        /// Whether the alert type is enabled
        /// </summary>
        public bool? Enabled { get; set; }

        /// <summary>
        /// Parameter values to update. Key = parameter name, Value = new value as string.
        /// Only provided parameters will be updated; omitted parameters remain unchanged.
        /// </summary>
        public Dictionary<string, string>? Parameters { get; set; }
    }
}
