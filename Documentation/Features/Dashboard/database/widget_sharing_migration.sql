-- ================================================================
-- Dashboard Widget Sharing Feature Migration
-- Date: 2025-10-14
-- Description: Add widget sharing capabilities
-- ================================================================

USE `gpsdata`;

-- Add sharing columns to dashboard_widget_instances table
ALTER TABLE `dashboard_widget_instances`
ADD COLUMN `IsShared` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'True if this widget was shared from another user',
ADD COLUMN `SharedFromUserId` VARCHAR(450) NULL COMMENT 'Original owner user ID (null if not shared)',
ADD COLUMN `SharedFromWidgetId` INT NULL COMMENT 'Original widget instance ID (null if not shared)',
ADD COLUMN `CanEdit` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Can edit configuration (always true for shared widgets)',
ADD COLUMN `CanDelete` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Can delete widget (false for shared widgets)',
ADD COLUMN `SharedAt` DATETIME NULL COMMENT 'When this widget was shared to this user';

-- Add foreign key for SharedFromWidgetId (self-referencing)
ALTER TABLE `dashboard_widget_instances`
ADD CONSTRAINT `FK_DashboardWidgetInstances_SharedFrom`
    FOREIGN KEY (`SharedFromWidgetId`)
    REFERENCES `dashboard_widget_instances` (`Id`)
    ON DELETE SET NULL;

-- Add foreign key for SharedFromUserId
ALTER TABLE `dashboard_widget_instances`
ADD CONSTRAINT `FK_DashboardWidgetInstances_SharedFromUser`
    FOREIGN KEY (`SharedFromUserId`)
    REFERENCES `aspnetusers` (`Id`)
    ON DELETE SET NULL;

-- Add index for performance on shared widget queries
CREATE INDEX `IDX_DashboardWidgetInstances_IsShared`
ON `dashboard_widget_instances` (`IsShared`);

CREATE INDEX `IDX_DashboardWidgetInstances_SharedFromUserId`
ON `dashboard_widget_instances` (`SharedFromUserId`);

CREATE INDEX `IDX_DashboardWidgetInstances_SharedFromWidgetId`
ON `dashboard_widget_instances` (`SharedFromWidgetId`);

-- ================================================================
-- Update existing records
-- ================================================================

-- Set default values for existing records
UPDATE `dashboard_widget_instances`
SET
    `IsShared` = 0,
    `CanEdit` = 1,
    `CanDelete` = 1,
    `SharedFromUserId` = NULL,
    `SharedFromWidgetId` = NULL,
    `SharedAt` = NULL
WHERE `IsShared` IS NULL;

-- ================================================================
-- Verification Queries
-- ================================================================

-- Verify column addition
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'gpsdata'
    AND TABLE_NAME = 'dashboard_widget_instances'
    AND COLUMN_NAME IN ('IsShared', 'SharedFromUserId', 'SharedFromWidgetId', 'CanEdit', 'CanDelete', 'SharedAt');

-- Verify indexes
SELECT
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'gpsdata'
    AND TABLE_NAME = 'dashboard_widget_instances'
    AND INDEX_NAME LIKE 'IDX_DashboardWidgetInstances_%';

-- Verify foreign keys
SELECT
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'gpsdata'
    AND TABLE_NAME = 'dashboard_widget_instances'
    AND CONSTRAINT_NAME LIKE 'FK_DashboardWidgetInstances_Shared%';

-- ================================================================
-- Rollback Script (if needed)
-- ================================================================

/*
USE `gpsdata`;

-- Drop foreign keys first
ALTER TABLE `dashboard_widget_instances`
DROP FOREIGN KEY `FK_DashboardWidgetInstances_SharedFrom`,
DROP FOREIGN KEY `FK_DashboardWidgetInstances_SharedFromUser`;

-- Drop indexes
DROP INDEX `IDX_DashboardWidgetInstances_IsShared` ON `dashboard_widget_instances`;
DROP INDEX `IDX_DashboardWidgetInstances_SharedFromUserId` ON `dashboard_widget_instances`;
DROP INDEX `IDX_DashboardWidgetInstances_SharedFromWidgetId` ON `dashboard_widget_instances`;

-- Drop columns
ALTER TABLE `dashboard_widget_instances`
DROP COLUMN `IsShared`,
DROP COLUMN `SharedFromUserId`,
DROP COLUMN `SharedFromWidgetId`,
DROP COLUMN `CanEdit`,
DROP COLUMN `CanDelete`,
DROP COLUMN `SharedAt`;
*/
