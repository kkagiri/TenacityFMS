-- File: calibrationdatapoints.sql
-- Purpose: Creates the learned-calibration data point table.
-- Compatibility: MySQL 5.5.6+
-- Last Modified: 2026-03-24

CREATE TABLE IF NOT EXISTS `calibrationdatapoints` (
    `Id` BIGINT NOT NULL AUTO_INCREMENT,
    `TankId` INT(11) NOT NULL,
    `HeightBefore` DECIMAL(12,3) NOT NULL,
    `HeightAfter` DECIMAL(12,3) NOT NULL,
    `VolumeChange` DECIMAL(18,3) NOT NULL,
    `HeightInterval` INT(11) NOT NULL,
    `VolumePerMm` DECIMAL(18,6) NOT NULL,
    `SourceType` VARCHAR(32) NOT NULL,
    `SourceEventId` INT(11) NOT NULL,
    `RecordedAtUtc` DATETIME NOT NULL,
    `IsProcessed` TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (`Id`),
    UNIQUE KEY `UX_calibrationdatapoints_tank_source_event` (`TankId`, `SourceType`, `SourceEventId`),
    KEY `IX_calibrationdatapoints_tank_interval_recorded` (`TankId`, `HeightInterval`, `RecordedAtUtc`),
    KEY `IX_calibrationdatapoints_tank_processed_recorded` (`TankId`, `IsProcessed`, `RecordedAtUtc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;