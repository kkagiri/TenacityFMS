-- ============================================================================
-- Migration: Issue Activity Log and Reminder Tables
-- Date: 2026-02-05
-- Purpose: Add persistent activity stream and reminder functionality for Issue Tracker
-- Compatibility: MySQL 5.5+ (no JSON type - uses LONGTEXT instead)
-- ============================================================================

-- ============================================================================
-- Table: issue_activity_log
-- Purpose: Stores chronological activity/audit log for issues (activity stream)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `issue_activity_log` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `issue_id` INT(11) NOT NULL,
    `activity_type` VARCHAR(50) NOT NULL COMMENT 'Created, Updated, StatusChanged, PriorityChanged, Assigned, ReminderSet, TagsUpdated, Closed, Reopened',
    `field_name` VARCHAR(100) NULL COMMENT 'Name of the field that was changed (for update activities)',
    `old_value` VARCHAR(500) NULL COMMENT 'Previous value before change',
    `new_value` VARCHAR(500) NULL COMMENT 'New value after change',
    `description` TEXT NULL COMMENT 'Human-readable description of the activity',
    `performed_by` VARCHAR(100) NULL COMMENT 'User ID who performed the action',
    `performed_by_user_name` VARCHAR(200) NULL COMMENT 'Display name of user who performed the action',
    `activity_date` DATETIME NOT NULL,
    `metadata` LONGTEXT NULL COMMENT 'Additional metadata stored as JSON string',
    PRIMARY KEY (`id`),
    INDEX `idx_issue_activity_log_issue_id` (`issue_id`),
    INDEX `idx_issue_activity_log_activity_date` (`activity_date`),
    INDEX `idx_issue_activity_log_activity_type` (`activity_type`),
    INDEX `idx_issue_activity_log_performed_by` (`performed_by`),
    CONSTRAINT `fk_issue_activity_log_issue`
        FOREIGN KEY (`issue_id`)
        REFERENCES `issuetracker` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci
COMMENT='Stores activity stream/audit log for issues';

-- ============================================================================
-- Table: issue_reminder
-- Purpose: Stores reminder configurations for issues based on due dates
-- ============================================================================
CREATE TABLE IF NOT EXISTS `issue_reminder` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `issue_id` INT(11) NOT NULL,
    `reminder_type` VARCHAR(50) NOT NULL DEFAULT 'Daily' COMMENT 'Daily, Weekly, OnceBeforeDue, Custom',
    `days_before` INT(11) NOT NULL DEFAULT 1 COMMENT 'Number of days before due date to start reminders',
    `reminder_time` TIME NULL COMMENT 'Time of day to send reminders (HH:mm:ss)',
    `recipient_user_ids` LONGTEXT NULL COMMENT 'JSON array of user IDs to notify (stored as string)',
    `notify_assignee` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Whether to notify the issue assignee',
    `notify_opener` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Whether to notify the issue opener',
    `custom_message` VARCHAR(500) NULL COMMENT 'Custom message to include in reminder',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `last_sent_date` DATETIME NULL COMMENT 'Date when last reminder was sent',
    `next_reminder_date` DATETIME NULL COMMENT 'Calculated next reminder date',
    `created_by` VARCHAR(100) NULL,
    `created_date` DATETIME NOT NULL,
    `modified_date` DATETIME NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_issue_reminder_issue_id` (`issue_id`),
    INDEX `idx_issue_reminder_next_date` (`next_reminder_date`),
    INDEX `idx_issue_reminder_is_active` (`is_active`),
    CONSTRAINT `fk_issue_reminder_issue`
        FOREIGN KEY (`issue_id`)
        REFERENCES `issuetracker` (`id`)
        ON DELETE CASCADE,
    UNIQUE KEY `uq_issue_reminder_issue_id` (`issue_id`) COMMENT 'One active reminder per issue'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci
COMMENT='Stores reminder configurations for issues';

-- ============================================================================
-- Table: issue_follower
-- Purpose: Tracks users who follow issues to receive activity notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS `issue_follower` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `issue_id` INT(11) NOT NULL,
    `user_id` VARCHAR(100) NOT NULL COMMENT 'User ID who is following the issue',
    `user_name` VARCHAR(200) NULL COMMENT 'Display name of the follower',
    `followed_date` DATETIME NOT NULL COMMENT 'When the user started following',
    `notify_by_email` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Receive email notifications',
    `notify_by_push` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Receive push notifications',
    PRIMARY KEY (`id`),
    INDEX `idx_issue_follower_issue_id` (`issue_id`),
    INDEX `idx_issue_follower_user_id` (`user_id`),
    UNIQUE KEY `uq_issue_follower_issue_user` (`issue_id`, `user_id`) COMMENT 'One follow per user per issue',
    CONSTRAINT `fk_issue_follower_issue`
        FOREIGN KEY (`issue_id`)
        REFERENCES `issuetracker` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci
COMMENT='Tracks users following issues for activity notifications';

-- ============================================================================
-- Verify tables created successfully
-- ============================================================================
SELECT 'issue_activity_log' AS table_name, COUNT(*) AS row_count FROM issue_activity_log
UNION ALL
SELECT 'issue_reminder' AS table_name, COUNT(*) AS row_count FROM issue_reminder
UNION ALL
SELECT 'issue_follower' AS table_name, COUNT(*) AS row_count FROM issue_follower;

-- ============================================================================
-- Sample Data (Optional - for testing)
-- ============================================================================
-- INSERT INTO issue_activity_log (issue_id, activity_type, description, performed_by, performed_by_user_name)
-- VALUES (1, 'Created', 'Admin has created issue #1', 'admin', 'Administrator');

-- ============================================================================
-- Rollback Script (if needed)
-- ============================================================================
-- DROP TABLE IF EXISTS `issue_reminder`;
-- DROP TABLE IF EXISTS `issue_activity_log`;
