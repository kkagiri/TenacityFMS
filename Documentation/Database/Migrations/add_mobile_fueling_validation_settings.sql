-- Migration: Add Mobile Fueling Validation Settings to automatedfuelingconfigurations table
-- Date: 2024
-- Description: Adds admin-managed settings for mobile app fuel validation features

-- Check if columns exist before adding (for MySQL 8.0+)
-- Add EnableFuelRulesCheck column
ALTER TABLE automatedfuelingconfigurations 
ADD COLUMN IF NOT EXISTS EnableFuelRulesCheck TINYINT(1) NOT NULL DEFAULT 1 
COMMENT 'Whether to check if vehicle has fueling rules before allowing fueling (mobile app)';

-- Add EnableFuelCapacityValidation column
ALTER TABLE automatedfuelingconfigurations 
ADD COLUMN IF NOT EXISTS EnableFuelCapacityValidation TINYINT(1) NOT NULL DEFAULT 1 
COMMENT 'Whether to validate fuel volume against vehicle tank capacity (mobile app)';

-- Add EnableGPSFuelLevelCheck column  
ALTER TABLE automatedfuelingconfigurations 
ADD COLUMN IF NOT EXISTS EnableGPSFuelLevelCheck TINYINT(1) NOT NULL DEFAULT 1 
COMMENT 'Whether to use GPS fuel level sensor to calculate remaining tank capacity (mobile app)';

-- Alternative syntax for older MySQL versions (run these if the above fails):
-- 
-- ALTER TABLE automatedfuelingconfigurations 
-- ADD COLUMN EnableFuelRulesCheck TINYINT(1) NOT NULL DEFAULT 1;
-- 
-- ALTER TABLE automatedfuelingconfigurations 
-- ADD COLUMN EnableFuelCapacityValidation TINYINT(1) NOT NULL DEFAULT 1;
-- 
-- ALTER TABLE automatedfuelingconfigurations 
-- ADD COLUMN EnableGPSFuelLevelCheck TINYINT(1) NOT NULL DEFAULT 1;

-- Verify the migration
SELECT 
    COLUMN_NAME, 
    COLUMN_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'automatedfuelingconfigurations' 
AND COLUMN_NAME IN ('EnableFuelRulesCheck', 'EnableFuelCapacityValidation', 'EnableGPSFuelLevelCheck');
