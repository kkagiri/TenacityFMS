-- ============================================================================
-- FMS Geofence Caching & Location Validation Feature
-- Script 04: Alter Vehicle Table - Add Fixed Location Columns
--
-- Purpose: Add columns to vehicle table for managing fixed/stationary
--          equipment locations for proximity validation during fueling
--
-- Author: FMS Development Team
-- Date: 2026-01-08
-- ============================================================================

-- Add fixed location properties for stationary equipment
ALTER TABLE `vehicle`
ADD COLUMN `is_fixed_location` TINYINT(1) NOT NULL DEFAULT 0
  COMMENT 'Indicates if this is a fixed/stationary asset (generator, pump, etc.)' AFTER `IsActive`,
ADD COLUMN `fixed_latitude` DECIMAL(10, 8) NULL
  COMMENT 'Registered latitude for fixed location' AFTER `is_fixed_location`,
ADD COLUMN `fixed_longitude` DECIMAL(11, 8) NULL
  COMMENT 'Registered longitude for fixed location' AFTER `fixed_latitude`,
ADD COLUMN `fixed_location_radius_meters` DECIMAL(10, 2) NULL DEFAULT 50
  COMMENT 'Allowed proximity radius in meters for fueling validation' AFTER `fixed_longitude`,
ADD COLUMN `fixed_location_name` VARCHAR(200) NULL
  COMMENT 'Descriptive name for the fixed location' AFTER `fixed_location_radius_meters`,
ADD COLUMN `fixed_location_last_verified_at` DATETIME NULL
  COMMENT 'When the fixed location was last verified/updated' AFTER `fixed_location_name`,
ADD COLUMN `fixed_location_verified_by` VARCHAR(100) NULL
  COMMENT 'User who last verified/updated the fixed location' AFTER `fixed_location_last_verified_at`,
ADD COLUMN `require_proximity_validation` TINYINT(1) NOT NULL DEFAULT 1
  COMMENT 'Whether to require proximity validation for fueling' AFTER `fixed_location_verified_by`;

-- Add index for querying fixed location vehicles
CREATE INDEX `IX_vehicle_fixed_location` ON `vehicle` (`is_fixed_location` ASC);

-- ============================================================================
-- Verification Query
-- ============================================================================
SELECT
    COLUMN_NAME,
    COLUMN_TYPE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'vehicle'
  AND COLUMN_NAME LIKE '%fixed%'
ORDER BY ORDINAL_POSITION;

-- Query to show indexes
SHOW INDEX FROM `vehicle` WHERE Key_name = 'IX_vehicle_fixed_location';
