-- ============================================================================
-- FIX: Missing delivery records for ST1 and ST2 on Mar 4, 2026 business day
-- ============================================================================
-- Problem: Closing stock was entered with large volume increase but no delivery
-- was recorded. ST1 jumped 9,500→21,000 and ST2 jumped 590→12,516.
--
-- This script:
--   1. Inserts delivery records (delivery table)
--   2. Inserts delivery TVH records (tankvolumehistory, ChangeReason=2)
--   3. Updates subsequent TVH NewVolume values to reflect the delivery
--   4. Updates closing TVH VolumeChange to correct value
--   5. Updates tankstock entries with DeliveryAmount and DeliveryId
--
-- Business Day: Mar 4 (EntryDate: 2026-03-03 21:05:00 UTC)
-- Delivery Time: 09:00 UTC on Mar 4 (12:00 noon EAT)
-- Delivery Amount: 12,000L for both tanks
-- Supplier: Vivo (SupplierId=1)
-- ============================================================================

-- Run in a transaction for safety
START TRANSACTION;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 1: Insert delivery records
-- ═══════════════════════════════════════════════════════════════════════════

-- ST1 Delivery (TankId=1)
INSERT INTO gpsdata.delivery (
    TankId, DeliveryDate, ManualDeliveryAmount, SensorDeliveryAmount,
    DeliveryTemperature, DeliveryDensity, DeliveryMass,
    StockBeforeDelivery, StockAfterDelivery,
    RecordedBy, SupplierId, LPONumber, Product, CreatedOn, PricePerLiter, is_deleted
) VALUES (
    1,                                          -- TankId = ST1
    '2026-03-04 09:00:00',                     -- DeliveryDate (09:00 UTC)
    12000,                                      -- ManualDeliveryAmount
    NULL, NULL, NULL, NULL,                     -- Sensor/Temp/Density/Mass not available
    9391,                                       -- StockBeforeDelivery (approx from TVH 42812)
    21391,                                      -- StockAfterDelivery (9391 + 12000)
    'c8d645a6-bc5f-4a1e-82bb-c36ede8dd811',   -- RecordedBy (same user who enters stock)
    1,                                          -- SupplierId = Vivo
    NULL,                                       -- LPONumber (unknown)
    'Diesel',                                   -- Product
    NOW(),                                      -- CreatedOn
    150.00,                                     -- PricePerLiter (default)
    0                                           -- is_deleted = false
);

SET @st1_delivery_id = LAST_INSERT_ID();

-- ST2 Delivery (TankId=2)
INSERT INTO gpsdata.delivery (
    TankId, DeliveryDate, ManualDeliveryAmount, SensorDeliveryAmount,
    DeliveryTemperature, DeliveryDensity, DeliveryMass,
    StockBeforeDelivery, StockAfterDelivery,
    RecordedBy, SupplierId, LPONumber, Product, CreatedOn, PricePerLiter, is_deleted
) VALUES (
    2,                                          -- TankId = ST2
    '2026-03-04 09:00:00',                     -- DeliveryDate (09:00 UTC)
    12000,                                      -- ManualDeliveryAmount
    NULL, NULL, NULL, NULL,                     -- Sensor/Temp/Density/Mass not available
    110,                                        -- StockBeforeDelivery (approx from TVH 42863)
    12110,                                      -- StockAfterDelivery (110 + 12000)
    'c8d645a6-bc5f-4a1e-82bb-c36ede8dd811',   -- RecordedBy
    1,                                          -- SupplierId = Vivo
    NULL,                                       -- LPONumber (unknown)
    'Diesel',                                   -- Product
    NOW(),                                      -- CreatedOn
    150.00,                                     -- PricePerLiter (default)
    0                                           -- is_deleted = false
);

SET @st2_delivery_id = LAST_INSERT_ID();

-- Verify delivery IDs
SELECT @st1_delivery_id AS ST1_DeliveryId, @st2_delivery_id AS ST2_DeliveryId;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 2: Insert delivery TVH records (ChangeReason=2)
-- ═══════════════════════════════════════════════════════════════════════════

-- ST1: Delivery TVH at 09:00 UTC
-- Last TVH before 09:00 was id=42812 at 02:58, NewVolume=9390.86
-- After delivery: 9390.86 + 12000 = 21390.86
INSERT INTO gpsdata.tankvolumehistory (
    TankId, TimeStamp, VolumeChange, NewVolume, ChangeReason,
    RecordedBy, ReferenceId, ReferenceType, CreatedOn, IsDeleted
) VALUES (
    1,                                          -- TankId = ST1
    '2026-03-04 09:00:00',                     -- Timestamp (delivery time)
    12000.00,                                   -- VolumeChange (+12000L delivery)
    21390.86,                                   -- NewVolume (9390.86 + 12000)
    2,                                          -- ChangeReason = Delivery
    'c8d645a6-bc5f-4a1e-82bb-c36ede8dd811',   -- RecordedBy
    @st1_delivery_id,                           -- ReferenceId = delivery.Id
    'Delivery',                                 -- ReferenceType
    NOW(),                                      -- CreatedOn
    0                                           -- IsDeleted = false
);

-- ST2: Delivery TVH at 09:00 UTC
-- Last TVH before 09:00 was id=42863 at 08:23, NewVolume=109.72
-- After delivery: 109.72 + 12000 = 12109.72
INSERT INTO gpsdata.tankvolumehistory (
    TankId, TimeStamp, VolumeChange, NewVolume, ChangeReason,
    RecordedBy, ReferenceId, ReferenceType, CreatedOn, IsDeleted
) VALUES (
    2,                                          -- TankId = ST2
    '2026-03-04 09:00:00',                     -- Timestamp (delivery time)
    12000.00,                                   -- VolumeChange (+12000L delivery)
    12109.72,                                   -- NewVolume (109.72 + 12000)
    2,                                          -- ChangeReason = Delivery
    'c8d645a6-bc5f-4a1e-82bb-c36ede8dd811',   -- RecordedBy
    @st2_delivery_id,                           -- ReferenceId = delivery.Id
    'Delivery',                                 -- ReferenceType
    NOW(),                                      -- CreatedOn
    0                                           -- IsDeleted = false
);

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 3: Update subsequent TVH NewVolume values (add delivery amount)
-- ═══════════════════════════════════════════════════════════════════════════

-- ST1: 3 dispensing records AFTER 09:00 need NewVolume += 12000
-- id=42893 at 10:18: 9342.14 → 21342.14
-- id=42896 at 10:39: 9300.58 → 21300.58
-- id=42897 at 10:45: 9295.50 → 21295.50
UPDATE gpsdata.tankvolumehistory
SET NewVolume = NewVolume + 12000
WHERE Id IN (42893, 42896, 42897);

-- ST2: No dispensing records after 09:00, so nothing to update

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 4: Update closing TVH VolumeChange
-- ═══════════════════════════════════════════════════════════════════════════

-- ST1 Closing TVH (id=42898):
-- Before fix: VolumeChange=11704.50 (closing 21000 - last dispensing 9295.50)
-- After fix:  VolumeChange=21000 - 21295.50 = -295.50 (small usage/discrepancy)
UPDATE gpsdata.tankvolumehistory
SET VolumeChange = -295.50
WHERE Id = 42898;

-- ST2 Closing TVH (id=42899):
-- Before fix: VolumeChange=12406.28 (closing 12516 - last dispensing 109.72)
-- After fix:  VolumeChange=12516 - 12109.72 = 406.28 (small discrepancy)
UPDATE gpsdata.tankvolumehistory
SET VolumeChange = 406.28
WHERE Id = 42899;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 5: Update tankstock entries with delivery info
-- ═══════════════════════════════════════════════════════════════════════════

-- ST1 TankStock (EntryID=25675)
UPDATE gpsdata.tankstock
SET DeliveryAmount = 12000.00,
    DeliveryId = @st1_delivery_id
WHERE EntryID = 25675;

-- ST2 TankStock (EntryID=25676)
UPDATE gpsdata.tankstock
SET DeliveryAmount = 12000.00,
    DeliveryId = @st2_delivery_id
WHERE EntryID = 25676;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION: Check the results before committing
-- ═══════════════════════════════════════════════════════════════════════════

-- Verify deliveries created
SELECT 'DELIVERY RECORDS' AS Section;
SELECT Id, TankId, DeliveryDate, ManualDeliveryAmount, StockBeforeDelivery, StockAfterDelivery
FROM gpsdata.delivery
WHERE Id IN (@st1_delivery_id, @st2_delivery_id);

-- Verify tankstock updated
SELECT 'TANKSTOCK RECORDS' AS Section;
SELECT EntryID, TankID, ManualOpeningLevel, ManualClosingLevel, DeliveryAmount, DeliveryId, EntryDate
FROM gpsdata.tankstock
WHERE EntryID IN (25675, 25676);

-- Verify TVH timeline for ST1
SELECT 'ST1 TVH TIMELINE' AS Section;
SELECT Id, TankId, TimeStamp, VolumeChange, NewVolume, ChangeReason, ReferenceType
FROM gpsdata.tankvolumehistory
WHERE TankId = 1
  AND TimeStamp >= '2026-03-03 20:50:00' AND TimeStamp <= '2026-03-04 21:10:00'
  AND (IsDeleted = 0 OR IsDeleted IS NULL)
ORDER BY TimeStamp;

-- Verify TVH timeline for ST2
SELECT 'ST2 TVH TIMELINE' AS Section;
SELECT Id, TankId, TimeStamp, VolumeChange, NewVolume, ChangeReason, ReferenceType
FROM gpsdata.tankvolumehistory
WHERE TankId = 2
  AND TimeStamp >= '2026-03-03 20:50:00' AND TimeStamp <= '2026-03-04 21:10:00'
  AND (IsDeleted = 0 OR IsDeleted IS NULL)
ORDER BY TimeStamp;

-- ═══════════════════════════════════════════════════════════════════════════
-- COMMIT or ROLLBACK
-- Review the verification output above, then run ONE of:
--   COMMIT;      -- if everything looks correct
--   ROLLBACK;    -- if something looks wrong
-- ═══════════════════════════════════════════════════════════════════════════
-- COMMIT;
