-- Fix ReconciliationDiscrepancy table to make PolicyExecutionId nullable
-- This allows manual closing stock discrepancies to exist without a policy execution
-- Date: 2025-11-12
-- Issue: EF Core was trying to insert ReconciliationPolicyId column which doesn't exist

-- Step 1: Drop the foreign key constraint
ALTER TABLE `reconciliationdiscrepancy`
DROP FOREIGN KEY `FK_ReconciliationDiscrepancy_PolicyExecution`;

-- Step 2: Modify the PolicyExecutionId column to allow NULL
ALTER TABLE `reconciliationdiscrepancy`
MODIFY COLUMN `PolicyExecutionId` INT(11) NULL DEFAULT NULL;

-- Step 3: Recreate the foreign key constraint with ON DELETE SET NULL
ALTER TABLE `reconciliationdiscrepancy`
ADD CONSTRAINT `FK_ReconciliationDiscrepancy_PolicyExecution`
FOREIGN KEY (`PolicyExecutionId`)
REFERENCES `reconciliationpolicyexecution` (`Id`)
ON UPDATE RESTRICT
ON DELETE SET NULL;

-- Verify the change
DESCRIBE `reconciliationdiscrepancy`;
