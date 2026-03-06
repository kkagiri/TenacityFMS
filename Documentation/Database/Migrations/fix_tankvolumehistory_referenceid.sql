-- ============================================================================
-- Migration Script: Fix TankVolumeHistory Issues
-- ============================================================================
--
-- PART 1: Fix AutomatedDispensing ReferenceId
-- Issue: ReferenceId was storing PTS transaction number instead of database PK
-- Root Cause: CreatePumpTransactionCommand.cs and AutoTransactionCompletionService.cs
--             were passing transaction.Transaction instead of transaction.Id
--
-- PART 2: Fix ClosingStock VolumeChange calculations
-- Issue: VolumeChange was calculated from previous day's last transaction
--        instead of current day's last transaction before closing
-- Root Cause: ClosingStockCommand.cs compared against entryDate (00:00:00)
--             instead of closingStockTime (23:55:00)
--
-- Fix Applied: Code fixed in both cases
-- This Script: Fixes historical data for both issues
--
-- Date: 2026-01-19
-- ============================================================================

-- ============================================================================
-- PART 1: Fix AutomatedDispensing ReferenceId (PumpTransaction)
-- ============================================================================

-- Step 1: Diagnostic - Check how many records need fixing
-- ============================================================================
SELECT
    'Records with ChangeReason = 7 (AutomatedDispensing)' as Description,
    COUNT(*) as TotalCount
FROM tankvolumehistory
WHERE ChangeReason = 7;

SELECT
    'Records that CAN be fixed (PTS transaction number matches pumptransaction.Transaction)' as Description,
    COUNT(*) as FixableCount
FROM tankvolumehistory tvh
INNER JOIN pumptransaction pt ON pt.Transaction = tvh.ReferenceId
WHERE tvh.ChangeReason = 7
  AND tvh.ReferenceId != pt.Id;  -- Only count those that actually need fixing

SELECT
    'Records that CANNOT be fixed (no matching pumptransaction found)' as Description,
    COUNT(*) as UnfixableCount
FROM tankvolumehistory tvh
LEFT JOIN pumptransaction pt ON pt.Transaction = tvh.ReferenceId
WHERE tvh.ChangeReason = 7
  AND pt.Id IS NULL;

-- Step 2: Preview the changes (DRY RUN)
-- ============================================================================
-- This shows what will be updated without making changes
SELECT
    tvh.Id as TankVolumeHistoryId,
    tvh.ReferenceId as CurrentReferenceId_PTSNumber,
    pt.Id as CorrectReferenceId_DatabasePK,
    pt.Transaction as PTSTransactionNumber,
    pt.PtsId as DeviceId,
    tvh.TimeStamp,
    tvh.VolumeChange,
    tvh.TankId
FROM tankvolumehistory tvh
INNER JOIN pumptransaction pt ON pt.Transaction = tvh.ReferenceId
WHERE tvh.ChangeReason = 7
  AND tvh.ReferenceId != pt.Id
ORDER BY tvh.TimeStamp DESC
LIMIT 50;  -- Preview first 50 records

-- Step 3: BACKUP - Create backup of affected records before update
-- ============================================================================
-- Uncomment and run this to create a backup table first
/*
CREATE TABLE IF NOT EXISTS tankvolumehistory_referenceid_backup AS
SELECT
    tvh.Id,
    tvh.ReferenceId as OriginalReferenceId,
    pt.Id as NewReferenceId,
    NOW() as BackupDateTime
FROM tankvolumehistory tvh
INNER JOIN pumptransaction pt ON pt.Transaction = tvh.ReferenceId
WHERE tvh.ChangeReason = 7
  AND tvh.ReferenceId != pt.Id;
*/

-- Step 4: THE FIX - Update ReferenceId from PTS transaction number to database ID
-- ============================================================================
-- WARNING: Run the diagnostic queries first to understand the scope!
-- WARNING: Create a backup before running this in production!
--
-- This UPDATE joins on the PTS transaction number to find the correct database ID

/*
-- UNCOMMENT TO EXECUTE THE FIX:

UPDATE tankvolumehistory tvh
INNER JOIN pumptransaction pt ON pt.Transaction = tvh.ReferenceId
SET tvh.ReferenceId = pt.Id
WHERE tvh.ChangeReason = 7
  AND tvh.ReferenceId != pt.Id;

*/

-- Alternative with explicit subquery (if the JOIN UPDATE doesn't work on your MySQL version):
/*
UPDATE tankvolumehistory
SET ReferenceId = (
    SELECT pt.Id
    FROM pumptransaction pt
    WHERE pt.Transaction = tankvolumehistory.ReferenceId
    LIMIT 1
)
WHERE ChangeReason = 7
  AND EXISTS (
    SELECT 1
    FROM pumptransaction pt
    WHERE pt.Transaction = tankvolumehistory.ReferenceId
      AND pt.Id != tankvolumehistory.ReferenceId
  );
*/

-- Step 5: Verification - Confirm the fix worked
-- ============================================================================
-- After running the UPDATE, check that vehicle lookups now work
SELECT
    tvh.Id as TankVolumeHistoryId,
    tvh.ReferenceId,
    pt.Id as PumpTransactionId,
    pt.Transaction as PTSNumber,
    v.HyoungNo as VehicleName,
    vt.Name as VehicleType,
    tvh.VolumeChange as Volume,
    tvh.TimeStamp as TransactionDateTime
FROM tankvolumehistory tvh
LEFT JOIN pumptransaction pt ON pt.Id = tvh.ReferenceId
LEFT JOIN vehicle v ON v.VehicleId = pt.VehicleId
LEFT JOIN vehicletype vt ON vt.VehicleTypeId = v.VehicleTypeId
WHERE tvh.ChangeReason = 7
ORDER BY tvh.TimeStamp DESC
LIMIT 20;

-- ============================================================================
-- NOTES:
-- 1. The JOIN assumes pumptransaction.Transaction is unique per device
--    If there could be duplicate transaction numbers across devices,
--    you may need to add additional conditions (e.g., matching on TankId)
--
-- 2. Records where no matching pumptransaction is found will NOT be updated
--    These may represent deleted transactions or data inconsistencies
--
-- 3. After running this migration, new transactions will automatically
--    have the correct ReferenceId due to the code fix in:
--    - CreatePumpTransactionCommand.cs
--    - AutoTransactionCompletionService.cs
-- ============================================================================


-- ============================================================================
-- PART 2: Fix ClosingStock volumeChange calculations
-- ============================================================================
-- Issue: ClosingStock entries had incorrect volumeChange values because the
--        query used `Timestamp < entryDate` instead of `Timestamp < closingStockTime`
--        This caused it to find transactions from the PREVIOUS day instead of
--        the last transaction on the CURRENT day before 23:55:00.
--
-- Root Cause: ClosingStockCommand.cs line 257 was comparing against entryDate
--             (which is 00:00:00) instead of closingStockTime (23:55:00)
--
-- Fix Applied: Code fixed to use closingStockTime for the comparison
-- This Script: Recalculates volumeChange for historical ClosingStock entries
--
-- Date: 2026-01-19
-- ============================================================================

-- Step 1: Diagnostic - Check ClosingStock records with incorrect volumeChange
-- ============================================================================
SELECT
    'ClosingStock records that may need fixing' as Description,
    COUNT(*) as TotalCount
FROM tankvolumehistory
WHERE ChangeReason = 1  -- ClosingStock
  AND ReferenceType = 'ClosingStock';

-- Step 2: Preview ClosingStock records with their expected vs actual volumeChange
-- ============================================================================
-- This shows what the volumeChange SHOULD be vs what it currently is
SELECT
    closing.Id as ClosingStockId,
    closing.TankId,
    closing.TimeStamp as ClosingTime,
    closing.NewVolume as ClosingNewVolume,
    closing.VolumeChange as CurrentVolumeChange,
    prev.Id as PreviousTransactionId,
    prev.TimeStamp as PreviousTransactionTime,
    prev.NewVolume as PreviousNewVolume,
    prev.ChangeReason as PreviousChangeReason,
    (closing.NewVolume - COALESCE(prev.NewVolume, 0)) as CorrectVolumeChange,
    (closing.VolumeChange - (closing.NewVolume - COALESCE(prev.NewVolume, 0))) as Difference
FROM tankvolumehistory closing
LEFT JOIN LATERAL (
    -- Find the most recent transaction BEFORE the closing stock on the SAME DAY
    SELECT tvh2.Id, tvh2.TimeStamp, tvh2.NewVolume, tvh2.ChangeReason
    FROM tankvolumehistory tvh2
    WHERE tvh2.TankId = closing.TankId
      AND tvh2.TimeStamp < closing.TimeStamp
      AND tvh2.Id != closing.Id
      AND (tvh2.IsDeleted IS NULL OR tvh2.IsDeleted = 0)
    ORDER BY tvh2.TimeStamp DESC, tvh2.Id DESC
    LIMIT 1
) prev ON TRUE
WHERE closing.ChangeReason = 1  -- ClosingStock
  AND (closing.IsDeleted IS NULL OR closing.IsDeleted = 0)
ORDER BY closing.TimeStamp DESC
LIMIT 50;

-- Alternative for MySQL versions that don't support LATERAL:
SELECT
    closing.Id as ClosingStockId,
    closing.TankId,
    closing.TimeStamp as ClosingTime,
    closing.NewVolume as ClosingNewVolume,
    closing.VolumeChange as CurrentVolumeChange,
    (
        SELECT tvh2.NewVolume
        FROM tankvolumehistory tvh2
        WHERE tvh2.TankId = closing.TankId
          AND tvh2.TimeStamp < closing.TimeStamp
          AND tvh2.Id != closing.Id
          AND (tvh2.IsDeleted IS NULL OR tvh2.IsDeleted = 0)
        ORDER BY tvh2.TimeStamp DESC, tvh2.Id DESC
        LIMIT 1
    ) as PreviousNewVolume,
    closing.NewVolume - COALESCE((
        SELECT tvh2.NewVolume
        FROM tankvolumehistory tvh2
        WHERE tvh2.TankId = closing.TankId
          AND tvh2.TimeStamp < closing.TimeStamp
          AND tvh2.Id != closing.Id
          AND (tvh2.IsDeleted IS NULL OR tvh2.IsDeleted = 0)
        ORDER BY tvh2.TimeStamp DESC, tvh2.Id DESC
        LIMIT 1
    ), 0) as CorrectVolumeChange
FROM tankvolumehistory closing
WHERE closing.ChangeReason = 1  -- ClosingStock
  AND (closing.IsDeleted IS NULL OR closing.IsDeleted = 0)
ORDER BY closing.TimeStamp DESC
LIMIT 50;

-- Step 3: BACKUP - Create backup of ClosingStock records before update
-- ============================================================================
/*
CREATE TABLE IF NOT EXISTS tankvolumehistory_closingstock_backup AS
SELECT
    closing.Id,
    closing.VolumeChange as OriginalVolumeChange,
    closing.NewVolume - COALESCE((
        SELECT tvh2.NewVolume
        FROM tankvolumehistory tvh2
        WHERE tvh2.TankId = closing.TankId
          AND tvh2.TimeStamp < closing.TimeStamp
          AND tvh2.Id != closing.Id
          AND (tvh2.IsDeleted IS NULL OR tvh2.IsDeleted = 0)
        ORDER BY tvh2.TimeStamp DESC, tvh2.Id DESC
        LIMIT 1
    ), 0) as NewVolumeChange,
    NOW() as BackupDateTime
FROM tankvolumehistory closing
WHERE closing.ChangeReason = 1
  AND (closing.IsDeleted IS NULL OR closing.IsDeleted = 0);
*/

-- Step 4: THE FIX - Recalculate VolumeChange for ClosingStock entries
-- ============================================================================
-- WARNING: Run the diagnostic queries first to understand the scope!
-- WARNING: Create a backup before running this in production!

/*
-- UNCOMMENT TO EXECUTE THE FIX:

UPDATE tankvolumehistory closing
SET VolumeChange = closing.NewVolume - COALESCE((
    SELECT tvh2.NewVolume
    FROM tankvolumehistory tvh2
    WHERE tvh2.TankId = closing.TankId
      AND tvh2.TimeStamp < closing.TimeStamp
      AND tvh2.Id != closing.Id
      AND (tvh2.IsDeleted IS NULL OR tvh2.IsDeleted = 0)
    ORDER BY tvh2.TimeStamp DESC, tvh2.Id DESC
    LIMIT 1
), 0)
WHERE closing.ChangeReason = 1  -- ClosingStock
  AND (closing.IsDeleted IS NULL OR closing.IsDeleted = 0);

*/

-- Step 5: Verification - Confirm the fix worked
-- ============================================================================
SELECT
    closing.Id,
    closing.TankId,
    closing.TimeStamp,
    closing.VolumeChange,
    closing.NewVolume
FROM tankvolumehistory closing
WHERE closing.ChangeReason = 1
ORDER BY closing.TimeStamp DESC
LIMIT 20;
