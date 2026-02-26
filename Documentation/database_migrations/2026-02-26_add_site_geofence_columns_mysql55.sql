-- Migration: Add GPS geofence columns to site
-- Date: 2026-02-26
-- Target: MySQL 5.5.6 compatible schema
-- Reason: Support selecting a GPSGate geofence in Site Edit and persisting snapshot details

ALTER TABLE `site`
  ADD COLUMN `gps_geofence_id` INT(11) NULL COMMENT 'Selected local GPS geofence ID from gps_geofence' AFTER `gps_gate_tag_name`,
  ADD COLUMN `gps_geofence_name` VARCHAR(200) NULL COMMENT 'Selected GPS geofence display name snapshot' AFTER `gps_geofence_id`,
  ADD COLUMN `gps_geofence_type` VARCHAR(20) NULL COMMENT 'Selected GPS geofence type snapshot: Circle, Polygon, Route' AFTER `gps_geofence_name`,
  ADD COLUMN `gps_geofence_center_latitude` DECIMAL(10,7) NULL COMMENT 'Selected GPS geofence center latitude snapshot' AFTER `gps_geofence_type`,
  ADD COLUMN `gps_geofence_center_longitude` DECIMAL(10,7) NULL COMMENT 'Selected GPS geofence center longitude snapshot' AFTER `gps_geofence_center_latitude`;

ALTER TABLE `site`
  ADD INDEX `IX_Site_GpsGeofence` (`gps_geofence_id`);

ALTER TABLE `site`
  ADD CONSTRAINT `FK_Site_GpsGeofence`
  FOREIGN KEY (`gps_geofence_id`) REFERENCES `gps_geofence` (`id`)
  ON DELETE SET NULL
  ON UPDATE RESTRICT;

-- Verification
-- SELECT COLUMN_NAME
-- FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_SCHEMA = DATABASE()
--   AND TABLE_NAME = 'site'
--   AND COLUMN_NAME IN (
--     'gps_geofence_id',
--     'gps_geofence_name',
--     'gps_geofence_type',
--     'gps_geofence_center_latitude',
--     'gps_geofence_center_longitude'
--   );
