/**
 * File: SystemConfiguration.cs
 * Purpose: Defines system configuration keys and default values used across the application.
 * Dependencies: System
 * Last Modified: 2026-02-04
 */
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
        public const int DEFAULT_TANK_STOCK_MAX_HISTORICAL_DAYS = 400;
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

        /// <summary>
        /// Configuration key to enable/disable IssueMonitoringService auto-checkups.
        /// </summary>
        public const string DB_CONFIG_ISSUE_MONITORING_ENABLED_KEY = "IssueTracker.AutoMonitoring.Enabled";

        /// <summary>
        /// Configuration key for default vehicle GPS offline threshold in minutes
        /// when template OfflineThresholdMinutes is not set.
        /// </summary>
        public const string DB_CONFIG_ISSUE_MONITORING_VEHICLE_OFFLINE_THRESHOLD_MINUTES_KEY = "IssueTracker.AutoMonitoring.VehicleOfflineThresholdMinutes";

        /// <summary>
        /// Configuration key for default PTS offline threshold in minutes
        /// when template OfflineThresholdMinutes is not set.
        /// </summary>
        public const string DB_CONFIG_ISSUE_MONITORING_PTS_OFFLINE_THRESHOLD_MINUTES_KEY = "IssueTracker.AutoMonitoring.PTSOfflineThresholdMinutes";

        /// <summary>
        /// Configuration key for fuel-while-offline monitoring lookback window in minutes.
        /// </summary>
        public const string DB_CONFIG_ISSUE_MONITORING_FUEL_ACTIVITY_WINDOW_MINUTES_KEY = "IssueTracker.AutoMonitoring.FuelActivityWindowMinutes";

        /// <summary>
        /// Configuration key for default IssueCategoryId used by auto-created issues.
        /// </summary>
        public const string DB_CONFIG_ISSUE_MONITORING_DEFAULT_ISSUE_CATEGORY_ID_KEY = "IssueTracker.AutoMonitoring.DefaultIssueCategoryId";

        /// <summary>
        /// Configuration key for daily local run time (HH:mm) of IssueMonitoringService.
        /// Example: "00:00" for midnight.
        /// </summary>
        public const string DB_CONFIG_ISSUE_MONITORING_DAILY_RUN_TIME_LOCAL_KEY = "IssueTracker.AutoMonitoring.DailyRunTimeLocal";
        #endregion

        #region PTS Automated Fueling Configuration Keys
        /// <summary>
        /// Configuration key for whether to update tank current volume from book keeping (ledger)
        /// </summary>
        public const string DB_CONFIG_PTS_UPDATE_TANK_VOLUME_FROM_BOOKKEEPING_KEY = "PTS.AutomatedFueling.UpdateTankVolumeFromBookKeeping";

        /// <summary>
        /// Configuration key for whether to use PTS probe readings for tank volume
        /// </summary>
        public const string DB_CONFIG_PTS_USE_PTS_PROBE_READINGS_KEY = "PTS.AutomatedFueling.UsePtsProbeReadings";

        /// <summary>
        /// Configuration key for upload status physical stock update interval in seconds
        /// </summary>
        public const string DB_CONFIG_PTS_UPLOADSTATUS_PHYSICAL_STOCK_UPDATE_INTERVAL_SECONDS_KEY = "PTS.UploadStatus.PhysicalStockUpdateIntervalSeconds";

        /// <summary>
        /// Configuration key for how often (seconds) to persist tank measurement records from UploadStatus probe data.
        /// Prevents flooding the tankmeasurements table since UploadStatus arrives every 10-30 seconds.
        /// Default: 300 seconds (5 minutes)
        /// </summary>
        public const string DB_CONFIG_PTS_UPLOADSTATUS_MEASUREMENT_PERSIST_INTERVAL_SECONDS_KEY = "PTS.UploadStatus.MeasurementPersistIntervalSeconds";

        /// <summary>
        /// Configuration key prefix for mapping a physical tank to a PTS probe/tank number
        /// Final key format: PTS.TankBinding.ProbeNumber.{TankId}
        /// </summary>
        public const string DB_CONFIG_PTS_TANK_BINDING_PROBE_NUMBER_PREFIX = "PTS.TankBinding.ProbeNumber.";

        /// <summary>
        /// Configuration key for volume source priority: 1=BookKeeping, 2=PTS Probe
        /// </summary>
        public const string DB_CONFIG_PTS_VOLUME_SOURCE_PRIORITY_KEY = "PTS.AutomatedFueling.VolumeSourcePriority";

        /// <summary>
        /// Configuration key for whether to automatically create ledger entries for pump transactions
        /// </summary>
        public const string DB_CONFIG_PTS_AUTO_CREATE_LEDGER_ENTRIES_KEY = "PTS.AutomatedFueling.AutoCreateLedgerEntries";

        /// <summary>
        /// Configuration key for whether to check for duplicate manual entries
        /// </summary>
        public const string DB_CONFIG_PTS_CHECK_FOR_DUPLICATE_MANUAL_ENTRIES_KEY = "PTS.AutomatedFueling.CheckForDuplicateManualEntries";

        /// <summary>
        /// Configuration key for volume tolerance percentage for duplicate detection (e.g., 0.01 = 1%)
        /// </summary>
        public const string DB_CONFIG_PTS_DUPLICATE_VOLUME_TOLERANCE_KEY = "PTS.AutomatedFueling.DuplicateVolumeTolerance";

        /// <summary>
        /// Configuration key for whether to reconcile tank volumes automatically
        /// </summary>
        public const string DB_CONFIG_PTS_AUTO_RECONCILE_TANK_VOLUMES_KEY = "PTS.AutomatedFueling.AutoReconcileTankVolumes";

        /// <summary>
        /// Configuration key for reconciliation frequency in minutes
        /// </summary>
        public const string DB_CONFIG_PTS_RECONCILIATION_FREQUENCY_MINUTES_KEY = "PTS.AutomatedFueling.ReconciliationFrequencyMinutes";

        /// <summary>
        /// Configuration key for maximum allowed discrepancy between book keeping and probe readings (liters)
        /// </summary>
        public const string DB_CONFIG_PTS_MAX_VOLUME_DISCREPANCY_THRESHOLD_KEY = "PTS.AutomatedFueling.MaxVolumeDiscrepancyThreshold";

        /// <summary>
        /// Configuration key for action to take when discrepancy exceeds threshold: 1=Alert, 2=Block, 3=AutoAdjust
        /// </summary>
        public const string DB_CONFIG_PTS_DISCREPANCY_ACTION_KEY = "PTS.AutomatedFueling.DiscrepancyAction";

        /// <summary>
        /// Configuration key for whether to check if vehicle has fueling rules before allowing fueling (mobile app)
        /// </summary>
        public const string DB_CONFIG_PTS_ENABLE_FUEL_RULES_CHECK_KEY = "PTS.AutomatedFueling.EnableFuelRulesCheck";

        /// <summary>
        /// Configuration key for whether to validate fuel volume against vehicle tank capacity (mobile app)
        /// </summary>
        public const string DB_CONFIG_PTS_ENABLE_FUEL_CAPACITY_VALIDATION_KEY = "PTS.AutomatedFueling.EnableFuelCapacityValidation";

        /// <summary>
        /// Configuration key for whether to use GPS fuel level sensor to calculate remaining tank capacity (mobile app)
        /// </summary>
        public const string DB_CONFIG_PTS_ENABLE_GPS_FUEL_LEVEL_CHECK_KEY = "PTS.AutomatedFueling.EnableGPSFuelLevelCheck";
        #endregion

        #region PTS Offline Report Configuration Keys
        /// <summary>
        /// Configuration key for minimum offline duration threshold in seconds for reporting
        /// </summary>
        public const string DB_CONFIG_PTS_OFFLINE_THRESHOLD_SECONDS_KEY = "PTS.OfflineReport.ThresholdSeconds";
        #endregion

        #region PTS Offline Report Default Values
        /// <summary>
        /// Default minimum offline duration threshold in seconds (60 = 1 minute)
        /// Offline periods shorter than this are not counted in reports
        /// </summary>
        public const int DEFAULT_PTS_OFFLINE_THRESHOLD_SECONDS = 60;
        #endregion

        #region Issue Monitoring Default Values
        public const bool DEFAULT_ISSUE_MONITORING_ENABLED = true;
        public const int DEFAULT_ISSUE_MONITORING_VEHICLE_OFFLINE_THRESHOLD_MINUTES = 60;
        public const int DEFAULT_ISSUE_MONITORING_PTS_OFFLINE_THRESHOLD_MINUTES = 30;
        public const int DEFAULT_ISSUE_MONITORING_FUEL_ACTIVITY_WINDOW_MINUTES = 4320;
        public const int DEFAULT_ISSUE_MONITORING_DEFAULT_ISSUE_CATEGORY_ID = 1;
        public const string DEFAULT_ISSUE_MONITORING_DAILY_RUN_TIME_LOCAL = "00:00";
        #endregion

        #region PTS Automated Fueling Default Values
        public const bool DEFAULT_PTS_UPDATE_TANK_VOLUME_FROM_BOOKKEEPING = true;
        public const bool DEFAULT_PTS_USE_PTS_PROBE_READINGS = false;
        public const int DEFAULT_PTS_UPLOADSTATUS_PHYSICAL_STOCK_UPDATE_INTERVAL_SECONDS = 60;
        public const int DEFAULT_PTS_UPLOADSTATUS_MEASUREMENT_PERSIST_INTERVAL_SECONDS = 300; // 5 minutes
        public const int DEFAULT_PTS_VOLUME_SOURCE_PRIORITY = 1; // BookKeeping
        public const bool DEFAULT_PTS_AUTO_CREATE_LEDGER_ENTRIES = true;
        public const bool DEFAULT_PTS_CHECK_FOR_DUPLICATE_MANUAL_ENTRIES = true;
        public const decimal DEFAULT_PTS_DUPLICATE_VOLUME_TOLERANCE = 0.01m; // 1%
        public const bool DEFAULT_PTS_AUTO_RECONCILE_TANK_VOLUMES = false;
        public const int DEFAULT_PTS_RECONCILIATION_FREQUENCY_MINUTES = 60;
        public const decimal DEFAULT_PTS_MAX_VOLUME_DISCREPANCY_THRESHOLD = 10.0m; // liters
        public const int DEFAULT_PTS_DISCREPANCY_ACTION = 1; // Alert
        public const bool DEFAULT_PTS_ENABLE_FUEL_RULES_CHECK = true;
        public const bool DEFAULT_PTS_ENABLE_FUEL_CAPACITY_VALIDATION = true;
        public const bool DEFAULT_PTS_ENABLE_GPS_FUEL_LEVEL_CHECK = true;
        #endregion

        #region In-Tank Delivery Auto-Detection Configuration Keys
        /// <summary>
        /// Whether ITD auto-detection alerts are enabled
        /// </summary>
        public const string DB_CONFIG_ITD_ALERTS_ENABLED_KEY = "ITD.AutoDetection.AlertsEnabled";

        /// <summary>
        /// Minimum absolute volume change (liters) to trigger an alert
        /// </summary>
        public const string DB_CONFIG_ITD_MIN_VOLUME_THRESHOLD_KEY = "ITD.AutoDetection.MinVolumeThreshold";

        /// <summary>
        /// Whether to automatically create a TankVolumeHistory ledger entry for detected ITDs
        /// </summary>
        public const string DB_CONFIG_ITD_AUTO_CREATE_LEDGER_ENTRY_KEY = "ITD.AutoDetection.AutoCreateLedgerEntry";

        /// <summary>
        /// Whether to attempt matching detected ITDs with manual delivery entries
        /// </summary>
        public const string DB_CONFIG_ITD_AUTO_MATCH_MANUAL_DELIVERY_KEY = "ITD.AutoDetection.AutoMatchManualDelivery";

        /// <summary>
        /// Volume tolerance percentage for matching ITDs with manual deliveries (e.g., 0.10 = 10%)
        /// </summary>
        public const string DB_CONFIG_ITD_MATCH_VOLUME_TOLERANCE_KEY = "ITD.AutoDetection.MatchVolumeTolerance";

        /// <summary>
        /// Time window in hours for matching ITDs with manual deliveries
        /// </summary>
        public const string DB_CONFIG_ITD_MATCH_TIME_WINDOW_HOURS_KEY = "ITD.AutoDetection.MatchTimeWindowHours";

        /// <summary>
        /// Alert priority for ITD notifications: Low, Medium, High, Critical
        /// </summary>
        public const string DB_CONFIG_ITD_ALERT_PRIORITY_KEY = "ITD.AutoDetection.AlertPriority";

        /// <summary>
        /// Auto-resolve alert after N minutes (0 = no auto-resolve)
        /// </summary>
        public const string DB_CONFIG_ITD_ALERT_AUTO_RESOLVE_MINUTES_KEY = "ITD.AutoDetection.AlertAutoResolveMinutes";
        #endregion

        #region In-Tank Delivery Auto-Detection Default Values
        public const bool DEFAULT_ITD_ALERTS_ENABLED = true;
        public const decimal DEFAULT_ITD_MIN_VOLUME_THRESHOLD = 50.0m; // liters
        public const bool DEFAULT_ITD_AUTO_CREATE_LEDGER_ENTRY = true;
        public const bool DEFAULT_ITD_AUTO_MATCH_MANUAL_DELIVERY = true;
        public const decimal DEFAULT_ITD_MATCH_VOLUME_TOLERANCE = 0.10m; // 10%
        public const int DEFAULT_ITD_MATCH_TIME_WINDOW_HOURS = 24;
        public const string DEFAULT_ITD_ALERT_PRIORITY = "Medium";
        public const int DEFAULT_ITD_ALERT_AUTO_RESOLVE_MINUTES = 0; // No auto-resolve
        #endregion

        #region Tank Measurement Configuration Keys
        /// <summary>
        /// How many days of tank measurement history to retain per tank (0 = no retention cleanup)
        /// </summary>
        public const string DB_CONFIG_TANK_MEASUREMENT_RETENTION_DAYS_KEY = "TankMeasurement.RetentionDays";

        /// <summary>
        /// Interval (seconds) at which WebClient broadcasts latest tank measurements over SignalR
        /// </summary>
        public const string DB_CONFIG_TANK_MEASUREMENT_SIGNALR_PUSH_INTERVAL_SECONDS_KEY = "TankMeasurement.SignalRPushIntervalSeconds";
        #endregion

        #region Tank Measurement Default Values
        public const int DEFAULT_TANK_MEASUREMENT_RETENTION_DAYS = 30;
        public const int DEFAULT_TANK_MEASUREMENT_SIGNALR_PUSH_INTERVAL_SECONDS = 10;
        #endregion
    }
}
