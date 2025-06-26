using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Configuration;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SystemConfigurationEntity = FMS.Domain.Entities.SystemConfiguration;
using SystemConfigurationConstants = FMS.Application.Configuration.SystemConfiguration;

namespace FMS.Application.Services.Configuration {
    //Cursor on changes to code
    /// <summary>
    /// Implementation of system configuration service
    /// Priority: Database > appsettings.json > Default values
    /// </summary>
    public class SystemConfigurationService : ISystemConfigurationService {
        private readonly ILogger<SystemConfigurationService> _logger;
        private readonly GpsdataContext _context;
        private readonly IMemoryCache _cache;
        private readonly FMSSystemSettings _settings;
        private readonly TimeSpan _cacheDuration;

        public SystemConfigurationService (
            ILogger<SystemConfigurationService> logger,
            GpsdataContext context,
            IMemoryCache cache,
            IOptionsMonitor<FMSSystemSettings> settings) {
            _logger = logger;
            _context = context;
            _cache = cache;
            _settings = settings.CurrentValue;
            _cacheDuration = TimeSpan.FromMinutes (_settings.DeviceActivity.ConfigCacheDurationMinutes);
        }

        #region Device Activity Configuration
        public async Task<int> GetWebSocketTimeoutSecondsAsync (CancellationToken cancellationToken = default) {
            return await GetConfigurationValueAsync (
                SystemConfigurationConstants.DB_CONFIG_WEBSOCKET_TIMEOUT_KEY,
                _settings.DeviceActivity.WebSocketTimeoutSeconds,
                SystemConfigurationConstants.DEFAULT_WEBSOCKET_TIMEOUT_SECONDS,
                cancellationToken);
        }

        public async Task<int> GetHttpTimeoutSecondsAsync (CancellationToken cancellationToken = default) {
            return await GetConfigurationValueAsync (
                SystemConfigurationConstants.DB_CONFIG_HTTP_TIMEOUT_KEY,
                _settings.DeviceActivity.HttpTimeoutSeconds,
                SystemConfigurationConstants.DEFAULT_HTTP_TIMEOUT_SECONDS,
                cancellationToken);
        }

        public async Task<int> GetDeviceActivityCheckIntervalSecondsAsync (CancellationToken cancellationToken = default) {
            return await GetConfigurationValueAsync (
                SystemConfigurationConstants.DB_CONFIG_DEVICE_ACTIVITY_INTERVAL_KEY,
                _settings.DeviceActivity.CheckIntervalSeconds,
                SystemConfigurationConstants.DEFAULT_DEVICE_ACTIVITY_CHECK_INTERVAL_SECONDS,
                cancellationToken);
        }

        public async Task<int> GetConfigCacheDurationMinutesAsync (CancellationToken cancellationToken = default) {
            return await Task.FromResult (_settings.DeviceActivity.ConfigCacheDurationMinutes);
        }

        public async Task<int> GetWebSocketStartupStaleThresholdMinutesAsync (CancellationToken cancellationToken = default) {
            return await Task.FromResult (_settings.DeviceActivity.WebSocketStartupStaleThresholdMinutes);
        }

        public async Task<int> GetHttpStartupStaleThresholdMinutesAsync (CancellationToken cancellationToken = default) {
            return await Task.FromResult (_settings.DeviceActivity.HttpStartupStaleThresholdMinutes);
        }

        public async Task<int> GetCleanupTimeoutMultiplierAsync (CancellationToken cancellationToken = default) {
            return await Task.FromResult (_settings.DeviceActivity.CleanupTimeoutMultiplier);
        }
        #endregion

        #region Work Schedule Configuration
        public async Task<TimeSpan> GetWorkStartTimeAsync (CancellationToken cancellationToken = default) {
            var workStartTimeStr = await GetConfigurationValueAsync (
                SystemConfigurationConstants.DB_CONFIG_WORK_START_TIME_KEY,
                _settings.WorkSchedule.WorkStartTime,
                "06:00",
                cancellationToken);

            return TimeSpan.TryParse (workStartTimeStr, out var time) ? time : SystemConfigurationConstants.DEFAULT_WORK_START_TIME;
        }

        public async Task<TimeSpan> GetWorkEndTimeAsync (CancellationToken cancellationToken = default) {
            var workEndTimeStr = await GetConfigurationValueAsync (
                SystemConfigurationConstants.DB_CONFIG_WORK_END_TIME_KEY,
                _settings.WorkSchedule.WorkEndTime,
                "22:00",
                cancellationToken);

            return TimeSpan.TryParse (workEndTimeStr, out var time) ? time : SystemConfigurationConstants.DEFAULT_WORK_END_TIME;
        }

        public async Task<string> GetTimezoneAsync (CancellationToken cancellationToken = default) {
            return await GetConfigurationValueAsync (
                SystemConfigurationConstants.DB_CONFIG_TIMEZONE_KEY,
                _settings.WorkSchedule.Timezone,
                SystemConfigurationConstants.DEFAULT_TIMEZONE,
                cancellationToken);
        }

        public async Task<bool> IsWithinWorkHoursAsync (DateTime? time = null, CancellationToken cancellationToken = default) {
            var currentTime = time ?? DateTime.UtcNow;
            var workStart = await GetWorkStartTimeAsync (cancellationToken);
            var workEnd = await GetWorkEndTimeAsync (cancellationToken);
            var timezone = await GetTimezoneAsync (cancellationToken);

            try {
                var timeZoneInfo = TimeZoneInfo.FindSystemTimeZoneById (timezone);
                var localTime = TimeZoneInfo.ConvertTimeFromUtc (currentTime, timeZoneInfo);
                var currentTimeOfDay = localTime.TimeOfDay;

                return currentTimeOfDay >= workStart && currentTimeOfDay <= workEnd;
            } catch (Exception ex) {
                _logger.LogWarning (ex, "Error converting timezone {Timezone}, using UTC", timezone);
                var currentTimeOfDay = currentTime.TimeOfDay;
                return currentTimeOfDay >= workStart && currentTimeOfDay <= workEnd;
            }
        }
        #endregion

        #region Command Execution Configuration
        public async Task<int> GetCommandTimeoutSecondsAsync (CancellationToken cancellationToken = default) {
            return await Task.FromResult (_settings.CommandExecution.CommandTimeoutSeconds);
        }

        public async Task<int> GetCommandStaleConnectionThresholdMinutesAsync (CancellationToken cancellationToken = default) {
            return await Task.FromResult (_settings.CommandExecution.StaleConnectionThresholdMinutes);
        }
        #endregion

        #region Maintenance Configuration
        public async Task<int> GetRedisCleanupIntervalMinutesAsync (CancellationToken cancellationToken = default) {
            return await Task.FromResult (_settings.Maintenance.RedisCleanupIntervalMinutes);
        }

        public async Task<bool> IsAutomaticCleanupEnabledAsync (CancellationToken cancellationToken = default) {
            return await Task.FromResult (_settings.Maintenance.EnableAutomaticCleanup);
        }

        public async Task<bool> IsPerformanceLoggingEnabledAsync (CancellationToken cancellationToken = default) {
            return await Task.FromResult (_settings.Maintenance.EnablePerformanceLogging);
        }
        #endregion

        #region Configuration Management
        public async Task<bool> UpdateConfigurationAsync (string key, string value, CancellationToken cancellationToken = default) {
            try {
                var existingConfig = await _context.SystemConfigurations
                    .FirstOrDefaultAsync (c => c.ConfigurationKey == key, cancellationToken);

                if (existingConfig != null) {
                    existingConfig.ConfigurationValue = value;
                    existingConfig.UpdatedAt = DateTime.UtcNow;
                } else {
                    _context.SystemConfigurations.Add (new SystemConfigurationEntity {
                        ConfigurationKey = key,
                            ConfigurationValue = value,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow,
                            IsActive = true
                    });
                }

                var result = await _context.SaveChangesAsync (cancellationToken);

                // Clear cache for this configuration key
                _cache.Remove ($"SystemConfig_{key}");

                _logger.LogInformation ("Updated system configuration {Key} = {Value}", key, value);
                return result > 0;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error updating system configuration {Key}", key);
                return false;
            }
        }

        public async Task<string?> GetConfigurationValueAsync (string key, CancellationToken cancellationToken = default) {
            string cacheKey = $"SystemConfig_{key}";

            if (_cache.TryGetValue (cacheKey, out string? cachedValue)) {
                return cachedValue;
            }

            try {
                var config = await _context.SystemConfigurations
                    .AsNoTracking ()
                    .FirstOrDefaultAsync (c => c.ConfigurationKey == key && c.IsActive, cancellationToken);

                var value = config?.ConfigurationValue;
                _cache.Set (cacheKey, value, _cacheDuration);

                return value;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting system configuration {Key}", key);
                return null;
            }
        }

        public async Task ClearConfigurationCacheAsync () {
            // Note: IMemoryCache doesn't have a clear all method
            // In a production environment, you might want to use a more sophisticated caching mechanism
            // For now, we'll rely on cache expiration
            _logger.LogInformation ("Configuration cache clear requested - relying on natural expiration");
            await Task.CompletedTask;
        }

        public async Task ReloadConfigurationAsync (CancellationToken cancellationToken = default) {
            await ClearConfigurationCacheAsync ();
            _logger.LogInformation ("Configuration reloaded from all sources");
        }
        #endregion

        #region Private Helper Methods
        /// <summary>
        /// Gets configuration value with priority: Database > Settings > Default
        /// </summary>
        private async Task<int> GetConfigurationValueAsync (string dbKey, int settingsValue, int defaultValue, CancellationToken cancellationToken) {
            var dbValue = await GetConfigurationValueAsync (dbKey, cancellationToken);

            if (!string.IsNullOrEmpty (dbValue) && int.TryParse (dbValue, out int parsedDbValue)) {
                return parsedDbValue;
            }

            return settingsValue != 0 ? settingsValue : defaultValue;
        }

        /// <summary>
        /// Gets configuration value with priority: Database > Settings > Default
        /// </summary>
        private async Task<string> GetConfigurationValueAsync (string dbKey, string settingsValue, string defaultValue, CancellationToken cancellationToken) {
            var dbValue = await GetConfigurationValueAsync (dbKey, cancellationToken);

            if (!string.IsNullOrEmpty (dbValue)) {
                return dbValue;
            }

            return !string.IsNullOrEmpty (settingsValue) ? settingsValue : defaultValue;
        }
        #endregion
    }
}