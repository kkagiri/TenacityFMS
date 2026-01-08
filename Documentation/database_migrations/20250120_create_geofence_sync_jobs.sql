-- Migration Script: Create geofence_sync_jobs table
-- Feature: Async Geofence Sync Jobs
-- Description: Table to track background geofence synchronization job status
-- Version: 1.0.0
-- Date: 2025-01-20

-- Create the geofence_sync_jobs table
CREATE TABLE IF NOT EXISTS `geofence_sync_jobs` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `job_id` VARCHAR(36) NOT NULL COMMENT 'Unique job identifier (GUID)',
    `status` VARCHAR(20) NOT NULL COMMENT 'Job status: Queued, Running, Completed, Failed, Cancelled',
    `progress_percent` INT NOT NULL DEFAULT 0 COMMENT 'Progress percentage (0-100)',
    `status_message` VARCHAR(500) NULL COMMENT 'Current status message',
    `geofences_synced` INT NOT NULL DEFAULT 0 COMMENT 'Number of geofences successfully synced',
    `groups_synced` INT NOT NULL DEFAULT 0 COMMENT 'Number of groups successfully synced',
    `total_geofences` INT NULL COMMENT 'Total number of geofences to sync',
    `total_groups` INT NULL COMMENT 'Total number of groups to sync',
    `failed_count` INT NOT NULL DEFAULT 0 COMMENT 'Number of failed sync operations',
    `force_full_sync` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Whether this was a force full sync',
    `error_message` TEXT NULL COMMENT 'Error details if job failed',
    `initiated_by` VARCHAR(100) NULL COMMENT 'User who initiated the sync',
    `created_at` DATETIME NOT NULL COMMENT 'When the job was created/queued',
    `started_at` DATETIME NULL COMMENT 'When the job started processing',
    `completed_at` DATETIME NULL COMMENT 'When the job completed (success or failure)',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `ix_geofence_sync_jobs_job_id` (`job_id`),
    INDEX `ix_geofence_sync_jobs_status` (`status`),
    INDEX `ix_geofence_sync_jobs_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks background geofence synchronization job status';

-- Example queries:

-- Get running jobs
-- SELECT * FROM geofence_sync_jobs WHERE status = 'Running';

-- Get job by ID
-- SELECT * FROM geofence_sync_jobs WHERE job_id = 'your-job-id-here';

-- Get recent job history
-- SELECT * FROM geofence_sync_jobs ORDER BY created_at DESC LIMIT 10;

-- Clean up old completed jobs (older than 30 days)
-- DELETE FROM geofence_sync_jobs WHERE status IN ('Completed', 'Failed', 'Cancelled') AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
