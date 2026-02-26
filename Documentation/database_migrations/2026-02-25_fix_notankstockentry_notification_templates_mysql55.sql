-- File: 2026-02-25_fix_notankstockentry_notification_templates_mysql55.sql
-- Purpose: Fix blank/low-detail NoTankStockEntry notifications caused by mismatched template placeholders.
-- Target DB: MySQL 5.5 / 5.6 (gpsdata)
--
-- Root cause:
-- 1) notification_policy.Id = 8 used TitleTemplate with {{alarmType}} (not present in SystemEvent template variables)
-- 2) event_expressions.Id = 3 used generic MessageTemplate ('You have not enter any data')
--
-- Result after patch:
-- - Title uses available variables from SystemEvent: {{SubType}}, {{Severity}}
-- - Message includes tank/site/date/last-entry context from event Data/template variables

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
    TitleTemplate = 'Alert: {{SubType}} - {{Severity}}',
    MessageTemplate = 'No {{missingEntryType}} entry submitted for {{tankName}} at {{siteName}} on {{checkDate}}. Last entry: {{lastEntryDate}}.',
    ModifiedAt = UTC_TIMESTAMP(),
    ModifiedBy = CreatedBy
WHERE Id = 8;

-- ==========================================
-- 2) Fix expression-level message template (active source for ExpressionId=3)
-- ==========================================
UPDATE event_expressions
SET
    MessageTemplate = 'No {{missingEntryType}} entry submitted for {{tankName}} at {{siteName}} on {{checkDate}}. Last entry: {{lastEntryDate}}.',
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
