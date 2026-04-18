-- =============================================================
-- Migration: Warning Letter — per-letter "hide count in subject"
--            option + system-wide effective start date config.
-- MySQL 5.5/5.6 compatible
-- Idempotent: safe to run multiple times
-- =============================================================

-- -------------------------------------------------------------
-- 1) warning_letter.HideWarningCountInSubject column
--    TINYINT(1) NOT NULL DEFAULT 0
-- -------------------------------------------------------------
SET @columnExists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'warning_letter'
      AND COLUMN_NAME = 'HideWarningCountInSubject'
);

SET @ddl := IF(
    @columnExists = 0,
    'ALTER TABLE warning_letter ADD COLUMN HideWarningCountInSubject TINYINT(1) NOT NULL DEFAULT 0 AFTER IssuedByTitle',
    'SELECT ''warning_letter.HideWarningCountInSubject already exists'''
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- -------------------------------------------------------------
-- 2) systemconfigurations — WarningLetter:EffectiveStartDate
--    Default: 2026-04-14 (system-in-place date)
--    Applies to:
--      - Warning letter counter (per-employee/per-type ordinal)
--      - Warning Letter Analytics report
--      - Warning Letter Candidates report
-- -------------------------------------------------------------
INSERT INTO systemconfigurations
    (ConfigurationKey, ConfigurationValue, Description, DataType,
     Category, IsActive, IsEditable, DefaultValue)
SELECT
    'WarningLetter:EffectiveStartDate',
    '2026-04-14',
    'System-in-place date for the Warning Letter feature. Letters, candidates and analytics prior to this date are ignored by the counter and both reports.',
    'date',
    'WarningLetter',
    1,
    1,
    '2026-04-14'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM systemconfigurations
    WHERE ConfigurationKey = 'WarningLetter:EffectiveStartDate'
);
