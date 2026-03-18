-- File: mysql-phase2-trip-management-persistence.sql
-- Purpose: Phase 2 schema additions for trip grouping, confidence, anomaly, and reconciliation metadata.
-- Compatibility: MySQL 5.5 / 5.6
-- Dependencies: Existing vehicle_trip_group and vehicle_trip tables from phase 1.
-- Last Modified: 2026-03-11

-- =====================================================
-- Phase 2A: Persist trip group metadata
-- =====================================================
ALTER TABLE `vehicle_trip_group`
    ADD COLUMN `GroupingType` TINYINT(4) NOT NULL DEFAULT 1 AFTER `DetectionMode`,
    ADD COLUMN `ConfidenceScore` DECIMAL(5,2) NOT NULL DEFAULT 1.00 AFTER `GroupingType`,
    ADD COLUMN `ConfidenceBand` VARCHAR(20) NOT NULL DEFAULT 'High' AFTER `ConfidenceScore`,
    ADD COLUMN `AnomalyFlags` INT(11) NOT NULL DEFAULT 0 AFTER `ConfidenceBand`,
    ADD COLUMN `ReconciliationStatus` TINYINT(4) NOT NULL DEFAULT 0 AFTER `AnomalyFlags`;

ALTER TABLE `vehicle_trip_group`
    ADD KEY `idx_vehicle_trip_group_grouping_type` (`GroupingType`),
    ADD KEY `idx_vehicle_trip_group_reconciliation_status` (`ReconciliationStatus`),
    ADD KEY `idx_vehicle_trip_group_confidence_score` (`ConfidenceScore`);

-- =====================================================
-- Phase 2B: Persist trip leg metadata
-- =====================================================
ALTER TABLE `vehicle_trip`
    ADD COLUMN `ConfidenceScore` DECIMAL(5,2) NOT NULL DEFAULT 1.00 AFTER `DetectionMode`,
    ADD COLUMN `ConfidenceBand` VARCHAR(20) NOT NULL DEFAULT 'High' AFTER `ConfidenceScore`,
    ADD COLUMN `AnomalyFlags` INT(11) NOT NULL DEFAULT 0 AFTER `ConfidenceBand`,
    ADD COLUMN `ReconciliationStatus` TINYINT(4) NOT NULL DEFAULT 0 AFTER `AnomalyFlags`,
    ADD COLUMN `IsLowConfidence` BIT(1) NOT NULL DEFAULT b'0' AFTER `ReconciliationStatus`;

ALTER TABLE `vehicle_trip`
    ADD KEY `idx_vehicle_trip_reconciliation_status` (`ReconciliationStatus`),
    ADD KEY `idx_vehicle_trip_confidence_score` (`ConfidenceScore`),
    ADD KEY `idx_vehicle_trip_is_low_confidence` (`IsLowConfidence`);

-- =====================================================
-- Phase 2C: Backfill existing rows with safe defaults
-- =====================================================
UPDATE `vehicle_trip_group`
SET
    `GroupingType` = CASE
        WHEN `TripCount` > 1 AND `MovementProfile` = 2 THEN 3
        WHEN `TripCount` > 1 THEN 2
        ELSE 1
    END,
    `ConfidenceScore` = 1.00,
    `ConfidenceBand` = 'High',
    `AnomalyFlags` = 0,
    `ReconciliationStatus` = 0
WHERE 1 = 1;

UPDATE `vehicle_trip`
SET
    `ConfidenceScore` = 1.00,
    `ConfidenceBand` = 'High',
    `AnomalyFlags` = 0,
    `ReconciliationStatus` = 0,
    `IsLowConfidence` = b'0'
WHERE 1 = 1;

-- =====================================================
-- Enum reference values used by application code
-- =====================================================
-- GroupingType:
--   0 = None
--   1 = SingleLeg
--   2 = RoundTrip
--   3 = LoadCycle
--
-- ReconciliationStatus:
--   0 = Pending
--   1 = Confirmed
--   2 = Split
--   3 = Merged
--   4 = Adjusted
--   5 = Anomaly
--
-- AnomalyFlags is a bitwise integer:
--   1  = LowConfidence
--   2  = UnknownOriginOrDestination
--   4  = GpsGapSuspected
--   8  = OffSiteIdleSuspected
--   16 = UnmatchedReturn
