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
    }
}
