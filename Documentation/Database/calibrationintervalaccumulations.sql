-- File: calibrationintervalaccumulations.sql
-- Purpose: Creates the learned-calibration interval accumulation table.
-- Compatibility: MySQL 5.5.6+
-- Last Modified: 2026-03-24

CREATE TABLE IF NOT EXISTS `calibrationintervalaccumulations` (
    `Id` BIGINT NOT NULL AUTO_INCREMENT,
    `TankId` INT(11) NOT NULL,
    `IntervalStartMm` INT(11) NOT NULL,
    `IntervalEndMm` INT(11) NOT NULL,
    `ObservationCount` INT(11) NOT NULL DEFAULT 0,
    `MeanVolumePerMm` DECIMAL(18,6) NOT NULL DEFAULT 0.000000,
    `StdDevVolumePerMm` DECIMAL(18,6) NOT NULL DEFAULT 0.000000,
    `LastUpdatedUtc` DATETIME NOT NULL,
    PRIMARY KEY (`Id`),
    UNIQUE KEY `UX_calibrationintervalaccumulations_tank_interval` (`TankId`, `IntervalStartMm`, `IntervalEndMm`),
    KEY `IX_calibrationintervalaccumulations_tank_updated` (`TankId`, `LastUpdatedUtc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;