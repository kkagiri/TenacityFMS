-- ============================================================================
-- Migration: Issue Template Workflows (MySQL 5.5 / 5.6 safe)
-- Date: 2026-04-23
-- Purpose: Add staged workflow persistence for issue-template completion actions,
--          including workflow tables and StageID / PositionX / PositionY columns.
-- Notes:
--   * Manual ID assignment is preserved (max+1 pattern)
--   * DATETIME columns are nullable; no CURRENT_TIMESTAMP defaults are used
--   * Script is idempotent and can be re-run safely
-- ============================================================================

CREATE TABLE IF NOT EXISTS `issuetemplateworkflow` (
    `ID` INT(11) NOT NULL COMMENT 'Manually assigned PK (max+1 pattern)',
    `IssueTemplateID` INT(11) NOT NULL,
    `Name` VARCHAR(150) NOT NULL,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    `RowVersion` BIGINT NOT NULL DEFAULT 1,
    `CreatedAt` DATETIME NULL,
    `UpdatedAt` DATETIME NULL,
    PRIMARY KEY (`ID`),
    UNIQUE KEY `UQ_issuetemplateworkflow_templateid` (`IssueTemplateID`),
    CONSTRAINT `FK_issuetemplateworkflow_issuetemplate`
        FOREIGN KEY (`IssueTemplateID`)
        REFERENCES `issuetemplate` (`ID`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci
COMMENT='Staged workflow definition for issue template completion';

CREATE TABLE IF NOT EXISTS `issuetemplateworkflowstage` (
    `ID` INT(11) NOT NULL COMMENT 'Manually assigned PK (max+1 pattern)',
    `WorkflowID` INT(11) NOT NULL,
    `Name` VARCHAR(100) NOT NULL,
    `Description` VARCHAR(500) NULL,
    `Color` VARCHAR(20) NULL,
    `SortOrder` INT(11) NOT NULL DEFAULT 0,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    `CreatedAt` DATETIME NULL,
    `UpdatedAt` DATETIME NULL,
    PRIMARY KEY (`ID`),
    KEY `IX_issuetemplateworkflowstage_workflowid` (`WorkflowID`),
    KEY `IX_issuetemplateworkflowstage_workflow_sortorder` (`WorkflowID`, `SortOrder`),
    CONSTRAINT `FK_issuetemplateworkflowstage_workflow`
        FOREIGN KEY (`WorkflowID`)
        REFERENCES `issuetemplateworkflow` (`ID`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci
COMMENT='Stages inside an issue-template workflow';

SET @sql_add_stageid = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'issuetemplateaction'
          AND COLUMN_NAME = 'StageID') = 0,
    'ALTER TABLE `issuetemplateaction` ADD COLUMN `StageID` INT(11) NULL AFTER `RequiresCameraDetails`',
    'SELECT 1'
);
PREPARE stmt_add_stageid FROM @sql_add_stageid;
EXECUTE stmt_add_stageid;
DEALLOCATE PREPARE stmt_add_stageid;

SET @sql_add_positionx = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'issuetemplateaction'
          AND COLUMN_NAME = 'PositionX') = 0,
    'ALTER TABLE `issuetemplateaction` ADD COLUMN `PositionX` DOUBLE NULL AFTER `StageID`',
    'SELECT 1'
);
PREPARE stmt_add_positionx FROM @sql_add_positionx;
EXECUTE stmt_add_positionx;
DEALLOCATE PREPARE stmt_add_positionx;

SET @sql_add_positiony = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'issuetemplateaction'
          AND COLUMN_NAME = 'PositionY') = 0,
    'ALTER TABLE `issuetemplateaction` ADD COLUMN `PositionY` DOUBLE NULL AFTER `PositionX`',
    'SELECT 1'
);
PREPARE stmt_add_positiony FROM @sql_add_positiony;
EXECUTE stmt_add_positiony;
DEALLOCATE PREPARE stmt_add_positiony;

SET @sql_add_stageid_index = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'issuetemplateaction'
          AND INDEX_NAME = 'IX_issuetemplateaction_stageid') = 0,
    'ALTER TABLE `issuetemplateaction` ADD INDEX `IX_issuetemplateaction_stageid` (`StageID`)',
    'SELECT 1'
);
PREPARE stmt_add_stageid_index FROM @sql_add_stageid_index;
EXECUTE stmt_add_stageid_index;
DEALLOCATE PREPARE stmt_add_stageid_index;

SET @sql_add_stage_fk = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'issuetemplateaction'
          AND CONSTRAINT_NAME = 'FK_issuetemplateaction_workflowstage') = 0,
    'ALTER TABLE `issuetemplateaction` ADD CONSTRAINT `FK_issuetemplateaction_workflowstage` FOREIGN KEY (`StageID`) REFERENCES `issuetemplateworkflowstage` (`ID`) ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE stmt_add_stage_fk FROM @sql_add_stage_fk;
EXECUTE stmt_add_stage_fk;
DEALLOCATE PREPARE stmt_add_stage_fk;

SET @next_workflow_id := (SELECT IFNULL(MAX(`ID`), 0) FROM `issuetemplateworkflow`);
INSERT INTO `issuetemplateworkflow` (`ID`, `IssueTemplateID`, `Name`, `IsActive`, `RowVersion`, `CreatedAt`, `UpdatedAt`)
SELECT
    @next_workflow_id := @next_workflow_id + 1,
    t.`ID`,
    'Default workflow',
    1,
    1,
    UTC_TIMESTAMP(),
    UTC_TIMESTAMP()
FROM `issuetemplate` t
LEFT JOIN `issuetemplateworkflow` w ON w.`IssueTemplateID` = t.`ID`
WHERE w.`ID` IS NULL;

SET @next_stage_id := (SELECT IFNULL(MAX(`ID`), 0) FROM `issuetemplateworkflowstage`);
INSERT INTO `issuetemplateworkflowstage` (`ID`, `WorkflowID`, `Name`, `Description`, `Color`, `SortOrder`, `IsActive`, `CreatedAt`, `UpdatedAt`)
SELECT
    @next_stage_id := @next_stage_id + 1,
    w.`ID`,
    'Diagnose',
    'Initial diagnosis and problem scoping',
    '#0078d4',
    0,
    1,
    UTC_TIMESTAMP(),
    UTC_TIMESTAMP()
FROM `issuetemplateworkflow` w
LEFT JOIN `issuetemplateworkflowstage` s
    ON s.`WorkflowID` = w.`ID`
   AND s.`Name` = 'Diagnose'
WHERE s.`ID` IS NULL;

SET @next_stage_id := (SELECT IFNULL(MAX(`ID`), 0) FROM `issuetemplateworkflowstage`);
INSERT INTO `issuetemplateworkflowstage` (`ID`, `WorkflowID`, `Name`, `Description`, `Color`, `SortOrder`, `IsActive`, `CreatedAt`, `UpdatedAt`)
SELECT
    @next_stage_id := @next_stage_id + 1,
    w.`ID`,
    'Repair',
    'Physical repair, replacement, or installation work',
    '#ca5010',
    1,
    1,
    UTC_TIMESTAMP(),
    UTC_TIMESTAMP()
FROM `issuetemplateworkflow` w
LEFT JOIN `issuetemplateworkflowstage` s
    ON s.`WorkflowID` = w.`ID`
   AND s.`Name` = 'Repair'
WHERE s.`ID` IS NULL;

SET @next_stage_id := (SELECT IFNULL(MAX(`ID`), 0) FROM `issuetemplateworkflowstage`);
INSERT INTO `issuetemplateworkflowstage` (`ID`, `WorkflowID`, `Name`, `Description`, `Color`, `SortOrder`, `IsActive`, `CreatedAt`, `UpdatedAt`)
SELECT
    @next_stage_id := @next_stage_id + 1,
    w.`ID`,
    'Verify',
    'Final validation and sign-off checks',
    '#107c10',
    2,
    1,
    UTC_TIMESTAMP(),
    UTC_TIMESTAMP()
FROM `issuetemplateworkflow` w
LEFT JOIN `issuetemplateworkflowstage` s
    ON s.`WorkflowID` = w.`ID`
   AND s.`Name` = 'Verify'
WHERE s.`ID` IS NULL;

UPDATE `issuetemplateaction` a
INNER JOIN `issuetemplateworkflow` w
    ON w.`IssueTemplateID` = a.`IssueTemplateID`
INNER JOIN `issuetemplateworkflowstage` s
    ON s.`WorkflowID` = w.`ID`
   AND s.`Name` = CASE
        WHEN a.`ActionType` IN ('DeviceChange', 'CameraInstall') THEN 'Repair'
        ELSE 'Diagnose'
   END
SET
    a.`StageID` = IFNULL(a.`StageID`, s.`ID`),
    a.`PositionX` = IFNULL(a.`PositionX`, 48 + (MOD(a.`SortOrder`, 3) * 300)),
    a.`PositionY` = IFNULL(
        a.`PositionY`,
        CASE
            WHEN a.`ActionType` IN ('DeviceChange', 'CameraInstall') THEN 300 + (FLOOR(a.`SortOrder` / 3) * 118)
            ELSE 52 + (FLOOR(a.`SortOrder` / 3) * 118)
        END
    )
WHERE a.`StageID` IS NULL
   OR a.`PositionX` IS NULL
   OR a.`PositionY` IS NULL;

-- Verification queries
-- SELECT * FROM issuetemplateworkflow ORDER BY IssueTemplateID;
-- SELECT * FROM issuetemplateworkflowstage ORDER BY WorkflowID, SortOrder;
-- SELECT ID, IssueTemplateID, Name, ActionType, StageID, PositionX, PositionY FROM issuetemplateaction ORDER BY IssueTemplateID, SortOrder;