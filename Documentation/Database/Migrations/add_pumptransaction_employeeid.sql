-- Migration Script: Add EmployeeId to pumptransaction table
-- Purpose: Track which employee/driver performed the fueling operation
-- Date: 2026-01-08
--
-- Description:
--   - EmployeeId: FK to employees table for the driver/operator who performed fueling
--   - Captured during mobile app authorization flow
--   - Displayed as "Driver" in transaction history

-- Step 1: Add EmployeeId column
ALTER TABLE `pumptransaction`
ADD COLUMN `EmployeeId` INT(11) NULL DEFAULT NULL
COMMENT 'FK to employees table - driver/operator who performed the fueling'
AFTER `IsTransferMode`;

-- Step 2: Add index for EmployeeId (performance for filtering by driver)
CREATE INDEX `idx_pumptransaction_employeeid`
ON `pumptransaction` (`EmployeeId`);

-- Step 3: Clean up orphaned EmployeeId values (set to NULL if employee doesn't exist)
-- This is required before adding the FK constraint
UPDATE `pumptransaction` pt
SET pt.EmployeeId = NULL
WHERE pt.EmployeeId IS NOT NULL
  AND pt.EmployeeId NOT IN (SELECT e.id FROM employee e);

-- Step 4: Add foreign key constraint to employee table
ALTER TABLE `pumptransaction`
ADD CONSTRAINT `FK_pumptransaction_employee`
FOREIGN KEY (`EmployeeId`)
REFERENCES `employee` (`id`)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Verification query (run after migration)
-- SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
-- FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_NAME = 'pumptransaction' AND COLUMN_NAME = 'EmployeeId';
