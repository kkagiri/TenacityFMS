-- System Configuration Database Update Script
-- This script updates the systemconfigurations table to match the entity configuration
-- Execute each section separately if needed

-- ===================================================================
-- SECTION 1: Add missing columns (safe to rerun)
-- ===================================================================

-- Add MinValue column only when it is missing
SET @ddl = IF (
	EXISTS (
		SELECT 1
		FROM information_schema.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE()
		  AND TABLE_NAME = 'systemconfigurations'
		  AND COLUMN_NAME = 'MinValue'
	),
	'SELECT ''Column MinValue already exists''',
	'ALTER TABLE `systemconfigurations` ADD COLUMN `MinValue` DOUBLE NULL DEFAULT NULL'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add MaxValue column only when it is missing
SET @ddl = IF (
	EXISTS (
		SELECT 1
		FROM information_schema.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE()
		  AND TABLE_NAME = 'systemconfigurations'
		  AND COLUMN_NAME = 'MaxValue'
	),
	'SELECT ''Column MaxValue already exists''',
	'ALTER TABLE `systemconfigurations` ADD COLUMN `MaxValue` DOUBLE NULL DEFAULT NULL'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add DefaultValue column only when it is missing
SET @ddl = IF (
	EXISTS (
		SELECT 1
		FROM information_schema.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE()
		  AND TABLE_NAME = 'systemconfigurations'
		  AND COLUMN_NAME = 'DefaultValue'
	),
	'SELECT ''Column DefaultValue already exists''',
	'ALTER TABLE `systemconfigurations` ADD COLUMN `DefaultValue` VARCHAR(1000) NULL DEFAULT NULL COLLATE ''utf8mb4_unicode_ci'''
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ===================================================================
-- SECTION 2: Update existing columns to match entity configuration
-- ===================================================================

ALTER TABLE `systemconfigurations`
MODIFY COLUMN `ConfigurationKey` VARCHAR(191) NOT NULL COLLATE 'utf8mb4_unicode_ci',
MODIFY COLUMN `ValidationPattern` VARCHAR(191) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
MODIFY COLUMN `CreatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
MODIFY COLUMN `UpdatedAt` TIMESTAMP NOT NULL DEFAULT '0000-00-00 00:00:00';

-- ===================================================================
-- SECTION 3: Create indexes (safe to rerun)
-- ===================================================================

-- Create unique index for ConfigurationKey only when it is missing
SET @ddl = IF (
	EXISTS (
		SELECT 1
		FROM information_schema.STATISTICS
		WHERE TABLE_SCHEMA = DATABASE()
		  AND TABLE_NAME = 'systemconfigurations'
		  AND INDEX_NAME = 'IX_SystemConfigurations_ConfigurationKey'
	),
	'SELECT ''Index IX_SystemConfigurations_ConfigurationKey already exists''',
	'CREATE UNIQUE INDEX `IX_SystemConfigurations_ConfigurationKey` ON `systemconfigurations` (`ConfigurationKey`)'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create index for Category only when it is missing
SET @ddl = IF (
	EXISTS (
		SELECT 1
		FROM information_schema.STATISTICS
		WHERE TABLE_SCHEMA = DATABASE()
		  AND TABLE_NAME = 'systemconfigurations'
		  AND INDEX_NAME = 'IX_SystemConfigurations_Category'
	),
	'SELECT ''Index IX_SystemConfigurations_Category already exists''',
	'CREATE INDEX `IX_SystemConfigurations_Category` ON `systemconfigurations` (`Category`)'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create composite index for IsActive and ConfigurationKey only when it is missing
SET @ddl = IF (
	EXISTS (
		SELECT 1
		FROM information_schema.STATISTICS
		WHERE TABLE_SCHEMA = DATABASE()
		  AND TABLE_NAME = 'systemconfigurations'
		  AND INDEX_NAME = 'IX_SystemConfigurations_IsActive_ConfigurationKey'
	),
	'SELECT ''Index IX_SystemConfigurations_IsActive_ConfigurationKey already exists''',
	'CREATE INDEX `IX_SystemConfigurations_IsActive_ConfigurationKey` ON `systemconfigurations` (`IsActive`, `ConfigurationKey`)'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ===================================================================
-- SECTION 4: Synchronize code-backed system configurations
-- Audit source: compared code-used keys against gpsdata.systemconfigurations
-- on 2026-04-23 using MySQL MCP.
-- ===================================================================
INSERT INTO `systemconfigurations`
(`ConfigurationKey`, `ConfigurationValue`, `Description`, `DataType`, `Category`, `IsActive`, `IsEditable`, `ValidationPattern`, `MinValue`, `MaxValue`, `CreatedBy`, `DefaultValue`)
VALUES

('Notification.MaxRetryAttempts', '3', 'Maximum retry attempts for notifications', 'Int32', 'Notification', 1, 1, '^[0-9]+$', 0, 20, 'System', '3'),
('PTS.UploadStatus.PhysicalStockUpdateIntervalSeconds', '60', 'Minimum interval in seconds for applying averaged UploadStatus probe readings to tank physical stock', 'Int32', 'PTS', 1, 1, NULL, NULL, NULL, 'System', '60'),

('TankStock.FutureRecordsPolicy', 'WARN_RECONCILE', 'Policy for handling historical tank stock entries when future records exist: BLOCK, WARN_RECONCILE, WARN_RECALCULATE, ALLOW_RECALCULATE', 'String', 'TankStock', 1, 1, '^(BLOCK|WARN_RECONCILE|WARN_RECALCULATE|ALLOW_RECALCULATE)$', NULL, NULL, 'System', 'WARN_RECONCILE'),
('TankStock.ShowDetailedWarnings', 'true', 'Show detailed warnings when future tank stock records already exist', 'Boolean', 'TankStock', 1, 1, '^(true|false)$', NULL, NULL, 'System', 'true'),
('TankStock.MaxHistoricalDays', '400', 'Maximum historical tank stock backdating window in days', 'Int32', 'TankStock', 1, 1, '^[0-9]+$', 0, 3650, 'System', '400'),
('PTS.AutomatedFueling.CheckForDuplicateManualEntries', 'true', 'Check for duplicate manual entries before creating automated fueling records', 'Boolean', 'PTS.AutomatedFueling', 1, 1, '^(true|false)$', NULL, NULL, 'System', 'true'),
('PTS.AutomatedFueling.DiscrepancyAction', '1', 'Action when tank discrepancy exceeds threshold: 1=Alert, 2=Block, 3=AutoAdjust', 'Int32', 'PTS.AutomatedFueling', 1, 1, '^[1-3]$', 1, 3, 'System', '1'),
('PTS.AutomatedFueling.DuplicateVolumeTolerance', '0.01', 'Volume tolerance ratio for duplicate manual entry detection', 'Decimal', 'PTS.AutomatedFueling', 1, 1, '^(0(\\.[0-9]+)?|1(\\.0+)?)$', 0, 1, 'System', '0.01'),
('PTS.AutomatedFueling.EnableFuelCapacityValidation', 'true', 'Validate requested fuel volume against vehicle tank capacity during automated fueling', 'Boolean', 'PTS.AutomatedFueling', 1, 1, '^(true|false)$', NULL, NULL, 'System', 'true'),
('PTS.AutomatedFueling.EnableFuelRulesCheck', 'true', 'Require fuel rules validation before automated fueling is allowed', 'Boolean', 'PTS.AutomatedFueling', 1, 1, '^(true|false)$', NULL, NULL, 'System', 'true'),
('PTS.AutomatedFueling.EnableGPSFuelLevelCheck', 'true', 'Use GPS fuel level sensor data when validating automated fueling capacity', 'Boolean', 'PTS.AutomatedFueling', 1, 1, '^(true|false)$', NULL, NULL, 'System', 'true'),
('PTS.AutomatedFueling.ReconciliationFrequencyMinutes', '60', 'Frequency in minutes for automated tank reconciliation checks', 'Int32', 'PTS.AutomatedFueling', 1, 1, '^[1-9][0-9]*$', 1, 1440, 'System', '60'),
('PTS.AutomatedFueling.VolumeSourcePriority', '1', 'Primary tank volume source priority: 1=BookKeeping, 2=PTS Probe', 'Int32', 'PTS.AutomatedFueling', 1, 1, '^[1-2]$', 1, 2, 'System', '1'),
('PTS.OfflineReport.ThresholdSeconds', '60', 'Minimum PTS offline duration in seconds before the period is included in reports', 'Int32', 'PTS.OfflineReport', 1, 1, '^[1-9][0-9]*$', 1, 86400, 'System', '60'),
('IssueTracker.AutoMonitoring.DailyRunTimeLocal', '00:00', 'Daily local run time for issue auto-monitoring in HH:mm format', 'TimeSpan', 'IssueTracker.AutoMonitoring', 1, 1, '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$', NULL, NULL, 'System', '00:00'),
('AutoOpeningStock_Enabled', 'false', 'Enable the automated opening stock background service', 'Boolean', 'TankStock', 1, 1, '^(true|false)$', NULL, NULL, 'System', 'false')
ON DUPLICATE KEY UPDATE
`ConfigurationValue` = IF(`ConfigurationValue` IS NULL OR `ConfigurationValue` = '', VALUES(`ConfigurationValue`), `ConfigurationValue`),
`Description` = VALUES(`Description`),
`DataType` = VALUES(`DataType`),
`Category` = VALUES(`Category`),
`IsActive` = VALUES(`IsActive`),
`IsEditable` = VALUES(`IsEditable`),
`ValidationPattern` = VALUES(`ValidationPattern`),
`MinValue` = VALUES(`MinValue`),
`MaxValue` = VALUES(`MaxValue`),
`DefaultValue` = VALUES(`DefaultValue`),
`UpdatedBy` = 'System';
