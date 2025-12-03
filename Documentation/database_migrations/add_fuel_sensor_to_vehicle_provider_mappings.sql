-- Migration: Add fuel sensor tracking to vehicle_provider_mappings table
-- Date: 2024-12-03
-- Description: Adds columns to track whether a vehicle has a fuel sensor installed
--              This is cached from GPSGate API to avoid repeated lookups during classification

-- Add fuel sensor columns to vehicle_provider_mappings table
ALTER TABLE `vehicle_provider_mappings`
    ADD COLUMN `has_fuel_sensor` TINYINT(1) NULL DEFAULT NULL
        COMMENT 'Whether the device has a fuel sensor installed (cached from GPSGate)'
        AFTER `device_type`,
    ADD COLUMN `fuel_sensor_type` VARCHAR(100) NULL DEFAULT NULL
        COMMENT 'Type of fuel sensor if installed (e.g., CapacitiveFuelSensor, FlowMeter)'
        AFTER `has_fuel_sensor`,
    ADD COLUMN `fuel_sensor_verified_at` DATETIME NULL DEFAULT NULL
        COMMENT 'Last time the fuel sensor status was verified/updated from GPSGate'
        AFTER `fuel_sensor_type`;

-- Add index for quick lookups of vehicles with fuel sensors
CREATE INDEX `idx_vehicle_fuel_sensor` ON `vehicle_provider_mappings` (`vehicle_id`, `is_active`, `has_fuel_sensor`);

-- Update existing records: Set has_fuel_sensor to NULL (unknown) initially
-- A background job should populate this by calling GPSGate API for each vehicle
UPDATE `vehicle_provider_mappings` SET `has_fuel_sensor` = NULL WHERE 1=1;

-- Example query to update a specific vehicle's fuel sensor status:
-- UPDATE `vehicle_provider_mappings`
-- SET `has_fuel_sensor` = 1,
--     `fuel_sensor_type` = 'CapacitiveFuelSensor',
--     `fuel_sensor_verified_at` = NOW()
-- WHERE `vehicle_id` = ? AND `is_active` = 1;

-- To rollback:
-- ALTER TABLE `vehicle_provider_mappings`
--     DROP INDEX `idx_vehicle_fuel_sensor`,
--     DROP COLUMN `fuel_sensor_verified_at`,
--     DROP COLUMN `fuel_sensor_type`,
--     DROP COLUMN `has_fuel_sensor`;
