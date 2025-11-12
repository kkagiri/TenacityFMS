-- Complete ReconciliationDiscrepancy table setup
-- This script creates the table if it doesn't exist, or fixes it if it does
-- Date: 2025-11-12

-- Create the table if it doesn't exist (with nullable PolicyExecutionId from the start)
CREATE TABLE IF NOT EXISTS `reconciliationdiscrepancy` (
    `Id` INT(11) NOT NULL AUTO_INCREMENT,
    `PolicyExecutionId` INT(11) NULL DEFAULT NULL,
    `TankId` INT(11) NOT NULL,
    `DetectedAt` DATETIME NOT NULL,
    `CurrentStock` DECIMAL(10,2) NOT NULL,
    `ExpectedStock` DECIMAL(10,2) NOT NULL,
    `AbsoluteVariance` DECIMAL(10,2) NOT NULL,
    `PercentageVariance` DECIMAL(5,2) NOT NULL,
    `Severity` INT(11) NOT NULL,
    `IsResolved` TINYINT(1) NULL DEFAULT '0',
    `ResolvedAt` DATETIME NULL DEFAULT NULL,
    `ResolutionMethod` VARCHAR(100) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
    `AnalysisNotes` VARCHAR(500) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
    `TrendAnalysis` TEXT NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
    `BusinessImpactScore` DECIMAL(5,2) NULL DEFAULT NULL,
    PRIMARY KEY (`Id`) USING BTREE,
    INDEX `FK_ReconciliationDiscrepancy_PolicyExecution_idx` (`PolicyExecutionId`) USING BTREE,
    INDEX `FK_ReconciliationDiscrepancy_Tank_idx` (`TankId`) USING BTREE,
    INDEX `IX_ReconciliationDiscrepancy_DetectedAt` (`DetectedAt`) USING BTREE,
    INDEX `IX_ReconciliationDiscrepancy_Severity` (`Severity`) USING BTREE,
    INDEX `IX_ReconciliationDiscrepancy_IsResolved` (`IsResolved`) USING BTREE
)
COLLATE='utf8mb4_unicode_ci'
ENGINE=InnoDB;

-- If table exists but PolicyExecutionId is NOT NULL, fix it
-- Check if we need to drop and recreate the constraint
SET @constraint_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reconciliationdiscrepancy'
    AND CONSTRAINT_NAME = 'FK_ReconciliationDiscrepancy_PolicyExecution'
);

-- Drop foreign key if it exists
SET @sql = IF(@constraint_exists > 0,
    'ALTER TABLE `reconciliationdiscrepancy` DROP FOREIGN KEY `FK_ReconciliationDiscrepancy_PolicyExecution`',
    'SELECT "FK constraint does not exist, skipping drop"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify column to be nullable (safe even if already nullable)
ALTER TABLE `reconciliationdiscrepancy`
MODIFY COLUMN `PolicyExecutionId` INT(11) NULL DEFAULT NULL;

-- Recreate foreign key constraint with SET NULL on delete
ALTER TABLE `reconciliationdiscrepancy`
ADD CONSTRAINT `FK_ReconciliationDiscrepancy_PolicyExecution`
FOREIGN KEY (`PolicyExecutionId`)
REFERENCES `reconciliationpolicyexecution` (`Id`)
ON UPDATE RESTRICT
ON DELETE SET NULL;

-- Add Tank foreign key if it doesn't exist
SET @tank_constraint_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reconciliationdiscrepancy'
    AND CONSTRAINT_NAME = 'FK_ReconciliationDiscrepancy_Tank'
);

SET @sql = IF(@tank_constraint_exists = 0,
    'ALTER TABLE `reconciliationdiscrepancy`
     ADD CONSTRAINT `FK_ReconciliationDiscrepancy_Tank`
     FOREIGN KEY (`TankId`)
     REFERENCES `tank` (`Id`)
     ON UPDATE RESTRICT
     ON DELETE RESTRICT',
    'SELECT "Tank FK constraint already exists, skipping"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify the changes
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'reconciliationdiscrepancy'
ORDER BY ORDINAL_POSITION;

SELECT 'ReconciliationDiscrepancy table setup completed successfully' AS Status;
