/**
 * File: ISystemConfigurationService.cs
 * Purpose: Contract for accessing runtime system configuration values.
 * Dependencies: System, System.Threading, FMS.Application.Configuration
 * Last Modified: 2026-02-04
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Configuration;

namespace FMS.Application.Services.Configuration
{
    //Cursor on changes to code
    /// <summary>
    /// Service for managing system-wide configuration settings
    /// Provides a unified interface for accessing configuration from multiple sources (appsettings, database, defaults)
    /// </summary>
    public interface ISystemConfigurationService
    {
        #region Device Activity Configuration
        /// <summary>
        /// Gets the WebSocket timeout in seconds for device activity monitoring
        /// </summary>
        Task<int> GetWebSocketTimeoutSecondsAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the HTTP timeout in seconds for device activity monitoring
        /// </summary>
        Task<int> GetHttpTimeoutSecondsAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the device activity check interval in seconds
        /// </summary>
        Task<int> GetDeviceActivityCheckIntervalSecondsAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the configuration cache duration in minutes
        /// </summary>
        Task<int> GetConfigCacheDurationMinutesAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the WebSocket startup stale threshold in minutes
        /// </summary>
        Task<int> GetWebSocketStartupStaleThresholdMinutesAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the HTTP startup stale threshold in minutes
        /// </summary>
        Task<int> GetHttpStartupStaleThresholdMinutesAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the cleanup timeout multiplier
        /// </summary>
        Task<int> GetCleanupTimeoutMultiplierAsync(CancellationToken cancellationToken = default);
        #endregion

        #region Work Schedule Configuration
        /// <summary>
        /// Gets the work start time
        /// </summary>
        Task<TimeSpan> GetWorkStartTimeAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the work end time
        /// </summary>
        Task<TimeSpan> GetWorkEndTimeAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the timezone for work schedule
        /// </summary>
        Task<string> GetTimezoneAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Checks if the current time is within work hours
        /// </summary>
        Task<bool> IsWithinWorkHoursAsync(DateTime? time = null, CancellationToken cancellationToken = default);
        #endregion

        #region Command Execution Configuration
        /// <summary>
        /// Gets the command timeout in seconds
        /// </summary>
        Task<int> GetCommandTimeoutSecondsAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the stale connection threshold in minutes for command execution
        /// </summary>
        Task<int> GetCommandStaleConnectionThresholdMinutesAsync(CancellationToken cancellationToken = default);
        #endregion

        #region Maintenance Configuration
        /// <summary>
        /// Gets the Redis cleanup interval in minutes
        /// </summary>
        Task<int> GetRedisCleanupIntervalMinutesAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets whether automatic cleanup is enabled
        /// </summary>
        Task<bool> IsAutomaticCleanupEnabledAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets whether performance logging is enabled
        /// </summary>
        Task<bool> IsPerformanceLoggingEnabledAsync(CancellationToken cancellationToken = default);
        #endregion

        #region Tank Stock Configuration
        /// <summary>
        /// Gets the policy for handling historical tank stock entries when future records exist
        /// Values: "BLOCK", "WARN_RECONCILE", "WARN_RECALCULATE", "ALLOW_RECALCULATE"
        /// </summary>
        Task<string> GetTankStockFutureRecordsPolicyAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets whether to show detailed warnings when future records exist
        /// </summary>
        Task<bool> GetTankStockShowDetailedWarningsAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the maximum number of days in the past allowed for historical entries
        /// </summary>
        Task<int> GetTankStockMaxHistoricalDaysAsync(CancellationToken cancellationToken = default);
        #endregion

        #region PTS Offline Report Configuration
        /// <summary>
        /// Gets the minimum offline duration threshold in seconds for reporting
        /// Offline periods shorter than this value are not counted in reports
        /// </summary>
        Task<int> GetPtsOfflineThresholdSecondsAsync(CancellationToken cancellationToken = default);
        #endregion

        #region Configuration Management
        /// <summary>
        /// Updates a system configuration value in the database
        /// </summary>
        Task<bool> UpdateConfigurationAsync(string key, string value, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets a configuration value from the database
        /// </summary>
        Task<string?> GetConfigurationValueAsync(string key, CancellationToken cancellationToken = default);

        /// <summary>
        /// Clears the configuration cache
        /// </summary>
        Task ClearConfigurationCacheAsync();

        /// <summary>
        /// Reloads configuration from all sources
        /// </summary>
        Task ReloadConfigurationAsync(CancellationToken cancellationToken = default);
        #endregion

        #region PTS Automated Fueling Configuration
        /// <summary>
        /// Gets whether to update tank current volume from book keeping (ledger)
        /// </summary>
        Task<bool> GetPtsUpdateTankVolumeFromBookKeepingAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets whether to use PTS probe readings for tank volume
        /// </summary>
        Task<bool> GetPtsUsePtsProbeReadingsAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets upload status physical stock update interval in seconds.
        /// </summary>
        Task<int> GetPtsUploadStatusPhysicalStockUpdateIntervalSecondsAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the interval (seconds) at which tank measurement records are persisted from UploadStatus probe data.
        /// Default: 300 seconds (5 minutes).
        /// </summary>
        Task<int> GetPtsUploadStatusMeasurementPersistIntervalSecondsAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the volume source priority: 1=BookKeeping, 2=PTS Probe
        /// </summary>
        Task<int> GetPtsVolumeSourcePriorityAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets whether to automatically create ledger entries for pump transactions
        /// </summary>
        Task<bool> GetPtsAutoCreateLedgerEntriesAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets whether to check for duplicate manual entries
        /// </summary>
        Task<bool> GetPtsCheckForDuplicateManualEntriesAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets volume tolerance percentage for duplicate detection (e.g., 0.01 = 1%)
        /// </summary>
        Task<decimal> GetPtsDuplicateVolumeToleranceAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets whether to reconcile tank volumes automatically
        /// </summary>
        Task<bool> GetPtsAutoReconcileTankVolumesAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the reconciliation frequency in minutes
        /// </summary>
        Task<int> GetPtsReconciliationFrequencyMinutesAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the maximum allowed discrepancy between book keeping and probe readings (liters)
        /// </summary>
        Task<decimal> GetPtsMaxVolumeDiscrepancyThresholdAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the action to take when discrepancy exceeds threshold: 1=Alert, 2=Block, 3=AutoAdjust
        /// </summary>
        Task<int> GetPtsDiscrepancyActionAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets whether to check if vehicle has fueling rules before allowing fueling (mobile app)
        /// </summary>
        Task<bool> GetPtsEnableFuelRulesCheckAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets whether to validate fuel volume against vehicle tank capacity (mobile app)
        /// </summary>
        Task<bool> GetPtsEnableFuelCapacityValidationAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets whether to use GPS fuel level sensor to calculate remaining tank capacity (mobile app)
        /// </summary>
        Task<bool> GetPtsEnableGPSFuelLevelCheckAsync(CancellationToken cancellationToken = default);
        #endregion

        #region In-Tank Delivery Auto-Detection Configuration
        /// <summary>
        /// Gets whether ITD auto-detection alerts are enabled
        /// </summary>
        Task<bool> GetItdAlertsEnabledAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets minimum volume threshold (liters) to trigger ITD alert
        /// </summary>
        Task<decimal> GetItdMinVolumeThresholdAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets whether to auto-create TankVolumeHistory ledger entries for detected ITDs
        /// </summary>
        Task<bool> GetItdAutoCreateLedgerEntryAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets whether to auto-match ITDs with manual delivery entries
        /// </summary>
        Task<bool> GetItdAutoMatchManualDeliveryAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets volume tolerance for matching ITDs with manual deliveries (e.g., 0.10 = 10%)
        /// </summary>
        Task<decimal> GetItdMatchVolumeToleranceAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets time window in hours for matching ITDs with manual deliveries
        /// </summary>
        Task<int> GetItdMatchTimeWindowHoursAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets alert priority for ITD notifications
        /// </summary>
        Task<string> GetItdAlertPriorityAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets auto-resolve minutes for ITD alerts (0 = no auto-resolve)
        /// </summary>
        Task<int> GetItdAlertAutoResolveMinutesAsync(CancellationToken cancellationToken = default);
        #endregion

        #region Tank Measurement Configuration
        Task<int> GetTankMeasurementRetentionDaysAsync(CancellationToken cancellationToken = default);
        Task<int> GetTankMeasurementSignalRPushIntervalSecondsAsync(CancellationToken cancellationToken = default);
        #endregion

        #region Generic Configuration Access
        /// <summary>
        /// Gets a decimal configuration value by key with a default fallback.
        /// Useful for dynamic threshold configurations.
        /// </summary>
        /// <param name="key">The configuration key to look up</param>
        /// <param name="defaultValue">Default value if key not found</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>The decimal configuration value or default</returns>
        Task<decimal> GetDecimalAsync(string key, decimal defaultValue, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets a boolean configuration value by key with a default fallback.
        /// </summary>
        /// <param name="key">The configuration key to look up</param>
        /// <param name="defaultValue">Default value if key not found</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>The boolean configuration value or default</returns>
        Task<bool> GetBoolAsync(string key, bool defaultValue, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets an integer configuration value by key with a default fallback.
        /// </summary>
        /// <param name="key">The configuration key to look up</param>
        /// <param name="defaultValue">Default value if key not found</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>The integer configuration value or default</returns>
        Task<int> GetIntAsync(string key, int defaultValue, CancellationToken cancellationToken = default);
        #endregion
    }
}
