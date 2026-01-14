-- ============================================================================
-- Issue Tracker V2 Database Migration Script
-- Purpose: Add new tables and columns for template-based issue tracking
-- Date: Generated for Issue Tracker v2 Redesign
-- ============================================================================

-- ============================================================================
-- STEP 1: Create new tables
-- ============================================================================

-- Create devicetype table
CREATE TABLE IF NOT EXISTS `devicetype` (
  `Id` INT(11) NOT NULL AUTO_INCREMENT,
  `Name` VARCHAR(100) NOT NULL COLLATE 'utf8mb4_general_ci',
  `Description` VARCHAR(500) NULL COLLATE 'utf8mb4_general_ci',
  `IsMonitored` TINYINT(1) NOT NULL DEFAULT 0,
  `MonitoringEndpoint` VARCHAR(500) NULL COLLATE 'utf8mb4_general_ci',
  `CreatedAt` DATETIME NULL,
  `UpdatedAt` DATETIME NULL,
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
  `CreatedAt` DATETIME NULL,
  `UpdatedAt` DATETIME NULL,
  PRIMARY KEY (`Id`),
  UNIQUE INDEX `issuetemplate_devicetype_name_unique` (`DeviceTypeId`, `Name`),
  INDEX `issuetemplate_devicetype_idx` (`DeviceTypeId`),
  INDEX `issuetemplate_priority_idx` (`DefaultPriorityId`),
  INDEX `issuetemplate_status_idx` (`DefaultStatusId`),
  INDEX `issuetemplate_isactive_idx` (`IsActive`),
  CONSTRAINT `issuetemplate_devicetype_fk` FOREIGN KEY (`DeviceTypeId`)
    REFERENCES `devicetype` (`Id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `issuetemplate_priority_fk` FOREIGN KEY (`DefaultPriorityId`)
    REFERENCES `issuepriority` (`ID`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `issuetemplate_status_fk` FOREIGN KEY (`DefaultStatusId`)
    REFERENCES `issuestatus` (`ID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create issueautocloseconfig table
CREATE TABLE IF NOT EXISTS `issueautocloseconfig` (
  `Id` INT(11) NOT NULL AUTO_INCREMENT,
  `IssueTemplateId` INT(11) NOT NULL,
  `IsEnabled` TINYINT(1) NOT NULL DEFAULT 0,
  `CheckerType` VARCHAR(50) NOT NULL COLLATE 'utf8mb4_general_ci',
  `CheckIntervalSeconds` INT(11) NULL,
  `CheckerConfigJson` TEXT NULL COLLATE 'utf8mb4_general_ci',
  `AutoCloseWhenSatisfied` TINYINT(1) NOT NULL DEFAULT 1,
  `CreatedAt` DATETIME NULL,
  `UpdatedAt` DATETIME NULL,
  PRIMARY KEY (`Id`),
  UNIQUE INDEX `issueautocloseconfig_template_unique` (`IssueTemplateId`),
  INDEX `issueautocloseconfig_enabled_idx` (`IsEnabled`),
  INDEX `issueautocloseconfig_checkertype_idx` (`CheckerType`),
  CONSTRAINT `issueautocloseconfig_template_fk` FOREIGN KEY (`IssueTemplateId`)
    REFERENCES `issuetemplate` (`Id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================================
-- STEP 2: Add new columns to issuetracker table
-- ============================================================================

-- Add V2 columns to issuetracker table (if they don't exist)
SET @dbname = DATABASE();

-- Add IssueTemplateId column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'issuetracker' AND COLUMN_NAME = 'IssueTemplateId');
SET @sql = IF(@col_exists = 0,
              'ALTER TABLE `issuetracker` ADD COLUMN `IssueTemplateId` INT(11) NULL AFTER `ActiveAlarmId`',
              'SELECT "IssueTemplateId column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add DeviceTypeId column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'issuetracker' AND COLUMN_NAME = 'DeviceTypeId');
SET @sql = IF(@col_exists = 0,
              'ALTER TABLE `issuetracker` ADD COLUMN `DeviceTypeId` INT(11) NULL AFTER `IssueTemplateId`',
              'SELECT "DeviceTypeId column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add CanAutoClose column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'issuetracker' AND COLUMN_NAME = 'CanAutoClose');
SET @sql = IF(@col_exists = 0,
              'ALTER TABLE `issuetracker` ADD COLUMN `CanAutoClose` TINYINT(1) NOT NULL DEFAULT 0 AFTER `DeviceTypeId`',
              'SELECT "CanAutoClose column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add AutoCloseReason column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'issuetracker' AND COLUMN_NAME = 'AutoCloseReason');
SET @sql = IF(@col_exists = 0,
              'ALTER TABLE `issuetracker` ADD COLUMN `AutoCloseReason` VARCHAR(500) NULL COLLATE utf8mb4_general_ci AFTER `CanAutoClose`',
              'SELECT "AutoCloseReason column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add IsAutoCreated column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'issuetracker' AND COLUMN_NAME = 'IsAutoCreated');
SET @sql = IF(@col_exists = 0,
              'ALTER TABLE `issuetracker` ADD COLUMN `IsAutoCreated` TINYINT(1) NOT NULL DEFAULT 0 AFTER `AutoCloseReason`',
              'SELECT "IsAutoCreated column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- STEP 3: Add indexes and foreign keys to issuetracker table
-- ============================================================================

-- Add index for IssueTemplateId (check if exists first)
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
                   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'issuetracker' AND INDEX_NAME = 'issuetracker_template_idx');
SET @sql = IF(@idx_exists = 0,
              'ALTER TABLE `issuetracker` ADD INDEX `issuetracker_template_idx` (`IssueTemplateId`)',
              'SELECT "issuetracker_template_idx index already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for DeviceTypeId
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
                   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'issuetracker' AND INDEX_NAME = 'issuetracker_devicetype_v2_idx');
SET @sql = IF(@idx_exists = 0,
              'ALTER TABLE `issuetracker` ADD INDEX `issuetracker_devicetype_v2_idx` (`DeviceTypeId`)',
              'SELECT "issuetracker_devicetype_v2_idx index already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for CanAutoClose
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
                   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'issuetracker' AND INDEX_NAME = 'issuetracker_canautoclose_idx');
SET @sql = IF(@idx_exists = 0,
              'ALTER TABLE `issuetracker` ADD INDEX `issuetracker_canautoclose_idx` (`CanAutoClose`)',
              'SELECT "issuetracker_canautoclose_idx index already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for IsAutoCreated
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
                   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'issuetracker' AND INDEX_NAME = 'issuetracker_isautocreated_idx');
SET @sql = IF(@idx_exists = 0,
              'ALTER TABLE `issuetracker` ADD INDEX `issuetracker_isautocreated_idx` (`IsAutoCreated`)',
              'SELECT "issuetracker_isautocreated_idx index already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key for IssueTemplateId
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'issuetracker' AND CONSTRAINT_NAME = 'issuetracker_template');
SET @sql = IF(@fk_exists = 0,
              'ALTER TABLE `issuetracker` ADD CONSTRAINT `issuetracker_template` FOREIGN KEY (`IssueTemplateId`) REFERENCES `issuetemplate` (`Id`) ON DELETE SET NULL ON UPDATE CASCADE',
              'SELECT "issuetracker_template FK already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key for DeviceTypeId
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'issuetracker' AND CONSTRAINT_NAME = 'issuetracker_devicetype_v2');
SET @sql = IF(@fk_exists = 0,
              'ALTER TABLE `issuetracker` ADD CONSTRAINT `issuetracker_devicetype_v2` FOREIGN KEY (`DeviceTypeId`) REFERENCES `devicetype` (`Id`) ON DELETE SET NULL ON UPDATE CASCADE',
              'SELECT "issuetracker_devicetype_v2 FK already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- STEP 4: Insert default device types (optional seed data)
-- ============================================================================

-- Insert common device types if they don't exist
INSERT IGNORE INTO `devicetype` (`Name`, `Description`, `IsMonitored`, `MonitoringEndpoint`, `CreatedAt`, `UpdatedAt`) VALUES
('ATG', 'Automatic Tank Gauge - Tank level monitoring system', 1, NULL, NOW(), NOW()),
('PTS', 'Pump Tracking System - Fuel dispenser monitoring', 1, NULL, NOW(), NOW()),
('GPS', 'GPS Tracking Device - Vehicle location tracking', 1, NULL, NOW(), NOW()),
('Vehicle', 'Vehicle-related issues (general)', 0, NULL, NOW(), NOW()),
('Fuel Card', 'Fuel card system issues', 0, NULL, NOW(), NOW()),
('Network', 'Network connectivity issues', 1, NULL, NOW(), NOW()),
('Software', 'Software/Application issues', 0, NULL, NOW(), NOW()),
('Other', 'Other/General issues', 0, NULL, NOW(), NOW());

-- ============================================================================
-- STEP 5: Insert sample issue templates (optional)
-- ============================================================================

-- Note: These are sample templates - modify as needed for your environment
-- You can remove or customize these based on requirements

-- ATG Templates
INSERT IGNORE INTO `issuetemplate` (`DeviceTypeId`, `Name`, `TitleTemplate`, `DescriptionTemplate`, `IsActive`, `CreatedAt`, `UpdatedAt`)
SELECT d.Id, 'Device Offline', 'ATG Offline - {SiteName}', 'ATG device at {SiteName} is not communicating. Last seen: {LastSeen}', 1, NOW(), NOW()
FROM `devicetype` d WHERE d.Name = 'ATG';

INSERT IGNORE INTO `issuetemplate` (`DeviceTypeId`, `Name`, `TitleTemplate`, `DescriptionTemplate`, `IsActive`, `CreatedAt`, `UpdatedAt`)
SELECT d.Id, 'Low Tank Level', 'Low Tank Level Alert - {SiteName}', 'Tank level at {SiteName} has dropped below threshold. Current level: {CurrentLevel}', 1, NOW(), NOW()
FROM `devicetype` d WHERE d.Name = 'ATG';

-- PTS Templates
INSERT IGNORE INTO `issuetemplate` (`DeviceTypeId`, `Name`, `TitleTemplate`, `DescriptionTemplate`, `IsActive`, `CreatedAt`, `UpdatedAt`)
SELECT d.Id, 'Device Offline', 'PTS Offline - {VehicleName}', 'PTS device on {VehicleName} is not communicating. Last seen: {LastSeen}', 1, NOW(), NOW()
FROM `devicetype` d WHERE d.Name = 'PTS';

INSERT IGNORE INTO `issuetemplate` (`DeviceTypeId`, `Name`, `TitleTemplate`, `DescriptionTemplate`, `IsActive`, `CreatedAt`, `UpdatedAt`)
SELECT d.Id, 'Pump Malfunction', 'Pump Malfunction - {VehicleName}', 'Pump malfunction detected on {VehicleName}. Error code: {ErrorCode}', 1, NOW(), NOW()
FROM `devicetype` d WHERE d.Name = 'PTS';

-- GPS Templates
INSERT IGNORE INTO `issuetemplate` (`DeviceTypeId`, `Name`, `TitleTemplate`, `DescriptionTemplate`, `IsActive`, `CreatedAt`, `UpdatedAt`)
SELECT d.Id, 'Device Offline', 'GPS Offline - {VehicleName}', 'GPS device on {VehicleName} is not communicating. Last seen: {LastSeen}', 1, NOW(), NOW()
FROM `devicetype` d WHERE d.Name = 'GPS';

INSERT IGNORE INTO `issuetemplate` (`DeviceTypeId`, `Name`, `TitleTemplate`, `DescriptionTemplate`, `IsActive`, `CreatedAt`, `UpdatedAt`)
SELECT d.Id, 'No Signal', 'GPS No Signal - {VehicleName}', 'GPS device on {VehicleName} has lost satellite signal', 1, NOW(), NOW()
FROM `devicetype` d WHERE d.Name = 'GPS';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables created
SELECT 'devicetype' AS TableName, COUNT(*) AS RowCount FROM `devicetype`
UNION ALL
SELECT 'issuetemplate', COUNT(*) FROM `issuetemplate`
UNION ALL
SELECT 'issueautocloseconfig', COUNT(*) FROM `issueautocloseconfig`;

-- Verify new columns in issuetracker
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'issuetracker'
AND COLUMN_NAME IN ('IssueTemplateId', 'DeviceTypeId', 'CanAutoClose', 'AutoCloseReason', 'IsAutoCreated');

-- ============================================================================
-- END OF MIGRATION SCRIPT
-- ============================================================================
