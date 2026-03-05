-- Migration: Add fuel_import_file_tracker table
-- Purpose: Track fuel report files on network shares for auto-import feature
-- Dependencies: sites table (FK on site_id)
-- Date: 2026-03-03
-- Compatibility: MySQL 5.5+

CREATE TABLE IF NOT EXISTS `fuel_import_file_tracker` (
    `Id` INT NOT NULL AUTO_INCREMENT,
    `FilePath` VARCHAR(1000) NOT NULL COMMENT 'Full path to the file on network share',
    `FileName` VARCHAR(500) NOT NULL COMMENT 'Filename without path',
    `FileSizeBytes` BIGINT NOT NULL DEFAULT 0,
    `FileLastModifiedUtc` DATETIME NOT NULL COMMENT 'Primary change detection field',
    `ReportType` VARCHAR(10) NOT NULL COMMENT 'km/l or l/hr',
    `DetectedSiteName` VARCHAR(200) NULL COMMENT 'Site name from filename (km/l) or null (l/hr)',
    `DetectedMonth` VARCHAR(20) NULL COMMENT 'Month name from filename',
    `DetectedYear` INT NULL COMMENT 'Year from filename',
    `SiteId` INT NULL COMMENT 'Resolved site ID (null for l/hr)',
    `Status` VARCHAR(20) NOT NULL DEFAULT 'Pending' COMMENT 'Pending, Processing, Completed, Failed, Skipped',
    `ImportReportId` VARCHAR(100) NULL COMMENT 'Links to fuelreportimportlog.ReportId',
    `TotalRecords` INT NOT NULL DEFAULT 0,
    `SuccessCount` INT NOT NULL DEFAULT 0,
    `FailedCount` INT NOT NULL DEFAULT 0,
    `SkippedCount` INT NOT NULL DEFAULT 0,
    `DuplicateCount` INT NOT NULL DEFAULT 0,
    `ErrorMessage` TEXT NULL,
    `RetryCount` INT NOT NULL DEFAULT 0,
    `MaxRetries` INT NOT NULL DEFAULT 3,
    `FirstScannedAtUtc` DATETIME NOT NULL,
    `LastProcessedAtUtc` DATETIME NULL,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`Id`),
    UNIQUE INDEX `IX_FuelImportFileTracker_FilePath_LastModified` (`FilePath`(180), `FileLastModifiedUtc`),
    INDEX `IX_FuelImportFileTracker_Status` (`Status`),
    INDEX `IX_FuelImportFileTracker_SiteId` (`SiteId`),
    CONSTRAINT `FK_FuelImportFileTracker_Sites_SiteId` FOREIGN KEY (`SiteId`) REFERENCES `sites` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
