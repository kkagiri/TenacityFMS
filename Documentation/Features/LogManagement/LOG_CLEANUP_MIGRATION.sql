-- Migration: Add Log Cleanup Configuration to SystemConfigurations
-- Description: Adds configurable log retention days to system configuration
-- Date: 2025-11-20
-- Database: MySQL 5.5.6+

-- Insert log cleanup retention configuration
INSERT INTO `SystemConfigurations` (
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

-- Verify the insertion
SELECT * FROM `SystemConfigurations` WHERE `ConfigurationKey` = 'Logging.RetentionDays';
