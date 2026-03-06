-- ============================================================================
-- Migration: Add new fields to fuel_audit_vehicle_positions table
-- Purpose: Support saving edited vehicle fuel data from wizard steps 5-6
-- Date: 2025-12-04
-- MySQL 5.6 Compatible
-- ============================================================================

-- Add GPS measured consumption field
ALTER TABLE `fuel_audit_vehicle_positions`
ADD COLUMN `gps_measured_consumption` DECIMAL(10,2) NULL
COMMENT 'GPS-measured fuel consumption from GPS fuel level monitoring'
AFTER `fuel_consumed`;

-- Add variance flag message field
ALTER TABLE `fuel_audit_vehicle_positions`
ADD COLUMN `variance_flag_message` VARCHAR(500) NULL
COMMENT 'Message describing the variance flag reason'
AFTER `has_variance_flag`;

-- Add manually edited indicator field
ALTER TABLE `fuel_audit_vehicle_positions`
ADD COLUMN `is_manually_edited` BIT(1) NOT NULL DEFAULT 0
COMMENT 'Indicates if values were manually edited by user'
AFTER `variance_flag_message`;

-- ============================================================================
-- Verification query
-- ============================================================================
-- SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
-- FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_NAME = 'fuel_audit_vehicle_positions'
--   AND COLUMN_NAME IN ('gps_measured_consumption', 'variance_flag_message', 'is_manually_edited');
