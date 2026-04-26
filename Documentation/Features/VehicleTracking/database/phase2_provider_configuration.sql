-- ============================================================================
-- Vehicle Tracking Provider Configuration System - Database Schema
-- Phase 2 Implementation
-- MySQL 8.0+
-- ============================================================================

-- Table 1: Provider Configurations
-- Stores GPS/tracking provider configurations
CREATE TABLE IF NOT EXISTS `provider_configurations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique provider identifier (e.g., GPSGate, Geotab)',
    `display_name` VARCHAR(200) NOT NULL COMMENT 'Display name for UI',
    `description` VARCHAR(1000) NULL COMMENT 'Provider description',
    `is_enabled` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether provider is enabled',
    `is_default` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Whether this is the default provider',
    `version` VARCHAR(50) NOT NULL DEFAULT '1.0.0' COMMENT 'Configuration version',
    `settings` JSON NOT NULL DEFAULT '{}' COMMENT 'JSON configuration settings (encrypted for sensitive data)',
    `priority` INT NOT NULL DEFAULT 999 COMMENT 'Priority for failover (1 = highest)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    `created_by` VARCHAR(100) NULL COMMENT 'User who created this configuration',
    `updated_by` VARCHAR(100) NULL COMMENT 'User who last updated this configuration',
    `is_deleted` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Soft delete flag',
    `deleted_at` DATETIME NULL COMMENT 'Deletion timestamp',
    `deleted_by` VARCHAR(100) NULL COMMENT 'User who deleted this configuration',
    
    INDEX `idx_provider_name` (`name`),
    INDEX `idx_provider_enabled` (`is_enabled`),
    INDEX `idx_provider_default` (`is_default`),
    INDEX `idx_provider_active` (`is_deleted`, `is_enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores vehicle tracking provider configurations';

-- Table 2: Provider Health History
-- Tracks provider health status over time
CREATE TABLE IF NOT EXISTS `provider_health_history` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `provider_config_id` INT NOT NULL COMMENT 'Foreign key to provider_configurations',
    `provider_name` VARCHAR(100) NOT NULL COMMENT 'Provider name (denormalized for query performance)',
    `status` VARCHAR(50) NOT NULL DEFAULT 'Unknown' COMMENT 'Health status: Healthy, Degraded, Unhealthy, Unknown',
    `message` TEXT NULL COMMENT 'Status message or error details',
    `response_time_ms` INT NULL COMMENT 'Response time in milliseconds',
    `success_rate` DECIMAL(5,2) NULL COMMENT 'Success rate (0-100)',
    `error_count` INT NOT NULL DEFAULT 0 COMMENT 'Number of errors encountered',
    `additional_metrics` JSON NULL COMMENT 'Additional metrics as JSON',
    `checked_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when health check was performed',
    
    FOREIGN KEY (`provider_config_id`) REFERENCES `provider_configurations`(`id`) ON DELETE CASCADE,
    
    INDEX `idx_health_provider_id` (`provider_config_id`),
    INDEX `idx_health_provider_name` (`provider_name`),
    INDEX `idx_health_checked_at` (`checked_at`),
    INDEX `idx_health_provider_time` (`provider_config_id`, `checked_at`),
    INDEX `idx_health_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks provider health status over time';

-- Table 3: Vehicle Provider Mappings
-- Maps vehicles to specific tracking providers
CREATE TABLE IF NOT EXISTS `vehicle_provider_mappings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `vehicle_id` INT NOT NULL COMMENT 'Vehicle ID from vehicles table',
    `provider_config_id` INT NOT NULL COMMENT 'Provider configuration ID',
    `external_device_id` VARCHAR(200) NULL COMMENT 'External device ID in the provider''s system',
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether this mapping is active',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    `created_by` VARCHAR(100) NULL COMMENT 'User who created this mapping',
    `updated_by` VARCHAR(100) NULL COMMENT 'User who last updated this mapping',
    
    FOREIGN KEY (`provider_config_id`) REFERENCES `provider_configurations`(`id`) ON DELETE CASCADE,
    -- Note: vehicle_id FK would reference vehicles table if it exists
    
    INDEX `idx_mapping_vehicle_id` (`vehicle_id`),
    INDEX `idx_mapping_provider_id` (`provider_config_id`),
    INDEX `idx_mapping_vehicle_active` (`vehicle_id`, `is_active`),
    INDEX `idx_mapping_external_device` (`external_device_id`),
    
    -- Ensure only one active mapping per vehicle
    UNIQUE INDEX `idx_unique_active_mapping` (`vehicle_id`, `is_active`) 
        COMMENT 'Only one active provider per vehicle'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Maps vehicles to specific tracking providers';

-- ============================================================================
-- Sample Data (GPSGate as default provider)
-- ============================================================================

-- Insert GPSGate as the default provider (if not exists)
INSERT INTO `provider_configurations` 
    (`name`, `display_name`, `description`, `is_enabled`, `is_default`, `version`, `settings`, `priority`)
VALUES 
    (
        'GPSGate',
        'GPSGate Tracking',
        'GPS tracking provider using GPSGate API',
        TRUE,
        TRUE,
        '2.0.0',
        JSON_OBJECT(
            'ApiUrl', 'https://api.gpsgate.com',
            'Username', 'your_username',
            'Password', 'encrypted_password',
            'TimeoutSeconds', 30,
            'RetryAttempts', 3,
            'EnableCaching', true,
            'CacheDurationMinutes', 5
        ),
        1
    )
ON DUPLICATE KEY UPDATE 
    `display_name` = VALUES(`display_name`),
    `description` = VALUES(`description`),
    `version` = VALUES(`version`);

-- ============================================================================
-- Views for easier querying
-- ============================================================================

-- View: Active Providers
CREATE OR REPLACE VIEW `v_active_providers` AS
SELECT 
    `id`,
    `name`,
    `display_name`,
    `description`,
    `is_default`,
    `version`,
    `priority`,
    `created_at`,
    `updated_at`
FROM `provider_configurations`
WHERE `is_enabled` = TRUE 
  AND `is_deleted` = FALSE
ORDER BY `priority` ASC, `name` ASC;

-- View: Provider Health Summary
CREATE OR REPLACE VIEW `v_provider_health_summary` AS
SELECT 
    pc.`id` AS `provider_id`,
    pc.`name` AS `provider_name`,
    pc.`display_name`,
    pc.`is_enabled`,
    ph.`status` AS `current_status`,
    ph.`message` AS `last_message`,
    ph.`response_time_ms` AS `last_response_time`,
    ph.`success_rate` AS `last_success_rate`,
    ph.`checked_at` AS `last_check_time`,
    (
        SELECT COUNT(*) 
        FROM `provider_health_history` 
        WHERE `provider_config_id` = pc.`id` 
          AND `status` = 'Unhealthy' 
          AND `checked_at` >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    ) AS `unhealthy_count_24h`,
    (
        SELECT AVG(`response_time_ms`) 
        FROM `provider_health_history` 
        WHERE `provider_config_id` = pc.`id` 
          AND `checked_at` >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    ) AS `avg_response_time_1h`
FROM `provider_configurations` pc
LEFT JOIN (
    SELECT DISTINCT 
        `provider_config_id`,
        FIRST_VALUE(`status`) OVER (PARTITION BY `provider_config_id` ORDER BY `checked_at` DESC) AS `status`,
        FIRST_VALUE(`message`) OVER (PARTITION BY `provider_config_id` ORDER BY `checked_at` DESC) AS `message`,
        FIRST_VALUE(`response_time_ms`) OVER (PARTITION BY `provider_config_id` ORDER BY `checked_at` DESC) AS `response_time_ms`,
        FIRST_VALUE(`success_rate`) OVER (PARTITION BY `provider_config_id` ORDER BY `checked_at` DESC) AS `success_rate`,
        FIRST_VALUE(`checked_at`) OVER (PARTITION BY `provider_config_id` ORDER BY `checked_at` DESC) AS `checked_at`
    FROM `provider_health_history`
) ph ON pc.`id` = ph.`provider_config_id`
WHERE pc.`is_deleted` = FALSE;

-- View: Vehicle Provider Assignments
CREATE OR REPLACE VIEW `v_vehicle_provider_assignments` AS
SELECT 
    vpm.`vehicle_id`,
    v.`VehicleNo` AS `vehicle_number`,
    v.`Tenacy_No` AS `vehicle_code`,
    pc.`name` AS `provider_name`,
    pc.`display_name` AS `provider_display_name`,
    vpm.`external_device_id`,
    vpm.`created_at` AS `mapped_at`,
    vpm.`created_by` AS `mapped_by`
FROM `vehicle_provider_mappings` vpm
INNER JOIN `provider_configurations` pc ON vpm.`provider_config_id` = pc.`id`
LEFT JOIN `vehicles` v ON vpm.`vehicle_id` = v.`VehicleId`
WHERE vpm.`is_active` = TRUE 
  AND pc.`is_deleted` = FALSE;

-- ============================================================================
-- Stored Procedures
-- ============================================================================

DELIMITER $$

-- Procedure: Get Default Provider Configuration
CREATE PROCEDURE `sp_get_default_provider`()
BEGIN
    SELECT 
        `id`,
        `name`,
        `display_name`,
        `description`,
        `version`,
        `settings`,
        `priority`
    FROM `provider_configurations`
    WHERE `is_default` = TRUE 
      AND `is_enabled` = TRUE
      AND `is_deleted` = FALSE
    LIMIT 1;
END$$

-- Procedure: Get Provider for Vehicle
CREATE PROCEDURE `sp_get_provider_for_vehicle`(
    IN p_vehicle_id INT
)
BEGIN
    -- Try to get vehicle-specific provider
    SELECT 
        pc.`id`,
        pc.`name`,
        pc.`display_name`,
        pc.`description`,
        pc.`version`,
        pc.`settings`,
        pc.`priority`,
        vpm.`external_device_id`
    FROM `vehicle_provider_mappings` vpm
    INNER JOIN `provider_configurations` pc ON vpm.`provider_config_id` = pc.`id`
    WHERE vpm.`vehicle_id` = p_vehicle_id
      AND vpm.`is_active` = TRUE
      AND pc.`is_enabled` = TRUE
      AND pc.`is_deleted` = FALSE
    LIMIT 1;
    
    -- If no result, return default provider
    IF NOT FOUND THEN
        CALL sp_get_default_provider();
    END IF;
END$$

-- Procedure: Record Health Check
CREATE PROCEDURE `sp_record_health_check`(
    IN p_provider_name VARCHAR(100),
    IN p_status VARCHAR(50),
    IN p_message TEXT,
    IN p_response_time INT,
    IN p_success_rate DECIMAL(5,2),
    IN p_error_count INT
)
BEGIN
    DECLARE v_provider_id INT;
    
    -- Get provider ID
    SELECT `id` INTO v_provider_id
    FROM `provider_configurations`
    WHERE `name` = p_provider_name
    LIMIT 1;
    
    IF v_provider_id IS NOT NULL THEN
        INSERT INTO `provider_health_history` (
            `provider_config_id`,
            `provider_name`,
            `status`,
            `message`,
            `response_time_ms`,
            `success_rate`,
            `error_count`,
            `checked_at`
        ) VALUES (
            v_provider_id,
            p_provider_name,
            p_status,
            p_message,
            p_response_time,
            p_success_rate,
            p_error_count,
            NOW()
        );
    END IF;
END$$

DELIMITER ;

-- ============================================================================
-- Cleanup: Remove old health history (retention policy)
-- Run this as a scheduled job (e.g., daily)
-- ============================================================================

-- Delete health history older than 90 days
-- DELETE FROM `provider_health_history` 
-- WHERE `checked_at` < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check active providers
-- SELECT * FROM `v_active_providers`;

-- Check provider health summary
-- SELECT * FROM `v_provider_health_summary`;

-- Check vehicle provider assignments
-- SELECT * FROM `v_vehicle_provider_assignments`;

-- ============================================================================
-- End of Migration Script
-- ============================================================================
