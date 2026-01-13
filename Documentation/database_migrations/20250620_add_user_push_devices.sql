-- ============================================================================
-- Migration: Add User Push Devices Table for Push Notifications
-- Date: 2025-06-20
-- Description: Creates the user_push_devices table to store push notification
--              tokens for mobile and web applications
-- ============================================================================

-- Create the user_push_devices table
CREATE TABLE IF NOT EXISTS `user_push_devices` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `device_token` VARCHAR(500) NOT NULL COMMENT 'FCM/Expo push token',
    `platform` VARCHAR(20) NOT NULL COMMENT 'ios, android, web',
    `device_id` VARCHAR(255) NULL COMMENT 'Unique device identifier',
    `device_name` VARCHAR(255) NULL COMMENT 'Device model/name',
    `app_version` VARCHAR(50) NULL COMMENT 'App version for compatibility',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Whether this device is active for push',
    `failed_attempts` INT NOT NULL DEFAULT 0 COMMENT 'Count of failed push attempts',
    `last_push_at` DATETIME NULL COMMENT 'Last successful push time',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `ix_user_push_devices_user_id` (`user_id`),
    INDEX `ix_user_push_devices_device_token` (`device_token`(191)),
    INDEX `ix_user_push_devices_user_active` (`user_id`, `is_active`),
    UNIQUE INDEX `uq_user_push_devices_token` (`device_token`(191)),
    CONSTRAINT `fk_user_push_devices_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users` (`user_id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores push notification device tokens for users';

-- ============================================================================
-- Add Push to DeliveryMethod enum if not exists
-- This is tracked in the notification_policies table's delivery_methods column
-- ============================================================================

-- Verify the migration
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'user_push_devices'
ORDER BY ORDINAL_POSITION;

-- ============================================================================
-- Rollback Script (if needed)
-- ============================================================================
-- DROP TABLE IF EXISTS `user_push_devices`;

-- ============================================================================
-- Sample Data (for testing)
-- ============================================================================
-- INSERT INTO `user_push_devices` (`user_id`, `device_token`, `platform`, `device_id`, `device_name`, `app_version`)
-- VALUES (1, 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]', 'android', 'device-uuid-123', 'Samsung Galaxy S23', '1.0.0');
