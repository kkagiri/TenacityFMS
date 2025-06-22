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
    }
}