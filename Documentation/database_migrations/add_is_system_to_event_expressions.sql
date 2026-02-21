-- Migration: Add is_system column to event_expressions table
-- Purpose: Mark system-seeded event expressions as non-deletable
-- Date: 2026-02-12

-- Step 1: Add is_system column (ALREADY APPLIED — skip if column exists)
-- ALTER TABLE `event_expressions`
-- ADD COLUMN `is_system` tinyint(1) NOT NULL DEFAULT 0
-- AFTER `is_active`;

-- Step 2: Create a "System Default" notification policy for system expressions
-- Uses category 2 (Stock Reconciliation), system notifications + email enabled
INSERT INTO `notification_policy` (
  `Name`, `Description`, `IsActive`, `NotificationCategoryId`,
  `NotificationType`, `Priority`,
  `MaxNotificationsPerHour`, `MaxNotificationsPerDay`, `CooldownMinutes`,
  `EnableEmail`, `EnableSms`, `EnableSystem`, `EnableSound`,
  `TitleTemplate`, `MessageTemplate`,
  `RequireAcknowledgment`, `AcknowledgmentTimeoutMinutes`,
  `CreateIssueTracker`, `CreatedBy`, `CreatedAt`
) VALUES (
  'System Default Policy',
  'Default notification policy for system-seeded event expressions. Delivers via system notification and email.',
  1, 2,
  'Alert', 'High',
  10, 50, 30,
  1, 0, 1, 0,
  'Alert: {{eventType}} - {{severity}}',
  '{{eventType}} detected at {{siteName}} — {{description}}',
  1, 0,
  0, 'System', NOW()
);

-- Step 3: Seed default system expressions using the policy just created
-- @policy_id captures the auto-increment ID from the INSERT above
SET @policy_id = LAST_INSERT_ID();

INSERT INTO `event_expressions` (
  `Name`, `Description`, `IsActive`, `is_system`, `EventType`,
  `SiteId`, `TankId`, `DeviceId`, `MinimumSeverity`,
  `Conditions`, `NotificationPolicyId`,
  `CooldownMinutes`, `MaxNotificationsPerDay`,
  `Priority`, `CreateActiveEvent`, `CreatedBy`, `CreatedAt`
) VALUES
(
  'Tank Stock Discrepancy',
  'System default: Fires when closing stock reconciliation detects significant variance between expected and actual stock levels.',
  1, 1, 'TankStockDiscrepancy',
  NULL, NULL, NULL, NULL,
  '{"minVariance": 50, "minVariancePercent": 5}',
  @policy_id,
  30, 0,
  'High', 1, 'System', NOW()
),
(
  'Sensor Variance',
  'System default: Fires when manual closing stock measurement differs significantly from sensor readings.',
  1, 1, 'SensorVariance',
  NULL, NULL, NULL, NULL,
  '{"minVariance": 20, "minVariancePercent": 3}',
  @policy_id,
  30, 0,
  'Medium', 1, 'System', NOW()
);
