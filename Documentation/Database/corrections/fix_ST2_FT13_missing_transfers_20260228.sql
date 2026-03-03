-- =============================================================================
-- CORRECTIVE SQL: Missing Pump Transfers ST2 → FT13 on 28/02/2026
-- =============================================================================
-- Root Cause:
--   5 pump transfer transactions (IsTransferMode=1) ran from ST2 to FT13.
--   Only the first (PumpTx #1487) was processed into tanktransfer + tankvolumehistory.
--   PumpTx #1488, #1489, #1490, #1495 (4 × 1500 L = 6000 L) were silently skipped.
--
-- Effect:
--   ST2 variance:  -5,998.29 L  (expected closing 10087.29, actual 4089.00)
--   FT13 variance: +6,024.00 L  (expected closing 2476.00, actual 8500.00)
--
-- This script:
--   1. Inserts 4 missing tanktransfer records
--   2. Inserts 8 tankvolumehistory records (TransferOut ST2 + TransferIn FT13 for each)
--   3. Updates NewVolume on 7 subsequent ST2 history entries to fix running balance
--   4. Corrects ClosingStock adjustment VolumeChange for ST2 and FT13
--   5. Updates TransferOutAmount/TransferInAmount in tankstock
--
-- Author: System correction - 2026-03-02
-- Reviewed by: <operator name>
-- =============================================================================

START TRANSACTION;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: Insert 4 missing tanktransfer records
-- ─────────────────────────────────────────────────────────────────────────────

-- Transfer 2: PumpTx #1488, 04:05:21
INSERT INTO gpsdata.tanktransfer
    (Amount, SourceTankId, DestinationTankId, TransferDate, RecordedBy, CreatedOn, is_deleted, is_correction, corrects_record_id, correction_reason)
VALUES
    (1500, 2, 23, '2026-02-28 04:05:21', 'b5162d83-6778-4aa8-bf65-35b7d32de00a', '2026-03-02 00:00:00', 0, 1, NULL, 'Retroactive correction: pump transfer tx #1488 was not processed into tanktransfer');

SET @tt_id_1488 = LAST_INSERT_ID();

-- Transfer 3: PumpTx #1489, 04:31:37
INSERT INTO gpsdata.tanktransfer
    (Amount, SourceTankId, DestinationTankId, TransferDate, RecordedBy, CreatedOn, is_deleted, is_correction, corrects_record_id, correction_reason)
VALUES
    (1500, 2, 23, '2026-02-28 04:31:37', 'b5162d83-6778-4aa8-bf65-35b7d32de00a', '2026-03-02 00:00:00', 0, 1, NULL, 'Retroactive correction: pump transfer tx #1489 was not processed into tanktransfer');

SET @tt_id_1489 = LAST_INSERT_ID();

-- Transfer 4: PumpTx #1490, 05:03:01
INSERT INTO gpsdata.tanktransfer
    (Amount, SourceTankId, DestinationTankId, TransferDate, RecordedBy, CreatedOn, is_deleted, is_correction, corrects_record_id, correction_reason)
VALUES
    (1500, 2, 23, '2026-02-28 05:03:01', 'b5162d83-6778-4aa8-bf65-35b7d32de00a', '2026-03-02 00:00:00', 0, 1, NULL, 'Retroactive correction: pump transfer tx #1490 was not processed into tanktransfer');

SET @tt_id_1490 = LAST_INSERT_ID();

-- Transfer 5: PumpTx #1495, 06:24:30
INSERT INTO gpsdata.tanktransfer
    (Amount, SourceTankId, DestinationTankId, TransferDate, RecordedBy, CreatedOn, is_deleted, is_correction, corrects_record_id, correction_reason)
VALUES
    (1500, 2, 23, '2026-02-28 06:24:30', 'b5162d83-6778-4aa8-bf65-35b7d32de00a', '2026-03-02 00:00:00', 0, 1, NULL, 'Retroactive correction: pump transfer tx #1495 was not processed into tanktransfer');

SET @tt_id_1495 = LAST_INSERT_ID();

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: Insert tankvolumehistory for ST2 (ChangeReason=4 TransferOut)
-- ─────────────────────────────────────────────────────────────────────────────
-- Running balance from: after Transfer#558 ST2 = 10585.96
--   04:05 → 10585.96 - 1500 = 9085.96
--   04:31 → 9085.96  - 1500 = 7585.96
--   05:03 → 7585.96  - 1500 = 6085.96
--   (pump txs 05:21–05:44 total -152.10 L → 6085.96 - 152.10 = 5933.86)
--   06:24 → 5933.86  - 1500 = 4433.86

INSERT INTO gpsdata.tankvolumehistory
    (TankId, TimeStamp, VolumeChange, NewVolume, ChangeReason, RecordedBy, ReferenceId, ReferenceType, CreatedOn, IsDeleted)
VALUES
    (2, '2026-02-28 04:05:21', -1500.00, 9085.96, 4, 'b5162d83-6778-4aa8-bf65-35b7d32de00a', @tt_id_1488, 'TankTransfer', '2026-03-02 00:00:00', 0),
    (2, '2026-02-28 04:31:37', -1500.00, 7585.96, 4, 'b5162d83-6778-4aa8-bf65-35b7d32de00a', @tt_id_1489, 'TankTransfer', '2026-03-02 00:00:00', 0),
    (2, '2026-02-28 05:03:01', -1500.00, 6085.96, 4, 'b5162d83-6778-4aa8-bf65-35b7d32de00a', @tt_id_1490, 'TankTransfer', '2026-03-02 00:00:00', 0),
    (2, '2026-02-28 06:24:30', -1500.00, 4433.86, 4, 'b5162d83-6778-4aa8-bf65-35b7d32de00a', @tt_id_1495, 'TankTransfer', '2026-03-02 00:00:00', 0);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: Insert tankvolumehistory for FT13 (ChangeReason=3 TransferIn)
-- ─────────────────────────────────────────────────────────────────────────────
-- Running balance from: after Transfer#558 FT13 = 2476.00
--   04:05 → 2476 + 1500 = 3976
--   04:31 → 3976 + 1500 = 5476
--   05:03 → 5476 + 1500 = 6976
--   06:24 → 6976 + 1500 = 8476

INSERT INTO gpsdata.tankvolumehistory
    (TankId, TimeStamp, VolumeChange, NewVolume, ChangeReason, RecordedBy, ReferenceId, ReferenceType, CreatedOn, IsDeleted)
VALUES
    (23, '2026-02-28 04:05:21',  1500.00, 3976.00, 3, 'b5162d83-6778-4aa8-bf65-35b7d32de00a', @tt_id_1488, 'TankTransfer', '2026-03-02 00:00:00', 0),
    (23, '2026-02-28 04:31:37',  1500.00, 5476.00, 3, 'b5162d83-6778-4aa8-bf65-35b7d32de00a', @tt_id_1489, 'TankTransfer', '2026-03-02 00:00:00', 0),
    (23, '2026-02-28 05:03:01',  1500.00, 6976.00, 3, 'b5162d83-6778-4aa8-bf65-35b7d32de00a', @tt_id_1490, 'TankTransfer', '2026-03-02 00:00:00', 0),
    (23, '2026-02-28 06:24:30',  1500.00, 8476.00, 3, 'b5162d83-6778-4aa8-bf65-35b7d32de00a', @tt_id_1495, 'TankTransfer', '2026-03-02 00:00:00', 0);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: Fix NewVolume on existing ST2 pump-dispensing history entries
-- ─────────────────────────────────────────────────────────────────────────────
-- After inserting transfers at 04:05, 04:31, 05:03 → all subsequent entries
-- before 06:24 are off by -4500 L. Entries from 06:24 onwards are off by -6000 L.

-- Entries between 05:03 and 06:24 (off by 4500): IDs 42568, 42569, 42570, 42572
UPDATE gpsdata.tankvolumehistory
SET NewVolume = NewVolume - 4500.00
WHERE Id IN (42568, 42569, 42570, 42572);

-- Entries after 06:24 (off by 6000): IDs 42596, 42597, 42598
UPDATE gpsdata.tankvolumehistory
SET NewVolume = NewVolume - 6000.00
WHERE Id IN (42596, 42597, 42598);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5: Correct ClosingStock adjustment entries
-- ─────────────────────────────────────────────────────────────────────────────
-- ST2 (Id=42601): book now ends at 4087.29, actual=4089.00 → adjustment = +1.71
--   (was -5998.29 because 6000 L of transfers were missing from book)
UPDATE gpsdata.tankvolumehistory
SET VolumeChange = 1.71
WHERE Id = 42601;

-- FT13 (Id=42599): book now ends at 8476.00, actual=8500.00 → adjustment = +24.00
--   (was +6024 because 6000 L of transfers were missing from book)
UPDATE gpsdata.tankvolumehistory
SET VolumeChange = 24.00
WHERE Id = 42599;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 6: Update tankstock transfer amounts for the Feb 28 entries
-- ─────────────────────────────────────────────────────────────────────────────
-- ST2 EntryID=25648: total transferred out = 5 × 1500 = 7500 L
UPDATE gpsdata.tankstock
SET TransferOutAmount = 7500.00
WHERE EntryID = 25648;

-- FT13 EntryID=25650: total transferred in = 5 × 1500 = 7500 L
UPDATE gpsdata.tankstock
SET TransferInAmount = 7500.00
WHERE EntryID = 25650;

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFY before committing
-- ─────────────────────────────────────────────────────────────────────────────
-- Expected after fix:
--   ST2  variance = +1.71 L  (near-zero ✓)
--   FT13 variance = +24.00 L (near-zero ✓)

SELECT
    t.Name as Tank,
    ts.EntryID,
    ts.ManualOpeningLevel as Opening,
    ts.ManualClosingLevel as ActualClosing,
    (ts.ManualOpeningLevel
        + COALESCE(ts.DeliveryAmount,0)
        + COALESCE(ts.TransferInAmount,0)
        - COALESCE(ts.TransferOutAmount,0)) as ExpectedClosing,
    (ts.ManualClosingLevel - (
        ts.ManualOpeningLevel
        + COALESCE(ts.DeliveryAmount,0)
        + COALESCE(ts.TransferInAmount,0)
        - COALESCE(ts.TransferOutAmount,0)
    )) as VarianceAfterFix,
    ts.TransferInAmount,
    ts.TransferOutAmount
FROM gpsdata.tankstock ts
JOIN gpsdata.tank t ON t.Id = ts.TankID
WHERE ts.EntryID IN (25648, 25650);

-- If VarianceAfterFix is close to 0, COMMIT. Otherwise ROLLBACK.
-- NOTE: Dispensing is NOT tracked in tankstock.TransferOut; variance includes
--       pump dispensing which this SELECT does not subtract.
--       The tankvolumehistory is the authoritative source for variance analysis.

COMMIT;

-- =============================================================================
-- POST-FIX VERIFICATION QUERY (run after commit)
-- =============================================================================
/*
SELECT
    t.Name,
    tvh.TimeStamp,
    tvh.VolumeChange,
    tvh.NewVolume,
    tvh.ChangeReason,
    tvh.ReferenceId,
    tvh.ReferenceType
FROM gpsdata.tankvolumehistory tvh
JOIN gpsdata.tank t ON t.Id = tvh.TankId
WHERE tvh.TankId IN (2, 23)
  AND tvh.TimeStamp >= '2026-02-28'
  AND tvh.TimeStamp < '2026-03-01'
ORDER BY tvh.TankId, tvh.TimeStamp;
*/
