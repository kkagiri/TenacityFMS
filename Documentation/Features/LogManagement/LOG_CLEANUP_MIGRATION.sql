-- Migration: Add Log Cleanup Configuration to SystemConfigurations
-- Description: Adds configurable log retention days to system configuration
-- Date: 2025-11-20
-- Database: MySQL 5.5.6+

-- Insert log cleanup retention configuration
INSERT IGNORE INTO `SystemConfigurations` (
    `ConfigurationKey`,
    `ConfigurationValue`,
    `Description`,
    `DataType`,
    `IsActive`,
    `IsEditable`,
    `Category`,
    `CreatedAt`,
    `UpdatedAt`,
    `CreatedBy`,
    `UpdatedBy`,
    `ValidationPattern`,
    `MinValue`,
    `MaxValue`,
    `DefaultValue`
)
VALUES (
    'Logging.RetentionDays',
    '30',
    'Number of days to retain log files before automatic cleanup',
    'Int',
    1,
    1,
    'Logging',
    UTC_TIMESTAMP(),
    UTC_TIMESTAMP(),
    'System',
    'System',
    NULL,
    1,
    365,
    '30'
);

-- Insert log cleanup auto-cleanup enabled configuration
INSERT IGNORE INTO `SystemConfigurations` (
    `ConfigurationKey`,
    `ConfigurationValue`,
    `Description`,
    `DataType`,
    `IsActive`,
    `IsEditable`,
    `Category`,
    `CreatedAt`,
    `UpdatedAt`,
    `CreatedBy`,
    `UpdatedBy`,
    `ValidationPattern`,
    `MinValue`,
    `MaxValue`,
    `DefaultValue`
)
VALUES (
    'Logging.AutoCleanupEnabled',
    'true',
    'Whether automatic log file cleanup is enabled',
    'Boolean',
    1,
    1,
    'Logging',
    UTC_TIMESTAMP(),
    UTC_TIMESTAMP(),
    'System',
    'System',
    NULL,
    NULL,
    NULL,
    'true'
);

-- Insert log cleanup hour configuration
INSERT IGNORE INTO `SystemConfigurations` (
    `ConfigurationKey`,
    `ConfigurationValue`,
    `Description`,
    `DataType`,
    `IsActive`,
    `IsEditable`,
    `Category`,
    `CreatedAt`,
    `UpdatedAt`,
    `CreatedBy`,
    `UpdatedBy`,
    `ValidationPattern`,
    `MinValue`,
    `MaxValue`,
    `DefaultValue`
)
VALUES (
    'Logging.CleanupHour',
    '2',
    'Hour of day (0-23) at which automatic log cleanup runs',
    'Int',
    1,
    1,
    'Logging',
    UTC_TIMESTAMP(),
    UTC_TIMESTAMP(),
    'System',
    'System',
    NULL,
    0,
    23,
    '2'
);

-- Verify the insertions
SELECT * FROM `SystemConfigurations` WHERE `ConfigurationKey` LIKE 'Logging.%' ORDER BY `ConfigurationKey`;
