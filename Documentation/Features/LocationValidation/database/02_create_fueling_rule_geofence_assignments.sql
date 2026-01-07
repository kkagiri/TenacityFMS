-- ============================================================================
-- FMS Geofence Caching & Location Validation Feature
-- Script 02: Create Fueling Rule Set Geofence Assignments
--
-- Purpose: Link fueling rule sets to geofences and geofence groups
--          for location-based validation during fueling operations
--
-- Author: FMS Development Team
-- Date: 2026-01-08
-- ============================================================================

-- Table: fueling_rule_set_geofence
-- Purpose: Link individual geofences to fueling rule sets
CREATE TABLE IF NOT EXISTS `fueling_rule_set_geofence` (
  `Id` INT(11) NOT NULL AUTO_INCREMENT,
  `fueling_rule_set_id` INT(11) NOT NULL,
  `geofence_id` INT(11) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` VARCHAR(100) NULL COMMENT 'User who created the assignment',
  PRIMARY KEY (`Id`),
  UNIQUE INDEX `IX_fueling_rule_set_geofence_unique` (`fueling_rule_set_id` ASC, `geofence_id` ASC),
  INDEX `IX_fueling_rule_set_geofence_geofence_id` (`geofence_id` ASC),
  CONSTRAINT `FK_fueling_rule_set_geofence_ruleset`
    FOREIGN KEY (`fueling_rule_set_id`)
    REFERENCES `fuelingruleset` (`Id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `FK_fueling_rule_set_geofence_geofence`
    FOREIGN KEY (`geofence_id`)
    REFERENCES `gps_geofence` (`Id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Individual geofence assignments to rule sets';

-- Table: fueling_rule_set_geofence_group
-- Purpose: Link geofence groups to fueling rule sets
CREATE TABLE IF NOT EXISTS `fueling_rule_set_geofence_group` (
  `Id` INT(11) NOT NULL AUTO_INCREMENT,
  `fueling_rule_set_id` INT(11) NOT NULL,
  `geofence_group_id` INT(11) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` VARCHAR(100) NULL COMMENT 'User who created the assignment',
  PRIMARY KEY (`Id`),
  UNIQUE INDEX `IX_fueling_rule_set_geofence_group_unique` (`fueling_rule_set_id` ASC, `geofence_group_id` ASC),
  INDEX `IX_fueling_rule_set_geofence_group_group_id` (`geofence_group_id` ASC),
  CONSTRAINT `FK_fueling_rule_set_geofence_group_ruleset`
    FOREIGN KEY (`fueling_rule_set_id`)
    REFERENCES `fuelingruleset` (`Id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `FK_fueling_rule_set_geofence_group_group`
    FOREIGN KEY (`geofence_group_id`)
    REFERENCES `gps_geofence_group` (`Id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Geofence group assignments to rule sets';

-- ============================================================================
-- Verification Query
-- ============================================================================
SELECT
    'fueling_rule_set_geofence' AS table_name,
    COUNT(*) AS row_count
FROM fueling_rule_set_geofence
UNION ALL
SELECT
    'fueling_rule_set_geofence_group' AS table_name,
    COUNT(*) AS row_count
FROM fueling_rule_set_geofence_group;
