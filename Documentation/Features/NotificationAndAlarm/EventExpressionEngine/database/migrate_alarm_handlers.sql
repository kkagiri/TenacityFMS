-- ============================================================================
-- Migration: alarm_handlers → event_expressions
-- Purpose:   Copy existing alarm handler configurations to the new event
--            expressions table so the Event Expression Engine can take over.
-- Prerequisite: Run migration.sql (creates event_expressions table) first.
-- Rollback:  DROP TABLE IF EXISTS event_expressions;
-- Date:      2026-02-11
-- ============================================================================

-- 1. Verify source table exists
SELECT COUNT(*) AS alarm_handler_count FROM alarm_handler;

-- 2. Insert alarm_handlers → event_expressions
--    Maps: AlarmType → EventType, AlarmId → (unused), TriggerConditions → Conditions
INSERT INTO event_expressions (
    Name,
    Description,
    IsActive,
    EventType,
    SiteId,
    TankId,
    DeviceId,
    MinimumSeverity,
    Conditions,
    NotificationPolicyId,
    CreateIssueTracker,
    IssueCategory,
    IssuePriority,
    AssignIssueTo,
    CooldownMinutes,
    MaxNotificationsPerDay,
    EnableEscalation,
    EscalationRules,
    MessageTemplate,
    Priority,
    CreateActiveEvent,
    CreatedBy,
    CreatedAt,
    ModifiedBy,
    ModifiedAt,
    TriggerCount,
    LastTriggeredAt
)
SELECT
    ah.Name,
    ah.Description,
    ah.IsActive,
    -- Map AlarmType to EventType (same values are used)
    ah.AlarmType                    AS EventType,
    ah.SiteId,
    ah.TankId,
    NULL                            AS DeviceId,
    NULL                            AS MinimumSeverity,
    ah.TriggerConditions            AS Conditions,
    ah.NotificationPolicyId,
    ah.CreateIssueTracker,
    ah.IssueCategory,
    ah.IssuePriority,
    ah.AssignIssueTo,
    ah.CooldownMinutes,
    ah.MaxNotificationsPerDay,
    ah.EnableEscalation,
    ah.EscalationRules,
    ah.MessageTemplate,
    ah.Priority,
    1                               AS CreateActiveEvent,
    ah.CreatedBy,
    ah.CreatedAt,
    ah.ModifiedBy,
    ah.ModifiedAt,
    ah.TriggerCount,
    ah.LastTriggeredAt
FROM alarm_handler ah
WHERE NOT EXISTS (
    -- Idempotent: skip if already migrated (match by Name + EventType)
    SELECT 1 FROM event_expressions ee
    WHERE ee.Name = ah.Name AND ee.EventType = ah.AlarmType
);

-- 3. Verify migration
SELECT
    (SELECT COUNT(*) FROM alarm_handler)         AS source_count,
    (SELECT COUNT(*) FROM event_expressions)     AS target_count;

-- 4. (Optional) Rename old table to archive it
-- ALTER TABLE alarm_handler RENAME TO alarm_handler_archived;
