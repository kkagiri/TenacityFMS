-- Migration: Add mobile location fields to pumptransaction table
-- Purpose: Store fueling location captured from mobile app during pump authorization
-- This provides a fallback when LocationValidationLog linking fails
-- Date: 2026-01-21

-- Add mobile location columns to pumptransaction table
ALTER TABLE `pumptransaction`
    ADD COLUMN `MobileLatitude` DECIMAL(10,7) NULL COMMENT 'Mobile app GPS latitude at time of fueling authorization' AFTER `Odometer`,
    ADD COLUMN `MobileLongitude` DECIMAL(10,7) NULL COMMENT 'Mobile app GPS longitude at time of fueling authorization' AFTER `MobileLatitude`,
    ADD COLUMN `MobileAccuracy` DECIMAL(10,2) NULL COMMENT 'Mobile app GPS accuracy in meters at time of fueling' AFTER `MobileLongitude`;

-- Add index for location queries (optional, for performance if querying by location)
-- ALTER TABLE `pumptransaction`
--     ADD INDEX `idx_pumptransaction_location` (`MobileLatitude`, `MobileLongitude`);

-- Verify the changes
DESCRIBE `pumptransaction`;
