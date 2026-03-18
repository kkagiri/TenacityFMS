-- File: mysql-phase5-trip-management-reconciliation-settings.sql
-- Purpose: Seeds VehicleTrips reconciliation background-job SystemConfiguration keys.
-- Compatibility: MySQL 5.5 / 5.6
-- Dependencies: systemconfigurations table with a unique index on ConfigurationKey.
-- Last Modified: 2026-03-14

INSERT INTO `systemconfigurations`
(
    `ConfigurationKey`,
    `ConfigurationValue`,
    `Description`,
    `DataType`,
    `Category`,
    `IsActive`,
    `IsEditable`,
    `CreatedBy`,
    `UpdatedBy`,
    `ValidationPattern`,
    `DefaultValue`,
    `CreatedAt`,
    `UpdatedAt`
)
VALUES
(
    'VehicleTrips.Reconciliation.Enabled',
    'true',
    'Enable or disable the nightly vehicle trip reconciliation background service.',
    'Boolean',
    'VehicleTrips',
    1,
    1,
    'System',
    'System',
    '^(true|false|1|0)$',
    'true',
    NOW(),
    NOW()
),
(
    'VehicleTrips.Reconciliation.DailyRunTimeLocal',
    '00:30',
    'Local daily run time for the vehicle trip reconciliation background service in HH:mm or HH:mm:ss format.',
    'String',
    'VehicleTrips',
    1,
    1,
    'System',
    'System',
    '^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$',
    '00:30',
    NOW(),
    NOW()
),
(
    'VehicleTrips.Reconciliation.LookbackDays',
    '1',
    'Number of local days to look back when the nightly vehicle trip reconciliation background service selects persisted trip groups.',
    'Int32',
    'VehicleTrips',
    1,
    1,
    'System',
    'System',
    '^[0-9]+$',
    '1',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    `ConfigurationValue` = VALUES(`ConfigurationValue`),
    `Description` = VALUES(`Description`),
    `DataType` = VALUES(`DataType`),
    `Category` = VALUES(`Category`),
    `IsActive` = VALUES(`IsActive`),
    `IsEditable` = VALUES(`IsEditable`),
    `UpdatedBy` = VALUES(`UpdatedBy`),
    `ValidationPattern` = VALUES(`ValidationPattern`),
    `DefaultValue` = VALUES(`DefaultValue`),
    `UpdatedAt` = VALUES(`UpdatedAt`);