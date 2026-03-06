-- Migration: Add BypassLocationValidation column to AspNetUsers table
-- Description: Allows per-user GPS/location validation bypass for mobile fueling
-- Use case: Users operating in areas with poor GPS/network coverage
-- Date: 2025-01-XX

-- Add the column with default value of false (0)
ALTER TABLE `aspnetusers`
ADD COLUMN `BypassLocationValidation` TINYINT(1) NOT NULL DEFAULT 0
COMMENT 'When true, this user can bypass GPS/location validation during mobile fueling. Useful for users in areas with poor GPS/network coverage.';

-- Verify the column was added
-- SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
-- FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_NAME = 'aspnetusers' AND COLUMN_NAME = 'BypassLocationValidation';
