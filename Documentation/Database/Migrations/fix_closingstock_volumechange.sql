-- ============================================================================
-- Migration Script: Fix ClosingStock VolumeChange Calculations
-- ============================================================================
--
-- Issue: ClosingStock entries had incorrect VolumeChange values because the
--        query used `Timestamp < entryDate` instead of `Timestamp < closingStockTime`
--        This caused it to find transactions from the PREVIOUS day instead of
--        the last transaction on the CURRENT day before 23:55:00.
--
-- Example of the bug:
--   - ClosingStock at 2026-01-19 23:55:00 with NewVolume = 25,830.95
--   - Code looked for transactions with Timestamp < 2026-01-19 00:00:00
--   - Found last transaction from 2026-01-18 with NewVolume = 107,325.52
--   - Calculated VolumeChange = 25,830.95 - 107,325.52 = -81,494.57 (WRONG!)
--   - Should have found last transaction from 2026-01-19 14:07:29
--
-- Root Cause: ClosingStockCommand.cs line 257 compared against entryDate
--             (which is 00:00:00) instead of closingStockTime (23:55:00)
--
-- Code Fix Applied: Changed to use closingStockTime for the comparison
-- This Script: Recalculates VolumeChange for historical ClosingStock entries
--
-- Date: 2026-01-19
-- ============================================================================

-- Step 1: Diagnostic - Check how many ClosingStock records exist
-- ============================================================================
SELECT
    'Total ClosingStock records' as Description,
    COUNT(*) as TotalCount
FROM tankvolumehistory
WHERE ChangeReason = 1;

-- Step 2: Preview ClosingStock records with INCORRECT volumeChange
-- ============================================================================
-- Shows records where the VolumeChange doesn't match what it should be
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
    ), 0) as CorrectVolumeChange,
    ABS(closing.VolumeChange - (closing.NewVolume - COALESCE((
        SELECT tvh2.NewVolume
        FROM tankvolumehistory tvh2
        WHERE tvh2.TankId = closing.TankId
          AND tvh2.TimeStamp < closing.TimeStamp
          AND tvh2.Id != closing.Id
          AND (tvh2.IsDeleted IS NULL OR tvh2.IsDeleted = 0)
        ORDER BY tvh2.TimeStamp DESC, tvh2.Id DESC
        LIMIT 1
    ), 0))) as Difference
FROM tankvolumehistory closing
WHERE closing.ChangeReason = 1  -- ClosingStock
  AND (closing.IsDeleted IS NULL OR closing.IsDeleted = 0)
ORDER BY closing.TimeStamp DESC
LIMIT 50;

-- Step 3: Count records that need fixing (difference > 1 liter)
-- ============================================================================
SELECT
    'ClosingStock records with incorrect VolumeChange (diff > 1L)' as Description,
    COUNT(*) as NeedFixing
FROM tankvolumehistory closing
WHERE closing.ChangeReason = 1
  AND (closing.IsDeleted IS NULL OR closing.IsDeleted = 0)
  AND ABS(closing.VolumeChange - (closing.NewVolume - COALESCE((
      SELECT tvh2.NewVolume
      FROM tankvolumehistory tvh2
      WHERE tvh2.TankId = closing.TankId
        AND tvh2.TimeStamp < closing.TimeStamp
        AND tvh2.Id != closing.Id
        AND (tvh2.IsDeleted IS NULL OR tvh2.IsDeleted = 0)
      ORDER BY tvh2.TimeStamp DESC, tvh2.Id DESC
      LIMIT 1
  ), 0))) > 1;

-- Step 4: BACKUP - Create backup of affected records before update
-- ============================================================================
-- UNCOMMENT TO CREATE BACKUP:
/*
CREATE TABLE IF NOT EXISTS tankvolumehistory_closingstock_backup AS
SELECT
    closing.Id,
    closing.TankId,
    closing.TimeStamp,
    closing.VolumeChange as OriginalVolumeChange,
    closing.NewVolume,
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

-- Step 5: THE FIX - Recalculate VolumeChange for ClosingStock entries
-- ============================================================================
-- WARNING: Run the diagnostic queries first to understand the scope!
-- WARNING: Create a backup before running this in production!
--
-- This UPDATE recalculates VolumeChange based on the CORRECT previous transaction
-- (the one immediately before the closing stock timestamp, not before the day starts)

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

-- Step 6: Verification - Confirm the fix worked
-- ============================================================================
-- After running the UPDATE, verify the VolumeChange values are reasonable
SELECT
    closing.Id,
    closing.TankId,
    closing.TimeStamp,
    closing.VolumeChange,
    closing.NewVolume,
    closing.ReferenceType
FROM tankvolumehistory closing
WHERE closing.ChangeReason = 1
  AND (closing.IsDeleted IS NULL OR closing.IsDeleted = 0)
ORDER BY closing.TimeStamp DESC
LIMIT 20;

-- ============================================================================
-- NOTES:
-- 1. The VolumeChange for ClosingStock represents the difference between:
--    - The closing stock value (NewVolume)
--    - The previous transaction's NewVolume
--
-- 2. For a properly balanced day, the VolumeChange should be small (near zero)
--    indicating that the closing stock matches the expected value after all
--    day's transactions.
--
-- 3. Large VolumeChange values in ClosingStock indicate either:
--    - A reconciliation adjustment (legitimate variance from expected)
--    - OR the bug this script fixes (wrong previous transaction used)
--
-- 4. After running this migration, new ClosingStock entries will be calculated
--    correctly due to the code fix in:
--    - ClosingStockCommand.cs
-- ============================================================================
