-- File: calibrationintervalaccumulations-add-seededfromsnapshotid.sql
-- Purpose: Adds SeededFromSnapshotId column to track which snapshot was used to seed a baseline interval.
-- Compatibility: MySQL 5.5.6+
-- Last Modified: 2026-03-25

ALTER TABLE `calibrationintervalaccumulations`
    ADD COLUMN `SeededFromSnapshotId` BIGINT NULL DEFAULT NULL;
