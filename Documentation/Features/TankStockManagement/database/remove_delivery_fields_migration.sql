-- ========================================
-- Migration: Remove unused fields from delivery table
-- Date: 2025-11-13
-- Description: Removes StockBeforeDelivery, StockAfterDelivery, PricePerLiter, LPONumber, and Product fields
-- ========================================

USE `gpsdata`;

-- Step 1: Drop the composite index that includes PricePerLiter
ALTER TABLE `delivery`
  DROP INDEX `IX_Delivery_TankId_DeliveryDate_PricePerLiter`;

-- Step 2: Remove columns
ALTER TABLE `delivery`
  DROP COLUMN `StockBeforeDelivery`,
  DROP COLUMN `StockAfterDelivery`,
  DROP COLUMN `PricePerLiter`,
  DROP COLUMN `LPONumber`,
  DROP COLUMN `Product`;

-- Step 3: Add new composite index without PricePerLiter
ALTER TABLE `delivery`
  ADD INDEX `IX_Delivery_TankId_DeliveryDate` (`TankId`, `DeliveryDate`) USING BTREE;

-- ========================================
-- Verification Queries
-- ========================================

-- Verify columns have been removed
DESCRIBE `delivery`;

-- Verify new index exists
SHOW INDEXES FROM `delivery` WHERE Key_name = 'IX_Delivery_TankId_DeliveryDate';

-- Check record count (should remain the same)
SELECT COUNT(*) AS total_deliveries FROM `delivery`;

-- ========================================
-- Rollback Script (if needed)
-- ========================================
/*
-- WARNING: This rollback will restore columns but data will be lost!
-- Only use if migration needs to be reverted immediately after execution

USE `gpsdata`;

-- Drop the new index
ALTER TABLE `delivery`
  DROP INDEX `IX_Delivery_TankId_DeliveryDate`;

-- Add back the removed columns
ALTER TABLE `delivery`
  ADD COLUMN `StockBeforeDelivery` DECIMAL(10,0) NULL DEFAULT NULL AFTER `DeliveryMass`,
  ADD COLUMN `StockAfterDelivery` DECIMAL(10,0) NULL DEFAULT NULL AFTER `StockBeforeDelivery`,
  ADD COLUMN `PricePerLiter` DECIMAL(10,2) NOT NULL DEFAULT '150.00' COMMENT 'Price per liter in Kenya Shillings (KES)' AFTER `CreatedOn`,
  ADD COLUMN `LPONumber` VARCHAR(45) NULL DEFAULT NULL COLLATE 'latin1_swedish_ci' AFTER `SupplierId`,
  ADD COLUMN `Product` VARCHAR(100) NOT NULL COLLATE 'latin1_swedish_ci' AFTER `LPONumber`;

-- Recreate the old composite index
ALTER TABLE `delivery`
  ADD INDEX `IX_Delivery_TankId_DeliveryDate_PricePerLiter` (`TankId`, `DeliveryDate`, `PricePerLiter`) USING BTREE;

*/
