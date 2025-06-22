using System;
using System.ComponentModel.DataAnnotations;

namespace FMS.Application.Configuration
{
    //Cursor on changes to code
    /// <summary>
    /// FMS system settings that can be configured via appsettings.json
    /// These settings override the defaults in SystemConfiguration
    /// </summary>
    public class FMSSystemSettings
    {
        public const string ConfigurationSection = "FMSSystem";

        /// <summary>
        /// Device activity monitoring settings
        /// </summary>
        public DeviceActivitySettings DeviceActivity { get; set; } = new();

        /// <summary>
        /// Work schedule settings
        /// </summary>
        public WorkScheduleSettings WorkSchedule { get; set; } = new();

        /// <summary>
        /// Command execution settings
        /// </summary>
        public CommandExecutionSettings CommandExecution { get; set; } = new();

        /// <summary>
        /// System maintenance settings
        /// </summary>
        public MaintenanceSettings Maintenance { get; set; } = new();

        /// <summary>
        /// Logging configuration settings
        /// </summary>
        public LoggingSettings Logging { get; set; } = new();
    }

    /// <summary>
    /// Device activity monitoring configuration
    /// </summary>
    public class DeviceActivitySettings
    {
        /// <summary>
        /// WebSocket timeout in seconds for device activity monitoring
        /// </summary>
        [Range(10, 300)]
        public int WebSocketTimeoutSeconds { get; set; } = SystemConfiguration.DEFAULT_WEBSOCKET_TIMEOUT_SECONDS;

        /// <summary>
        /// HTTP timeout in seconds for device activity monitoring
        /// </summary>
        [Range(30, 600)]
        public int HttpTimeoutSeconds { get; set; } = SystemConfiguration.DEFAULT_HTTP_TIMEOUT_SECONDS;

        /// <summary>
        /// Interval in seconds for checking device activity
        /// </summary>
        [Range(5, 60)]
        public int CheckIntervalSeconds { get; set; } = SystemConfiguration.DEFAULT_DEVICE_ACTIVITY_CHECK_INTERVAL_SECONDS;

        /// <summary>
        /// Duration in minutes for caching configuration values
        /// </summary>
        [Range(1, 60)]
        public int ConfigCacheDurationMinutes { get; set; } = SystemConfiguration.DEFAULT_CONFIG_CACHE_DURATION_MINUTES;

        /// <summary>
        /// Threshold in minutes for considering a WebSocket connection stale during startup cleanup
        /// </summary>
        [Range(5, 60)]
        public int WebSocketStartupStaleThresholdMinutes { get; set; } = SystemConfiguration.DEFAULT_WS_STARTUP_STALE_THRESHOLD_MINUTES;

        /// <summary>
        /// Threshold in minutes for considering an HTTP connection stale during startup cleanup
        /// </summary>
        [Range(10, 120)]
        public int HttpStartupStaleThresholdMinutes { get; set; } = SystemConfiguration.DEFAULT_HTTP_STARTUP_STALE_THRESHOLD_MINUTES;

        /// <summary>
        /// Multiplier for cleanup timeout (connection_timeout * this_multiplier)
        /// </summary>
        [Range(1, 5)]
        public int CleanupTimeoutMultiplier { get; set; } = SystemConfiguration.DEFAULT_CLEANUP_TIMEOUT_MULTIPLIER;
    }

    /// <summary>
    /// Work schedule configuration
    /// </summary>
    public class WorkScheduleSettings
    {
        /// <summary>
        /// Start of work time in HH:mm format (24-hour)
        /// </summary>
        [Required]
        public string WorkStartTime { get; set; } = "06:00";

        /// <summary>
        /// End of work time in HH:mm format (24-hour)
        /// </summary>
        [Required]
        public string WorkEndTime { get; set; } = "22:00";

        /// <summary>
        /// Timezone for work schedule (e.g., "UTC", "America/New_York")
        /// </summary>
        [Required]
        public string Timezone { get; set; } = SystemConfiguration.DEFAULT_TIMEZONE;

        /// <summary>
        /// Gets the work start time as TimeSpan
        /// </summary>
        public TimeSpan GetWorkStartTimeSpan()
        {
            return TimeSpan.TryParse(WorkStartTime, out var time) ? time : SystemConfiguration.DEFAULT_WORK_START_TIME;
        }

        /// <summary>
        /// Gets the work end time as TimeSpan
        /// </summary>
        public TimeSpan GetWorkEndTimeSpan()
        {
            return TimeSpan.TryParse(WorkEndTime, out var time) ? time : SystemConfiguration.DEFAULT_WORK_END_TIME;
        }
    }

    /// <summary>
    /// Command execution configuration
    /// </summary>
    public class CommandExecutionSettings
    {
        /// <summary>
        /// Timeout in seconds for PTS command execution
        /// </summary>
        [Range(5, 120)]
        public int CommandTimeoutSeconds { get; set; } = SystemConfiguration.DEFAULT_COMMAND_TIMEOUT_SECONDS;

        /// <summary>
        /// Threshold in minutes for considering a device connection stale for command execution
        /// </summary>
        [Range(1, 30)]
        public int StaleConnectionThresholdMinutes { get; set; } = SystemConfiguration.DEFAULT_COMMAND_STALE_THRESHOLD_MINUTES;
    }

    /// <summary>
    /// System maintenance configuration
    /// </summary>
    public class MaintenanceSettings
    {
        /// <summary>
        /// Interval in minutes for Redis cleanup operations
        /// </summary>
        [Range(1, 60)]
        public int RedisCleanupIntervalMinutes { get; set; } = SystemConfiguration.DEFAULT_REDIS_CLEANUP_INTERVAL_MINUTES;

        /// <summary>
        /// Enable automatic cleanup of stale connections
        /// </summary>
        public bool EnableAutomaticCleanup { get; set; } = true;

        /// <summary>
        /// Enable detailed performance logging
        /// </summary>
        public bool EnablePerformanceLogging { get; set; } = false;
    }

    /// <summary>
    /// Logging configuration
    /// </summary>
    public class LoggingSettings
    {
        /// <summary>
        /// Minimum log level for system operations
        /// </summary>
        [Required]
        public string MinimumLevel { get; set; } = SystemConfiguration.DEFAULT_LOG_LEVEL;

        /// <summary>
        /// Maximum file size for logs in MB
        /// </summary>
        [Range(1, 100)]
        public int MaxFileSizeMB { get; set; } = SystemConfiguration.DEFAULT_LOG_MAX_FILE_SIZE_MB;

        /// <summary>
        /// Number of log files to retain
        /// </summary>
        [Range(1, 365)]
        public int RetainedFileCount { get; set; } = SystemConfiguration.DEFAULT_LOG_RETAINED_FILE_COUNT;

        /// <summary>
        /// Enable verbose device activity logging
        /// </summary>
        public bool EnableVerboseDeviceLogging { get; set; } = false;
    }
}