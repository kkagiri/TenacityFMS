-- =============================================================================
-- Migration:  Add sensor capture columns to issuecompletionrecord
-- Purpose:    Store technician-captured data for the new SensorReplacement and
--             SensorCalibration action types in the Issue Tracker workflow.
-- Target DB:  MySQL 5.5 / 5.6 (no CURRENT_TIMESTAMP defaults, no JSON)
-- Date:       2026-04-23
-- =============================================================================

-- Guarded ADD COLUMN (MySQL 5.5/5.6 has no "IF NOT EXISTS" for columns, so run once).
ALTER TABLE issuecompletionrecord
    ADD COLUMN OldSensorType      VARCHAR(100) NULL AFTER CameraSimNumber,
    ADD COLUMN NewSensorType      VARCHAR(100) NULL AFTER OldSensorType,
    ADD COLUMN SensorReason       VARCHAR(100) NULL AFTER NewSensorType,
    ADD COLUMN CalibrationResult  VARCHAR(100) NULL AFTER SensorReason;
