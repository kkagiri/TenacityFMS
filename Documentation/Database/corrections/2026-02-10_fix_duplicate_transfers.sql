-- ==========================================================================
-- FIX: Duplicate TankTransfer records and incorrect PumpTransaction volume
--      history entries for transfer-mode transactions
-- Date: 2026-02-10
-- Issue: UploadStatusCommand AND AutoTransactionCompletionService both called
--        ProcessPumpTransferAsync, causing duplicate TankTransfer records.
--        Additionally, AutoTransactionCompletionService called
--        ProcessPumpTransactionAsync (fuel dispense deduction) for transfer-mode
--        transactions, which are already handled by PumpTankTransferService.
-- ==========================================================================

-- ========================================
-- STEP 0: BACKUP AFFECTED TABLES
-- ========================================
CREATE TABLE IF NOT EXISTS tanktransfer_backup_20260210 AS SELECT * FROM tanktransfer WHERE Id IN (512, 514, 516, 518, 520, 522, 526);
CREATE TABLE IF NOT EXISTS tankvolumehistory_backup_20260210 AS SELECT * FROM tankvolumehistory WHERE Id IN (
    -- Duplicate transfer history entries
    39365, 39367, 39393, 39394, 39521, 39523, 39527, 39528, 39654, 39655, 39718, 39720, 39878, 39879,
    -- Incorrect PumpTransaction entries for transfer-mode transactions
    38971, 38979, 38991, 39152, 39209, 39364, 39391, 39519, 39525, 39651, 39716, 39875
);
CREATE TABLE IF NOT EXISTS tank_backup_20260210 AS SELECT * FROM tank WHERE Id IN (1, 2, 23);

-- ========================================
-- STEP 1: SOFT-DELETE DUPLICATE TANK TRANSFERS
-- (Keep the first/original transfer, delete the duplicate)
-- ========================================
UPDATE tanktransfer
SET is_deleted = 1, deleted_at = NOW(), deleted_by = 'system-correction-20260210'
WHERE Id IN (512, 514, 516, 518, 520, 522, 526)
  AND is_deleted = 0;
-- Expected: 7 rows affected

-- ========================================
-- STEP 2: SOFT-DELETE VOLUME HISTORY FOR DUPLICATE TRANSFERS
-- (14 records: 7 source OUT + 7 destination IN)
-- ========================================
UPDATE tankvolumehistory
SET IsDeleted = 1, DeletedAt = NOW(), DeletedBy = 'system-correction-20260210'
WHERE ReferenceType = 'TankTransfer'
  AND ReferenceId IN (512, 514, 516, 518, 520, 522, 526)
  AND IsDeleted = 0;
-- Expected: 14 rows affected

-- ========================================
-- STEP 3: SOFT-DELETE INCORRECT PUMPTRANSACTION VOLUME HISTORY
-- (Transfer-mode transactions incorrectly recorded as AutomatedDispensing)
-- ========================================
UPDATE tankvolumehistory
SET IsDeleted = 1, DeletedAt = NOW(), DeletedBy = 'system-correction-20260210'
WHERE Id IN (38971, 38979, 38991, 39152, 39209, 39364, 39391, 39519, 39525, 39651, 39716, 39875)
  AND IsDeleted = 0;
-- Expected: 12 rows affected

-- ========================================
-- STEP 4: ADJUST TANK CURRENT STOCK
-- Corrections per tank:
--   Tank 1 (ST1):  +4,249.60  (was deducted 4,149.70 by bad PumpTx + 99.90 by dup transfer)
--   Tank 2 (ST2):  +16,800.10 (was deducted 8,450.00 by bad PumpTx + 8,350.10 by dup transfer)
--   Tank 23 (FT13): -8,450.00 (was over-credited 8,450.00 by dup transfer IN)
-- ========================================

-- Tank 1 (ST1): CurrentStock 450 + 4249.60 = 4699.60
UPDATE tank SET CurrentStock = CurrentStock + 4249.60, LastStockUpdate = NOW() WHERE Id = 1;

-- Tank 2 (ST2): CurrentStock 4840 + 16800.10 = 21640.10
UPDATE tank SET CurrentStock = CurrentStock + 16800.10, LastStockUpdate = NOW() WHERE Id = 2;

-- Tank 23 (FT13): CurrentStock 1652 - 8450 = -6798
UPDATE tank SET CurrentStock = CurrentStock - 8450.00, LastStockUpdate = NOW() WHERE Id = 23;

-- ========================================
-- STEP 5: VERIFICATION QUERIES
-- ========================================
-- Verify no more duplicates
SELECT COUNT(*) as remaining_duplicates
FROM tanktransfer t1
INNER JOIN tanktransfer t2 ON t1.SourceTankId = t2.SourceTankId
    AND t1.DestinationTankId = t2.DestinationTankId
    AND t1.Amount = t2.Amount
    AND t1.TransferDate = t2.TransferDate
    AND t1.RecordedBy = t2.RecordedBy
    AND t1.Id < t2.Id
    AND t1.is_deleted = 0 AND t2.is_deleted = 0;
-- Expected: 0

-- Verify no more incorrect PumpTransaction history for transfers
SELECT COUNT(*) as remaining_bad_pump_history
FROM tankvolumehistory h
INNER JOIN pumptransaction pt ON h.ReferenceId = pt.Id AND h.ReferenceType = 'PumpTransaction'
WHERE pt.IsTransferMode = 1 AND h.IsDeleted = 0;
-- Expected: 0

-- Check corrected tank stocks
SELECT Id, Name, CurrentStock, PhysicalStockValue, TankVolume FROM tank WHERE Id IN (1, 2, 23);
