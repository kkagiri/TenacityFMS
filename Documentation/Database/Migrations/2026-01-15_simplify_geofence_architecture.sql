-- ==========================================================
-- Migration Script: Simplify Geofence Architecture
-- Date: 2026-01-15
-- Compatible with: MySQL 5.5.6+
-- Description:
--   1. Add is_allowed_for_fueling column to gps_geofence_group table
--   2. Add temporary bypass system configuration entries
--   3. Drop deprecated ruleset geofence tables
--   4. Remove fixed location columns from vehicle table (if exist)
-- ==========================================================

-- Step 1: Add is_allowed_for_fueling column to gps_geofence_group
-- Check if column exists first using stored procedure (MySQL 5.5 compatible)

DELIMITER //

DROP PROCEDURE IF EXISTS add_column_if_not_exists//

CREATE PROCEDURE add_column_if_not_exists(
    IN p_table_name VARCHAR(128),
    IN p_column_name VARCHAR(128),
    IN p_column_definition VARCHAR(255)
)
BEGIN
    DECLARE column_exists INT;

    SELECT COUNT(*) INTO column_exists
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
    AND table_name = p_table_name
    AND column_name = p_column_name;

    IF column_exists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE ', p_table_name, ' ADD COLUMN ', p_column_name, ' ', p_column_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END//

DELIMITER ;

CALL add_column_if_not_exists('gps_geofence_group', 'is_allowed_for_fueling', 'TINYINT(1) NOT NULL DEFAULT 0');

DROP PROCEDURE IF EXISTS add_column_if_not_exists;

-- Step 2: Add temporary bypass system configuration entries
-- Using INSERT IGNORE (requires unique key on ConfigurationKey) or ON DUPLICATE KEY UPDATE

INSERT INTO systemconfigurations (ConfigurationKey, ConfigurationValue, Category, Description, DataType, IsActive, IsEditable, CreatedAt)
VALUES ('FuelingRules.TemporaryBypass.IsActive', 'false', 'FuelingRules', 'Whether temporary bypass is currently active', 'Boolean', 1, 1, NOW())
ON DUPLICATE KEY UPDATE UpdatedAt = NOW();

INSERT INTO systemconfigurations (ConfigurationKey, ConfigurationValue, Category, Description, DataType, IsActive, IsEditable, CreatedAt)
VALUES ('FuelingRules.TemporaryBypass.ExpiresAt', '', 'FuelingRules', 'When the temporary bypass expires (ISO 8601 format)', 'String', 1, 1, NOW())
ON DUPLICATE KEY UPDATE UpdatedAt = NOW();

INSERT INTO systemconfigurations (ConfigurationKey, ConfigurationValue, Category, Description, DataType, IsActive, IsEditable, CreatedAt)
VALUES ('FuelingRules.TemporaryBypass.EnabledBy', '', 'FuelingRules', 'Who enabled the temporary bypass', 'String', 1, 1, NOW())
ON DUPLICATE KEY UPDATE UpdatedAt = NOW();

INSERT INTO systemconfigurations (ConfigurationKey, ConfigurationValue, Category, Description, DataType, IsActive, IsEditable, CreatedAt)
VALUES ('FuelingRules.TemporaryBypass.EnabledAt', '', 'FuelingRules', 'When the temporary bypass was enabled (ISO 8601 format)', 'String', 1, 1, NOW())
ON DUPLICATE KEY UPDATE UpdatedAt = NOW();

INSERT INTO systemconfigurations (ConfigurationKey, ConfigurationValue, Category, Description, DataType, IsActive, IsEditable, CreatedAt)
VALUES ('FuelingRules.TemporaryBypass.Reason', '', 'FuelingRules', 'Reason for the temporary bypass', 'String', 1, 1, NOW())
ON DUPLICATE KEY UPDATE UpdatedAt = NOW();

-- Step 3: Drop deprecated ruleset geofence tables
-- WARNING: This will permanently delete data. Backup first if needed.

DROP TABLE IF EXISTS fueling_rule_set_geofence_group;
DROP TABLE IF EXISTS fueling_rule_set_geofence;

-- Step 4: Remove fixed location columns from vehicle table (if they exist)

DELIMITER //

DROP PROCEDURE IF EXISTS drop_column_if_exists//

CREATE PROCEDURE drop_column_if_exists(
    IN p_table_name VARCHAR(128),
    IN p_column_name VARCHAR(128)
)
BEGIN
    DECLARE column_exists INT;

    SELECT COUNT(*) INTO column_exists
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
    AND table_name = p_table_name
    AND column_name = p_column_name;

    IF column_exists > 0 THEN
        SET @sql = CONCAT('ALTER TABLE ', p_table_name, ' DROP COLUMN ', p_column_name);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END//

DELIMITER ;

CALL drop_column_if_exists('vehicle', 'is_fixed_location');
CALL drop_column_if_exists('vehicle', 'fixed_latitude');
CALL drop_column_if_exists('vehicle', 'fixed_longitude');
CALL drop_column_if_exists('vehicle', 'fixed_location_radius_meters');
CALL drop_column_if_exists('vehicle', 'fixed_location_name');
CALL drop_column_if_exists('vehicle', 'fixed_location_last_verified_at');
CALL drop_column_if_exists('vehicle', 'fixed_location_verified_by');
CALL drop_column_if_exists('vehicle', 'require_proximity_validation');

DROP PROCEDURE IF EXISTS drop_column_if_exists;

-- Step 5: Mark deprecated system configuration as inactive
UPDATE systemconfigurations
SET IsActive = 0, UpdatedAt = NOW()
WHERE ConfigurationKey = 'FuelingRules.EnableFixedLocationValidation';

-- ==========================================================
-- Rollback Script (in case of issues)
-- ==========================================================
-- To rollback, execute the following:
--
-- ALTER TABLE gps_geofence_group DROP COLUMN is_allowed_for_fueling;
--
-- DELETE FROM systemconfigurations WHERE ConfigurationKey LIKE 'FuelingRules.TemporaryBypass.%';
--
-- UPDATE systemconfigurations
-- SET IsActive = 1, UpdatedAt = NOW()
-- WHERE ConfigurationKey = 'FuelingRules.EnableFixedLocationValidation';
--
-- Note: The dropped tables (fueling_rule_set_geofence, fueling_rule_set_geofence_group)
-- and vehicle fixed location columns cannot be restored from this script.
-- Restore from backup if needed.
-- ==========================================================
