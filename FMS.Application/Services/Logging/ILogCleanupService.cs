using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Services.Logging
{
    /// <summary>
    /// Service for managing log file cleanup operations
    /// </summary>
    public interface ILogCleanupService
    {
        /// <summary>
        /// Cleans up log files older than the configured retention period
        /// </summary>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Number of files deleted</returns>
        Task<int> CleanupOldLogsAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the current log retention days from configuration
        /// </summary>
        /// <returns>Number of retention days</returns>
        Task<int> GetLogRetentionDaysAsync();

        /// <summary>
        /// Gets whether scheduled auto-cleanup is enabled
        /// </summary>
        Task<bool> GetAutoCleanupEnabledAsync();

        /// <summary>
        /// Gets configured cleanup hour (0-23)
        /// </summary>
        Task<int> GetCleanupHourAsync();

        /// <summary>
        /// Updates cleanup settings in SystemConfiguration
        /// </summary>
        Task SaveSettingsAsync(int retentionDays, bool autoCleanupEnabled, int cleanupHour);
    }
}
