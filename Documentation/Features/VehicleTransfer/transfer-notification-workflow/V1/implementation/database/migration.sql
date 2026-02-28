-- ============================================================================
-- Vehicle Transfer Notification Workflow - Database Migration
-- Feature: Transfer Notification & Approval Workflow V1
-- Date: 2026-02-27
-- ============================================================================

-- ============================================================================
-- STEP 1: Add notification-related columns to vehicle_transfers table
-- ============================================================================

ALTER TABLE `vehicle_transfers`
    ADD COLUMN `receiver_user_id` VARCHAR(450) NULL AFTER `workshop_manager_sign`,
    ADD COLUMN `approver_user_id` VARCHAR(450) NULL AFTER `receiver_user_id`,
    ADD COLUMN `dispatched_at` DATETIME NULL AFTER `approver_user_id`,
    ADD COLUMN `received_at` DATETIME NULL AFTER `dispatched_at`,
    ADD COLUMN `last_reminder_sent_at` DATETIME NULL AFTER `received_at`,
    ADD COLUMN `reminder_count` INT NOT NULL DEFAULT 0 AFTER `last_reminder_sent_at`;

-- Verify columns were added
DESCRIBE `vehicle_transfers`;

-- ============================================================================
-- STEP 2: Insert VehicleTransfer notification category (ID = 18)
-- ============================================================================

INSERT INTO `notificationcategories` (
    `Id`,
    `CategoryName`,
    `Description`,
    `CreatedAt`,
    `IsActive`
)
SELECT
    18,
    'VehicleTransfer',
    'Notifications for vehicle transfer lifecycle events (approval, dispatch, receipt, reminders)',
    NOW(),
    1
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM `notificationcategories`
    WHERE `Id` = 18 OR `CategoryName` = 'VehicleTransfer'
);

-- Verify category was inserted
SELECT * FROM `notificationcategories` WHERE `Id` = 18;

-- ============================================================================
-- STEP 3 (Optional): Backfill receiver_user_id for existing transfers
--   If you know the mapping between ReceiverName and user IDs, run an UPDATE.
--   Example:
--     UPDATE vehicle_transfers vt
--     JOIN aspnetusers u ON CONCAT(u.FirstName, ' ', u.LastName) = vt.receiver_name
--     SET vt.receiver_user_id = u.Id
--     WHERE vt.receiver_user_id IS NULL
--       AND vt.receiver_name IS NOT NULL;
-- ============================================================================

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- ALTER TABLE `vehicle_transfers`
--     DROP COLUMN `receiver_user_id`,
--     DROP COLUMN `approver_user_id`,
--     DROP COLUMN `dispatched_at`,
--     DROP COLUMN `received_at`,
--     DROP COLUMN `last_reminder_sent_at`,
--     DROP COLUMN `reminder_count`;
--
-- DELETE FROM `notificationcategories` WHERE `Id` = 18;
