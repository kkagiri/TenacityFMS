-- Migration: Add ProbeNumber, PtsTankId, and UsePtsProbeReadings columns to tanks table
-- Date: 2026-02-05
-- Description: Store PTS probe binding directly on the tank instead of in systemconfigurations table.
--              ProbeNumber: The physical probe number assigned to this tank for ATG/probe measurements
--              PtsTankId: Reserved for future JsonPTS services (tank ID in PTS system)
--              UsePtsProbeReadings: Whether to auto-update physical stock from probe readings

-- Add ProbeNumber column
ALTER TABLE `tanks`
ADD COLUMN `ProbeNumber` INT NULL COMMENT 'The physical probe number assigned to this tank for ATG/probe measurements' AFTER `PtsId`;

-- Add PtsTankId column
ALTER TABLE `tanks`
ADD COLUMN `PtsTankId` INT NULL COMMENT 'The tank ID in the PTS system. Reserved for future JsonPTS services' AFTER `ProbeNumber`;

-- Add UsePtsProbeReadings column
ALTER TABLE `tanks`
ADD COLUMN `UsePtsProbeReadings` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Whether to use PTS probe readings for automatic physical stock updates on this tank' AFTER `PtsTankId`;

-- Optional: Migrate existing data from systemconfigurations to tanks table
-- This query updates tanks with their probe numbers from the old systemconfigurations storage
-- RUN THIS ONLY ONCE AFTER ADDING THE COLUMNS
UPDATE tanks t
INNER JOIN systemconfigurations sc ON sc.ConfigurationKey = CONCAT('PTS.TankBinding.ProbeNumber.', t.Id)
SET t.ProbeNumber = CAST(sc.ConfigurationValue AS SIGNED)
WHERE sc.IsActive = 1
  AND sc.ConfigurationValue IS NOT NULL
  AND sc.ConfigurationValue != '';

-- After migration is verified, you can clean up the old systemconfigurations entries:
-- WARNING: Only run this after verifying the migration worked correctly
-- DELETE FROM systemconfigurations WHERE ConfigurationKey LIKE 'PTS.TankBinding.ProbeNumber.%';
