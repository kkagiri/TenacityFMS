-- ============================================================================
-- Bulk Import Validation Configuration Settings
-- ============================================================================
-- Description: Advanced validation thresholds and tolerances for cumulative validators
-- Date: 2024
-- Related: BulkImportCumulativeValidator.cs, BulkImportSettingsPopup.js
-- ============================================================================

-- Insert validation configuration settings
INSERT INTO `systemconfigurations` (
  `ConfigurationKey`,
  `ConfigurationValue`,
  `Category`,
  `Description`,
  `DataType`,
  `IsActive`,
  `IsEditable`,
  `CreatedAt`,
  `UpdatedAt`,
  `MinValue`,
  `MaxValue`,
  `DefaultValue`
)
VALUES
  -- Stock Continuity Check Settings
  (
    'TankStock.BulkImport.StockContinuity.Enabled',
    'true',
    'BulkImport',
    'Enable stock continuity validation (checks if closing stock matches next opening stock)',
    'Boolean',
    1,
    1,
    NOW(),
    NOW(),
    NULL,
    NULL,
    'true'
  ),
  (
    'TankStock.BulkImport.StockContinuity.ThresholdLiters',
    '500',
    'BulkImport',
    'Stock continuity threshold in liters - flag if difference exceeds this value',
    'Number',
    1,
    1,
    NOW(),
    NOW(),
    0,
    10000,
    '500'
  ),
  (
    'TankStock.BulkImport.StockContinuity.ThresholdPercent',
    '10',
    'BulkImport',
    'Stock continuity threshold in percentage - flag if difference exceeds this percentage',
    'Number',
    1,
    1,
    NOW(),
    NOW(),
    0,
    100,
    '10'
  ),

  -- Balance Equation Check Settings
  (
    'TankStock.BulkImport.BalanceEquation.Enabled',
    'true',
    'BulkImport',
    'Enable balance equation validation (Opening + Delivery - Dispensing - TransferOut + TransferIn = Closing)',
    'Boolean',
    1,
    1,
    NOW(),
    NOW(),
    NULL,
    NULL,
    'true'
  ),
  (
    'TankStock.BulkImport.BalanceEquation.TolerancePercent',
    '2',
    'BulkImport',
    'Balance equation tolerance percentage - allows for sensor variance and measurement errors',
    'Number',
    1,
    1,
    NOW(),
    NOW(),
    0,
    20,
    '2'
  ),
  (
    'TankStock.BulkImport.BalanceEquation.MinVarianceLiters',
    '10',
    'BulkImport',
    'Minimum variance in liters to trigger balance equation warning',
    'Number',
    1,
    1,
    NOW(),
    NOW(),
    0,
    1000,
    '10'
  ),

  -- Meter Reading Validation Settings
  (
    'TankStock.BulkImport.MeterReadings.Enabled',
    'true',
    'BulkImport',
    'Enable meter reading validation (ClosingMeter - OpeningMeter vs Dispensing)',
    'Boolean',
    1,
    1,
    NOW(),
    NOW(),
    NULL,
    NULL,
    'true'
  ),
  (
    'TankStock.BulkImport.MeterReadings.TolerancePercent',
    '5',
    'BulkImport',
    'Meter reading tolerance percentage - allows for meter vs dispensing variance',
    'Number',
    1,
    1,
    NOW(),
    NOW(),
    0,
    20,
    '5'
  ),
  (
    'TankStock.BulkImport.MeterReadings.MinVarianceLiters',
    '20',
    'BulkImport',
    'Minimum variance in liters to trigger meter reading warning',
    'Number',
    1,
    1,
    NOW(),
    NOW(),
    0,
    1000,
    '20'
  ),
  (
    'TankStock.BulkImport.MeterReadings.AllowReset',
    'true',
    'BulkImport',
    'Allow meter resets (closing meter less than opening meter) - true allows, false flags as error',
    'Boolean',
    1,
    1,
    NOW(),
    NOW(),
    NULL,
    NULL,
    'true'
  ),

  -- Transfer Reciprocity Check Settings
  (
    'TankStock.BulkImport.TransferReciprocity.Enabled',
    'true',
    'BulkImport',
    'Enable transfer reciprocity validation (TransferOut from one tank should match TransferIn to another)',
    'Boolean',
    1,
    1,
    NOW(),
    NOW(),
    NULL,
    NULL,
    'true'
  ),
  (
    'TankStock.BulkImport.TransferReciprocity.ToleranceLiters',
    '10',
    'BulkImport',
    'Transfer reciprocity tolerance in liters - allows for minor measurement differences',
    'Number',
    1,
    1,
    NOW(),
    NOW(),
    0,
    1000,
    '10'
  );

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to verify validation configurations were inserted correctly:

SELECT
  `Id`,
  `ConfigurationKey`,
  `ConfigurationValue`,
  `Category`,
  `Description`,
  `DataType`,
  `IsActive`,
  `MinValue`,
  `MaxValue`,
  `DefaultValue`
FROM `systemconfigurations`
WHERE `Category` = 'BulkImport'
  AND (`ConfigurationKey` LIKE '%StockContinuity%'
   OR `ConfigurationKey` LIKE '%BalanceEquation%'
   OR `ConfigurationKey` LIKE '%MeterReadings%'
   OR `ConfigurationKey` LIKE '%TransferReciprocity%')
ORDER BY `ConfigurationKey`;

-- ============================================================================
-- Configuration Details & Use Cases
-- ============================================================================

/*
═══════════════════════════════════════════════════════════════════════════
1. STOCK CONTINUITY CHECK
═══════════════════════════════════════════════════════════════════════════

Purpose: Ensures yesterday's closing stock matches today's opening stock

Configuration Keys:
- TankStock.BulkImport.StockContinuity.Enabled (true|false)
- TankStock.BulkImport.StockContinuity.ThresholdLiters (default: 500)
- TankStock.BulkImport.StockContinuity.ThresholdPercent (default: 10)

Logic:
IF ABS(Row[N].Closing - Row[N+1].Opening) > ThresholdLiters
   OR ABS((Row[N].Closing - Row[N+1].Opening) / Row[N].Closing * 100) > ThresholdPercent
THEN Flag as STOCK_CONTINUITY_MISMATCH

Example:
- Day 1 Closing: 5000 liters
- Day 2 Opening: 4300 liters
- Difference: 700 liters (14%)
- Result: ⚠️ WARNING (exceeds 500L and 10%)

Use Cases:
✓ Historical data import - detect missing deliveries or manual adjustments
✓ Data quality check - identify data entry errors
✓ Audit trail - flag unexplained stock changes

═══════════════════════════════════════════════════════════════════════════
2. BALANCE EQUATION CHECK
═══════════════════════════════════════════════════════════════════════════

Purpose: Validates the fundamental stock balance equation

Configuration Keys:
- TankStock.BulkImport.BalanceEquation.Enabled (true|false)
- TankStock.BulkImport.BalanceEquation.TolerancePercent (default: 2)
- TankStock.BulkImport.BalanceEquation.MinVarianceLiters (default: 10)

Equation:
Expected = Opening + Delivery + TransferIn - Dispensing - TransferOut
Variance = ABS(Closing - Expected)

Logic:
IF Variance > MinVarianceLiters
   AND (Variance / Expected * 100) > TolerancePercent
THEN Flag as BALANCE_EQUATION_VIOLATION

Example:
- Opening: 3000L, Delivery: 2000L, Dispensing: 1800L
- Expected Closing: 3200L
- Actual Closing: 3100L
- Variance: 100L (3.1%)
- Result: ⚠️ WARNING (exceeds 2% tolerance)

Use Cases:
✓ Detect measurement errors
✓ Identify sensor calibration issues
✓ Flag potential fuel theft or leakage
✓ Validate data integrity

═══════════════════════════════════════════════════════════════════════════
3. METER READING VALIDATION
═══════════════════════════════════════════════════════════════════════════

Purpose: Validates meter readings against dispensing volumes

Configuration Keys:
- TankStock.BulkImport.MeterReadings.Enabled (true|false)
- TankStock.BulkImport.MeterReadings.TolerancePercent (default: 5)
- TankStock.BulkImport.MeterReadings.MinVarianceLiters (default: 20)
- TankStock.BulkImport.MeterReadings.AllowReset (default: true)

Logic:
MeterDifference = ClosingMeter - OpeningMeter
Variance = ABS(MeterDifference - Dispensing)

IF Variance > MinVarianceLiters
   AND (Variance / Dispensing * 100) > TolerancePercent
THEN Flag as METER_READING_MISMATCH

IF ClosingMeter < OpeningMeter AND !AllowReset
THEN Flag as METER_RESET_DETECTED

Example:
- Opening Meter: 125000L, Closing Meter: 126800L
- Meter Difference: 1800L
- Dispensing: 1900L
- Variance: 100L (5.26%)
- Result: ⚠️ WARNING (exceeds 5% tolerance)

Use Cases:
✓ Detect meter calibration issues
✓ Identify meter reset events
✓ Validate dispensing records
✓ Flag potential meter tampering

═══════════════════════════════════════════════════════════════════════════
4. TRANSFER RECIPROCITY CHECK
═══════════════════════════════════════════════════════════════════════════

Purpose: Ensures transfer OUT from one tank matches transfer IN to another

Configuration Keys:
- TankStock.BulkImport.TransferReciprocity.Enabled (true|false)
- TankStock.BulkImport.TransferReciprocity.ToleranceLiters (default: 10)

Logic:
FOR each date:
  TotalTransferOut = SUM(TransferOut for all tanks)
  TotalTransferIn = SUM(TransferIn for all tanks)
  Variance = ABS(TotalTransferOut - TotalTransferIn)

  IF Variance > ToleranceLiters
  THEN Flag as TRANSFER_RECIPROCITY_MISMATCH

Example:
- Tank A: TransferOut = 500L
- Tank B: TransferIn = 480L
- Variance: 20L
- Result: ⚠️ WARNING (exceeds 10L tolerance)

Use Cases:
✓ Validate inter-tank transfers
✓ Detect incomplete transfer records
✓ Ensure data consistency across tanks
✓ Flag potential data entry errors

*/

-- ============================================================================
-- Update Examples
-- ============================================================================

-- Make stock continuity check more lenient (allow up to 1000L or 15% variance)
UPDATE `systemconfigurations`
SET `ConfigurationValue` = '1000', `UpdatedAt` = NOW()
WHERE `ConfigurationKey` = 'TankStock.BulkImport.StockContinuity.ThresholdLiters';

UPDATE `systemconfigurations`
SET `ConfigurationValue` = '15', `UpdatedAt` = NOW()
WHERE `ConfigurationKey` = 'TankStock.BulkImport.StockContinuity.ThresholdPercent';

-- Make balance equation check stricter (only 1% tolerance)
UPDATE `systemconfigurations`
SET `ConfigurationValue` = '1', `UpdatedAt` = NOW()
WHERE `ConfigurationKey` = 'TankStock.BulkImport.BalanceEquation.TolerancePercent';

-- Disable meter reading validation
UPDATE `systemconfigurations`
SET `ConfigurationValue` = 'false', `UpdatedAt` = NOW()
WHERE `ConfigurationKey` = 'TankStock.BulkImport.MeterReadings.Enabled';

-- Disallow meter resets (flag as error)
UPDATE `systemconfigurations`
SET `ConfigurationValue` = 'false', `UpdatedAt` = NOW()
WHERE `ConfigurationKey` = 'TankStock.BulkImport.MeterReadings.AllowReset';

-- Increase transfer reciprocity tolerance to 50L
UPDATE `systemconfigurations`
SET `ConfigurationValue` = '50', `UpdatedAt` = NOW()
WHERE `ConfigurationKey` = 'TankStock.BulkImport.TransferReciprocity.ToleranceLiters';

-- ============================================================================
-- Rollback (if needed)
-- ============================================================================

-- Delete all validation configuration settings
DELETE FROM `systemconfigurations`
WHERE `Category` = 'BulkImport'
  AND (`ConfigurationKey` LIKE '%StockContinuity%'
   OR `ConfigurationKey` LIKE '%BalanceEquation%'
   OR `ConfigurationKey` LIKE '%MeterReadings%'
   OR `ConfigurationKey` LIKE '%TransferReciprocity%');

-- ============================================================================
-- Notes
-- ============================================================================

/*
1. Data Sources:
   - All validation uses in-memory Excel data (sorted by tank and date)
   - Minimal DB queries: Tank lookup, duplicate check, configuration

2. Performance:
   - All checks run during validation phase (before import)
   - No impact on import performance (validation-only mode)
   - Configuration values cached in memory

3. Severity Levels:
   - INFO: Configuration-based threshold not exceeded
   - WARNING: Exceeds configured threshold but not blocking
   - ERROR: Critical validation failure (blocks import)

4. UI Integration:
   - Settings popup shows all thresholds
   - Enable/disable each validator independently
   - Real-time preview of configuration impact

5. Backend Integration:
   - BulkImportCumulativeValidator reads these settings
   - Applied during Step 3 validation
   - Results included in BulkImportValidationResult

6. Future Enhancements (Reserved Keys):
   - TankStock.BulkImport.StockContinuity.Severity.Low
   - TankStock.BulkImport.StockContinuity.Severity.Medium
   - TankStock.BulkImport.StockContinuity.Severity.High
   - TankStock.BulkImport.EmailNotifyOnAnomaly
   - TankStock.BulkImport.AutoCorrectMinorVariances
*/
