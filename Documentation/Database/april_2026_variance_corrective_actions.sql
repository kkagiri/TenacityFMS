-- =============================================================================
-- FILE:    april_2026_variance_corrective_actions.sql
-- PURPOSE: Corrective data-repair scripts for April 2026 fuel stock variances
-- SCOPE:   gpsdata database
-- DATE:    2026-04-24
--
-- ISSUES ADDRESSED:
--   ACTION-1  Soft-delete orphan InTankDelivery TVH entry on ST1, Apr 22
--             (+12,000 L over-count) and cascade NewVolume correction
--   ACTION-2  Insert missing TransferOut TVH on ST1 for Transfer 628, Apr 14
--             (-2,500 L) and cascade NewVolume correction up to reconciliation
--   ACTION-3  Insert missing TransferOut TVH on ST1 for Transfer 645, Apr 21
--             (-1,000 L) and cascade NewVolume correction to probe anchor
--   ACTION-4  Insert missing TransferIn TVH on FT13 for Transfer 645, Apr 21
--             (+1,000 L) and cascade NewVolume correction to probe anchor
--   ACTION-5  Link intankdelivery record Id=8 to the matched manual delivery
--
-- SAFETY RULES:
--   - Each action begins with a VERIFICATION SELECT.  Confirm the output
--     matches the expected values before executing the DML block.
--   - Each DML block is wrapped in START TRANSACTION / ROLLBACK or COMMIT.
--     Run the block, inspect the row-count message, then COMMIT only when
--     the counts are correct.
--   - MySQL 5.5/5.6 compatible — no JSON, no CURRENT_TIMESTAMP defaults.
-- =============================================================================


-- ============================================================
-- ACTION-1  Soft-delete orphan CR=10 TVH entry on ST1 (Apr 22)
-- ============================================================
-- Root cause: Manual Delivery Id=305 (CR=2, +12,000L at 07:09) and InTankDelivery
-- Id=8 (CR=10, +12,000L at 08:21) both refer to the same physical delivery.
-- The original delivery record (Id=304) was deleted but its CR=10 TVH was never
-- reversed, creating a phantom +12,000 L credit.
--
-- After soft-deleting TVH Id=47425 the 18 PumpTransaction entries posted on
-- Apr 22 between 09:03 and 13:49 have inflated NewVolume values and must be
-- reduced by 12,000 L.
--
-- Apr 23 00:05 OpeningStock (NewVolume=11,900) is a physical probe reading and
-- acts as an absolute anchor — no cascade is needed beyond that point.
-- ============================================================

-- STEP 1-A: Verify the orphan entry before touching it
SELECT
    Id,
    TankId,
    TimeStamp,
    VolumeChange,
    NewVolume,
    ChangeReason,
    ReferenceType,
    ReferenceId,
    IsDeleted
FROM tankvolumehistory
WHERE Id = 47425;
-- Expected: TankId=1, VolumeChange=12000, ChangeReason=10,
--           ReferenceType='InTankDelivery', ReferenceId=8, IsDeleted=0

-- STEP 1-B: Count cascade-affected rows before DML
SELECT COUNT(*) AS rows_to_cascade
FROM tankvolumehistory
WHERE TankId = 1
  AND TimeStamp > '2026-04-22 08:21:31'
  AND TimeStamp < '2026-04-23 00:05:00'
  AND (IsDeleted = 0 OR IsDeleted IS NULL);
-- Expected: 18 rows (PumpTransactions Apr 22 09:03 – 13:49)

-- STEP 1-C: DML — soft-delete orphan + cascade
START TRANSACTION;

    -- 1. Soft-delete the orphan TVH entry
    UPDATE tankvolumehistory
    SET
        IsDeleted = 1
    WHERE Id = 47425
      AND ChangeReason = 10
      AND ReferenceType = 'InTankDelivery'
      AND ReferenceId = 8
      AND TankId = 1;
    -- Expect: 1 row affected

    -- 2. Cascade NewVolume correction for the 18 subsequent entries on Apr 22
    --    (stops before the Apr 23 00:05 probe-based OpeningStock)
    UPDATE tankvolumehistory
    SET
        NewVolume = NewVolume - 12000.00
    WHERE TankId = 1
      AND TimeStamp > '2026-04-22 08:21:31'
      AND TimeStamp < '2026-04-23 00:05:00'
      AND (IsDeleted = 0 OR IsDeleted IS NULL);
    -- Expect: 18 rows affected

ROLLBACK;
-- Change ROLLBACK → COMMIT once row counts are confirmed correct.


-- ============================================================
-- ACTION-2  Insert missing TransferOut TVH on ST1, Transfer 628 (Apr 14)
-- ============================================================
-- Root cause: tanktransfer Id=628 (ST1 → FT13, 2,500 L, Apr 14 05:57:13)
-- was recorded on FT13 (CR=3, +2,500 L, TVH Id=46718) but the corresponding
-- ST1 TransferOut (CR=4, −2,500 L) was never written.
--
-- Book balance on ST1 immediately before the transfer:
--   Apr 14 00:05 OpeningStock NewVolume = 980 L
--   (no other ST1 entries exist between 00:05 and 05:57)
--   → NewVolume after transfer = 980 − 2,500 = −1,520 L
--   (legitimately negative, confirming that books were already in deficit
--    before the Apr 14 09:11 manual reconciliation)
--
-- The six PumpTransaction entries posted between 05:57 and the reconciliation
-- (Ids 46608–46636) must be reduced by 2,500 L.
--
-- The reconciliation (TVH Id=46637, NewVolume=16,440) was entered from a
-- physical probe reading and is an absolute anchor — cascade stops there.
-- ============================================================

-- STEP 2-A: Verify Transfer 628 exists and has no ST1 TVH entry
SELECT
    tt.Id,
    tt.Amount,
    tt.SourceTankId,
    tt.DestinationTankId,
    tt.TransferDate,
    tt.is_deleted
FROM tanktransfer tt
WHERE tt.Id = 628;
-- Expected: Amount=2500, SourceTankId=1, DestinationTankId=23, is_deleted=0

SELECT Id, TankId, ChangeReason, ReferenceType, ReferenceId, VolumeChange, NewVolume
FROM tankvolumehistory
WHERE ReferenceId = 628 AND ChangeReason = 4 AND ReferenceType = 'TankTransfer';
-- Expected: 0 rows (confirms the entry is missing)

-- STEP 2-B: Confirm cascade scope (6 PumpTransactions between transfer and reconciliation)
SELECT Id, TimeStamp, VolumeChange, NewVolume, ChangeReason
FROM tankvolumehistory
WHERE TankId = 1
  AND TimeStamp > '2026-04-14 05:57:13'
  AND TimeStamp < '2026-04-14 09:11:55'
  AND (IsDeleted = 0 OR IsDeleted IS NULL)
ORDER BY TimeStamp;
-- Expected: 6 rows (Ids 46608, 46609, 46610, 46629, 46632, 46636)

-- STEP 2-C: DML — insert missing TVH + cascade
START TRANSACTION;

    -- 1. Insert the missing TransferOut entry for ST1
    INSERT INTO tankvolumehistory
        (TankId, TimeStamp, VolumeChange, NewVolume, ChangeReason,
         ReferenceType, ReferenceId, IsDeleted, RecordedBy, CreatedOn)
    VALUES
        (1,                          -- ST1
         '2026-04-14 05:57:13',      -- TransferDate from tanktransfer.Id=628
         -2500.00,                   -- TransferOut is negative
         -1520.00,                   -- 980 (opening) − 2500 = −1520
         4,                          -- ChangeReason: TransferOut
         'TankTransfer',
         628,
         0,
         'system',                   -- RecordedBy: data-repair script
         '2026-04-14 05:57:13');     -- CreatedOn: matches TransferDate of reference
    -- Expect: 1 row affected

    -- 2. Cascade the 6 PumpTransaction entries between transfer and reconciliation
    UPDATE tankvolumehistory
    SET
        NewVolume = NewVolume - 2500.00
    WHERE TankId = 1
      AND TimeStamp > '2026-04-14 05:57:13'
      AND TimeStamp < '2026-04-14 09:11:55'   -- stops before reconciliation at 09:11:55
      AND (IsDeleted = 0 OR IsDeleted IS NULL);
    -- Expect: 6 rows affected (Ids 46608, 46609, 46610, 46629, 46632, 46636)

    -- NOTE: Reconciliation TVH Id=46637 (NewVolume=16,440) is a physical probe
    --       anchor and must NOT be updated.  The VolumeChange on that row will
    --       now implicitly represent a larger correction (+18,825.58 instead of
    --       +16,325.58), but since it was entered as an absolute physical reading
    --       the NewVolume stays at 16,440.  All entries after the reconciliation
    --       remain unchanged.

ROLLBACK;
-- Change ROLLBACK → COMMIT once row counts are confirmed correct.


-- ============================================================
-- ACTION-3  Insert missing TransferOut TVH on ST1, Transfer 645 (Apr 21)
-- ============================================================
-- Root cause: tanktransfer Id=645 (ST1 → FT13, 1,000 L, Apr 21 13:38:06)
-- has NO TVH entry on either side.
--
-- Book balance on ST1 immediately before the transfer:
--   Apr 21 13:18:48 PumpTransaction (TVH Id=47362) NewVolume = 2,395.79 L
--   → NewVolume after transfer = 2,395.79 − 1,000 = 1,395.79 L
--
-- The Apr 22 00:05 OpeningStock is a physical probe reading (absolute anchor).
-- Cascade applies only to ST1 entries between 13:38:06 on Apr 21 and 00:05:00
-- on Apr 22.
-- ============================================================

-- STEP 3-A: Verify Transfer 645 and missing ST1 TVH
SELECT
    tt.Id,
    tt.Amount,
    tt.SourceTankId,
    tt.DestinationTankId,
    tt.TransferDate,
    tt.is_deleted
FROM tanktransfer tt
WHERE tt.Id = 645;
-- Expected: Amount=1000, SourceTankId=1, DestinationTankId=23, is_deleted=0

SELECT Id, TankId, ChangeReason, ReferenceType, ReferenceId, VolumeChange, NewVolume
FROM tankvolumehistory
WHERE ReferenceId = 645 AND ReferenceType = 'TankTransfer';
-- Expected: 0 rows (confirms both sides are missing)

-- STEP 3-B: Confirm ST1 balance immediately before the transfer
SELECT Id, TimeStamp, VolumeChange, NewVolume, ChangeReason
FROM tankvolumehistory
WHERE TankId = 1
  AND TimeStamp < '2026-04-21 13:38:06'
  AND (IsDeleted = 0 OR IsDeleted IS NULL)
ORDER BY TimeStamp DESC
LIMIT 1;
-- Expected: Id=47362, NewVolume=2395.79

-- STEP 3-C: Count cascade-affected rows on ST1
SELECT COUNT(*) AS rows_to_cascade
FROM tankvolumehistory
WHERE TankId = 1
  AND TimeStamp > '2026-04-21 13:38:06'
  AND TimeStamp < '2026-04-22 00:05:00'
  AND (IsDeleted = 0 OR IsDeleted IS NULL);
-- Run to see how many ST1 entries exist in this window (may be 0 if no
-- afternoon activity was recorded after 13:38 on Apr 21)

-- STEP 3-D: DML — insert missing ST1 TVH + cascade
START TRANSACTION;

    -- 1. Insert the missing TransferOut entry for ST1
    INSERT INTO tankvolumehistory
        (TankId, TimeStamp, VolumeChange, NewVolume, ChangeReason,
         ReferenceType, ReferenceId, IsDeleted, RecordedBy, CreatedOn)
    VALUES
        (1,                          -- ST1
         '2026-04-21 13:38:06',      -- TransferDate from tanktransfer.Id=645
         -1000.00,                   -- TransferOut is negative
         1395.79,                    -- 2395.79 − 1000 = 1395.79
         4,                          -- ChangeReason: TransferOut
         'TankTransfer',
         645,
         0,
         'system',                   -- RecordedBy: data-repair script
         '2026-04-21 13:38:06');     -- CreatedOn: matches TransferDate of reference
    -- Expect: 1 row affected

    -- 2. Cascade any ST1 entries between 13:38 Apr 21 and the Apr 22 probe anchor
    UPDATE tankvolumehistory
    SET
        NewVolume = NewVolume - 1000.00
    WHERE TankId = 1
      AND TimeStamp > '2026-04-21 13:38:06'
      AND TimeStamp < '2026-04-22 00:05:00'
      AND (IsDeleted = 0 OR IsDeleted IS NULL);
    -- Expect: 0 rows (no ST1 entries in this window) or small number

ROLLBACK;
-- Change ROLLBACK → COMMIT once row counts are confirmed correct.


-- ============================================================
-- ACTION-4  Insert missing TransferIn TVH on FT13, Transfer 645 (Apr 21)
-- ============================================================
-- Root cause: same as Action-3 — tanktransfer Id=645 has no TVH on either side.
--
-- Book balance on FT13 immediately before the transfer:
--   Apr 21 12:15:27 TankTransfer-In (TVH Id=47351) NewVolume = 2,260 L
--   → NewVolume after Transfer 645 = 2,260 + 1,000 = 3,260 L
--
-- The Apr 22 00:05 OpeningStock for FT13 (NewVolume=5,000) is a physical probe
-- anchor.  Cascade applies only to FT13 entries between 13:38:06 on Apr 21
-- and 00:05:00 on Apr 22.
-- ============================================================

-- STEP 4-A: Confirm FT13 balance immediately before the transfer
SELECT Id, TimeStamp, VolumeChange, NewVolume, ChangeReason
FROM tankvolumehistory
WHERE TankId = 23
  AND TimeStamp < '2026-04-21 13:38:06'
  AND (IsDeleted = 0 OR IsDeleted IS NULL)
ORDER BY TimeStamp DESC
LIMIT 1;
-- Expected: Id=47351, NewVolume=2260.00

-- STEP 4-B: Count cascade-affected rows on FT13
SELECT COUNT(*) AS rows_to_cascade
FROM tankvolumehistory
WHERE TankId = 23
  AND TimeStamp > '2026-04-21 13:38:06'
  AND TimeStamp < '2026-04-22 00:05:00'
  AND (IsDeleted = 0 OR IsDeleted IS NULL);
-- Run to see how many FT13 entries exist in this window

-- STEP 4-C: DML — insert missing FT13 TVH + cascade
START TRANSACTION;

    -- 1. Insert the missing TransferIn entry for FT13
    INSERT INTO tankvolumehistory
        (TankId, TimeStamp, VolumeChange, NewVolume, ChangeReason,
         ReferenceType, ReferenceId, IsDeleted, RecordedBy, CreatedOn)
    VALUES
        (23,                         -- FT13
         '2026-04-21 13:38:06',      -- TransferDate from tanktransfer.Id=645
         1000.00,                    -- TransferIn is positive
         3260.00,                    -- 2260 + 1000 = 3260
         3,                          -- ChangeReason: TransferIn
         'TankTransfer',
         645,
         0,
         'system',                   -- RecordedBy: data-repair script
         '2026-04-21 13:38:06');     -- CreatedOn: matches TransferDate of reference
    -- Expect: 1 row affected

    -- 2. Cascade any FT13 entries between 13:38 Apr 21 and the Apr 22 probe anchor
    UPDATE tankvolumehistory
    SET
        NewVolume = NewVolume + 1000.00
    WHERE TankId = 23
      AND TimeStamp > '2026-04-21 13:38:06'
      AND TimeStamp < '2026-04-22 00:05:00'
      AND (IsDeleted = 0 OR IsDeleted IS NULL);
    -- Expect: 0 rows (no FT13 entries found in this window from earlier query)
    --         or small number if afternoon activity exists

ROLLBACK;
-- Change ROLLBACK → COMMIT once row counts are confirmed correct.


-- ============================================================
-- ACTION-5  Link intankdelivery Id=8 to manual delivery Id=305
-- ============================================================
-- Root cause: intankdelivery record Id=8 has Status='Matched' but
-- matched_delivery_id is NULL.  It corresponds to the same physical delivery
-- as delivery Id=305 (12,000 L on Apr 22).  Linking them prevents the
-- background reconciler from re-processing this InTankDelivery and creating
-- another phantom credit.
-- ============================================================

-- STEP 5-A: Verify current state
SELECT
    itd.DeliveryId,
    itd.TankId,
    itd.SiteId,
    itd.StartDateTime,
    itd.EndDateTime,
    itd.AbsoluteProductVolume,
    itd.Status,
    itd.matched_delivery_id,
    itd.is_processed
FROM intankdelivery itd
WHERE itd.DeliveryId = 8;
-- Expected: Status='Matched', matched_delivery_id=NULL

SELECT
    d.Id,
    d.TankId,
    d.DeliveryDate,
    d.ManualDeliveryAmount,
    d.is_deleted
FROM delivery d
WHERE d.Id = 305;
-- Expected: TankId=1, ManualDeliveryAmount=12000, is_deleted=0

-- STEP 5-B: DML — link the records
START TRANSACTION;

    UPDATE intankdelivery
    SET
        matched_delivery_id = 305,
        is_processed        = 1
    WHERE DeliveryId = 8
      AND matched_delivery_id IS NULL;
    -- Expect: 1 row affected

ROLLBACK;
-- Change ROLLBACK → COMMIT once confirmed correct.


-- ============================================================
-- POST-REPAIR VERIFICATION QUERIES
-- ============================================================
-- Run these after all five actions are committed to confirm the
-- April 2026 ledger is consistent.

-- V1: Confirm orphan TVH is soft-deleted
SELECT Id, IsDeleted, ChangeReason, ReferenceId, TimeStamp
FROM tankvolumehistory
WHERE Id = 47425;
-- Expected: IsDeleted = 1

-- V2: Confirm missing ST1 TransferOut entries now exist
SELECT Id, TankId, TimeStamp, VolumeChange, NewVolume, ChangeReason, ReferenceId
FROM tankvolumehistory
WHERE TankId = 1
  AND ChangeReason = 4
  AND ReferenceId IN (628, 645)
  AND ReferenceType = 'TankTransfer';
-- Expected: 2 rows

-- V3: Confirm missing FT13 TransferIn entry for Transfer 645 exists
SELECT Id, TankId, TimeStamp, VolumeChange, NewVolume, ChangeReason, ReferenceId
FROM tankvolumehistory
WHERE TankId = 23
  AND ChangeReason = 3
  AND ReferenceId = 645
  AND ReferenceType = 'TankTransfer';
-- Expected: 1 row, NewVolume=3260

-- V4: Confirm intankdelivery link
SELECT DeliveryId, matched_delivery_id, is_processed, Status
FROM intankdelivery
WHERE DeliveryId = 8;
-- Expected: matched_delivery_id=305, is_processed=1

-- V5: ST1 April 2026 closing balance check (after all corrections)
SELECT
    tvh.TimeStamp,
    tvh.NewVolume,
    tvh.ChangeReason,
    tvh.ReferenceType
FROM tankvolumehistory tvh
WHERE tvh.TankId = 1
  AND tvh.TimeStamp >= '2026-04-01'
  AND tvh.TimeStamp <= '2026-04-24 23:59:59'
  AND (tvh.IsDeleted = 0 OR tvh.IsDeleted IS NULL)
ORDER BY tvh.TimeStamp DESC
LIMIT 10;
-- Review the last 10 entries to confirm NewVolume progression is logical

-- V6: FT13 April 2026 closing balance check
SELECT
    tvh.TimeStamp,
    tvh.NewVolume,
    tvh.ChangeReason,
    tvh.ReferenceType
FROM tankvolumehistory tvh
WHERE tvh.TankId = 23
  AND tvh.TimeStamp >= '2026-04-01'
  AND tvh.TimeStamp <= '2026-04-24 23:59:59'
  AND (tvh.IsDeleted = 0 OR tvh.IsDeleted IS NULL)
ORDER BY tvh.TimeStamp DESC
LIMIT 10;

-- V7: Summary of ST1 April 2026 — opening vs closing vs net
SELECT
    SUM(CASE WHEN ChangeReason = 0 AND TimeStamp < '2026-04-02' THEN NewVolume ELSE 0 END) AS opening_stock_apr1,
    SUM(CASE WHEN ChangeReason = 2 THEN VolumeChange ELSE 0 END)                           AS total_deliveries,
    SUM(CASE WHEN ChangeReason = 4 THEN VolumeChange ELSE 0 END)                           AS total_transfers_out,
    SUM(CASE WHEN ChangeReason = 3 THEN VolumeChange ELSE 0 END)                           AS total_transfers_in,
    SUM(CASE WHEN ChangeReason IN (6, 7) THEN VolumeChange ELSE 0 END)                     AS total_dispensing,
    SUM(CASE WHEN ChangeReason = 8 THEN VolumeChange ELSE 0 END)                           AS total_reconciliation_adj
FROM tankvolumehistory
WHERE TankId = 1
  AND TimeStamp >= '2026-04-01'
  AND TimeStamp < '2026-05-01'
  AND (IsDeleted = 0 OR IsDeleted IS NULL);
