# Database Refactoring: Event Expression Engine

## Overview

This document contains the MySQL migration scripts to transition from the `alarm_handlers` / `active_alarms` system to the new `event_expressions` / `active_events` system.

**MySQL 5.5 Compatible** — No JSON type, TIMESTAMP for defaults, utf8mb4_general_ci.

---

## Step 1: Create New Tables

```sql
-- ============================================================
-- EVENT EXPRESSIONS (replaces alarm_handler)
-- Mirrors alarm_handler FK pattern: sites, tanks, notification_policies,
-- issuecategory, issuepriority, user (CreatedBy/ModifiedBy)
-- ============================================================
CREATE TABLE IF NOT EXISTS `event_expressions` (
    `Id` INT(11) NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(100) NOT NULL,
    `Description` VARCHAR(500) NULL,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    `EventType` VARCHAR(50) NOT NULL COMMENT 'Match key: TankStockDiscrepancy, DeviceOffline, etc.',
    `SiteId` INT(11) NULL COMMENT 'Scope: null = all sites',
    `TankId` INT(11) NULL COMMENT 'Scope: null = all tanks',
    `DeviceId` INT(11) NULL COMMENT 'Scope: null = all devices',
    `MinimumSeverity` VARCHAR(20) NULL COMMENT 'Low, Medium, High, Critical',
    `Conditions` TEXT NULL COMMENT 'JSON: type-specific conditions e.g. {"minVariance":50}',
    `NotificationPolicyId` INT(11) NOT NULL,
    `CreateIssueTracker` TINYINT(1) NOT NULL DEFAULT 0,
    `IssueCategory` INT(11) NULL,
    `IssuePriority` INT(11) NULL,
    `AssignIssueTo` VARCHAR(100) NULL,
    `CooldownMinutes` INT(11) NOT NULL DEFAULT 30,
    `MaxNotificationsPerDay` INT(11) NOT NULL DEFAULT 0 COMMENT '0 = unlimited',
    `EnableEscalation` TINYINT(1) NOT NULL DEFAULT 0,
    `EscalationRules` TEXT NULL COMMENT 'JSON: escalation configuration',
    `MessageTemplate` TEXT NULL,
    `Priority` VARCHAR(20) NOT NULL DEFAULT 'Medium',
    `CreateActiveEvent` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Whether to create ActiveEvent record',
    `CreatedBy` VARCHAR(100) NOT NULL,
    `CreatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `ModifiedBy` VARCHAR(100) NULL,
    `ModifiedAt` TIMESTAMP NULL,
    `TriggerCount` INT(11) NOT NULL DEFAULT 0,
    `LastTriggeredAt` TIMESTAMP NULL,
    PRIMARY KEY (`Id`),
    INDEX `IX_event_expressions_EventType` (`EventType`, `IsActive`),
    INDEX `IX_event_expressions_SiteId` (`SiteId`),
    INDEX `IX_event_expressions_TankId` (`TankId`),
    INDEX `IX_event_expressions_PolicyId` (`NotificationPolicyId`),
    INDEX `IX_event_expressions_CreatedBy` (`CreatedBy`),
    INDEX `IX_event_expressions_ModifiedBy` (`ModifiedBy`),
    INDEX `IX_event_expressions_IssueCategory` (`IssueCategory`),
    INDEX `IX_event_expressions_IssuePriority` (`IssuePriority`),
    INDEX `IX_event_expressions_AssignIssueTo` (`AssignIssueTo`),
    CONSTRAINT `FK_event_expressions_policy` FOREIGN KEY (`NotificationPolicyId`)
        REFERENCES `notification_policy` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_event_expressions_site` FOREIGN KEY (`SiteId`)
        REFERENCES `site` (`id`) ON DELETE SET NULL,
    CONSTRAINT `FK_event_expressions_tank` FOREIGN KEY (`TankId`)
        REFERENCES `tank` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `FK_event_expressions_issue_cat` FOREIGN KEY (`IssueCategory`)
        REFERENCES `issuecategory` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `FK_event_expressions_issue_pri` FOREIGN KEY (`IssuePriority`)
        REFERENCES `issuepriority` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `FK_EventExpressions_CreatedBy` FOREIGN KEY (`CreatedBy`)
        REFERENCES `user` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_EventExpressions_ModifiedBy` FOREIGN KEY (`ModifiedBy`)
        REFERENCES `user` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ============================================================
-- EVENT EXPRESSION EXECUTIONS (replaces alarm_handler_execution)
-- Mirrors alarm_handler_execution FK pattern
-- ============================================================
CREATE TABLE IF NOT EXISTS `event_expression_executions` (
    `Id` INT(11) NOT NULL AUTO_INCREMENT,
    `EventExpressionId` INT(11) NOT NULL,
    `EventType` VARCHAR(50) NOT NULL,
    `ExecutedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `WasTriggered` TINYINT(1) NOT NULL DEFAULT 0,
    `SuppressedReason` VARCHAR(100) NULL COMMENT 'Cooldown, DailyCap, ConditionNotMet, Disabled',
    `EventData` TEXT NULL COMMENT 'JSON: Snapshot of the FMSEvent data',
    `NotificationId` INT(11) NULL COMMENT 'FK to notification created, if any',
    `IssueTrackerId` INT(11) NULL COMMENT 'FK to issue tracker created, if any',
    `Success` TINYINT(1) NOT NULL DEFAULT 1,
    `ErrorMessage` VARCHAR(500) NULL,
    `ExecutionTimeMs` INT(11) NOT NULL DEFAULT 0,
    PRIMARY KEY (`Id`),
    INDEX `IX_executions_ExpressionId` (`EventExpressionId`, `ExecutedAt`),
    INDEX `IX_executions_EventType` (`EventType`, `ExecutedAt`),
    INDEX `IX_executions_NotificationId` (`NotificationId`),
    INDEX `IX_executions_IssueTrackerId` (`IssueTrackerId`),
    CONSTRAINT `FK_executions_expression` FOREIGN KEY (`EventExpressionId`)
        REFERENCES `event_expressions` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_executions_notification` FOREIGN KEY (`NotificationId`)
        REFERENCES `notification` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `FK_executions_issuetracker` FOREIGN KEY (`IssueTrackerId`)
        REFERENCES `issuetracker` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ============================================================
-- ACTIVE EVENTS (replaces activealarms)
-- Mirrors activealarms FK/column pattern
-- ============================================================
CREATE TABLE IF NOT EXISTS `active_events` (
    `Id` INT(11) NOT NULL AUTO_INCREMENT,
    `EventType` VARCHAR(50) NOT NULL,
    `State` VARCHAR(20) NOT NULL DEFAULT 'Active' COMMENT 'Active, Acknowledged, Resolved, Suppressed',
    `TriggerSource` VARCHAR(20) NOT NULL COMMENT 'Manual, Expression, Hardware, System',
    `Severity` INT(11) NOT NULL DEFAULT 2 COMMENT '1=Low, 2=Medium, 3=High, 4=Critical',
    `Priority` VARCHAR(20) NOT NULL DEFAULT 'Medium',
    `Message` VARCHAR(500) NOT NULL,
    `Description` VARCHAR(1000) NULL,
    `SiteId` INT(11) NULL,
    `TankId` INT(11) NULL,
    `DeviceId` INT(11) NULL,
    `PtsDeviceId` VARCHAR(50) NULL,
    `EventExpressionId` INT(11) NULL COMMENT 'Which expression triggered this event',
    `TriggeredAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `AcknowledgedAt` TIMESTAMP NULL,
    `ResolvedAt` TIMESTAMP NULL,
    `AcknowledgedBy` VARCHAR(100) NULL,
    `ResolvedBy` VARCHAR(100) NULL,
    `TriggeredBy` VARCHAR(100) NULL,
    `ThresholdValue` DECIMAL(18,4) NULL,
    `ActualValue` DECIMAL(18,4) NULL,
    `Unit` VARCHAR(20) NULL,
    `EscalationLevel` INT(11) NOT NULL DEFAULT 0,
    `LastEscalatedAt` TIMESTAMP NULL,
    `AutoResolveMinutes` INT(11) NOT NULL DEFAULT 0,
    `ResolutionNotes` LONGTEXT NULL,
    `EventData` TEXT NULL COMMENT 'JSON: Full FMSEvent snapshot',
    `SuppressNotifications` TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (`Id`),
    INDEX `IX_active_events_State` (`State`, `TriggeredAt`),
    INDEX `IX_active_events_EventType` (`EventType`, `State`),
    INDEX `IX_active_events_SiteId` (`SiteId`, `State`),
    INDEX `IX_active_events_Severity` (`Severity`),
    INDEX `IX_active_events_Priority` (`Priority`),
    INDEX `IX_active_events_PtsDeviceId` (`PtsDeviceId`),
    INDEX `IX_active_events_ExpressionId` (`EventExpressionId`),
    CONSTRAINT `FK_active_events_expression` FOREIGN KEY (`EventExpressionId`)
        REFERENCES `event_expressions` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `FK_active_events_site` FOREIGN KEY (`SiteId`)
        REFERENCES `site` (`id`) ON DELETE SET NULL,
    CONSTRAINT `FK_active_events_tank` FOREIGN KEY (`TankId`)
        REFERENCES `tank` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

---

## Step 2: Migrate Data from alarm_handlers → event_expressions

```sql
-- ============================================================
-- MIGRATE ALARM HANDLERS → EVENT EXPRESSIONS
-- ============================================================
-- Run AFTER creating new tables. Preserves all data.

INSERT INTO `event_expressions` (
    `Name`,
    `Description`,
    `IsActive`,
    `EventType`,
    `SiteId`,
    `TankId`,
    `DeviceId`,
    `MinimumSeverity`,
    `Conditions`,
    `NotificationPolicyId`,
    `CooldownMinutes`,
    `MaxNotificationsPerDay`,
    `Priority`,
    `CreateActiveEvent`,
    `CreatedBy`,
    `CreatedAt`,
    `ModifiedBy`,
    `ModifiedAt`,
    `TriggerCount`,
    `LastTriggeredAt`
)
SELECT
    ah.`Name`,
    ah.`Description`,
    ah.`IsActive`,
    ah.`AlarmType` AS `EventType`,
    ah.`SiteId`,
    ah.`TankId`,
    NULL AS `DeviceId`,
    NULL AS `MinimumSeverity`,
    ah.`TriggerConditions` AS `Conditions`,
    ah.`NotificationPolicyId`,
    ah.`CooldownMinutes`,
    ah.`MaxNotificationsPerDay`,
    ah.`Priority`,
    1 AS `CreateActiveEvent`,
    ah.`CreatedBy`,
    ah.`CreatedAt`,
    ah.`ModifiedBy`,
    ah.`ModifiedAt`,
    ah.`TriggerCount`,
    ah.`LastTriggeredAt`
FROM `alarm_handler` ah
WHERE ah.`NotificationPolicyId` IN (SELECT `Id` FROM `notification_policy`);


-- ============================================================
-- VERIFY MIGRATION
-- ============================================================
SELECT 'alarm_handler count' AS label, COUNT(*) AS cnt FROM `alarm_handler`
UNION ALL
SELECT 'event_expressions count', COUNT(*) FROM `event_expressions`;
```

---

## Step 3: Fix WellKnownCategories Alignment

```sql
-- ============================================================
-- VERIFY current notification_categories IDs
-- ============================================================
SELECT Id, Name FROM notificationcategories ORDER BY Id;

-- The C# WellKnownCategories enum must match these IDs exactly.
-- Update the enum in NotificationEnums.cs to match the actual DB values.
-- DO NOT change DB IDs — change the enum.
```

---

## Step 4: Cleanup (Phase 4 — AFTER validation)

```sql
-- ⚠️ ONLY RUN AFTER CONFIRMING ALL DATA MIGRATED AND NEW SYSTEM IS WORKING

-- Drop old trigger conditions from policies
-- ALTER TABLE `notification_policies` DROP COLUMN `TriggerConditions`;

-- Drop old tables
-- DROP TABLE IF EXISTS `alarm_handler_execution`;
-- DROP TABLE IF EXISTS `alarm_handler`;

-- Note: Keep active_alarms table as read-only archive.
-- New code writes to active_events only.
```
