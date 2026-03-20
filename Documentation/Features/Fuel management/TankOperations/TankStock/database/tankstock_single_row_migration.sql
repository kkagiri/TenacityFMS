-- =====================================================
-- TankStock Single-Row-Per-Day Architecture Migration
-- =====================================================
-- Purpose: Migrate TankStock table to support single row per tank per day
-- Date: 2025-01-20
-- Author: System Migration
--
-- This script:
-- 1. Adds new columns for delivery and transfer tracking
-- 2. Adds unique constraint to prevent multiple entries per tank per day
-- 3. Prepares for data consolidation
-- =====================================================

USE gpsdata;

-- Step 1: Add new columns to tankstock table
ALTER TABLE tankstock
ADD COLUMN DeliveryAmount DECIMAL(10,2) NULL COMMENT 'Total delivery amount for this tank on this day',
ADD COLUMN DeliveryId INT(11) NULL COMMENT 'Reference to Delivery record if delivery occurred',
ADD COLUMN TransferInAmount DECIMAL(10,2) NULL COMMENT 'Total fuel transferred INTO this tank from other tanks on this day',
ADD COLUMN TransferOutAmount DECIMAL(10,2) NULL COMMENT 'Total fuel transferred OUT of this tank to other tanks on this day',
ADD COLUMN TransferRecordId INT(11) NULL COMMENT 'Reference to TankTransfer record if transfer occurred';

-- Step 2: Add indexes for the new foreign key columns
ALTER TABLE tankstock
ADD INDEX idx_tankstock_deliveryid (DeliveryId),
ADD INDEX idx_tankstock_transferrecordid (TransferRecordId);

-- Step 3: Add foreign key constraints (optional - uncomment if needed)
-- ALTER TABLE tankstock
-- ADD CONSTRAINT fk_tankstock_delivery
--     FOREIGN KEY (DeliveryId) REFERENCES deliveries(Id) ON DELETE SET NULL,
-- ADD CONSTRAINT fk_tankstock_tanktransfer
--     FOREIGN KEY (TransferRecordId) REFERENCES tanktransfers(Id) ON DELETE SET NULL;

-- Step 4: Create unique constraint (will be enforced AFTER data consolidation)
-- Note: Do NOT run this until after consolidating existing data
-- This constraint only applies to non-deleted entries (IsDeleted = 0)
-- ALTER TABLE tankstock
-- ADD UNIQUE INDEX UQ_tankstock_tank_date (TankID, EntryDate, IsDeleted);

-- Step 5: Verify the changes
DESCRIBE tankstock;

-- Step 6: Check for existing duplicate entries (run before consolidation)
SELECT
    TankID,
    DATE(EntryDate) as EntryDate,
    COUNT(*) as EntryCount,
    GROUP_CONCAT(EntryID ORDER BY CreatedOn) as EntryIDs,
    GROUP_CONCAT(EntryType ORDER BY CreatedOn) as EntryTypes
FROM tankstock
GROUP BY TankID, DATE(EntryDate)
HAVING COUNT(*) > 1
ORDER BY TankID, EntryDate;

-- Step 7: Summary statistics before consolidation
SELECT
    'Total TankStock Entries' as Description,
    COUNT(*) as Count
FROM tankstock
UNION ALL
SELECT
    'Unique Tank-Date Combinations' as Description,
    COUNT(DISTINCT CONCAT(TankID, '-', DATE(EntryDate))) as Count
FROM tankstock
UNION ALL
SELECT
    'Entries with Multiple Rows per Day' as Description,
    SUM(EntryCount - 1) as Count
FROM (
    SELECT
        TankID,
        DATE(EntryDate) as EntryDate,
        COUNT(*) as EntryCount
    FROM tankstock
    GROUP BY TankID, DATE(EntryDate)
    HAVING COUNT(*) > 1
) duplicates;

-- =====================================================
-- IMPORTANT NOTES:
-- =====================================================
-- 1. Run Steps 1-3 first to add columns
-- 2. Run the Python consolidation script to merge duplicate entries
-- 3. After consolidation is verified, run Step 4 to add unique constraint
-- 4. Update application code to use new single-row-per-day logic
-- 5. Monitor for any issues during transition period
-- =====================================================
