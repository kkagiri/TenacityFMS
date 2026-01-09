-- Migration: Create location_validation_bypasses table
-- Description: Stores vehicle-specific and user-specific location validation bypasses
-- This allows admins to bypass location validation for specific vehicles (poor GPS)
-- or specific users (supervisors) instead of only system-wide bypass

-- Create the location_validation_bypasses table
CREATE TABLE IF NOT EXISTS `location_validation_bypasses` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `bypass_type` VARCHAR(20) NOT NULL DEFAULT 'All' COMMENT 'Type of bypass: Vehicle, User, or All',
    `vehicle_id` INT NULL COMMENT 'Vehicle ID for vehicle-specific bypasses',
    `user_id` VARCHAR(450) NULL COMMENT 'User ID for user-specific bypasses',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Whether bypass is currently active',
    `expires_at` DATETIME NULL COMMENT 'When the bypass expires (null for permanent)',
    `reason` VARCHAR(500) NULL COMMENT 'Reason for the bypass',
    `enabled_by` VARCHAR(256) NULL COMMENT 'Who enabled this bypass',
    `enabled_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the bypass was enabled',
    `cancelled_by` VARCHAR(256) NULL COMMENT 'Who cancelled this bypass',
    `cancelled_at` DATETIME NULL COMMENT 'When the bypass was cancelled',
    PRIMARY KEY (`id`),
    INDEX `idx_bypass_vehicle` (`vehicle_id`, `is_active`),
    INDEX `idx_bypass_user` (`user_id`, `is_active`),
    INDEX `idx_bypass_expires` (`expires_at`, `is_active`),
    INDEX `idx_bypass_type_active` (`bypass_type`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key constraints (optional - only if referential integrity is desired)
-- Note: Commented out to avoid issues if vehicles/users are deleted
-- ALTER TABLE `location_validation_bypasses`
--     ADD CONSTRAINT `fk_bypass_vehicle`
--     FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`VehicleId`)
--     ON DELETE CASCADE ON UPDATE CASCADE;

-- ALTER TABLE `location_validation_bypasses`
--     ADD CONSTRAINT `fk_bypass_user`
--     FOREIGN KEY (`user_id`) REFERENCES `users`(`Id`)
--     ON DELETE CASCADE ON UPDATE CASCADE;

-- Example: Add bypass for a specific vehicle (e.g., vehicle with poor GPS)
-- INSERT INTO location_validation_bypasses (bypass_type, vehicle_id, expires_at, reason, enabled_by)
-- VALUES ('Vehicle', 123, DATE_ADD(NOW(), INTERVAL 30 MINUTE), 'Poor GPS signal on vehicle', 'admin');

-- Example: Add bypass for a specific user (e.g., supervisor)
-- INSERT INTO location_validation_bypasses (bypass_type, user_id, expires_at, reason, enabled_by)
-- VALUES ('User', 'user-guid-here', NULL, 'Field supervisor - permanent bypass', 'admin');

-- Cleanup query: Remove expired bypasses (run periodically or via scheduled job)
-- DELETE FROM location_validation_bypasses
-- WHERE expires_at IS NOT NULL AND expires_at < NOW();
