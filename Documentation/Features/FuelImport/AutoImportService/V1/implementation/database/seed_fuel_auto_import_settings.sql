-- =============================================================
-- Seed: Fuel Auto-Import System Configuration entries
-- Table: systemconfigurations
-- Category: FuelAutoImport
-- MySQL 5.5 compatible
-- Run AFTER the systemconfigurations table exists.
--
-- Architecture: 2 keys only
--   FuelAutoImport.Enabled  → master toggle (Bool)
--   FuelAutoImport.Profiles → JSON array of per-profile settings
-- =============================================================

-- Clean up legacy individual config keys (safe if they don't exist)
DELETE FROM systemconfigurations WHERE ConfigurationKey IN (
    'FuelAutoImport.ScanPaths',
    'FuelAutoImport.IntervalMinutes',
    'FuelAutoImport.ScheduleTime',
    'FuelAutoImport.BatchSize',
    'FuelAutoImport.IncludeRetries',
    'FuelAutoImport.NotificationsEnabled',
    'FuelAutoImport.NotifyOnSuccess',
    'FuelAutoImport.NotifyOnFailure'
);

INSERT INTO systemconfigurations
  (ConfigurationKey, ConfigurationValue, Description, DataType, Category, IsActive, IsEditable, DefaultValue, CreatedAt, UpdatedAt)
SELECT 'FuelAutoImport.Enabled', 'true',
       'Master switch to enable/disable fuel auto-import',
       'Bool', 'FuelAutoImport', 1, 1, 'true', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM systemconfigurations WHERE ConfigurationKey = 'FuelAutoImport.Enabled');

INSERT INTO systemconfigurations
  (ConfigurationKey, ConfigurationValue, Description, DataType, Category, IsActive, IsEditable, DefaultValue, CreatedAt, UpdatedAt)
SELECT 'FuelAutoImport.Profiles',
       '[{"id":"heavy-report","name":"Heavy Report","scanPath":"Z:\\\\Heavy Report","enabled":true,"intervalMinutes":0,"scheduleTime":"","batchSize":50,"includeRetries":true,"notificationsEnabled":false,"notifyOnSuccess":false,"notifyOnFailure":true},{"id":"truck-report","name":"Truck Report","scanPath":"Z:\\\\Truck Report","enabled":true,"intervalMinutes":0,"scheduleTime":"","batchSize":50,"includeRetries":true,"notificationsEnabled":false,"notifyOnSuccess":false,"notifyOnFailure":true}]',
       'JSON array of import profiles with independent settings per scan path',
       'Json', 'FuelAutoImport', 1, 1, '[]', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM systemconfigurations WHERE ConfigurationKey = 'FuelAutoImport.Profiles');
