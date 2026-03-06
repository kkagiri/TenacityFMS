-- ======================================
-- SystemConfigurations Table Creation
-- This table stores system-wide configuration settings that override defaults and appsettings.json values
-- ======================================

-- Create SystemConfigurations table
CREATE TABLE IF NOT EXISTS `SystemConfigurations` (
    `Id` INT(11) NOT NULL AUTO_INCREMENT,
    `ConfigurationKey` VARCHAR(255) NOT NULL,
    `ConfigurationValue` VARCHAR(1000) NOT NULL,
    `Description` VARCHAR(500) NULL,
    `DataType` VARCHAR(50) NULL,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    `IsEditable` TINYINT(1) NOT NULL DEFAULT 1,
    `Category` VARCHAR(100) NULL,
    `CreatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `CreatedBy` VARCHAR(100) NULL,
    `UpdatedBy` VARCHAR(100) NULL,
    `ValidationPattern` VARCHAR(255) NULL,
    `MinValue` DOUBLE NULL,
    `MaxValue` DOUBLE NULL,
    `DefaultValue` VARCHAR(1000) NULL,
    PRIMARY KEY (`Id`),
    UNIQUE KEY `IX_SystemConfigurations_ConfigurationKey` (`ConfigurationKey`),
    KEY `IX_SystemConfigurations_Category` (`Category`),
    KEY `IX_SystemConfigurations_IsActive_ConfigurationKey` (`IsActive`, `ConfigurationKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial system configuration values
INSERT INTO `SystemConfigurations` (
    `ConfigurationKey`,
    `ConfigurationValue`,
    `Description`,
    `DataType`,
    `Category`,
    `IsActive`,
    `IsEditable`,
    `ValidationPattern`,
    `MinValue`,
    `MaxValue`,
    `DefaultValue`,
    `CreatedBy`
) VALUES

-- Device Activity Monitoring Configuration
('System.WebSocketTimeout', '30', 'WebSocket timeout in seconds for device activity monitoring', 'Int', 'DeviceActivity', 1, 1, '^[1-9][0-9]*$', 10, 300, '30', 'SYSTEM'),
('System.HttpTimeout', '60', 'HTTP timeout in seconds for device activity monitoring', 'Int', 'DeviceActivity', 1, 1, '^[1-9][0-9]*$', 30, 600, '60', 'SYSTEM'),
('System.DeviceActivityCheckInterval', '10', 'Interval in seconds for checking device activity', 'Int', 'DeviceActivity', 1, 1, '^[1-9][0-9]*$', 5, 60, '10', 'SYSTEM'),

-- Work Schedule Configuration
('System.WorkStartTime', '06:00', 'Start of work time in HH:mm format (24-hour)', 'TimeSpan', 'WorkSchedule', 1, 1, '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$', NULL, NULL, '06:00', 'SYSTEM'),
('System.WorkEndTime', '22:00', 'End of work time in HH:mm format (24-hour)', 'TimeSpan', 'WorkSchedule', 1, 1, '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$', NULL, NULL, '22:00', 'SYSTEM'),
('System.Timezone', 'UTC', 'Timezone for work schedule (e.g., UTC, America/New_York)', 'String', 'WorkSchedule', 1, 1, NULL, NULL, NULL, 'UTC', 'SYSTEM'),

-- Command Execution Configuration
('System.CommandTimeout', '15', 'Timeout in seconds for PTS command execution', 'Int', 'CommandExecution', 1, 1, '^[1-9][0-9]*$', 5, 120, '15', 'SYSTEM'),
('System.StaleConnectionThreshold', '5', 'Threshold in minutes for considering a device connection stale for command execution', 'Int', 'CommandExecution', 1, 1, '^[1-9][0-9]*$', 1, 30, '5', 'SYSTEM'),

-- Maintenance Configuration
('System.RedisCleanupInterval', '5', 'Interval in minutes for Redis cleanup operations', 'Int', 'Maintenance', 1, 1, '^[1-9][0-9]*$', 1, 60, '5', 'SYSTEM'),
('System.EnableAutomaticCleanup', 'true', 'Enable automatic cleanup of stale connections', 'Bool', 'Maintenance', 1, 1, '^(true|false)$', NULL, NULL, 'true', 'SYSTEM'),
('System.EnablePerformanceLogging', 'false', 'Enable detailed performance logging', 'Bool', 'Maintenance', 1, 1, '^(true|false)$', NULL, NULL, 'false', 'SYSTEM'),

-- Logging Configuration
('System.LogMinimumLevel', 'Information', 'Minimum log level for system operations', 'String', 'Logging', 1, 1, '^(Trace|Debug|Information|Warning|Error|Critical)$', NULL, NULL, 'Information', 'SYSTEM'),
('System.LogMaxFileSizeMB', '10', 'Maximum file size for logs in MB', 'Int', 'Logging', 1, 1, '^[1-9][0-9]*$', 1, 100, '10', 'SYSTEM'),
('System.LogRetainedFileCount', '31', 'Number of log files to retain', 'Int', 'Logging', 1, 1, '^[1-9][0-9]*$', 1, 365, '31', 'SYSTEM'),
('System.EnableVerboseDeviceLogging', 'false', 'Enable verbose device activity logging', 'Bool', 'Logging', 1, 1, '^(true|false)$', NULL, NULL, 'false', 'SYSTEM'),

-- Connection Threshold Configuration
('System.WebSocketStartupStaleThreshold', '10', 'Threshold in minutes for considering a WebSocket connection stale during startup cleanup', 'Int', 'ConnectionThresholds', 1, 1, '^[1-9][0-9]*$', 5, 60, '10', 'SYSTEM'),
('System.HttpStartupStaleThreshold', '20', 'Threshold in minutes for considering an HTTP connection stale during startup cleanup', 'Int', 'ConnectionThresholds', 1, 1, '^[1-9][0-9]*$', 10, 120, '20', 'SYSTEM'),
('System.CleanupTimeoutMultiplier', '2', 'Multiplier for cleanup timeout (connection_timeout * this_multiplier)', 'Int', 'ConnectionThresholds', 1, 1, '^[1-9]$', 1, 5, '2', 'SYSTEM')

ON DUPLICATE KEY UPDATE
    `ConfigurationValue` = VALUES(`ConfigurationValue`),
    `Description` = VALUES(`Description`),
    `DataType` = VALUES(`DataType`),
    `Category` = VALUES(`Category`),
    `UpdatedAt` = CURRENT_TIMESTAMP,
    `UpdatedBy` = 'SYSTEM';