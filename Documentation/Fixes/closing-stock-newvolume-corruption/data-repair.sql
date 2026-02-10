-- =============================================================================
-- DATA REPAIR: Fix corrupted ClosingStock NewVolume in tankvolumehistory
-- =============================================================================
-- BUG: UpdateTankVolumeHistoryCommand cascade recalculation was overwriting
--      user-entered closing stock physical values with calculated values:
--        NewVolume = previousVolume + VolumeChange (WRONG for ClosingStock)
--      instead of preserving the user-entered absolute measurement.
--
-- ROOT CAUSE: ClosingStock was not treated as a baseline (like OpeningStock)
--             in the cascade recalculation loop.
--
-- FIX: UpdateTankVolumeHistoryCommand.cs now preserves ClosingStock NewVolume
--       just like it does for OpeningStock.
--
-- This script repairs the 740 affected records across 18 tanks.
-- =============================================================================

-- Step 0: Create backup before repair
CREATE TABLE IF NOT EXISTS tankvolumehistory_closingstock_fix_20260210 AS
SELECT tvh.*
FROM tankvolumehistory tvh
JOIN tankstock ts ON ts.EntryId = tvh.ReferenceId AND tvh.ReferenceType = 'ClosingStock'
WHERE tvh.ChangeReason = 1
  AND tvh.IsDeleted != 1
  AND ts.ManualClosingLevel IS NOT NULL
  AND ABS(tvh.NewVolume - ts.ManualClosingLevel) > 0.01;

-- Step 1: Verify affected records before fix
SELECT
    tvh.Id,
    t.Name as TankName,
    tvh.Timestamp,
    tvh.NewVolume as CorruptedNewVolume,
    ts.ManualClosingLevel as CorrectNewVolume,
    (tvh.NewVolume - ts.ManualClosingLevel) as Difference,
    tvh.VolumeChange
FROM tankvolumehistory tvh
JOIN tank t ON t.Id = tvh.TankId
JOIN tankstock ts ON ts.EntryId = tvh.ReferenceId AND tvh.ReferenceType = 'ClosingStock'
WHERE tvh.ChangeReason = 1
  AND tvh.IsDeleted != 1
  AND ts.ManualClosingLevel IS NOT NULL
  AND ABS(tvh.NewVolume - ts.ManualClosingLevel) > 0.01
ORDER BY tvh.Timestamp DESC;

-- Step 2: Fix NewVolume to match user-entered ManualClosingLevel
UPDATE tankvolumehistory tvh
JOIN tankstock ts ON ts.EntryId = tvh.ReferenceId AND tvh.ReferenceType = 'ClosingStock'
SET tvh.NewVolume = ts.ManualClosingLevel
WHERE tvh.ChangeReason = 1
  AND tvh.IsDeleted != 1
  AND ts.ManualClosingLevel IS NOT NULL
  AND ABS(tvh.NewVolume - ts.ManualClosingLevel) > 0.01;

-- Step 3: Verify fix applied
SELECT
    COUNT(*) as StillCorrupted
FROM tankvolumehistory tvh
JOIN tankstock ts ON ts.EntryId = tvh.ReferenceId AND tvh.ReferenceType = 'ClosingStock'
WHERE tvh.ChangeReason = 1
  AND tvh.IsDeleted != 1
  AND ts.ManualClosingLevel IS NOT NULL
  AND ABS(tvh.NewVolume - ts.ManualClosingLevel) > 0.01;

-- Step 4: Verify the specific ST7 record from the report
SELECT tvh.Id, t.Name, tvh.Timestamp, tvh.NewVolume, tvh.VolumeChange, ts.ManualClosingLevel
FROM tankvolumehistory tvh
JOIN tank t ON t.Id = tvh.TankId
JOIN tankstock ts ON ts.EntryId = tvh.ReferenceId AND tvh.ReferenceType = 'ClosingStock'
WHERE tvh.Id = 39900;

-- NOTE: After deployment with the code fix, trigger a cascade recalculation
-- for each affected tank to also correct VolumeChange values.
-- This can be done via the API or by calling UpdateTankVolumeHistoryCommand
-- for each tank from the earliest affected date.
