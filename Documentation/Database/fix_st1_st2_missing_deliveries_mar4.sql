-- ============================================================================
-- CLEANUP: Fix volume balances for ST1 and ST2 on Mar 4, 2026 business day
-- ============================================================================
--
-- PROBLEM: The original fix script was executed TWICE, causing:
--   1. Duplicate delivery records: 276+278 (ST1), 277+279 (ST2)
--   2. Duplicate delivery TVH:     43000+43009 (ST1), 43001+43010 (ST2)
--   3. ST1 dispensing NewVolume double-incremented (+12000 applied twice)
--   4. ST2 dispensing NewVolume never adjusted (missed +12000)
--   5. ST2 delivery TVH NewVolume wrong (used 109.72 instead of 489.72)
--   6. Orphan TVH 42854/42855 (ref deleted deliveries 270/271) still active
--   7. Tankstock pointing to duplicate deliveries (278/279 instead of 276/277)
--
-- CORRECT TIMELINES (what we need after this fix):
--
--   ST1 (TankId=1):
--     42799  21:05 Mar 3  Opening    VolumeChange=0        NewVolume=9,500.00
--     42810  02:48 Mar 4  Dispensing  VolumeChange=-38.32   NewVolume=9,461.68
--     42812  02:58 Mar 4  Dispensing  VolumeChange=-70.82   NewVolume=9,390.86
--     43000  06:00 Mar 4  DELIVERY   VolumeChange=+12,000  NewVolume=21,390.86
--     42893  10:18 Mar 4  Dispensing  VolumeChange=-48.72   NewVolume=21,342.14
--     42896  10:39 Mar 4  Dispensing  VolumeChange=-41.56   NewVolume=21,300.58
--     42897  10:45 Mar 4  Dispensing  VolumeChange=-5.08    NewVolume=21,295.50
--     42898  20:55 Mar 4  Closing    VolumeChange=-295.50   NewVolume=21,000.00
--
--   ST2 (TankId=2):
--     42800  21:05 Mar 3  Opening    VolumeChange=0        NewVolume=590.00
--     42820  03:40 Mar 4  Dispensing  VolumeChange=-100.28  NewVolume=489.72
--     43001  06:00 Mar 4  DELIVERY   VolumeChange=+12,000  NewVolume=12,489.72
--     42856  07:07 Mar 4  Dispensing  VolumeChange=-106.78  NewVolume=12,382.94
--     42857  07:12 Mar 4  Dispensing  VolumeChange=-47.43   NewVolume=12,335.51
--     42859  08:05 Mar 4  Dispensing  VolumeChange=-98.58   NewVolume=12,236.93
--     42860  08:10 Mar 4  Dispensing  VolumeChange=-14.57   NewVolume=12,222.36
--     42861  08:15 Mar 4  Dispensing  VolumeChange=-25.87   NewVolume=12,196.49
--     42862  08:21 Mar 4  Dispensing  VolumeChange=-76.71   NewVolume=12,119.78
--     42863  08:23 Mar 4  Dispensing  VolumeChange=-10.06   NewVolume=12,109.72
--     42899  20:55 Mar 4  Closing    VolumeChange=+406.28   NewVolume=12,516.00
-- ============================================================================

START TRANSACTION;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 1: Soft-delete duplicate & orphan delivery records
-- ═══════════════════════════════════════════════════════════════════════════
-- Keep: 276 (ST1) and 277 (ST2) — created by first script run
-- Delete: 278 (ST1 dup) and 279 (ST2 dup) — created by second script run

UPDATE gpsdata.delivery SET is_deleted = 1, deleted_at = NOW() WHERE Id = 278;  -- ST1 duplicate
UPDATE gpsdata.delivery SET is_deleted = 1, deleted_at = NOW() WHERE Id = 279;  -- ST2 duplicate

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 2: Soft-delete duplicate & orphan TVH delivery records
-- ═══════════════════════════════════════════════════════════════════════════
-- Keep: 43000 (ST1, ref 276) and 43001 (ST2, ref 277)
-- Delete: 43009 (ST1 dup, ref 278), 43010 (ST2 dup, ref 279)
-- Delete: 42854 (ST1 orphan, ref 270), 42855 (ST2 orphan, ref 271)

UPDATE gpsdata.tankvolumehistory SET IsDeleted = 1 WHERE Id = 43009;  -- ST1 dup delivery TVH
UPDATE gpsdata.tankvolumehistory SET IsDeleted = 1 WHERE Id = 43010;  -- ST2 dup delivery TVH
UPDATE gpsdata.tankvolumehistory SET IsDeleted = 1 WHERE Id = 42854;  -- ST1 orphan (ref 270)
UPDATE gpsdata.tankvolumehistory SET IsDeleted = 1 WHERE Id = 42855;  -- ST2 orphan (ref 271)

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 3: Fix tankstock DeliveryId (point to correct deliveries)
-- ═══════════════════════════════════════════════════════════════════════════
-- Currently: 25675→278 (dup), 25676→279 (dup)
-- Should be: 25675→276,       25676→277

UPDATE gpsdata.tankstock SET DeliveryId = 276 WHERE EntryID = 25675;
UPDATE gpsdata.tankstock SET DeliveryId = 277 WHERE EntryID = 25676;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 4: Fix ST1 dispensing NewVolume (undo double +12000)
-- ═══════════════════════════════════════════════════════════════════════════
-- These got +12000 applied TWICE (once per script run).
-- Current values have +24000 offset; need to subtract 12000.
--   42893: 33,342.14 → 21,342.14
--   42896: 33,300.58 → 21,300.58
--   42897: 33,295.50 → 21,295.50

UPDATE gpsdata.tankvolumehistory SET NewVolume = 21342.14 WHERE Id = 42893;
UPDATE gpsdata.tankvolumehistory SET NewVolume = 21300.58 WHERE Id = 42896;
UPDATE gpsdata.tankvolumehistory SET NewVolume = 21295.50 WHERE Id = 42897;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 5: Fix ST2 delivery TVH NewVolume
-- ═══════════════════════════════════════════════════════════════════════════
-- Delivery timestamp = 06:00 UTC.  Previous record is 42820 at 03:40 (NewVol=489.72).
-- Correct NewVolume = 489.72 + 12000 = 12,489.72 (was 12,109.72)

UPDATE gpsdata.tankvolumehistory SET NewVolume = 12489.72 WHERE Id = 43001;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 6: Fix ST2 post-delivery dispensing NewVolume (+12000)
-- ═══════════════════════════════════════════════════════════════════════════
-- These records are AFTER the delivery at 06:00 UTC but were never adjusted.
--   42856: 382.94  → 12,382.94
--   42857: 335.51  → 12,335.51
--   42859: 236.93  → 12,236.93
--   42860: 222.36  → 12,222.36
--   42861: 196.49  → 12,196.49
--   42862: 119.78  → 12,119.78
--   42863: 109.72  → 12,109.72

UPDATE gpsdata.tankvolumehistory SET NewVolume = 12382.94 WHERE Id = 42856;
UPDATE gpsdata.tankvolumehistory SET NewVolume = 12335.51 WHERE Id = 42857;
UPDATE gpsdata.tankvolumehistory SET NewVolume = 12236.93 WHERE Id = 42859;
UPDATE gpsdata.tankvolumehistory SET NewVolume = 12222.36 WHERE Id = 42860;
UPDATE gpsdata.tankvolumehistory SET NewVolume = 12196.49 WHERE Id = 42861;
UPDATE gpsdata.tankvolumehistory SET NewVolume = 12119.78 WHERE Id = 42862;
UPDATE gpsdata.tankvolumehistory SET NewVolume = 12109.72 WHERE Id = 42863;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 7: Fix ST2 delivery table StockBefore/After
-- ═══════════════════════════════════════════════════════════════════════════
-- Pre-delivery volume was 489.72, not 109.72
-- StockBeforeDelivery: 110 → 490   (decimal(10,0))
-- StockAfterDelivery: 12110 → 12490

UPDATE gpsdata.delivery
SET StockBeforeDelivery = 490, StockAfterDelivery = 12490
WHERE Id = 277;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '--- DELIVERY RECORDS (only active) ---' AS Section;
SELECT Id, TankId, DeliveryDate, ManualDeliveryAmount, StockBeforeDelivery, StockAfterDelivery, is_deleted
FROM gpsdata.delivery
WHERE TankId IN (1,2) AND DeliveryDate >= '2026-03-03' AND DeliveryDate <= '2026-03-05'
ORDER BY TankId, Id;

SELECT '--- TANKSTOCK ---' AS Section;
SELECT EntryID, TankID, ManualOpeningLevel, ManualClosingLevel, DeliveryAmount, DeliveryId
FROM gpsdata.tankstock
WHERE EntryID IN (25675, 25676);

SELECT '--- ST1 TVH TIMELINE (volume balance check) ---' AS Section;
SELECT Id, TankId, TimeStamp, VolumeChange, NewVolume, ChangeReason, ReferenceType
FROM gpsdata.tankvolumehistory
WHERE TankId = 1
  AND TimeStamp >= '2026-03-03 20:50:00' AND TimeStamp <= '2026-03-04 21:10:00'
  AND (IsDeleted = 0 OR IsDeleted IS NULL)
ORDER BY TimeStamp, Id;

SELECT '--- ST2 TVH TIMELINE (volume balance check) ---' AS Section;
SELECT Id, TankId, TimeStamp, VolumeChange, NewVolume, ChangeReason, ReferenceType
FROM gpsdata.tankvolumehistory
WHERE TankId = 2
  AND TimeStamp >= '2026-03-03 20:50:00' AND TimeStamp <= '2026-03-04 21:10:00'
  AND (IsDeleted = 0 OR IsDeleted IS NULL)
ORDER BY TimeStamp, Id;

SELECT '--- DELETED RECORDS CHECK ---' AS Section;
SELECT Id, TankId, VolumeChange, ReferenceId, IsDeleted
FROM gpsdata.tankvolumehistory
WHERE Id IN (43009, 43010, 42854, 42855);

SELECT '--- TOTAL DELIVERY CHECK (should be 24,000) ---' AS Section;
SELECT SUM(VolumeChange) AS TotalDelivery
FROM gpsdata.tankvolumehistory
WHERE TankId IN (1,2)
  AND ChangeReason = 2
  AND TimeStamp >= '2026-03-03 20:50:00' AND TimeStamp <= '2026-03-04 21:10:00'
  AND (IsDeleted = 0 OR IsDeleted IS NULL);

-- ═══════════════════════════════════════════════════════════════════════════
-- Review verification output above, then run ONE of:
--   COMMIT;      -- if everything looks correct
--   ROLLBACK;    -- if something looks wrong
-- ═══════════════════════════════════════════════════════════════════════════
-- COMMIT;
