using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Services.Logging
{
    /// <summary>
    /// Service for cleaning up old log files based on configured retention period
    /// </summary>
    public class LogCleanupService : ILogCleanupService
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<LogCleanupService> _logger;
        private const string LOG_RETENTION_KEY = "Logging.RetentionDays";
        private const int DEFAULT_RETENTION_DAYS = 30;

        // Log directories from appsettings.json
        private static readonly string[] LogDirectories = new[]
        {
            @"C:\Logs\FMS.Webclient\app",
            @"C:\Logs\FMS.Webclient\errors",
            @"C:\Logs\FMS.Webclient\audit",
            @"C:\Logs\FMS.Webclient\slow",
            @"C:\Logs\FMS.Webclient\startup"
        };

        public LogCleanupService(GpsdataContext context, ILogger<LogCleanupService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Gets the configured log retention days from SystemConfiguration
        /// </summary>
        public async Task<int> GetLogRetentionDaysAsync()
        {
            try
            {
                var config = await _context.SystemConfigurations
                    .Where(c => c.ConfigurationKey == LOG_RETENTION_KEY && c.IsActive)
                    .FirstOrDefaultAsync();

                if (config != null && int.TryParse(config.ConfigurationValue, out int retentionDays))
                {
                    return retentionDays;
                }

                _logger.LogWarning("Log retention configuration not found or invalid. Using default: {DefaultDays} days", DEFAULT_RETENTION_DAYS);
                return DEFAULT_RETENTION_DAYS;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving log retention configuration. Using default: {DefaultDays} days", DEFAULT_RETENTION_DAYS);
                return DEFAULT_RETENTION_DAYS;
            }
        }

        /// <summary>
        /// Cleans up log files older than the configured retention period
        /// </summary>
        public async Task<int> CleanupOldLogsAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var retentionDays = await GetLogRetentionDaysAsync();
                var cutoffDate = DateTime.Now.AddDays(-retentionDays);
                int totalDeleted = 0;

                _logger.LogInformation("Starting log cleanup. Retention period: {RetentionDays} days, Cutoff date: {CutoffDate}",
                    retentionDays, cutoffDate);

                foreach (var directory in LogDirectories)
                {
                    if (!Directory.Exists(directory))
                    {
                        _logger.LogWarning("Log directory does not exist: {Directory}", directory);
                        continue;
                    }

                    var deletedInDirectory = await CleanupDirectoryAsync(directory, cutoffDate, cancellationToken);
                    totalDeleted += deletedInDirectory;

                    if (deletedInDirectory > 0)
                    {
                        _logger.LogInformation("Deleted {Count} log files from {Directory}", deletedInDirectory, directory);
                    }
                }

                _logger.LogInformation("Log cleanup completed. Total files deleted: {TotalDeleted}", totalDeleted);
                return totalDeleted;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during log cleanup");
                throw;
            }
        }

        /// <summary>
        /// Cleans up old log files in a specific directory
        /// </summary>
        private async Task<int> CleanupDirectoryAsync(string directoryPath, DateTime cutoffDate, CancellationToken cancellationToken)
        {
            int deletedCount = 0;

            try
            {
                var logFiles = Directory.GetFiles(directoryPath, "*.log")
                    .Where(f => File.GetLastWriteTime(f) < cutoffDate)
                    .ToList();

                foreach (var file in logFiles)
                {
                    if (cancellationToken.IsCancellationRequested)
                    {
                        _logger.LogInformation("Log cleanup cancelled");
                        break;
                    }

                    try
                    {
                        var fileInfo = new FileInfo(file);
                        var lastWriteTime = fileInfo.LastWriteTime;

                        File.Delete(file);
                        deletedCount++;

                        _logger.LogDebug("Deleted log file: {FileName}, Last modified: {LastModified}",
                            file, lastWriteTime);
                    }
                    catch (IOException ioEx)
                    {
                        _logger.LogWarning(ioEx, "Could not delete log file (file may be in use): {FileName}", file);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error deleting log file: {FileName}", file);
                    }
                }

                return await Task.FromResult(deletedCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error accessing directory: {Directory}", directoryPath);
                return 0;
            }
        }
    }
}
