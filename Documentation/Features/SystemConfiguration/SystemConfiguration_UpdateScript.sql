-- System Configuration Database Update Script
-- This script updates the systemconfigurations table to match the entity configuration
-- Execute each section separately if needed

-- ===================================================================
-- SECTION 1: Add missing columns (Execute if columns don't exist)
-- ===================================================================

-- Add MinValue column (ignore error if exists)
ALTER TABLE `systemconfigurations` ADD COLUMN `MinValue` DOUBLE NULL DEFAULT NULL;

-- Add MaxValue column (ignore error if exists)
ALTER TABLE `systemconfigurations` ADD COLUMN `MaxValue` DOUBLE NULL DEFAULT NULL;

-- Add DefaultValue column (ignore error if exists)
ALTER TABLE `systemconfigurations` ADD COLUMN `DefaultValue` VARCHAR(1000) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci';

-- ===================================================================
-- SECTION 2: Update existing columns to match entity configuration
-- ===================================================================

ALTER TABLE `systemconfigurations`
MODIFY COLUMN `ConfigurationKey` VARCHAR(191) NOT NULL COLLATE 'utf8mb4_unicode_ci',
MODIFY COLUMN `ValidationPattern` VARCHAR(191) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
MODIFY COLUMN `CreatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
MODIFY COLUMN `UpdatedAt` TIMESTAMP NOT NULL DEFAULT '0000-00-00 00:00:00';

-- ===================================================================
-- SECTION 3: Create indexes (ignore errors if they exist)
-- ===================================================================

-- Create unique index for ConfigurationKey
CREATE UNIQUE INDEX `IX_SystemConfigurations_ConfigurationKey` ON `systemconfigurations` (`ConfigurationKey`);

-- Create index for Category
CREATE INDEX `IX_SystemConfigurations_Category` ON `systemconfigurations` (`Category`);

-- Create composite index for IsActive and ConfigurationKey
CREATE INDEX `IX_SystemConfigurations_IsActive_ConfigurationKey` ON `systemconfigurations` (`IsActive`, `ConfigurationKey`);

-- ===================================================================
-- SECTION 4: Insert default system configurations
-- ===================================================================
INSERT IGNORE INTO `systemconfigurations`
(`ConfigurationKey`, `ConfigurationValue`, `Description`, `DataType`, `Category`, `IsActive`, `IsEditable`, `CreatedBy`, `DefaultValue`)
VALUES

('Notification.MaxRetryAttempts', '3', 'Maximum retry attempts for notifications', 'Int32', 'Notification', 1, 1, 'System', '3'),
('PTS.UploadStatus.PhysicalStockUpdateIntervalSeconds', '60', 'Minimum interval in seconds for applying averaged UploadStatus probe readings to tank physical stock', 'Int32', 'PTS', 1, 1, 'System', '60');
