-- File: 2026-02-25_fix_notankstockentry_notification_templates_mysql55.rollback.sql
-- Purpose: Roll back template changes applied by 2026-02-25_fix_notankstockentry_notification_templates_mysql55.sql
-- Target DB: MySQL 5.5 / 5.6 (gpsdata)

USE gpsdata;

-- ==========================================
-- 0) Inspect current values (before rollback)
-- ==========================================
SELECT Id, Name, TitleTemplate, MessageTemplate, TriggerConditions
FROM notification_policy
WHERE Id = 8;

SELECT Id, Name, EventType, MessageTemplate, NotificationPolicyId, IsActive
FROM event_expressions
WHERE Id = 3;

-- ==========================================
-- 1) Roll back policy template (Id=8)
-- ==========================================
UPDATE notification_policy
SET
    TitleTemplate = 'Alert: {{alarmType}} - {{severity}}',
    MessageTemplate = 'You have not enter any data ',
    ModifiedAt = UTC_TIMESTAMP(),
    ModifiedBy = CreatedBy
WHERE Id = 8;

-- ==========================================
-- 2) Roll back expression template (Id=3)
-- ==========================================
UPDATE event_expressions
SET
    MessageTemplate = 'You have not enter any data ',
    ModifiedAt = UTC_TIMESTAMP(),
    ModifiedBy = CreatedBy
WHERE Id = 3;

-- ==========================================
-- 3) Verify rollback values
-- ==========================================
SELECT Id, Name, TitleTemplate, MessageTemplate, TriggerConditions, ModifiedAt, ModifiedBy
FROM notification_policy
WHERE Id = 8;

SELECT Id, Name, EventType, MessageTemplate, NotificationPolicyId, IsActive, ModifiedAt, ModifiedBy
FROM event_expressions
WHERE Id = 3;
