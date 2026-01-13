-- ============================================================
-- Issue Tracker V2 Phase 4 - Background Services Schema Update
-- MySQL 5.5.6 Compatible Syntax
-- Run this after the main v2 migration
-- ============================================================

-- ============================================================
-- STEP 1: Add new columns to issuetemplate (run each separately, ignore errors if column exists)
-- ============================================================

-- Check and add CanAutoCreate column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'issuetemplate' AND COLUMN_NAME = 'CanAutoCreate');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE issuetemplate ADD COLUMN CanAutoCreate TINYINT(1) NOT NULL DEFAULT 0',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add OfflineThresholdMinutes column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'issuetemplate' AND COLUMN_NAME = 'OfflineThresholdMinutes');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE issuetemplate ADD COLUMN OfflineThresholdMinutes INT(11) DEFAULT 30',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add DefaultAssignee column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'issuetemplate' AND COLUMN_NAME = 'DefaultAssignee');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE issuetemplate ADD COLUMN DefaultAssignee VARCHAR(100) DEFAULT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- STEP 2: Add new columns to issuetracker
-- ============================================================

-- Check and add RelatedEntityId column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'issuetracker' AND COLUMN_NAME = 'RelatedEntityId');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE issuetracker ADD COLUMN RelatedEntityId INT(11) DEFAULT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add RelatedEntityType column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'issuetracker' AND COLUMN_NAME = 'RelatedEntityType');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE issuetracker ADD COLUMN RelatedEntityType VARCHAR(50) DEFAULT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add AssignedTo column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'issuetracker' AND COLUMN_NAME = 'AssignedTo');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE issuetracker ADD COLUMN AssignedTo VARCHAR(100) DEFAULT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add ReportedBy column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'issuetracker' AND COLUMN_NAME = 'ReportedBy');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE issuetracker ADD COLUMN ReportedBy VARCHAR(100) DEFAULT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- STEP 3: Add index (check if exists first)
-- ============================================================

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'issuetracker' AND INDEX_NAME = 'issuetracker_relatedentity_idx');
SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX issuetracker_relatedentity_idx ON issuetracker (RelatedEntityId, RelatedEntityType)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- STEP 4: Add "Auto-Closed" status if it doesn't exist
-- ============================================================

INSERT INTO issuestatus (Id, Status)
SELECT (SELECT COALESCE(MAX(Id), 0) + 1 FROM issuestatus s2), 'Auto-Closed'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM issuestatus WHERE Status = 'Auto-Closed');

-- ============================================================
-- STEP 5: Insert sample device types (IGNORE duplicates)
-- ============================================================

INSERT IGNORE INTO devicetype (ID, Name, IconClass, IsMonitorable, IsActive, CreatedAt)
VALUES (1, 'Tank Monitor', 'fa-light fa-gas-pump-slash', 1, 1, NOW());

INSERT IGNORE INTO devicetype (ID, Name, IconClass, IsMonitorable, IsActive, CreatedAt)
VALUES (2, 'Vehicle', 'fa-light fa-car', 1, 1, NOW());

INSERT IGNORE INTO devicetype (ID, Name, IconClass, IsMonitorable, IsActive, CreatedAt)
VALUES (3, 'PTS Terminal', 'fa-light fa-credit-card', 1, 1, NOW());

-- ============================================================
-- STEP 6: Insert sample issue templates (IGNORE duplicates)
-- ============================================================

-- Tank Monitor Offline template
INSERT IGNORE INTO issuetemplate (ID, DeviceTypeID, Name, TitleTemplate, DescriptionTemplate,
    DefaultPriorityID, DefaultStatusID, IsActive, CanAutoCreate, OfflineThresholdMinutes, CreatedAt)
VALUES (1, 1, 'Tank Monitor Offline',
    'Tank Monitor {DeviceName} - Offline',
    'Tank monitor has not reported data. Please check the device.',
    2, 1, 1, 1, 30, NOW());

-- Vehicle Offline template
INSERT IGNORE INTO issuetemplate (ID, DeviceTypeID, Name, TitleTemplate, DescriptionTemplate,
    DefaultPriorityID, DefaultStatusID, IsActive, CanAutoCreate, OfflineThresholdMinutes, CreatedAt)
VALUES (2, 2, 'Vehicle Offline',
    'Vehicle {DeviceName} - Offline',
    'Vehicle GPS has not reported. Please check the device.',
    2, 1, 1, 1, 60, NOW());

-- PTS Terminal Offline template
INSERT IGNORE INTO issuetemplate (ID, DeviceTypeID, Name, TitleTemplate, DescriptionTemplate,
    DefaultPriorityID, DefaultStatusID, IsActive, CanAutoCreate, OfflineThresholdMinutes, CreatedAt)
VALUES (3, 3, 'PTS Terminal Offline',
    'PTS Terminal {DeviceName} - Offline',
    'PTS terminal has not reported. Please check the device.',
    2, 1, 1, 1, 30, NOW());

-- Tank Level Alert template
INSERT IGNORE INTO issuetemplate (ID, DeviceTypeID, Name, TitleTemplate, DescriptionTemplate,
    DefaultPriorityID, DefaultStatusID, IsActive, CanAutoCreate, OfflineThresholdMinutes, CreatedAt)
VALUES (4, 1, 'Tank Level Alert',
    'Tank Level Alert - {DeviceName}',
    'Tank level has triggered an alarm. Please investigate.',
    1, 1, 1, 0, NULL, NOW());

-- ============================================================
-- STEP 7: Insert auto-close configs (IGNORE duplicates)
-- ============================================================

-- Auto-close config for Tank Monitor Offline
INSERT IGNORE INTO issueautocloseconfig (ID, IssueTemplateId, IsEnabled, CheckerType, CheckIntervalSeconds,
    CheckerConfigJson, AutoCloseWhenSatisfied, CreatedAt)
VALUES (1, 1, 1, 'Online', 300, '{"onlineThresholdMinutes": 15}', 1, NOW());

-- Auto-close config for Vehicle Offline
INSERT IGNORE INTO issueautocloseconfig (ID, IssueTemplateId, IsEnabled, CheckerType, CheckIntervalSeconds,
    CheckerConfigJson, AutoCloseWhenSatisfied, CreatedAt)
VALUES (2, 2, 1, 'Online', 300, '{"onlineThresholdMinutes": 15}', 1, NOW());

-- Auto-close config for PTS Offline
INSERT IGNORE INTO issueautocloseconfig (ID, IssueTemplateId, IsEnabled, CheckerType, CheckIntervalSeconds,
    CheckerConfigJson, AutoCloseWhenSatisfied, CreatedAt)
VALUES (3, 3, 1, 'Online', 300, '{"onlineThresholdMinutes": 15}', 1, NOW());

-- Auto-close config for Tank Level Alert (alarm-based)
INSERT IGNORE INTO issueautocloseconfig (ID, IssueTemplateId, IsEnabled, CheckerType, CheckIntervalSeconds,
    CheckerConfigJson, AutoCloseWhenSatisfied, CreatedAt)
VALUES (4, 4, 1, 'AlarmCleared', 300, '{"closeIfAlarmDeleted": false, "closeOnAlarmAcknowledge": false}', 1, NOW());

-- ============================================================
-- Complete
-- ============================================================

SELECT 'Phase 4 migration completed successfully' AS Result;
