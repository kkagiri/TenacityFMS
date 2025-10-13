using System;

namespace FMS.Application.Configuration
{
    //Cursor on changes to code
    /// <summary>
    /// System-wide configuration defaults for FMS
    /// These values are used as fallbacks when configuration is not found in database or settings files
    /// </summary>
    public static class SystemConfiguration
    {
        #region Device Activity Monitoring
        /// <summary>
        /// Default WebSocket timeout in seconds for device activity monitoring
        /// </summary>
        public const int DEFAULT_WEBSOCKET_TIMEOUT_SECONDS = 30;

        /// <summary>
        /// Default HTTP timeout in seconds for device activity monitoring
        /// </summary>
        public const int DEFAULT_HTTP_TIMEOUT_SECONDS = 60;

        /// <summary>
        /// Default interval in seconds for checking device activity
        /// </summary>
        public const int DEFAULT_DEVICE_ACTIVITY_CHECK_INTERVAL_SECONDS = 10;

        /// <summary>
        /// Default interval in minutes for Redis cleanup operations
        /// </summary>
        public const int DEFAULT_REDIS_CLEANUP_INTERVAL_MINUTES = 5;

        /// <summary>
        /// Default duration in minutes for caching configuration values
        /// </summary>
        public const int DEFAULT_CONFIG_CACHE_DURATION_MINUTES = 5;
        #endregion

        #region Connection Thresholds
        /// <summary>
        /// Default threshold in minutes for considering a WebSocket connection stale during startup cleanup
        /// </summary>
        public const int DEFAULT_WS_STARTUP_STALE_THRESHOLD_MINUTES = 10;

        /// <summary>
        /// Default threshold in minutes for considering an HTTP connection stale during startup cleanup
        /// </summary>
        public const int DEFAULT_HTTP_STARTUP_STALE_THRESHOLD_MINUTES = 20;

        /// <summary>
        /// Default multiplier for cleanup timeout (connection_timeout * this_multiplier)
        /// </summary>
        public const int DEFAULT_CLEANUP_TIMEOUT_MULTIPLIER = 2;
        #endregion

        #region Command Execution
        /// <summary>
        /// Default timeout in seconds for PTS command execution
        /// </summary>
        public const int DEFAULT_COMMAND_TIMEOUT_SECONDS = 15;

        /// <summary>
        /// Default timeout in minutes for considering a device connection stale for command execution
        /// </summary>
        public const int DEFAULT_COMMAND_STALE_THRESHOLD_MINUTES = 5;
        #endregion

        #region Work Schedule
        /// <summary>
        /// Default start of work time (24-hour format)
        /// </summary>
        public static readonly TimeSpan DEFAULT_WORK_START_TIME = new TimeSpan(6, 0, 0); // 6:00 AM

        /// <summary>
        /// Default end of work time (24-hour format)
        /// </summary>
        public static readonly TimeSpan DEFAULT_WORK_END_TIME = new TimeSpan(22, 0, 0); // 10:00 PM

        /// <summary>
        /// Default timezone for work schedule
        /// </summary>
        public const string DEFAULT_TIMEZONE = "UTC";
        #endregion

        #region Tank Stock Configuration
        /// <summary>
        /// Default policy for handling historical tank stock entries when future records exist
        /// Values: "BLOCK", "WARN_RECONCILE", "WARN_RECALCULATE", "ALLOW_RECALCULATE"
        /// </summary>
        public const string DEFAULT_TANK_STOCK_FUTURE_RECORDS_POLICY = "WARN_RECONCILE";

        /// <summary>
        /// Default setting for showing detailed warnings when future records exist
        /// </summary>
        public const bool DEFAULT_TANK_STOCK_SHOW_DETAILED_WARNINGS = true;

        /// <summary>
        /// Default maximum number of days in the past allowed for historical entries
        /// </summary>
        public const int DEFAULT_TANK_STOCK_MAX_HISTORICAL_DAYS = 60;
        #endregion

        #region Redis Configuration Keys
        /// <summary>
        /// Redis key prefix for WebSocket connections
        /// </summary>
        public const string REDIS_WEBSOCKET_CONNECTIONS_KEY = "device:websocket-connections";

        /// <summary>
        /// Redis key prefix for HTTP connections
        /// </summary>
        public const string REDIS_HTTP_CONNECTIONS_KEY = "device:http-connections";

        /// <summary>
        /// Redis key prefix for device ID mappings
        /// </summary>
        public const string REDIS_DEVICE_ID_MAPPING_KEY_PREFIX = "device-id-mapping:";
        #endregion

        #region Logging
        /// <summary>
        /// Default log level for system operations
        /// </summary>
        public const string DEFAULT_LOG_LEVEL = "Information";

        /// <summary>
        /// Default maximum file size for logs in MB
        /// </summary>
        public const int DEFAULT_LOG_MAX_FILE_SIZE_MB = 10;

        /// <summary>
        /// Default number of log files to retain
        /// </summary>
        public const int DEFAULT_LOG_RETAINED_FILE_COUNT = 31;
        #endregion

        #region Database Configuration Keys
        /// <summary>
        /// Configuration key for WebSocket timeout in database
        /// </summary>
        public const string DB_CONFIG_WEBSOCKET_TIMEOUT_KEY = "System.WebSocketTimeout";

        /// <summary>
        /// Configuration key for HTTP timeout in database
        /// </summary>
        public const string DB_CONFIG_HTTP_TIMEOUT_KEY = "System.HttpTimeout";

        /// <summary>
        /// Configuration key for device activity check interval in database
        /// </summary>
        public const string DB_CONFIG_DEVICE_ACTIVITY_INTERVAL_KEY = "System.DeviceActivityCheckInterval";

        /// <summary>
        /// Configuration key for work start time in database
        /// </summary>
        public const string DB_CONFIG_WORK_START_TIME_KEY = "System.WorkStartTime";

        /// <summary>
        /// Configuration key for work end time in database
        /// </summary>
        public const string DB_CONFIG_WORK_END_TIME_KEY = "System.WorkEndTime";

        /// <summary>
        /// Configuration key for timezone in database
        /// </summary>
        public const string DB_CONFIG_TIMEZONE_KEY = "System.Timezone";

        /// <summary>
        /// Configuration key for tank stock future records policy in database
        /// </summary>
        public const string DB_CONFIG_TANK_STOCK_FUTURE_RECORDS_POLICY_KEY = "TankStock.FutureRecordsPolicy";

        /// <summary>
        /// Configuration key for tank stock detailed warnings setting in database
        /// </summary>
        public const string DB_CONFIG_TANK_STOCK_SHOW_DETAILED_WARNINGS_KEY = "TankStock.ShowDetailedWarnings";

        /// <summary>
        /// Configuration key for tank stock maximum historical days in database
        /// </summary>
        public const string DB_CONFIG_TANK_STOCK_MAX_HISTORICAL_DAYS_KEY = "TankStock.MaxHistoricalDays";
        #endregion
    }
}