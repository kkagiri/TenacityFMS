-- ============================================================================
-- FMS Geofence Caching & Location Validation Feature
-- Script 01: Create GPS Geofence Tables
--
-- Purpose: Create tables for caching geofence data from GPSGate
--          and managing geofence groups for fueling location validation
--
-- Author: FMS Development Team
-- Date: 2026-01-08
-- ============================================================================

-- Table: gps_geofence
-- Purpose: Cache geofence data from GPSGate for local validation
CREATE TABLE IF NOT EXISTS `gps_geofence` (
  `Id` INT(11) NOT NULL AUTO_INCREMENT,
  `external_geofence_id` INT(11) NOT NULL COMMENT 'GPSGate geofence ID',
  `name` VARCHAR(200) NOT NULL,
  `description` VARCHAR(500) NULL,
  `geofence_type` VARCHAR(20) NOT NULL COMMENT 'Circle, Polygon, Rectangle',
  `geometry_json` LONGTEXT NULL COMMENT 'Geofence geometry definition in JSON format',
  `center_latitude` DECIMAL(10, 8) NULL,
  `center_longitude` DECIMAL(11, 8) NULL,
  `radius_meters` DECIMAL(10, 2) NULL COMMENT 'For circular geofences',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_synced_at` DATETIME NULL COMMENT 'Last sync from GPSGate',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`Id`),
  UNIQUE INDEX `IX_gps_geofence_external_id` (`external_geofence_id` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Cached geofence data from GPSGate';

-- Table: gps_geofence_group
-- Purpose: Cache geofence groups from GPSGate for organizing geofences
CREATE TABLE IF NOT EXISTS `gps_geofence_group` (
  `Id` INT(11) NOT NULL AUTO_INCREMENT,
  `external_group_id` INT(11) NOT NULL COMMENT 'GPSGate geofence group ID',
  `name` VARCHAR(200) NOT NULL,
  `description` VARCHAR(500) NULL,
  `colour` VARCHAR(20) NULL COMMENT 'Display color from GPSGate',
  `is_pinned` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_synced_at` DATETIME NULL COMMENT 'Last sync from GPSGate',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`Id`),
  UNIQUE INDEX `IX_gps_geofence_group_external_id` (`external_group_id` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Cached geofence groups from GPSGate';

-- Table: gps_geofence_group_member
-- Purpose: Many-to-many relationship between groups and geofences
CREATE TABLE IF NOT EXISTS `gps_geofence_group_member` (
  `Id` INT(11) NOT NULL AUTO_INCREMENT,
  `group_id` INT(11) NOT NULL,
  `geofence_id` INT(11) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  UNIQUE INDEX `IX_gps_geofence_group_member_unique` (`group_id` ASC, `geofence_id` ASC),
  CONSTRAINT `FK_geofence_group_member_group`
    FOREIGN KEY (`group_id`)
    REFERENCES `gps_geofence_group` (`Id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `FK_geofence_group_member_geofence`
    FOREIGN KEY (`geofence_id`)
    REFERENCES `gps_geofence` (`Id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Group membership for geofences';

-- ============================================================================
-- Verification Query
-- ============================================================================
SELECT
    'gps_geofence' AS table_name,
    COUNT(*) AS row_count
FROM gps_geofence
UNION ALL
SELECT
    'gps_geofence_group' AS table_name,
    COUNT(*) AS row_count
FROM gps_geofence_group
UNION ALL
SELECT
    'gps_geofence_group_member' AS table_name,
    COUNT(*) AS row_count
FROM gps_geofence_group_member;
