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
        private const string AUTO_CLEANUP_ENABLED_KEY = "Logging.AutoCleanupEnabled";
        private const string CLEANUP_HOUR_KEY = "Logging.CleanupHour";
        private const int DEFAULT_RETENTION_DAYS = 30;
        private const bool DEFAULT_AUTO_CLEANUP_ENABLED = true;
        private const int DEFAULT_CLEANUP_HOUR = 2;

        // Log directories from appsettings.json
        private static readonly string[] LogDirectories = new[]
        {
            @"C:\Logs\FMS.Webclient\app",
            @"C:\Logs\FMS.Webclient\errors",
            @"C:\Logs\FMS.Webclient\audit",
            @"C:\Logs\FMS.Webclient\startup",
            @"C:\Logs\FMS.Webclient\gps",
            @"C:\Logs\FMS.Webclient\fuel",
            @"C:\Logs\FMS.Webclient\signalr",
            @"C:\Logs\FMS.Webclient\issues",
            @"C:\Logs\FMS.Webclient\efcore",
            @"C:\Logs\FMS.PTS\app",
            @"C:\Logs\FMS.PTS\errors",
            @"C:\Logs\FMS.PTS\startup",
            @"C:\Logs\FMS.PTS\device-raw",
            @"C:\Logs\FMS.PTS\commands",
            @"C:\Logs\FMS.PTS\transactions",
            @"C:\Logs\FMS.PTS\connections"
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
        /// Gets whether scheduled auto-cleanup is enabled
        /// </summary>
        public async Task<bool> GetAutoCleanupEnabledAsync()
        {
            try
            {
                var config = await _context.SystemConfigurations
                    .Where(c => c.ConfigurationKey == AUTO_CLEANUP_ENABLED_KEY && c.IsActive)
                    .FirstOrDefaultAsync();

                if (config != null && bool.TryParse(config.ConfigurationValue, out var enabled))
                {
                    return enabled;
                }

                _logger.LogWarning("Auto cleanup configuration not found or invalid. Using default: {DefaultValue}", DEFAULT_AUTO_CLEANUP_ENABLED);
                return DEFAULT_AUTO_CLEANUP_ENABLED;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving auto cleanup configuration. Using default: {DefaultValue}", DEFAULT_AUTO_CLEANUP_ENABLED);
                return DEFAULT_AUTO_CLEANUP_ENABLED;
            }
        }

        /// <summary>
        /// Gets configured cleanup hour (0-23)
        /// </summary>
        public async Task<int> GetCleanupHourAsync()
        {
            try
            {
                var config = await _context.SystemConfigurations
                    .Where(c => c.ConfigurationKey == CLEANUP_HOUR_KEY && c.IsActive)
                    .FirstOrDefaultAsync();

                if (config != null && int.TryParse(config.ConfigurationValue, out var cleanupHour) && cleanupHour >= 0 && cleanupHour <= 23)
                {
                    return cleanupHour;
                }

                _logger.LogWarning("Cleanup hour configuration not found or invalid. Using default: {DefaultHour}", DEFAULT_CLEANUP_HOUR);
                return DEFAULT_CLEANUP_HOUR;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving cleanup hour configuration. Using default: {DefaultHour}", DEFAULT_CLEANUP_HOUR);
                return DEFAULT_CLEANUP_HOUR;
            }
        }

        /// <summary>
        /// Updates cleanup settings in SystemConfiguration
        /// </summary>
        public async Task SaveSettingsAsync(int retentionDays, bool autoCleanupEnabled, int cleanupHour)
        {
            await UpsertConfigurationAsync(LOG_RETENTION_KEY, retentionDays.ToString(), "Log retention days", "Int", "Logging");
            await UpsertConfigurationAsync(AUTO_CLEANUP_ENABLED_KEY, autoCleanupEnabled.ToString().ToLowerInvariant(), "Enable or disable automatic daily log cleanup", "Bool", "Logging");
            await UpsertConfigurationAsync(CLEANUP_HOUR_KEY, cleanupHour.ToString(), "Daily automatic log cleanup hour (0-23)", "Int", "Logging");
            await _context.SaveChangesAsync();
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

        private async Task UpsertConfigurationAsync(string key, string value, string description, string dataType, string category)
        {
            var now = DateTime.UtcNow;
            var existing = await _context.SystemConfigurations
                .Where(c => c.ConfigurationKey == key)
                .FirstOrDefaultAsync();

            if (existing == null)
            {
                _context.SystemConfigurations.Add(new FMS.Domain.Entities.SystemConfiguration
                {
                    ConfigurationKey = key,
                    ConfigurationValue = value,
                    DefaultValue = value,
                    Description = description,
                    DataType = dataType,
                    Category = category,
                    IsActive = true,
                    IsEditable = true,
                    CreatedAt = now,
                    UpdatedAt = now
                });

                return;
            }

            existing.ConfigurationValue = value;
            existing.IsActive = true;
            existing.IsEditable = true;
            existing.Description = string.IsNullOrWhiteSpace(existing.Description) ? description : existing.Description;
            existing.DataType = string.IsNullOrWhiteSpace(existing.DataType) ? dataType : existing.DataType;
            existing.Category = string.IsNullOrWhiteSpace(existing.Category) ? category : existing.Category;
            existing.DefaultValue = string.IsNullOrWhiteSpace(existing.DefaultValue) ? value : existing.DefaultValue;
            existing.UpdatedAt = now;
        }
    }
}
