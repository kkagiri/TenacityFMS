-- ============================================================================
-- Vehicle Health Monitor - Database Schema
-- Tracks vehicle online/offline status and health history
-- MySQL 8.0+
-- ============================================================================

-- Table: Vehicle Health Monitor
-- Tracks vehicle health status and offline reasons over time
CREATE TABLE IF NOT EXISTS `vehicle_health_monitor` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `vehicle_id` INT NOT NULL COMMENT 'Foreign key to vehicles table',
    `checked_at` DATETIME NOT NULL COMMENT 'Timestamp when health check was performed',
    `is_online` BOOLEAN NOT NULL COMMENT 'Whether vehicle is online',
    `last_online_at` DATETIME NULL COMMENT 'Last time vehicle was online',
    `last_offline_at` DATETIME NULL COMMENT 'Last time vehicle went offline',
    `offline_duration` BIGINT NULL COMMENT 'Duration offline in seconds',

    -- Offline tracking
    `offline_reason` VARCHAR(50) NULL COMMENT 'Offline reason: Workshop, Yard, ToBeReviewed, Maintenance, Repair, Decommissioned, GPSIssue, PowerIssue',
    `permanent_location` VARCHAR(200) NULL COMMENT 'Permanent or semi-permanent location description',
    `working_site_id` INT NULL COMMENT 'Working site ID (links to vehicle.WorkingSite)',

    -- Last known location
    `last_known_latitude` DECIMAL(10,7) NULL COMMENT 'Last known GPS latitude',
    `last_known_longitude` DECIMAL(10,7) NULL COMMENT 'Last known GPS longitude',
    `last_known_address` VARCHAR(500) NULL COMMENT 'Last known address (reverse geocoded)',

    -- Issue tracking integration
    `issue_tracking_id` INT NULL COMMENT 'Link to issue tracking system for investigation',

    -- Additional information
    `notes` TEXT NULL COMMENT 'Additional notes about health status',

    -- Audit trail
    `created_by` VARCHAR(100) NULL COMMENT 'User who created this record',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    `updated_by` VARCHAR(100) NULL COMMENT 'User who last updated this record',
    `updated_at` DATETIME NULL COMMENT 'Last update timestamp',

    -- Indexes for performance
    INDEX `idx_vehicle_health_vehicle_id` (`vehicle_id`),
    INDEX `idx_vehicle_health_checked_at` (`checked_at`),
    INDEX `idx_vehicle_health_vehicle_checked` (`vehicle_id`, `checked_at`),
    INDEX `idx_vehicle_health_is_online` (`is_online`),
    INDEX `idx_vehicle_health_offline_reason` (`offline_reason`),
    INDEX `idx_vehicle_health_issue_tracking` (`issue_tracking_id`),
    INDEX `idx_vehicle_health_working_site` (`working_site_id`)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks vehicle health status and offline reasons over time';

-- ============================================================================
-- Views for easier querying
-- ============================================================================

-- View: Latest Vehicle Health Status
-- Returns the most recent health status for each vehicle
CREATE OR REPLACE VIEW `v_latest_vehicle_health` AS
SELECT
    vh.*,
    v.`Hyoung_No` AS `vehicle_name`,
    v.`NumberPlate` AS `number_plate`,
    v.`VehicleNo` AS `vehicle_number`
FROM (
    SELECT
        vh1.*
    FROM `vehicle_health_monitor` vh1
    INNER JOIN (
        SELECT
            `vehicle_id`,
            MAX(`checked_at`) AS `max_checked_at`
        FROM `vehicle_health_monitor`
        GROUP BY `vehicle_id`
    ) vh2 ON vh1.`vehicle_id` = vh2.`vehicle_id`
         AND vh1.`checked_at` = vh2.`max_checked_at`
) vh
LEFT JOIN `vehicles` v ON vh.`vehicle_id` = v.`VehicleId`;

-- View: Offline Vehicles
-- Returns all vehicles that are currently offline with their latest status
CREATE OR REPLACE VIEW `v_offline_vehicles` AS
SELECT
    vh.`id`,
    vh.`vehicle_id`,
    v.`Hyoung_No` AS `vehicle_name`,
    v.`NumberPlate` AS `number_plate`,
    vh.`last_offline_at`,
    vh.`offline_duration`,
    vh.`offline_reason`,
    vh.`permanent_location`,
    vh.`working_site_id`,
    vh.`last_known_latitude`,
    vh.`last_known_longitude`,
    vh.`last_known_address`,
    vh.`issue_tracking_id`,
    vh.`notes`,
    vh.`checked_at`
FROM `vehicle_health_monitor` vh
INNER JOIN (
    SELECT
        `vehicle_id`,
        MAX(`checked_at`) AS `max_checked_at`
    FROM `vehicle_health_monitor`
    GROUP BY `vehicle_id`
) latest ON vh.`vehicle_id` = latest.`vehicle_id`
         AND vh.`checked_at` = latest.`max_checked_at`
LEFT JOIN `vehicles` v ON vh.`vehicle_id` = v.`VehicleId`
WHERE vh.`is_online` = FALSE
ORDER BY vh.`last_offline_at` DESC;

-- View: Long-Term Offline Vehicles (24+ hours)
-- Returns vehicles that have been offline for more than 24 hours
CREATE OR REPLACE VIEW `v_longterm_offline_vehicles` AS
SELECT
    vh.`id`,
    vh.`vehicle_id`,
    v.`Hyoung_No` AS `vehicle_name`,
    v.`NumberPlate` AS `number_plate`,
    vh.`last_offline_at`,
    vh.`offline_duration`,
    TIMESTAMPDIFF(HOUR, vh.`last_offline_at`, NOW()) AS `hours_offline`,
    vh.`offline_reason`,
    vh.`permanent_location`,
    vh.`working_site_id`,
    vh.`issue_tracking_id`,
    vh.`notes`
FROM `vehicle_health_monitor` vh
INNER JOIN (
    SELECT
        `vehicle_id`,
        MAX(`checked_at`) AS `max_checked_at`
    FROM `vehicle_health_monitor`
    GROUP BY `vehicle_id`
) latest ON vh.`vehicle_id` = latest.`vehicle_id`
         AND vh.`checked_at` = latest.`max_checked_at`
LEFT JOIN `vehicles` v ON vh.`vehicle_id` = v.`VehicleId`
WHERE vh.`is_online` = FALSE
  AND vh.`last_offline_at` <= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY vh.`last_offline_at` ASC;

-- View: Vehicles by Offline Reason
-- Groups offline vehicles by their offline reason
CREATE OR REPLACE VIEW `v_vehicles_by_offline_reason` AS
SELECT
    vh.`offline_reason`,
    COUNT(*) AS `vehicle_count`,
    GROUP_CONCAT(v.`Hyoung_No` ORDER BY v.`Hyoung_No` SEPARATOR ', ') AS `vehicle_names`,
    AVG(TIMESTAMPDIFF(HOUR, vh.`last_offline_at`, NOW())) AS `avg_hours_offline`
FROM `vehicle_health_monitor` vh
INNER JOIN (
    SELECT
        `vehicle_id`,
        MAX(`checked_at`) AS `max_checked_at`
    FROM `vehicle_health_monitor`
    GROUP BY `vehicle_id`
) latest ON vh.`vehicle_id` = latest.`vehicle_id`
         AND vh.`checked_at` = latest.`max_checked_at`
LEFT JOIN `vehicles` v ON vh.`vehicle_id` = v.`VehicleId`
WHERE vh.`is_online` = FALSE
  AND vh.`offline_reason` IS NOT NULL
GROUP BY vh.`offline_reason`
ORDER BY `vehicle_count` DESC;

-- View: Vehicle Health Summary
-- Provides a summary of vehicle health statistics
CREATE OR REPLACE VIEW `v_vehicle_health_summary` AS
SELECT
    COUNT(DISTINCT vh.`vehicle_id`) AS `total_vehicles_tracked`,
    SUM(CASE WHEN vh.`is_online` = TRUE THEN 1 ELSE 0 END) AS `online_vehicles`,
    SUM(CASE WHEN vh.`is_online` = FALSE THEN 1 ELSE 0 END) AS `offline_vehicles`,
    SUM(CASE WHEN vh.`is_online` = FALSE AND vh.`last_offline_at` <= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) AS `longterm_offline_vehicles`,
    SUM(CASE WHEN vh.`offline_reason` = 'Workshop' THEN 1 ELSE 0 END) AS `in_workshop`,
    SUM(CASE WHEN vh.`offline_reason` = 'Yard' THEN 1 ELSE 0 END) AS `in_yard`,
    SUM(CASE WHEN vh.`offline_reason` = 'ToBeReviewed' THEN 1 ELSE 0 END) AS `to_be_reviewed`,
    SUM(CASE WHEN vh.`issue_tracking_id` IS NOT NULL THEN 1 ELSE 0 END) AS `under_investigation`
FROM `vehicle_health_monitor` vh
INNER JOIN (
    SELECT
        `vehicle_id`,
        MAX(`checked_at`) AS `max_checked_at`
    FROM `vehicle_health_monitor`
    GROUP BY `vehicle_id`
) latest ON vh.`vehicle_id` = latest.`vehicle_id`
         AND vh.`checked_at` = latest.`max_checked_at`;

-- ============================================================================
-- Stored Procedures
-- ============================================================================

DELIMITER $$

-- Procedure: Get Latest Health Status for Vehicle
CREATE PROCEDURE `sp_get_vehicle_latest_health`(
    IN p_vehicle_id INT
)
BEGIN
    SELECT
        vh.*,
        v.`Hyoung_No` AS `vehicle_name`,
        v.`NumberPlate` AS `number_plate`
    FROM `vehicle_health_monitor` vh
    LEFT JOIN `vehicles` v ON vh.`vehicle_id` = v.`VehicleId`
    WHERE vh.`vehicle_id` = p_vehicle_id
    ORDER BY vh.`checked_at` DESC
    LIMIT 1;
END$$

-- Procedure: Get Health History for Vehicle
CREATE PROCEDURE `sp_get_vehicle_health_history`(
    IN p_vehicle_id INT,
    IN p_from_date DATETIME,
    IN p_to_date DATETIME
)
BEGIN
    SELECT
        vh.*,
        v.`Hyoung_No` AS `vehicle_name`,
        v.`NumberPlate` AS `number_plate`
    FROM `vehicle_health_monitor` vh
    LEFT JOIN `vehicles` v ON vh.`vehicle_id` = v.`VehicleId`
    WHERE vh.`vehicle_id` = p_vehicle_id
      AND vh.`checked_at` >= p_from_date
      AND vh.`checked_at` <= p_to_date
    ORDER BY vh.`checked_at` DESC;
END$$

-- Procedure: Get Offline Vehicles by Reason
CREATE PROCEDURE `sp_get_offline_vehicles_by_reason`(
    IN p_offline_reason VARCHAR(50)
)
BEGIN
    SELECT
        vh.*,
        v.`Hyoung_No` AS `vehicle_name`,
        v.`NumberPlate` AS `number_plate`,
        TIMESTAMPDIFF(HOUR, vh.`last_offline_at`, NOW()) AS `hours_offline`
    FROM `vehicle_health_monitor` vh
    INNER JOIN (
        SELECT
            `vehicle_id`,
            MAX(`checked_at`) AS `max_checked_at`
        FROM `vehicle_health_monitor`
        GROUP BY `vehicle_id`
    ) latest ON vh.`vehicle_id` = latest.`vehicle_id`
             AND vh.`checked_at` = latest.`max_checked_at`
    LEFT JOIN `vehicles` v ON vh.`vehicle_id` = v.`VehicleId`
    WHERE vh.`is_online` = FALSE
      AND vh.`offline_reason` = p_offline_reason
    ORDER BY vh.`last_offline_at` ASC;
END$$

-- Procedure: Record Health Check
CREATE PROCEDURE `sp_record_vehicle_health_check`(
    IN p_vehicle_id INT,
    IN p_is_online BOOLEAN,
    IN p_latitude DECIMAL(10,7),
    IN p_longitude DECIMAL(10,7),
    IN p_address VARCHAR(500)
)
BEGIN
    DECLARE v_last_online_at DATETIME;
    DECLARE v_last_offline_at DATETIME;
    DECLARE v_offline_duration BIGINT;
    DECLARE v_offline_reason VARCHAR(50);
    DECLARE v_permanent_location VARCHAR(200);
    DECLARE v_working_site_id INT;
    DECLARE v_issue_tracking_id INT;

    -- Get latest health record
    SELECT
        `last_online_at`,
        `last_offline_at`,
        `offline_reason`,
        `permanent_location`,
        `working_site_id`,
        `issue_tracking_id`
    INTO
        v_last_online_at,
        v_last_offline_at,
        v_offline_reason,
        v_permanent_location,
        v_working_site_id,
        v_issue_tracking_id
    FROM `vehicle_health_monitor`
    WHERE `vehicle_id` = p_vehicle_id
    ORDER BY `checked_at` DESC
    LIMIT 1;

    -- Calculate durations
    IF p_is_online THEN
        SET v_last_online_at = NOW();
        IF v_last_offline_at IS NOT NULL THEN
            SET v_offline_duration = TIMESTAMPDIFF(SECOND, v_last_offline_at, NOW());
        END IF;
    ELSE
        SET v_last_offline_at = NOW();
        IF v_last_online_at IS NOT NULL THEN
            SET v_offline_duration = TIMESTAMPDIFF(SECOND, v_last_online_at, NOW());
        END IF;
    END IF;

    -- Insert health record
    INSERT INTO `vehicle_health_monitor` (
        `vehicle_id`,
        `checked_at`,
        `is_online`,
        `last_online_at`,
        `last_offline_at`,
        `offline_duration`,
        `offline_reason`,
        `permanent_location`,
        `working_site_id`,
        `last_known_latitude`,
        `last_known_longitude`,
        `last_known_address`,
        `issue_tracking_id`,
        `created_at`
    ) VALUES (
        p_vehicle_id,
        NOW(),
        p_is_online,
        v_last_online_at,
        v_last_offline_at,
        v_offline_duration,
        IF(p_is_online, NULL, v_offline_reason),
        IF(p_is_online, NULL, v_permanent_location),
        IF(p_is_online, NULL, v_working_site_id),
        p_latitude,
        p_longitude,
        p_address,
        IF(p_is_online, NULL, v_issue_tracking_id),
        NOW()
    );
END$$

DELIMITER ;

-- ============================================================================
-- Cleanup: Remove old health history (retention policy)
-- Run this as a scheduled job (e.g., daily or weekly)
-- ============================================================================

-- Delete health history older than 90 days (keep only recent history)
-- Uncomment to enable automatic cleanup
-- DELETE FROM `vehicle_health_monitor`
-- WHERE `checked_at` < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check latest health status for all vehicles
-- SELECT * FROM `v_latest_vehicle_health`;

-- Check offline vehicles
-- SELECT * FROM `v_offline_vehicles`;

-- Check long-term offline vehicles
-- SELECT * FROM `v_longterm_offline_vehicles`;

-- Check vehicles by offline reason
-- SELECT * FROM `v_vehicles_by_offline_reason`;

-- Check overall health summary
-- SELECT * FROM `v_vehicle_health_summary`;

-- ============================================================================
-- End of Migration Script
-- ============================================================================
