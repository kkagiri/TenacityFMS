-- =====================================================
-- Migration: Add PTSName column to ptsdevice table
-- Date: 2026-01-03
-- Description: Adds a human-readable name field for PTS devices
-- =====================================================

-- Add PTSName column after PTSId
ALTER TABLE `ptsdevice`
ADD COLUMN `PTSName` VARCHAR(200) NULL DEFAULT NULL
COMMENT 'Human-readable name for the PTS device'
AFTER `PTSId`;

-- Update existing records to have a default name based on PTSId (optional)
-- Uncomment if you want to populate existing records
-- UPDATE `ptsdevice` SET `PTSName` = CONCAT('PTS Device - ', `PTSId`) WHERE `PTSName` IS NULL;

-- =====================================================
-- Rollback script (if needed)
-- =====================================================
-- ALTER TABLE `ptsdevice` DROP COLUMN `PTSName`;
