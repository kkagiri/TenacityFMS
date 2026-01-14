-- ============================================================================
-- Issue Tracker V2 Database Migration Script (Fixed Version)
-- Purpose: Add new tables and columns for template-based issue tracking
-- Date: Generated for Issue Tracker v2 Redesign
--
-- IMPORTANT: Run this script in sections if you encounter errors.
-- Each section is marked with "-- SECTION X"
-- ============================================================================

-- ============================================================================
-- SECTION 1: Create new tables (safe to re-run with IF NOT EXISTS)
-- ============================================================================

-- Create devicetype table
CREATE TABLE IF NOT EXISTS `devicetype` (
  `Id` INT(11) NOT NULL AUTO_INCREMENT,
  `Name` VARCHAR(100) NOT NULL COLLATE 'utf8mb4_general_ci',
  `Description` VARCHAR(500) NULL COLLATE 'utf8mb4_general_ci',
  `IsMonitored` TINYINT(1) NOT NULL DEFAULT 0,
  `MonitoringEndpoint` VARCHAR(500) NULL COLLATE 'utf8mb4_general_ci',
  `CreatedAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  UNIQUE INDEX `devicetype_name_unique` (`Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create issuetemplate table
CREATE TABLE IF NOT EXISTS `issuetemplate` (
  `Id` INT(11) NOT NULL AUTO_INCREMENT,
  `DeviceTypeId` INT(11) NOT NULL,
  `Name` VARCHAR(100) NOT NULL COLLATE 'utf8mb4_general_ci',
  `TitleTemplate` VARCHAR(200) NULL COLLATE 'utf8mb4_general_ci',
  `DescriptionTemplate` TEXT NULL COLLATE 'utf8mb4_general_ci',
  `DefaultPriorityId` INT(11) NULL,
  `DefaultStatusId` INT(11) NULL,
  `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
  `CreatedAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  UNIQUE INDEX `issuetemplate_devicetype_name_unique` (`DeviceTypeId`, `Name`),
  INDEX `issuetemplate_devicetype_idx` (`DeviceTypeId`),
  INDEX `issuetemplate_isactive_idx` (`IsActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create issueautocloseconfig table
CREATE TABLE IF NOT EXISTS `issueautocloseconfig` (
  `Id` INT(11) NOT NULL AUTO_INCREMENT,
  `IssueTemplateId` INT(11) NOT NULL,
  `IsEnabled` TINYINT(1) NOT NULL DEFAULT 0,
  `CheckerType` VARCHAR(50) NOT NULL COLLATE 'utf8mb4_general_ci',
  `CheckIntervalSeconds` INT(11) NULL DEFAULT 300,
  `CheckerConfigJson` TEXT NULL COLLATE 'utf8mb4_general_ci',
  `AutoCloseWhenSatisfied` TINYINT(1) NOT NULL DEFAULT 1,
  `CreatedAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  UNIQUE INDEX `issueautocloseconfig_template_unique` (`IssueTemplateId`),
  INDEX `issueautocloseconfig_enabled_idx` (`IsEnabled`),
  INDEX `issueautocloseconfig_checkertype_idx` (`CheckerType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================================
-- SECTION 2: Add foreign keys for new tables
-- Run these separately if they fail (constraints may already exist)
-- ============================================================================

-- Drop existing FKs first (ignore errors if they don't exist)
-- Run these DROP statements one at a time - ignore "Can't DROP" errors

SET FOREIGN_KEY_CHECKS = 0;

-- Drop issuetemplate FK if exists
ALTER TABLE `issuetemplate` DROP FOREIGN KEY `issuetemplate_devicetype_fk`;
-- (Ignore error if it doesn't exist)

-- Drop issueautocloseconfig FK if exists
ALTER TABLE `issueautocloseconfig` DROP FOREIGN KEY `issueautocloseconfig_template_fk`;
-- (Ignore error if it doesn't exist)

SET FOREIGN_KEY_CHECKS = 1;

-- Now add the FKs
ALTER TABLE `issuetemplate`
  ADD CONSTRAINT `issuetemplate_devicetype_fk`
  FOREIGN KEY (`DeviceTypeId`) REFERENCES `devicetype` (`Id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `issueautocloseconfig`
  ADD CONSTRAINT `issueautocloseconfig_template_fk`
  FOREIGN KEY (`IssueTemplateId`) REFERENCES `issuetemplate` (`Id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- SECTION 3: Add V2 columns to issuetracker table
-- Run each ALTER separately if needed
-- ============================================================================

-- Check current columns first:
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'issuetracker';

-- Add IssueTemplateId column (nullable, links to template)
ALTER TABLE `issuetracker` ADD COLUMN `IssueTemplateId` INT(11) NULL;

-- Add DeviceTypeId column (nullable, V2 device type reference)
ALTER TABLE `issuetracker` ADD COLUMN `DeviceTypeId` INT(11) NULL;

-- Add CanAutoClose column (boolean flag)
ALTER TABLE `issuetracker` ADD COLUMN `CanAutoClose` TINYINT(1) NOT NULL DEFAULT 0;

-- Add AutoCloseReason column (text for auto-close explanation)
ALTER TABLE `issuetracker` ADD COLUMN `AutoCloseReason` VARCHAR(500) NULL;

-- Add IsAutoCreated column (flag for auto-generated issues)
ALTER TABLE `issuetracker` ADD COLUMN `IsAutoCreated` TINYINT(1) NOT NULL DEFAULT 0;

-- ============================================================================
-- SECTION 4: Add indexes to issuetracker table
-- ============================================================================

-- Create indexes for new columns
ALTER TABLE `issuetracker` ADD INDEX `issuetracker_template_idx` (`IssueTemplateId`);
ALTER TABLE `issuetracker` ADD INDEX `issuetracker_devicetype_v2_idx` (`DeviceTypeId`);
ALTER TABLE `issuetracker` ADD INDEX `issuetracker_canautoclose_idx` (`CanAutoClose`);
ALTER TABLE `issuetracker` ADD INDEX `issuetracker_isautocreated_idx` (`IsAutoCreated`);

-- ============================================================================
-- SECTION 5: Add foreign keys to issuetracker table
-- ============================================================================

-- Drop existing FKs first (ignore errors if they don't exist)
SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE `issuetracker` DROP FOREIGN KEY `issuetracker_template_fk`;
-- (Ignore error if it doesn't exist)

ALTER TABLE `issuetracker` DROP FOREIGN KEY `issuetracker_devicetype_v2_fk`;
-- (Ignore error if it doesn't exist)

SET FOREIGN_KEY_CHECKS = 1;

-- FK to issuetemplate
ALTER TABLE `issuetracker`
  ADD CONSTRAINT `issuetracker_template_fk`
  FOREIGN KEY (`IssueTemplateId`) REFERENCES `issuetemplate` (`Id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- FK to devicetype
ALTER TABLE `issuetracker`
  ADD CONSTRAINT `issuetracker_devicetype_v2_fk`
  FOREIGN KEY (`DeviceTypeId`) REFERENCES `devicetype` (`Id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- SECTION 6: Seed default device types
-- ============================================================================

INSERT IGNORE INTO `devicetype` (`Name`, `Description`, `IsMonitored`) VALUES
('ATG', 'Automatic Tank Gauge - Tank level monitoring system', 1),
('PTS', 'Pump Tracking System - Fuel dispenser monitoring', 1),
('GPS', 'GPS Tracking Device - Vehicle location tracking', 1),
('Vehicle', 'Vehicle-related issues (general)', 0),
('Fuel Card', 'Fuel card system issues', 0),
('Network', 'Network connectivity issues', 1),
('Software', 'Software/Application issues', 0),
('Other', 'Other/General issues', 0);

-- ============================================================================
-- SECTION 7: Verification
-- ============================================================================

-- Verify tables exist
SELECT 'Tables Created:' AS Status;
SELECT TABLE_NAME, TABLE_ROWS
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN ('devicetype', 'issuetemplate', 'issueautocloseconfig');

-- Verify issuetracker columns
SELECT 'IssueTracker V2 Columns:' AS Status;
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'issuetracker'
AND COLUMN_NAME IN ('IssueTemplateId', 'DeviceTypeId', 'CanAutoClose', 'AutoCloseReason', 'IsAutoCreated');

-- Show device types
SELECT 'Device Types:' AS Status;
SELECT * FROM `devicetype`;

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- If you get "Duplicate column" errors, the column already exists. Skip that ALTER.
-- If you get "Duplicate key name" errors, the index already exists. Skip that ALTER.
-- If you get "Duplicate foreign key constraint" errors, the FK already exists. Skip that ALTER.

-- To check what columns exist:
-- SHOW COLUMNS FROM issuetracker;

-- To check what indexes exist:
-- SHOW INDEX FROM issuetracker;

-- To drop a column if you need to recreate:
-- ALTER TABLE issuetracker DROP COLUMN DeviceTypeId;

-- To drop a FK if you need to recreate:
-- ALTER TABLE issuetracker DROP FOREIGN KEY issuetracker_devicetype_v2_fk;

-- ============================================================================
-- END OF MIGRATION SCRIPT
-- ============================================================================
