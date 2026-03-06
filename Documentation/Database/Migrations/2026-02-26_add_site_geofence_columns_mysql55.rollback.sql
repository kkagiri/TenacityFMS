-- Rollback: Remove GPS geofence columns from site
-- Date: 2026-02-26
-- Target: MySQL 5.5.6

ALTER TABLE `site` DROP FOREIGN KEY `FK_Site_GpsGeofence`;
ALTER TABLE `site` DROP INDEX `IX_Site_GpsGeofence`;

ALTER TABLE `site`
  DROP COLUMN `gps_geofence_center_longitude`,
  DROP COLUMN `gps_geofence_center_latitude`,
  DROP COLUMN `gps_geofence_type`,
  DROP COLUMN `gps_geofence_name`,
  DROP COLUMN `gps_geofence_id`;
