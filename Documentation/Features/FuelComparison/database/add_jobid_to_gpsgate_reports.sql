-- Migration: Add JobId column to gpsgate_reports table
-- Purpose: Track the GUID job identifier used for cancellation
-- Date: 2025-11-26

-- Add JobId column (nullable initially for existing records)
ALTER TABLE `gpsgate_reports`
ADD COLUMN `JobId` VARCHAR(50) NULL COMMENT 'GUID job identifier for tracking cancellation'
AFTER `HandleId`;

-- Create index for faster lookups by JobId
CREATE INDEX `idx_gpsgate_reports_jobid` ON `gpsgate_reports` (`JobId`);

-- Create composite index for JobId + Status (used in cancellation queries)
CREATE INDEX `idx_gpsgate_reports_jobid_status` ON `gpsgate_reports` (`JobId`, `Status`);
