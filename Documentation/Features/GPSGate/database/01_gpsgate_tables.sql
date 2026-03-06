-- GPSGate Integration Tables
-- MySQL Syntax

-- Table: gpsgate_sessions
CREATE TABLE IF NOT EXISTS `gpsgate_sessions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `session_id` VARCHAR(500) NOT NULL,
    `username` VARCHAR(100) NOT NULL,
    `application_id` INT NOT NULL,
    `created_at` DATETIME NOT NULL,
    `expires_at` DATETIME NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `last_used` DATETIME NULL,
    `ip_address` VARCHAR(50) NULL,
    UNIQUE INDEX `idx_session_id_unique` (`session_id`(255)),
    INDEX `idx_username` (`username`),
    INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: gpsgate_report_definitions
CREATE TABLE IF NOT EXISTS `gpsgate_report_definitions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `report_id` INT NOT NULL UNIQUE,
    `report_name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME NOT NULL,
    `updated_at` DATETIME NULL,
    INDEX `idx_report_id` (`report_id`),
    INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: gpsgate_reports
CREATE TABLE IF NOT EXISTS `gpsgate_reports` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `report_id` INT NOT NULL,
    `report_name` VARCHAR(200) NULL,
    `handle_id` INT NOT NULL UNIQUE,
    `session_id` VARCHAR(500) NOT NULL,
    `start_date` DATETIME NOT NULL,
    `end_date` DATETIME NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `requested_at` DATETIME NOT NULL,
    `completed_at` DATETIME NULL,
    `report_data` LONGTEXT NULL,
    `error_message` TEXT NULL,
    `requested_by_user_id` INT NULL,
    INDEX `idx_handle_id` (`handle_id`),
    INDEX `idx_report_id` (`report_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_requested_at` (`requested_at`),
    FOREIGN KEY (`report_id`) REFERENCES `gpsgate_report_definitions`(`report_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default report definitions
INSERT INTO `gpsgate_report_definitions` (`report_id`, `report_name`, `description`, `is_active`, `created_at`)
VALUES
    (208, 'Fuel Consumption Report', 'GPSGate fuel consumption report', TRUE, NOW()),
    (1, 'Track History', 'Vehicle track history report', TRUE, NOW()),
    (2, 'Speed Report', 'Vehicle speed analysis report', TRUE, NOW())
ON DUPLICATE KEY UPDATE
    `report_name` = VALUES(`report_name`),
    `description` = VALUES(`description`),
    `updated_at` = NOW();
