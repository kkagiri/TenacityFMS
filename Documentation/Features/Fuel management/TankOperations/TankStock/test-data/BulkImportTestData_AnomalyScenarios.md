# Bulk Import Test Data - Anomaly Detection Scenarios

## Test File: Anomaly_Detection_Sample.xlsx

### Description
This test file contains intentional anomalies to test all 11 validation algorithms.

### Test Data

| Row# | Tank Name | Date | Opening Stock | Dispensing | Transfer IN | Transfer OUT | Delivery | Closing Stock | Opening Meter | Closing Meter | Notes |
|------|-----------|------|---------------|------------|-------------|--------------|----------|---------------|---------------|---------------|-------|
| 1 | Tank 1 | 2024-01-01 | 10000 | 5000 | 0 | 0 | 0 | 5000 | 1000000 | 1005000 | Valid baseline |
| 2 | Tank 1 | 2024-01-02 | 5000 | 3000 | 0 | 0 | 8000 | 10150 | 1005000 | 1008000 | ❌ Daily Balance: Variance +150L |
| 3 | Tank 1 | 2024-01-03 | 9000 | 4000 | 0 | 0 | 0 | 5000 | 1008000 | 1012000 | ❌ Continuity Break: Opening 9000 ≠ Previous Closing 10150 |
| 4 | Tank 1 | 2024-01-04 | 5000 | 3000 | 0 | 0 | 0 | 2000 | 1012000 | 1011000 | ❌ Meter Rollback: 1011000 < 1012000 |
| 5 | Tank 1 | 2024-01-05 | 2000 | 1000 | 0 | 0 | 0 | 1000 | 1011000 | 1013000 | ❌ Meter Mismatch: Dispensing 1000L vs Meter 2000L (100% variance) |
| 6 | Tank 2 | 2024-01-01 | 5000 | 2000 | 0 | 0 | 50000 | 53000 | 500000 | 502000 | ❌ Capacity Overflow: Tank capacity 30000L |
| 7 | Tank 2 | 2024-01-02 | 53000 | 54000 | 0 | 0 | 0 | -1000 | 502000 | 556000 | ❌ Negative Stock: Dispensing exceeds available |
| 8 | Tank 3 | 2024-01-01 | 8000 | 2000 | 0 | 5000 | 0 | 1000 | 750000 | 752000 | ❌ Transfer Imbalance: Transfer OUT 5000 with no matching IN |
| 9 | Tank 3 | 2024-01-02 | 1000 | 0 | 0 | 0 | 0 | 3000 | 752000 | 752000 | ❌ Zero Movement: Stock changed 2000L with no transactions |
| 10 | Tank 4 | 2024-01-01 | 5000 | 50000 | 0 | 0 | 0 | -45000 | 300000 | 350000 | ❌ Implausible Dispensing: Exceeds available stock |
| 11 | Tank 4 | 2024-01-02 | 2000 | 0 | 0 | 0 | 30000 | 32000 | 350000 | 350000 | ❌ Delivery No Space: Tank capacity 20000L, delivery 30000L |

### Expected Anomalies

#### Row 2: Daily Balance Anomaly
- **Type**: DailyBalance
- **Severity**: Medium
- **Expected**: 10000 (5000 + 8000 - 3000)
- **Actual**: 10150
- **Variance**: +150L (1.5%)
- **Threshold**: 50L or 2%
- **Status**: ⚠️ Warning (within 2% but exceeds 50L)

#### Row 3: Continuity Break
- **Type**: ContinuityBreak
- **Severity**: High
- **Expected Opening**: 10150
- **Actual Opening**: 9000
- **Variance**: -1150L (11.3%)
- **Status**: 🔴 Error

#### Row 4: Meter Rollback
- **Type**: MeterRollback
- **Severity**: Medium
- **Previous Meter**: 1012000
- **Current Meter**: 1011000
- **Difference**: -1000
- **Status**: ⚠️ Warning (could be meter reset)

#### Row 5: Meter Mismatch
- **Type**: MeterMismatch
- **Severity**: High
- **Dispensing**: 1000L
- **Meter Difference**: 2000L (1013000 - 1011000)
- **Variance**: 100% (exceeds 5% threshold + 20L minimum)
- **Status**: 🔴 Error

#### Row 6: Capacity Overflow
- **Type**: CapacityOverflow
- **Severity**: Critical
- **Tank Capacity**: 30000L
- **Calculated Stock**: 53000L
- **Overflow**: 23000L (76.7%)
- **Status**: 🔴 Blocking

#### Row 7: Negative Stock
- **Type**: NegativeStock
- **Severity**: Critical
- **Opening**: 53000L
- **Dispensing**: 54000L
- **Result**: -1000L
- **Status**: 🔴 Blocking

#### Row 8: Transfer Imbalance
- **Type**: TransferImbalance
- **Severity**: Medium
- **Transfer OUT**: 5000L (Tank 3)
- **Matching Transfer IN**: None found for 2024-01-01
- **Status**: ⚠️ Warning (might be to different tank or different day)

#### Row 9: Zero Movement
- **Type**: ZeroMovement
- **Severity**: High
- **Opening**: 1000L
- **Closing**: 3000L
- **Change**: +2000L
- **Transactions**: None (all zero)
- **Status**: 🔴 Error

#### Row 10: Implausible Dispensing
- **Type**: ImplausibleDispensing
- **Severity**: Critical
- **Available Stock**: 5000L
- **Dispensing**: 50000L
- **Excess**: 45000L (900%)
- **Status**: 🔴 Blocking

#### Row 11: Delivery No Space
- **Type**: DeliveryNoSpace
- **Severity**: High
- **Current Stock**: 2000L
- **Tank Capacity**: 20000L
- **Available Space**: 18000L
- **Delivery**: 30000L
- **Excess**: 12000L (66.7%)
- **Status**: 🔴 Error

### Expected Validation Result

```json
{
  "isValid": false,
  "hasWarnings": true,
  "hasBlockingAnomalies": true,
  "summary": "Validation failed with 11 anomalies detected",
  "totalRows": 11,
  "validRows": 1,
  "rowsWithErrors": 10,
  "criticalCount": 3,
  "highCount": 5,
  "mediumCount": 3,
  "lowCount": 0,
  "anomalies": [
    // 11 anomalies as described above
  ]
}
```

### Expected Import Behavior

**With `ignoreWarnings: false`**:
- ❌ Import should FAIL
- Reason: Has blocking anomalies (Critical severity)
- User must fix rows 6, 7, 10

**With `ignoreWarnings: true`**:
- ✅ Import should SUCCEED for non-blocking rows
- Imported: Row 1 only (valid baseline)
- Skipped: Rows with critical anomalies (6, 7, 10)
- Warnings: Rows 2, 4, 8 (proceed with caution)
- Errors: Rows 3, 5, 9, 11 (high severity, skip recommended)

### Cumulative Drift Test

To test cumulative drift, add this 10-day sequence:

| Row# | Tank Name | Date | Opening | Dispensing | Transfer IN | Transfer OUT | Delivery | Closing | Notes |
|------|-----------|------|---------|------------|-------------|--------------|----------|---------|-------|
| 12 | Tank 5 | 2024-01-01 | 0 | 0 | 0 | 0 | 10000 | 10000 | Day 1 |
| 13 | Tank 5 | 2024-01-02 | 10000 | 1000 | 0 | 0 | 0 | 9000 | Day 2 |
| 14 | Tank 5 | 2024-01-03 | 9000 | 1000 | 0 | 0 | 0 | 8000 | Day 3 |
| 15 | Tank 5 | 2024-01-04 | 8000 | 1000 | 0 | 0 | 0 | 7000 | Day 4 |
| 16 | Tank 5 | 2024-01-05 | 7000 | 1000 | 0 | 0 | 0 | 6000 | Day 5 |
| 17 | Tank 5 | 2024-01-06 | 6000 | 1000 | 0 | 0 | 0 | 5000 | Day 6 |
| 18 | Tank 5 | 2024-01-07 | 5000 | 1000 | 0 | 0 | 0 | 4000 | Day 7 |
| 19 | Tank 5 | 2024-01-08 | 4000 | 1000 | 0 | 0 | 0 | 3000 | Day 8 |
| 20 | Tank 5 | 2024-01-09 | 3000 | 1000 | 0 | 0 | 0 | 2000 | Day 9 |
| 21 | Tank 5 | 2024-01-10 | 2000 | 1000 | 0 | 0 | 0 | 500 | ❌ Day 10: Expected 1000, Actual 500, Variance -500L (50%) |

**Cumulative Drift Detection**:
- Period: 10 days
- Initial: 0L
- Total Deliveries: 10000L
- Total Dispensing: 10000L (10 days × 1000L)
- Expected Final: 0L
- Actual Final: 500L
- **Cumulative Variance**: +500L
- **Threshold**: 100L or 2%
- **Status**: ❌ CumulativeDrift detected (exceeds 100L)

### Testing Instructions

1. **Create Excel File**: Copy data into Excel with exact column headers
2. **Upload via UI**: Use Bulk Import tab in Tank Stock Management
3. **Review Validation**: Check that all 11 anomalies are detected
4. **Verify Severity**: Confirm critical/high/medium classifications
5. **Test Import Modes**:
   - Try importing with all anomalies → Should FAIL
   - Fix critical anomalies (rows 6, 7, 10)
   - Try again → Should show only warnings
   - Import with `ignoreWarnings: true` → Should succeed partially
6. **Check Database**: Verify ImportBatchId is set for all imported records
