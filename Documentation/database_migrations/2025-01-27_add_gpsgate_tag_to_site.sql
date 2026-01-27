-- Migration: Add GPSGate Tag Fields to Site Table
-- Description: Adds fields for GPSGate tag configuration to enable automatic tag updates when vehicles are transferred
-- Date: 2025-01-27
-- Author: System

-- Add GPSGate tag configuration columns to site table
ALTER TABLE `site`
ADD COLUMN `gps_gate_tag_id` INT(11) NULL DEFAULT NULL COMMENT 'The GPSGate tag ID for monitoring vehicles at this site' AFTER `site_administrator_id`,
ADD COLUMN `gps_gate_tag_name` VARCHAR(100) NULL DEFAULT NULL COMMENT 'The GPSGate tag name for display purposes' AFTER `gps_gate_tag_id`,
ADD COLUMN `auto_update_gps_gate_tag` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Whether to automatically update GPSGate tags when vehicles are transferred' AFTER `gps_gate_tag_name`;

-- Add index for efficient tag lookups
ALTER TABLE `site`
ADD INDEX `IX_site_gps_gate_tag_id` (`gps_gate_tag_id`);

-- ============================================
-- MANUAL CONFIGURATION REQUIRED
-- ============================================
-- After running this migration, configure each site with its corresponding GPSGate tag.
-- You can get the tag IDs from GPSGate by calling: GET /applications/{appId}/tags
-- 
-- Example updates (adjust based on your actual GPSGate tags):
-- UPDATE site SET gps_gate_tag_id = 123, gps_gate_tag_name = 'HE_Meru' WHERE name = 'Meru';
-- UPDATE site SET gps_gate_tag_id = 124, gps_gate_tag_name = 'HE_Fujita' WHERE name = 'Fujita';
-- UPDATE site SET gps_gate_tag_id = 125, gps_gate_tag_name = 'HE_Nairobi' WHERE name = 'Nairobi';
-- 
-- To disable auto-update for specific sites:
-- UPDATE site SET auto_update_gps_gate_tag = 0 WHERE name = 'SomeSite';
