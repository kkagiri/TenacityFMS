-- File: 2026-02-25_fix_notankstockentry_notification_templates_mysql55.sql
-- Purpose: Fix blank/low-detail NoTankStockEntry notifications caused by mismatched template placeholders.
-- Target DB: MySQL 5.5 / 5.6 (gpsdata)
--
-- Root cause:
-- 1) notification_policy.Id = 8 used TitleTemplate with {{alarmType}} (not present in SystemEvent template variables)
-- 2) event_expressions.Id = 3 used generic MessageTemplate ('You have not enter any data')
--
-- Result after patch:
-- - Title includes entry type, site, tank, and business date
-- - In-app/system message stays concise for notification trays and SignalR toasts
-- - Email can carry fuller context via EmailBodyHtml stored in notification Data

USE gpsdata;

-- ==========================================
-- 0) Inspect current values (before change)
-- ==========================================
SELECT Id, Name, TitleTemplate, MessageTemplate, TriggerConditions
FROM notification_policy
WHERE Id = 8;

SELECT Id, Name, EventType, MessageTemplate, NotificationPolicyId, IsActive
FROM event_expressions
WHERE Id = 3;

-- ==========================================
-- 1) Fix policy template (fallback/default)
-- ==========================================
UPDATE notification_policy
SET
    TitleTemplate = 'Missing {{missingEntryLabel}} entry | {{siteName}} | {{tankName}} | {{checkDateDisplay}}',
    MessageTemplate = 'Missing {{missingEntryLabel}} entry for {{tankName}} on {{checkDateDisplay}}.',
    ModifiedAt = UTC_TIMESTAMP(),
    ModifiedBy = CreatedBy
WHERE Id = 8;

-- ==========================================
-- 2) Fix expression-level message template (active source for ExpressionId=3)
-- ==========================================
UPDATE event_expressions
SET
    MessageTemplate = 'Missing {{missingEntryLabel}} entry for {{tankName}} on {{checkDateDisplay}}.',
    ModifiedAt = UTC_TIMESTAMP(),
    ModifiedBy = CreatedBy
WHERE Id = 3;

-- ==========================================
-- 3) Verify values (after change)
-- ==========================================
SELECT Id, Name, TitleTemplate, MessageTemplate, TriggerConditions, ModifiedAt, ModifiedBy
FROM notification_policy
WHERE Id = 8;

SELECT Id, Name, EventType, MessageTemplate, NotificationPolicyId, IsActive, ModifiedAt, ModifiedBy
FROM event_expressions
WHERE Id = 3;

-- ==========================================
-- 4) (Optional) quick health check for unresolved placeholders in recent rows
-- ==========================================
SELECT Id, NotificationId, Title, Message, TriggerSource, CreatedAt
FROM notification
WHERE TriggerSource = 'EventExpression:3'
ORDER BY Id DESC
LIMIT 10;
