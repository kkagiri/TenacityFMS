-- Migration: Add RequirePasswordChangeOnFirstLogin column to the user identity table
-- Description: Forces newly onboarded users to change their temporary password after the first successful login
-- Date: 2026-04-13

SET @target_table := (
    SELECT CASE
        WHEN EXISTS (
            SELECT 1
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user'
        ) THEN 'user'
        WHEN EXISTS (
            SELECT 1
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aspnetusers'
        ) THEN 'aspnetusers'
        ELSE NULL
    END
);

SET @alter_sql := IF(
    @target_table IS NULL,
    'SELECT ''No identity user table found.'' AS Message',
    CONCAT(
        'ALTER TABLE `', @target_table, '` ',
        'ADD COLUMN `RequirePasswordChangeOnFirstLogin` TINYINT(1) NOT NULL DEFAULT 0 ',
        'COMMENT ''When true, the user must change the temporary onboarding password after their first successful login.'''
    )
);

PREPARE add_first_login_flag_stmt FROM @alter_sql;
EXECUTE add_first_login_flag_stmt;
DEALLOCATE PREPARE add_first_login_flag_stmt;