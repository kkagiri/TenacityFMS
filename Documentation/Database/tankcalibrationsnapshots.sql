-- ============================================================================
-- Tank Calibration Snapshot Table
-- Feature: Tank-scoped calibration workspace
-- Date: 2026-03-23
-- Description: Creates the tankcalibrationsnapshots table for storing local
--              tank calibration chart history. Managed by EF Core via the
--              TankCalibrationSnapshot entity and TankCalibrationSnapshotConfiguration.
-- ============================================================================

CREATE TABLE IF NOT EXISTS `tankcalibrationsnapshots` (
    `Id` BIGINT NOT NULL AUTO_INCREMENT,
    `TankId` INT(11) NOT NULL,
    `TankName` VARCHAR(255) NOT NULL,
    `PtsDeviceId` VARCHAR(100) NOT NULL,
    `ProbeNumber` INT(11) NOT NULL,
    `ChartType` VARCHAR(32) NOT NULL,
    `Source` VARCHAR(64) NOT NULL,
    `TotalRecords` INT(11) NOT NULL,
    `RecordedAtUtc` DATETIME NOT NULL,
    `RecordedBy` VARCHAR(255) NULL DEFAULT NULL,
    `Notes` VARCHAR(500) NULL DEFAULT NULL,
    `RecordsJson` LONGTEXT NOT NULL,
    PRIMARY KEY (`Id`),
    INDEX `IX_tankcalibrationsnapshots_tank_chart_recorded` (`TankId`, `ChartType`, `RecordedAtUtc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
