/**
 * File: IAlertConfigurationService.cs
 * Purpose: Interface for the alert configuration service that provides typed access to configurable alert thresholds
 * Dependencies: AlertConfigurationConstants
 * Last Modified: 2026-02-07
 *
 * Key Methods:
 * - GetDecimalAsync: Get a decimal threshold value
 * - GetIntAsync: Get an integer threshold value
 * - GetBoolAsync: Get a boolean threshold value
 * - IsAlertEnabledAsync: Check if an alert type is enabled
 * - GetAlertConfigAsync: Get all parameters for an alert type
 * - InvalidateCache: Force cache refresh after config update
 */

using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.Notification.Services.AlertConfiguration
{
    /// <summary>
    /// Provides typed, cached access to alert configuration thresholds stored in SystemConfiguration table.
    /// All alert threshold lookups in the application should go through this service.
    /// </summary>
    public interface IAlertConfigurationService
    {
        /// <summary>
        /// Gets a decimal configuration value for an alert type parameter
        /// </summary>
        /// <param name="alertType">The alert type key (e.g., "TankClosingStockDiscrepancy")</param>
        /// <param name="parameter">The parameter name (e.g., "significanceThresholdLiters")</param>
        /// <param name="defaultValue">Fallback if not configured</param>
        /// <param name="cancellationToken">Cancellation token</param>
        Task<decimal> GetDecimalAsync(string alertType, string parameter, decimal defaultValue, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets an integer configuration value for an alert type parameter
        /// </summary>
        Task<int> GetIntAsync(string alertType, string parameter, int defaultValue, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets a boolean configuration value for an alert type parameter
        /// </summary>
        Task<bool> GetBoolAsync(string alertType, string parameter, bool defaultValue, CancellationToken cancellationToken = default);

        /// <summary>
        /// Checks if a specific alert type is enabled
        /// </summary>
        /// <param name="alertType">The alert type key</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>True if enabled (defaults to true if not configured)</returns>
        Task<bool> IsAlertEnabledAsync(string alertType, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets all configured parameters for an alert type as a dictionary.
        /// Returns current values merged with defaults for any missing parameters.
        /// </summary>
        /// <param name="alertType">The alert type key</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Dictionary of parameter name → current value (as string)</returns>
        Task<Dictionary<string, string>> GetAlertConfigAsync(string alertType, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets all alert configurations grouped by category for management UI
        /// </summary>
        Task<List<AlertTypeConfigResult>> GetAllAlertConfigurationsAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Invalidates the cached configuration to force a fresh read from database.
        /// Should be called after any configuration update.
        /// </summary>
        void InvalidateCache();
    }

    /// <summary>
    /// Represents the current configuration state of an alert type
    /// </summary>
    public class AlertTypeConfigResult
    {
        public string Key { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Group { get; set; } = string.Empty;
        public bool Enabled { get; set; } = true;
        public List<AlertParameterConfigResult> Parameters { get; set; } = new();
    }

    /// <summary>
    /// Represents the current value of a single alert parameter
    /// </summary>
    public class AlertParameterConfigResult
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
