-- Migration: Add CooldownMinutes column to issuetemplate table
-- Purpose: Allows per-template cooldown period to prevent repeated issue creation
--          for the same vehicle after an issue is auto-closed.
-- Date: 2026-02-10

ALTER TABLE `issuetemplate`
    ADD COLUMN `CooldownMinutes` int(11) DEFAULT NULL
    COMMENT 'Minutes to suppress re-creation of issues for the same device after auto-close. NULL or 0 = no cooldown.';
