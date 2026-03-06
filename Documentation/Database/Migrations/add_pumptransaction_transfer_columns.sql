-- Migration Script: Add DestinationTankId and IsTransferMode to pumptransaction table
-- Purpose: Enable tracking of tank-to-tank transfers in pump transactions
-- Date: 2026-01-07
-- 
-- Description:
--   - DestinationTankId: FK to tanks table for destination tank in tank-to-tank transfers
--   - IsTransferMode: Boolean flag indicating tank transfer (true) vs vehicle fueling (false)
--
-- For tank-to-tank transfers:
--   - TankId = source tank (where fuel comes from)
--   - DestinationTankId = destination tank (where fuel goes to)
--   - IsTransferMode = 1
--   - VehicleId = NULL
--
-- For vehicle fueling:
--   - TankId = source tank
--   - DestinationTankId = NULL
--   - IsTransferMode = 0
--   - VehicleId = receiving vehicle

-- Step 1: Add DestinationTankId column
ALTER TABLE `pumptransaction` 
ADD COLUMN `DestinationTankId` INT(11) NULL DEFAULT NULL 
COMMENT 'FK to tanks table - destination tank for tank-to-tank transfers'
AFTER `VehicleId`;

-- Step 2: Add IsTransferMode column
ALTER TABLE `pumptransaction` 
ADD COLUMN `IsTransferMode` TINYINT(1) NOT NULL DEFAULT 0 
COMMENT 'True (1) for tank-to-tank transfers, False (0) for vehicle fueling'
AFTER `DestinationTankId`;

-- Step 3: Add index for DestinationTankId (performance)
CREATE INDEX `idx_pumptransaction_destinationtankid` 
ON `pumptransaction` (`DestinationTankId`);

-- Step 4: Add index for IsTransferMode (for filtering transfer transactions)
CREATE INDEX `idx_pumptransaction_istransfermode` 
ON `pumptransaction` (`IsTransferMode`);

-- Step 5: Add foreign key constraint to tanks table
ALTER TABLE `pumptransaction` 
ADD CONSTRAINT `FK_destination_tank` 
FOREIGN KEY (`DestinationTankId`) 
REFERENCES `tanks` (`id`) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Verification query (run after migration)
-- SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
-- FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_NAME = 'pumptransaction' 
-- AND COLUMN_NAME IN ('DestinationTankId', 'IsTransferMode');
