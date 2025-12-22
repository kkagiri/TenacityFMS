-- Migration: Add Odometer column to pumptransactions table
-- Purpose: Store vehicle odometer reading at time of fueling
-- Date: 2025-12-22

USE `gpsdata`;

-- Add Odometer column to pumptransactions table
ALTER TABLE `pumptransactions`
ADD COLUMN `Odometer` DECIMAL(10,2) NULL COMMENT 'Vehicle odometer reading at time of fueling (kilometers or miles)'
AFTER `VehicleId`;

-- Add index for querying by vehicle and odometer
CREATE INDEX `idx_pumptransactions_vehicle_odometer`
ON `pumptransactions` (`VehicleId`, `Odometer`);

-- Verify the column was added
SELECT
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_COMMENT
FROM
    INFORMATION_SCHEMA.COLUMNS
WHERE
    TABLE_SCHEMA = 'gpsdata'
    AND TABLE_NAME = 'pumptransactions'
    AND COLUMN_NAME = 'Odometer';
