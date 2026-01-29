-- Migration: Expand ResolutionNotes column and add escalation history table
-- Date: 2026-01-29
-- Purpose: Fix ResolutionNotes overflow issue by:
-- 1. Expanding ResolutionNotes from VARCHAR(1000) to LONGTEXT
-- 2. Creating separate escalation history table for audit trail
-- 3. Implementing truncation logic in service layer

-- Step 1: Alter ActiveAlarms table - expand ResolutionNotes column
ALTER TABLE `activealarms`
MODIFY COLUMN `ResolutionNotes` LONGTEXT
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci
COMMENT 'Escalation and resolution history (LONGTEXT to support unlimited history)';

-- Step 2: Create new escalation history table
CREATE TABLE IF NOT EXISTS `activealarmescalationhistory` (
  `Id` INT NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  `ActiveAlarmId` INT NOT NULL COMMENT 'Reference to parent ActiveAlarm',
  `EscalationLevel` INT NOT NULL COMMENT 'Sequential escalation level',
  `FromPriority` VARCHAR(20) NOT NULL COMMENT 'Previous priority level',
  `ToPriority` VARCHAR(20) NOT NULL COMMENT 'New priority level',
  `EscalatedBy` VARCHAR(100) NULL COMMENT 'User or system that triggered escalation',
  `EscalationReason` VARCHAR(50) NULL COMMENT 'AutoEscalation, Manual, Policy, etc.',
  `EscalatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When escalation occurred',
  `Notes` VARCHAR(500) NULL COMMENT 'Optional notes about the escalation',

  PRIMARY KEY (`Id`),

  CONSTRAINT `FK_ActiveAlarmEscalationHistory_ActiveAlarms`
    FOREIGN KEY (`ActiveAlarmId`)
    REFERENCES `activealarms` (`Id`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT,

  -- Indexes for performance
  INDEX `IX_ActiveAlarmEscalationHistory_ActiveAlarmId` (`ActiveAlarmId`),
  INDEX `IX_ActiveAlarmEscalationHistory_EscalatedAt` (`EscalatedAt`),
  INDEX `IX_ActiveAlarmEscalationHistory_AlarmAndLevel` (`ActiveAlarmId`, `EscalationLevel`),
  INDEX `IX_ActiveAlarmEscalationHistory_AlarmAndTime` (`ActiveAlarmId`, `EscalatedAt`)
)
ENGINE=InnoDB
AUTO_INCREMENT=1
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_general_ci
COMMENT='Detailed escalation history for active alarms with audit trail';

-- Step 3: Add index to ActiveAlarms for better query performance
ALTER TABLE `activealarms`
ADD INDEX IF NOT EXISTS `IX_ActiveAlarms_EscalationLevel` (`EscalationLevel`);

-- Verification queries to run after migration:
-- 1. Check ResolutionNotes column definition:
-- SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
-- FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_NAME='activealarms' AND COLUMN_NAME='ResolutionNotes';

-- 2. Check new table structure:
-- DESCRIBE activealarmescalationhistory;

-- 3. Check if foreign key exists:
-- SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
-- FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
-- WHERE CONSTRAINT_NAME = 'FK_ActiveAlarmEscalationHistory_ActiveAlarms';
