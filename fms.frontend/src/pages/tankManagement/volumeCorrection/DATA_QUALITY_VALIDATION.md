# Data Quality Validation Module - Enhanced Checks

## 🎯 Overview

Added comprehensive data quality validation rules to detect issues **beyond sequence breaks**, including:

- **Negative volumes** (tanks, opening stock, closing stock)
- **Unrealistic volume changes** (unusually large transactions)
- **Stock anomalies** (negative opening/closing stock)
- **Duplicate transactions** (same transaction entered twice)
- **Timing issues** (out-of-order transactions, future dates)
- **Missing data** (incomplete transactions)

---

## 📋 Validation Rules

### Rule 1: Negative Volume Check ✅

**What it checks**:
- Tank volume should NEVER be negative
- NewVolume field < 0 = CRITICAL

**Your data issues**:
```
ST2 OpeningStock: -2,135.00 ❌ CRITICAL
ST1 OpeningStock: -5,323.00 ❌ CRITICAL
ST2 ClosingStock: -2,480.00 ❌ CRITICAL
FT05 ClosingStock: -26.00 ❌ CRITICAL
```

**Recommendation**: These are system-breaking issues that must be corrected immediately.

---

### Rule 2: Unrealistic Volume Change ✅

**What it checks**:
- Single transaction should not exceed realistic limits
- Default threshold: 5,000L (configurable)
- Flags transactions as WARNING if > 2,000L

**Examples**:
```
Transaction: -265.00L (Dispensing)     ✅ Normal
Transaction: -119.00L (Dispensing)     ✅ Normal
Transaction: -2,135.00L (Delivery)     ⚠️ Large but possible
Transaction: -5,323.00L (Delivery)     ⚠️ Very large, verify
```

**Configuration** (in `volumeValidationRules.js`):
```javascript
const MAX_SINGLE_CHANGE = 5000;        // liters
const REALISTIC_THRESHOLD = 2000;      // flags as warning
```

---

### Rule 3: Stock Anomalies ✅

**What it checks**:
- Opening stock = should be positive
- Closing stock = should be positive
- Opening stock (today) should ≈ Closing stock (yesterday)

**Your data issues**:
```
Date: 01/12/2025 - OpeningStock: -2,135.00 ❌
  Expected: Positive value
  Issue: Cannot start day with negative stock

Date: 30/11/2025 - ClosingStock: -2,480.00 ❌
  Expected: Positive value
  Issue: Tank cannot end day with negative volume
```

**Tolerance**: 100L variance between closing & next opening (allows for rounding)

---

### Rule 4: Duplicate Transaction Detection ✅

**What it checks**:
- Same tank + same time (within 1 minute)
- Same transaction reason
- Same volume change (±1L tolerance)

**Example**:
```
Transaction 1: Tank 5, 14:30, Dispensing, -265L
Transaction 2: Tank 5, 14:30, Dispensing, -265L  ❌ Duplicate!
```

**Resolution**: Delete one if accidentally entered twice.

---

### Rule 5: Timing Anomalies ✅

**What it checks**:
1. **Future timestamps** - Transaction date in the future
2. **Wrong transaction order** - OpeningStock not first, ClosingStock not last
3. **Out-of-sequence** - Transactions not in chronological order

**Examples**:
```
Transaction: 2025-12-10 (when today is 2025-12-04) ❌ Future!
OpeningStock: 10:30 (but first Dispensing at 10:00) ❌ Wrong order!
```

---

### Rule 6: Missing Data Check ✅

**What it checks**:
- Required fields populated:
  - tankId
  - timestamp
  - changeReason
  - newVolume
  - volumeChange

**Severity**: HIGH - Cannot process incomplete records

---

## 📁 Files Created

### Validation Rules Engine
```
src/pages/tankManagement/volumeCorrection/utils/volumeValidationRules.js
```

**Functions**:
- `validateNegativeVolume()` - Check for negative volumes
- `validateUnrealisticChange()` - Check for unrealistic changes
- `validateStockAnomalies()` - Check opening/closing stock
- `validateDuplicateTransaction()` - Find duplicates
- `validateTimingAnomalies()` - Check transaction timing
- `validateMissingData()` - Check required fields
- `validateTransaction()` - Run all checks on one transaction
- `validateAllTransactions()` - Batch validate
- `generateValidationReport()` - Create summary report

### New Tab Component
```
src/pages/tankManagement/volumeCorrection/tabs/DataQualityCheck.js
```

**Features**:
- Tank & date range selection
- Severity summary (CRITICAL/HIGH/MEDIUM/LOW/WARNING)
- Detailed issue list with recommendations
- Category breakdown
- Critical issues highlighted

---

## 🚀 Usage

### Option 1: As Standalone Utility

```javascript
import {
  validateAllTransactions,
  generateValidationReport
} from 'utils/volumeValidationRules';

// Validate all transactions
const results = validateAllTransactions(tankVolumeHistory);

// Generate report
const report = generateValidationReport(results);

console.log(`Found ${report.bySeverity.CRITICAL} critical issues`);
console.log(`Found ${report.bySeverity.HIGH} high priority issues`);
```

### Option 2: In Data Quality Check Tab

1. Navigate to "Data Quality Check" tab
2. Select tank and date range
3. Click "Run Data Quality Check"
4. Review all validation issues found
5. Click on issues for recommendations

### Option 3: On Data Import

```javascript
// When importing new tank volume data
const validationResults = validateAllTransactions(importedData);

if (validationResults.length > 0) {
  // Block import and show issues
  showValidationErrors(validationResults);
} else {
  // Safe to import
  saveData(importedData);
}
```

---

## 📊 Severity Levels

| Level | Color | Priority | Action |
|-------|-------|----------|--------|
| **CRITICAL** | Red | Immediate | Block operations until fixed |
| **HIGH** | Orange | Urgent | Fix before processing |
| **MEDIUM** | Yellow | Soon | Correct during regular maintenance |
| **LOW** | Light Yellow | When possible | Monitor and fix |
| **WARNING** | Green | Informational | Just notify user |

---

## 🔧 Configuration

### Adjust Thresholds

Edit `volumeValidationRules.js`:

```javascript
// Change max single transaction
const MAX_SINGLE_CHANGE = 5000;        // ← Change here

// Change realistic threshold (warning)
const REALISTIC_THRESHOLD = 2000;      // ← Change here

// Change tank capacity
const MAX_OPENING_STOCK = 50000;       // ← Change here
```

### Add Custom Validation Rule

```javascript
export const validateCustomRule = (transaction) => {
  const issues = [];

  // Your custom logic
  if (someCondition) {
    issues.push({
      severity: VALIDATION_SEVERITY.HIGH,
      category: 'CUSTOM_CATEGORY',
      field: 'fieldName',
      value: transaction.fieldName,
      message: 'Custom error message',
      recommendation: 'What to do about it',
      affectedTransaction: transaction.id
    });
  }

  return issues;
};

// Then call it in validateTransaction()
allIssues.push(...validateCustomRule(transaction));
```

---

## 📈 Example Output

### For Your Data

```
VALIDATION REPORT
═════════════════════════════════════════

CRITICAL ISSUES: 4
├─ ST2 OpeningStock: -2,135.00L
├─ ST1 OpeningStock: -5,323.00L
├─ ST2 ClosingStock: -2,480.00L
└─ FT05 ClosingStock: -26.00L

HIGH PRIORITY: 2
├─ ST2 Opening differs from previous closing
└─ Potential duplicate in FT05 transfers

MEDIUM: 1
└─ Large transfer on 30/11

WARNINGS: 0

AFFECTED TANKS: ST1, ST2, FT05

RECOMMENDATIONS:
  1. FIX CRITICAL: Correct negative volumes
  2. Verify opening/closing stock values
  3. Check for duplicate entries
  4. Review large transactions
```

---

## 🔍 Real-World Example

### Your Data Analysis

**Issue #1: Negative Opening Stock**
```
Date: 01/12/2025 00:05
Tank: ST2
Type: OpeningStock
Value: -2,135.00L

CRITICAL - Tank cannot start day with negative stock!

Possible causes:
  • Data entry error
  • Sensor malfunction
  • System bug
  • Negative transfer not recorded

Action:
  1. Verify physical tank level
  2. Check readings from day before
  3. Correct to actual physical level
  4. Investigate root cause
```

**Issue #2: Negative Closing Stock**
```
Date: 30/11/2025 23:55
Tank: ST2
Type: ClosingStock
Value: -2,480.00L

CRITICAL - Tank cannot close day with negative stock!

This means:
  • Dispensed more than available
  • OR dispensing values are wrong
  • OR opening stock was wrong

Action:
  1. Trace all transactions for day
  2. Verify each dispensing amount
  3. Identify which transaction is wrong
  4. Use DETECT + ANALYZE to find breaks
  5. Execute CORRECT to fix
```

---

## 🎯 Next Steps

### Immediate (This Week)
1. ✅ Run data quality check on all tanks
2. ✅ Identify all CRITICAL issues
3. ✅ Document root causes
4. ✅ Create correction plan

### Short-term (This Month)
1. Fix all CRITICAL and HIGH issues
2. Use DETECT-ANALYZE-CORRECT workflow
3. Verify data integrity

### Long-term (Ongoing)
1. Run data quality checks weekly
2. Monitor for new issues
3. Investigate root causes
4. Prevent future issues

---

## 📞 Support

### Questions?

1. **"Is my data broken?"** → Run Data Quality Check
2. **"What do I fix first?"** → Fix CRITICAL issues first
3. **"How do I fix it?"** → Use DETECT-ANALYZE-CORRECT tabs
4. **"Why did this happen?"** → See issue recommendations

---

## 🔐 Permissions

- **Read**: `_Read_tankStock` - View issues
- **Write**: `_Update_tankStock` - Fix issues using correction strategies

---

## 📝 Summary

You now have **comprehensive data quality validation** that catches:

✅ Negative volumes (system-breaking)
✅ Unrealistic changes (data entry errors)
✅ Stock anomalies (processing errors)
✅ Duplicates (accidental double-entry)
✅ Timing issues (sequencing errors)
✅ Missing data (incomplete records)

Plus a dedicated UI tab to review and act on these issues!

---

**Status**: Ready to use
**Version**: 1.0
**Last Updated**: 2025-12-04
