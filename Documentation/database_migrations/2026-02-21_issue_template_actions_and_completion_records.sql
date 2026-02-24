-- ============================================================================
-- Migration: Issue Template Actions & Completion Records
-- Date: 2026-02-21
-- Purpose: Add admin-configurable template actions and structured issue
--          completion records (device changes, camera installs, etc.)
-- Compatibility: MySQL 5.5+ (no JSON type, no generated columns)
-- ============================================================================

-- ============================================================================
-- Table: issuetemplateaction
-- Purpose: Admin-defined actions per issue template that appear as structured
--          completion steps (e.g. "Change GPS Device", "Install Camera")
-- ============================================================================
CREATE TABLE IF NOT EXISTS `issuetemplateaction` (
    `ID` INT(11) NOT NULL COMMENT 'Manually assigned PK (max+1 pattern)',
    `IssueTemplateID` INT(11) NOT NULL,
    `Name` VARCHAR(150) NOT NULL,
    `ActionType` VARCHAR(50) NOT NULL DEFAULT 'General' COMMENT 'General, DeviceChange, CameraInstall',
    `Description` VARCHAR(500) NULL,
    `RequiresDeviceDetails` TINYINT(1) NOT NULL DEFAULT 0,
    `RequiresSourceVehicle` TINYINT(1) NOT NULL DEFAULT 0,
    `RequiresCameraDetails` TINYINT(1) NOT NULL DEFAULT 0,
    `SortOrder` INT(11) NOT NULL DEFAULT 0,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`ID`),
    INDEX `IX_issuetemplateaction_templateid` (`IssueTemplateID`),
    UNIQUE INDEX `UQ_issuetemplateaction_template_name` (`IssueTemplateID`, `Name`),
    CONSTRAINT `FK_issuetemplateaction_issuetemplate`
        FOREIGN KEY (`IssueTemplateID`)
        REFERENCES `issuetemplate` (`ID`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci
COMMENT='Admin-configurable completion actions per issue template';

-- ============================================================================
-- Table: issuecompletionrecord
-- Purpose: Stores structured completion data for each action performed when
--          completing an issue. One row per action performed during completion.
-- ============================================================================
CREATE TABLE IF NOT EXISTS `issuecompletionrecord` (
    `ID` INT(11) NOT NULL COMMENT 'Manually assigned PK (max+1 pattern)',
    `IssueID` INT(11) NOT NULL,
    `TemplateActionID` INT(11) NULL COMMENT 'NULL for free-text "Other" actions',
    `ActionName` VARCHAR(150) NOT NULL COMMENT 'Denormalized action name for audit trail',
    `RootCause` VARCHAR(1000) NULL,
    `Notes` VARCHAR(2000) NULL,

    -- Device change fields
    `OldDeviceType` VARCHAR(100) NULL,
    `OldDeviceImei` VARCHAR(50) NULL,
    `NewDeviceType` VARCHAR(100) NULL,
    `NewDeviceImei` VARCHAR(50) NULL,
    `DevicePhoneNumber` VARCHAR(50) NULL,
    `SourceVehicleID` INT(11) NULL COMMENT 'Vehicle from which device was sourced',

    -- Camera installation fields
    `CameraImei` VARCHAR(50) NULL,
    `CameraPosition` VARCHAR(20) NULL COMMENT 'Front, Rear, Interior, etc.',
    `CameraSimNumber` VARCHAR(50) NULL,

    `AdditionalNotes` VARCHAR(2000) NULL,
    `CompletedByUserId` VARCHAR(128) NOT NULL,
    `CompletedByUserName` VARCHAR(256) NULL,
    `CompletedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`ID`),
    INDEX `IX_issuecompletionrecord_issueid` (`IssueID`),
    INDEX `IX_issuecompletionrecord_actionid` (`TemplateActionID`),
    CONSTRAINT `FK_issuecompletionrecord_issuetracker`
        FOREIGN KEY (`IssueID`)
        REFERENCES `issuetracker` (`ID`)
        ON DELETE CASCADE,
    CONSTRAINT `FK_issuecompletionrecord_templateaction`
        FOREIGN KEY (`TemplateActionID`)
        REFERENCES `issuetemplateaction` (`ID`)
        ON DELETE SET NULL,
    CONSTRAINT `FK_issuecompletionrecord_vehicle`
        FOREIGN KEY (`SourceVehicleID`)
        REFERENCES `vehicle` (`vehicleID`)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci
COMMENT='Structured completion records for issue actions (device changes, camera installs, etc.)';

-- ============================================================================
-- Verification queries
-- ============================================================================
-- SELECT TABLE_NAME, ENGINE, TABLE_COMMENT
-- FROM INFORMATION_SCHEMA.TABLES
-- WHERE TABLE_NAME IN ('issuetemplateaction', 'issuecompletionrecord');
--
-- DESCRIBE issuetemplateaction;
-- DESCRIBE issuecompletionrecord;
