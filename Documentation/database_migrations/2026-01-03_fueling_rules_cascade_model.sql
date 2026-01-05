-- ============================================================================
-- FUELING RULES REDESIGN MIGRATION
-- Purpose: Implement cascade/hierarchy rule assignment model
-- Created: 2026-01-03
--
-- Changes:
-- 1. Create fueling_rule_set_assignments table for hierarchy-based assignments
-- 2. Add fueling_limit_per_transaction column to fuelingrule table
-- 3. Add time window columns for TimeWindowRule
-- ============================================================================

-- ============================================================================
-- STEP 1: Create the fueling_rule_set_assignments table
-- ============================================================================
-- This table links RuleSets to targets (Site, VehicleType, Vehicle, Tag)
-- enabling the cascade model: Site → VehicleType → Tag → Vehicle

CREATE TABLE IF NOT EXISTS `fueling_rule_set_assignments` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `fueling_rule_set_id` INT(11) NOT NULL COMMENT 'FK to fuelingruleset - the template being assigned',
    `target_type` VARCHAR(20) NOT NULL COMMENT 'Site, VehicleType, Tag, or Vehicle',

    -- Target IDs (only ONE should be populated based on target_type)
    `site_id` INT(11) NULL COMMENT 'FK to sites (when target_type = Site)',
    `vehicle_type_id` INT(11) NULL COMMENT 'FK to vehicletypes (when target_type = VehicleType)',
    `vehicle_id` INT(11) NULL COMMENT 'FK to vehicles (when target_type = Vehicle)',
    `tag_id` INT(11) NULL COMMENT 'FK to fuel_tags (when target_type = Tag)',

    -- Priority for conflict resolution (higher = more specific = wins)
    `priority` INT(11) NOT NULL DEFAULT 0 COMMENT 'Default: Site=10, VehicleType=50, Tag=80, Vehicle=100',

    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `description` VARCHAR(500) NULL COMMENT 'Optional notes about this assignment',

    -- Audit
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_by_user_id` INT(11) NULL,
    `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    `updated_by_user_id` INT(11) NULL,

    PRIMARY KEY (`id`),

    -- Indexes for efficient lookups
    INDEX `IX_Assignment_RuleSetId` (`fueling_rule_set_id`),
    INDEX `IX_Assignment_SiteId` (`site_id`),
    INDEX `IX_Assignment_VehicleTypeId` (`vehicle_type_id`),
    INDEX `IX_Assignment_VehicleId` (`vehicle_id`),
    INDEX `IX_Assignment_TagId` (`tag_id`),
    INDEX `IX_Assignment_TargetType_Active` (`target_type`, `is_active`),

    -- Foreign Keys
    CONSTRAINT `FK_Assignment_FuelingRuleSet`
        FOREIGN KEY (`fueling_rule_set_id`)
        REFERENCES `fuelingruleset` (`Id`)
        ON DELETE CASCADE,

    CONSTRAINT `FK_Assignment_Site`
        FOREIGN KEY (`site_id`)
        REFERENCES `sites` (`site_id`)
        ON DELETE CASCADE,

    CONSTRAINT `FK_Assignment_VehicleType`
        FOREIGN KEY (`vehicle_type_id`)
        REFERENCES `vehicletypes` (`VehicleTypeId`)
        ON DELETE CASCADE,

    CONSTRAINT `FK_Assignment_Vehicle`
        FOREIGN KEY (`vehicle_id`)
        REFERENCES `vehicles` (`vehicle_id`)
        ON DELETE CASCADE,

    CONSTRAINT `FK_Assignment_FuelTag`
        FOREIGN KEY (`tag_id`)
        REFERENCES `fuel_tags` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Links FuelingRuleSets to targets (Site/VehicleType/Tag/Vehicle) for cascade model';


-- ============================================================================
-- STEP 2: Add new columns to fuelingrule table
-- ============================================================================

-- Add per-transaction limit column (for DailyMonthlyLimitRule)
-- NOTE: Using PascalCase to match existing column naming convention
ALTER TABLE `fuelingrule`
ADD COLUMN IF NOT EXISTS `FuelingLimitPerTransaction` INT(11) NULL
COMMENT 'Max fuel per single transaction in liters (e.g., 100L/refill)'
AFTER `MonthlyLimitLiter`;

-- Add time window columns (for TimeWindowRule)
ALTER TABLE `fuelingrule`
ADD COLUMN IF NOT EXISTS `StartTime` TIME NULL
COMMENT 'Start of allowed fueling window (TimeWindowRule)'
AFTER `MaxRefillsPerMonth`;

ALTER TABLE `fuelingrule`
ADD COLUMN IF NOT EXISTS `EndTime` TIME NULL
COMMENT 'End of allowed fueling window (TimeWindowRule)'
AFTER `StartTime`;


-- ============================================================================
-- STEP 3: Verify columns exist (for environments without IF NOT EXISTS support)
-- ============================================================================
-- Run these if the IF NOT EXISTS syntax fails:
/*
-- Check if column exists before adding
SET @dbname = DATABASE();
SET @tablename = 'fuelingrule';
SET @columnname = 'fueling_limit_per_transaction';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1', -- Column exists, do nothing
    CONCAT('ALTER TABLE `', @tablename, '` ADD COLUMN `', @columnname, '` INT(11) NULL')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
*/


-- ============================================================================
-- STEP 4: Sample data for testing (optional)
-- ============================================================================
/*
-- Create a sample site-level assignment (applies to all vehicles at site)
INSERT INTO `fueling_rule_set_assignments`
    (`fueling_rule_set_id`, `target_type`, `site_id`, `priority`, `description`)
VALUES
    (1, 'Site', 1, 10, 'Default rules for Site 1 - all vehicles');

-- Create a vehicle-type override (Tippers get different limits)
INSERT INTO `fueling_rule_set_assignments`
    (`fueling_rule_set_id`, `target_type`, `vehicle_type_id`, `priority`, `description`)
VALUES
    (2, 'VehicleType', 5, 50, 'Special rules for Tippers - 150L per transaction');

-- Create a vehicle-specific override (one problematic vehicle)
INSERT INTO `fueling_rule_set_assignments`
    (`fueling_rule_set_id`, `target_type`, `vehicle_id`, `priority`, `description`)
VALUES
    (3, 'Vehicle', 123, 100, 'Restricted rules for Vehicle 123 - under investigation');
*/


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify table was created
SELECT 'fueling_rule_set_assignments table' AS Description,
       COUNT(*) AS Exists
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name = 'fueling_rule_set_assignments';

-- Verify new columns in fuelingrule (using PascalCase to match existing convention)
SELECT 'fuelingrule columns' AS Description,
       column_name, data_type
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'fuelingrule'
  AND column_name IN ('FuelingLimitPerTransaction', 'StartTime', 'EndTime');


-- ============================================================================
-- EXAMPLE: How assignments cascade
-- ============================================================================
/*
Query to get all applicable rules for a vehicle at a site:

SELECT a.*, rs.Name as RuleSetName
FROM fueling_rule_set_assignments a
JOIN fuelingruleset rs ON a.fueling_rule_set_id = rs.Id
WHERE a.is_active = 1
  AND (
    (a.target_type = 'Site' AND a.site_id = @siteId) OR
    (a.target_type = 'VehicleType' AND a.vehicle_type_id = @vehicleTypeId) OR
    (a.target_type = 'Vehicle' AND a.vehicle_id = @vehicleId) OR
    (a.target_type = 'Tag' AND a.tag_id = @tagId)
  )
ORDER BY a.priority ASC;  -- Lower priority first, higher overrides
*/
