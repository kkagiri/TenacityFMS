-- ============================================================================
-- Migration: Issue Tracker Workflows V2 feature flag
-- Date: 2026-04-23
-- Purpose: Seed the system configuration row that gates workflow-editor rollout.
-- Notes:
--   * MySQL 5.5 / 5.6 safe
--   * Default disabled for production rollout; enable explicitly after staging sign-off
-- ============================================================================

INSERT INTO `systemconfigurations`
(
    `ConfigurationKey`,
    `ConfigurationValue`,
    `Description`,
    `DataType`,
    `Category`,
    `IsActive`,
    `IsEditable`,
    `DefaultValue`,
    `CreatedAt`,
    `UpdatedAt`
)
VALUES
(
    'IssueTrackerWorkflowsV2',
    '0',
    'Enables the staged issue tracker workflow editor and startup workflow backfill.',
    'bool',
    'IssueTracker',
    1,
    1,
    '0',
    UTC_TIMESTAMP(),
    UTC_TIMESTAMP()
)
ON DUPLICATE KEY UPDATE
    `Description` = VALUES(`Description`),
    `DataType` = VALUES(`DataType`),
    `Category` = VALUES(`Category`),
    `IsActive` = VALUES(`IsActive`),
    `IsEditable` = VALUES(`IsEditable`),
    `DefaultValue` = VALUES(`DefaultValue`),
    `UpdatedAt` = UTC_TIMESTAMP();