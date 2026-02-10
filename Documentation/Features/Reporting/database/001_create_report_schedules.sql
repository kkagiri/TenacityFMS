-- ============================================================
-- Migration: Create report_schedules table
-- Date: 2026-02-04
-- Purpose: Support scheduled report generation and monitoring
-- ============================================================

CREATE TABLE IF NOT EXISTS `report_schedules` (
  `ReportScheduleId` BIGINT NOT NULL AUTO_INCREMENT,
  `ScheduleName` VARCHAR(200) NOT NULL,
  `Description` VARCHAR(1000) NULL,
  `ReportSourceId` VARCHAR(100) NOT NULL,
  `Filters` TEXT NULL COMMENT 'JSON parameter values',
  `OutputFormat` VARCHAR(20) NOT NULL DEFAULT 'pdf',
  `Frequency` VARCHAR(50) NOT NULL DEFAULT 'once',
  `RepeatCount` INT NOT NULL DEFAULT 1,
  `ExecutedCount` INT NOT NULL DEFAULT 0,
  `Recipients` TEXT NULL COMMENT 'JSON array of email addresses',
  `ScheduleConfig` TEXT NULL COMMENT 'JSON - periodType, days, weeks, time, timeZone',
  `ScheduledAt` DATETIME NOT NULL,
  `LastExecutedAt` DATETIME NULL,
  `NextExecutionAt` DATETIME NULL,
  `Status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `ErrorMessage` TEXT NULL,
  `CreatedBy` VARCHAR(100) NOT NULL,
  `CreatedAt` DATETIME NOT NULL,
  `ModifiedAt` DATETIME NULL,
  `ModifiedBy` VARCHAR(100) NULL,
  `CancelledAt` DATETIME NULL,
  `CancelledBy` VARCHAR(100) NULL,
  PRIMARY KEY (`ReportScheduleId`),
  INDEX `IX_report_schedules_Status` (`Status`),
  INDEX `IX_report_schedules_NextExecutionAt` (`NextExecutionAt`),
  INDEX `IX_report_schedules_CreatedBy` (`CreatedBy`),
  INDEX `IX_report_schedules_ReportSourceId` (`ReportSourceId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
