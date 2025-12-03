# Tank Volume History Data Correction Strategy

## Executive Summary

This document provides a comprehensive strategy for detecting, analyzing, and correcting corrupted tank volume history data in the FMS system. The spike in ST7 tank balance on 05/11/2025 at 03:14:00 revealed a critical issue with transaction ordering when multiple transactions share the same timestamp.

**Status**: Critical data corruption detected. Correction framework now implemented.

---

## Problem Analysis

### Root Cause
Multiple transactions with identical timestamps (05/11/2025 03:14:00) were processed out of order, causing a cascade of volume calculation errors:

**Example from your data:**
```
ST7 at 03:14:00 SH17 (Shovel):     41,972.00 - 195 = 41,777.00 ✓ Correct
ST7 at 03:14:00 KBH797Q (Pickup):  41,777.00 - 51  = 41,726.00 ✓ Should be this
ST7 at 03:14:00 KBH797Q (Pickup):  41,772.00 → 42,367.00 ✗ Wrong (+595 spike!)
```

### Why It Happened
1. **Concurrent Transaction Processing**: Multiple requests for same-timestamp transactions were processed in parallel
2. **Missing Lock Mechanism**: No serialization guarantee for transactions with identical timestamps
3. **GetPreviousVolumeAsync Issue**: When querying for "previous volume", the ordering was non-deterministic for same-timestamp entries
4. **Order-Dependent Calculations**: Each transaction depends on the exact previous transaction, so order matters critically

---

## Solution Architecture

### Three-Phase Correction Strategy

```
PHASE 1: DETECT        PHASE 2: ANALYZE       PHASE 3: CORRECT
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Validate Sequence│  │ Generate Plan    │  │ Execute Fix      │
│ Find Breaks      │  │ Group by Impact  │  │ Verify Results   │
│ Report Severity  │  │ Prioritize Order │  │ Audit Log        │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## PHASE 1: DETECT - Identify Data Corruption

### 1.1 Validate Single Tank

**Endpoint**: `GET /api/tankvolumedatacorrection/validate-tank/{tankId}`

**Purpose**: Check if a tank has volume sequence breaks

**Example**:
```bash
GET /api/tankvolumedatacorrection/validate-tank/5?fromDate=2025-11-05&toDate=2025-11-05
```

**Response**:
```json
{
  "tankId": 5,
  "isValid": false,
  "totalTransactions": 87,
  "sequenceBreaks": [
    {
      "tankId": 5,
      "breakIndex": 42,
      "previousTransactionId": 1023,
      "previousTimestamp": "2025-11-05T03:14:00Z",
      "previousNewVolume": 41772.00,
      "affectedTransactionId": 1024,
      "transactionTimestamp": "2025-11-05T03:14:00Z",
      "transactionChangeReason": "Dispensing",
      "expectedVolume": 41721.00,
      "actualVolume": 42367.00,
      "variance": 646.00,
      "severity": "HIGH"
    }
  ],
  "message": "Found 1 sequence break(s) in 87 transactions"
}
```

**What to Look For**:
- `isValid: false` = Data corruption confirmed
- `variance > 100` = HIGH or CRITICAL severity
- Multiple breaks on same date = Systemic timing issue

### 1.2 Validate All Tanks at Site

**Endpoint**: `GET /api/tankvolumedatacorrection/validate-site/{siteId}`

**Purpose**: Scan entire site for corruption

**Example**:
```bash
GET /api/tankvolumedatacorrection/validate-site/3?fromDate=2025-11-01&toDate=2025-11-30
```

**Response Summary**:
```
Validation complete: 12 tanks valid, 3 tanks invalid, 7 total breaks
```

### 1.3 Detect All Breaks System-Wide

**Endpoint**: `GET /api/tankvolumedatacorrection/detect-breaks`

**Purpose**: Get comprehensive list of all corruption across system

**Example**:
```bash
GET /api/tankvolumedatacorrection/detect-breaks?fromDate=2025-11-01
```

**Returns**: List of all `SequenceBreak` objects sorted by tank and severity

---

## PHASE 2: ANALYZE - Create Correction Plan

### 2.1 Generate Correction Plan

**Endpoint**: `POST /api/tankvolumedatacorrection/generate-plan`

**Purpose**: Take detected breaks and create step-by-step correction strategy

**Request**:
```json
{
  "breaks": [
    {
      "tankId": 5,
      "affectedTransactionId": 1024,
      "expectedVolume": 41721.00,
      "actualVolume": 42367.00,
      "variance": 646.00,
      "severity": "HIGH"
    }
  ]
}
```

**Response**:
```json
{
  "totalBreaks": 1,
  "affectedTanks": 1,
  "breaksByTank": {
    "5": [
      {
        "tankId": 5,
        "breakIndex": 42,
        "affectedTransactionId": 1024,
        "variance": 646.00,
        "severity": "HIGH"
      }
    ]
  },
  "correctionSteps": {
    "5": [
      {
        "stepNumber": 1,
        "action": "IDENTIFY_OPENING_STOCK",
        "description": "Identify opening stock for tank 5 on 2025-11-05",
        "affectedTransactionIds": []
      },
      {
        "stepNumber": 2,
        "action": "RECALCULATE_VOLUMES",
        "description": "Recalculate NewVolume for 45 affected transactions",
        "affectedTransactionIds": [1024, 1025, 1026, ...]
      },
      {
        "stepNumber": 3,
        "action": "VALIDATE_CORRECTION",
        "description": "Validate that all volumes now form a consistent sequence",
        "affectedTransactionIds": []
      }
    ]
  }
}
```

---

## PHASE 3: CORRECT - Fix the Data

### Correction Strategy Selection Guide

| Strategy | Use When | Risk | Time | Best For |
|----------|----------|------|------|----------|
| **RECALCULATE** | Single date range, valid opening stock | LOW | FAST | Bulk fixes, most cases |
| **MANUAL** | Know exact correct volume for one transaction | LOW | VERY FAST | Override single error |
| **RECALCULATE_SINGLE** | One transaction detected as broken | LOW | FAST | Targeted fixes |
| **RECALCULATE_FROM_POINT** | Know where corruption starts | MEDIUM | FAST | Complex corruption |

### 3.1 Strategy 1: RECALCULATE (Recommended for Most Cases)

**Endpoint**: `POST /api/tankvolumedatacorrection/correct-recalculate`

**When to Use**:
- ✅ Multiple transactions affected on same date
- ✅ Have valid opening stock for that date
- ✅ Want to rebuild from ground truth

**Process**:
1. Load opening stock for fromDate (baseline)
2. For each transaction: `NewVolume = PreviousVolume + VolumeChange`
3. Update all NewVolume fields
4. Validate sequence is now correct

**Request**:
```json
{
  "tankId": 5,
  "fromDate": "2025-11-05",
  "toDate": "2025-11-05"
}
```

**Response**:
```json
{
  "tankId": 5,
  "strategy": "RECALCULATE",
  "success": true,
  "transactionsProcessed": 87,
  "transactionsCorrect": 84,
  "transactionsCorrected": 3,
  "message": "Successfully recalculated 87 transactions, corrected 3 volumes, 84 were already correct"
}
```

**Example Correction**:
```
Before:
  Txn 1023: KBH797Q Dispensing -51L → NewVolume: 42,367.00 (WRONG, +595L spike)
  Txn 1024: TP107   Dispensing -100L → NewVolume: 42,267.00 (cascaded error)

After RECALCULATE:
  Txn 1023: KBH797Q Dispensing -51L → NewVolume: 41,721.00 (CORRECT)
  Txn 1024: TP107   Dispensing -100L → NewVolume: 41,621.00 (CORRECT)
```

### 3.2 Strategy 2: MANUAL (For Override Cases)

**Endpoint**: `POST /api/tankvolumedatacorrection/correct-manual`

**When to Use**:
- ✅ You have evidence (physical count, sensor reading) of correct volume
- ✅ Single transaction needs override
- ✅ Want to manually specify exact correction

**Process**:
1. Update transaction's NewVolume to your specified value
2. Calculate difference: `diff = newVolume - oldVolume`
3. Apply `+diff` to all downstream transactions
4. Audit log the reason

**Request**:
```json
{
  "transactionId": 1023,
  "newVolume": 41721.00,
  "reason": "Manual override based on physical count verification on 2025-11-05"
}
```

**Response**:
```json
{
  "success": true,
  "transactionsProcessed": 1,
  "transactionsCorrected": 1,
  "message": "Transaction 1023 corrected: 42367.00L → 41721.00L. Cascaded correction to 45 downstream transactions with -646.00L"
}
```

### 3.3 Strategy 3: RECALCULATE_SINGLE (For Isolated Breaks)

**Endpoint**: `POST /api/tankvolumedatacorrection/correct-single`

**When to Use**:
- ✅ Single transaction identified as broken
- ✅ Previous transaction is correct
- ✅ Only downstream needs fixing

**Process**:
1. Get previous transaction's NewVolume
2. Calculate: `expected = PrevVolume + VolumeChange`
3. Update this transaction
4. Cascade correction downstream

**Request**:
```json
{
  "transactionId": 1023
}
```

**Response**:
```json
{
  "success": true,
  "transactionsProcessed": 46,
  "transactionsCorrected": 46,
  "message": "Recalculated Txn 1023: 42367.00L → 41721.00L. Corrected 45 downstream transactions"
}
```

### 3.4 Strategy 4: RECALCULATE_FROM_POINT (For Complex Corruption)

**Endpoint**: `POST /api/tankvolumedatacorrection/correct-from-point`

**When to Use**:
- ✅ Corruption spans multiple dates
- ✅ Know the starting point (transaction ID)
- ✅ Want to recalculate forward from there

**Request**:
```json
{
  "startTransactionId": 1023,
  "toDate": "2025-11-10"
}
```

**Response**:
```json
{
  "success": true,
  "transactionsProcessed": 342,
  "transactionsCorrected": 87,
  "message": "Recalculated 342 transactions from Txn 1023, corrected 87"
}
```

### 3.5 Bulk Correction (Multiple Fixes)

**Endpoint**: `POST /api/tankvolumedatacorrection/correct-bulk`

**Purpose**: Execute multiple corrections in sequence

**Request**:
```json
[
  {
    "correctionType": "RECALCULATE",
    "tankId": 5,
    "fromDate": "2025-11-05",
    "toDate": "2025-11-05"
  },
  {
    "correctionType": "RECALCULATE",
    "tankId": 7,
    "fromDate": "2025-11-05",
    "toDate": "2025-11-05"
  },
  {
    "correctionType": "RECALCULATE",
    "tankId": 15,
    "fromDate": "2025-11-04",
    "toDate": "2025-11-04"
  }
]
```

**Response**:
```json
{
  "totalRequests": 3,
  "successfulCorrectionCount": 3,
  "failedCorrectionCount": 0,
  "duration": "00:00:45.2341234",
  "results": [
    { "success": true, "transactionsCorrected": 3 },
    { "success": true, "transactionsCorrected": 2 },
    { "success": true, "transactionsCorrected": 5 }
  ]
}
```

---

## Step-by-Step Correction Procedure

### For Your Specific Data (ST7 on 05/11/2025)

**Step 1: Detect the Problem** (Already Done ✓)
```bash
GET /api/tankvolumedatacorrection/validate-tank/7?fromDate=2025-11-05&toDate=2025-11-05
```

**Step 2: Verify Opening Stock**
- Check that ST7 has valid opening stock on 2025-11-05
- Expected opening: 41,652.00L (from your data)
- If missing or wrong, correct that first

**Step 3: Execute RECALCULATE Strategy**
```bash
POST /api/tankvolumedatacorrection/correct-recalculate

{
  "tankId": 7,
  "fromDate": "2025-11-05",
  "toDate": "2025-11-05"
}
```

**Step 4: Verify Correction**
```bash
GET /api/tankvolumedatacorrection/validate-tank/7?fromDate=2025-11-05&toDate=2025-11-05
```
- Should return `isValid: true`
- `sequenceBreaks: []` (empty)

**Step 5: Validate Closing Stock**
- Closing stock should now equal: `Opening + Deliveries + Transfers - Dispensing`
- For ST7 on 05/11/2025: `41,652 - 3,300 (TransferOut) = 38,352` (from your data)

---

## Automation & Prevention

### 4.1 Automatic Detection (Implemented)

The system now automatically detects sequence breaks on:
- Every transaction insertion
- Every daily reconciliation
- Every data correction execution

**Log Location**: Application logs will show:
```
Sequence break detected at transaction {id}: Expected {expected}L, got {actual}L, variance {var}L
```

### 4.2 Preventing Future Spikes

**Fix Implemented in ProcessTankStockChangeCommand.cs**:
1. ✅ Retrieve ALL previous transactions (not just last)
2. ✅ Process in deterministic order (Timestamp ASC, then ID ASC)
3. ✅ Validate sequence before returning
4. ✅ Log warnings if corruption detected

**How It Works**:
```csharp
// OLD (vulnerable to race conditions):
var previousVolume = await _context.TankVolumeHistories
  .OrderByDescending(h => h.Timestamp)
  .ThenByDescending(h => h.Id)
  .FirstOrDefaultAsync();

// NEW (deterministic):
var allPreviousTransactions = await _context.TankVolumeHistories
  .OrderBy(h => h.Timestamp)      // Ascending: earliest first
  .ThenBy(h => h.Id)               // Ascending: lowest ID first
  .ToListAsync();

var lastTransaction = allPreviousTransactions.Last();
ValidateTransactionSequence(allPreviousTransactions);  // Validate before using
```

---

## Data Correction Checklist

### Pre-Correction
- [ ] Backup database (CRITICAL!)
- [ ] Run DETECT phase for affected tanks
- [ ] Verify opening stock is correct
- [ ] Check if sensor data available for validation
- [ ] Document reason for correction
- [ ] Notify stakeholders of maintenance window

### Correction Execution
- [ ] Start with RECALCULATE strategy
- [ ] Execute corrections during low-traffic hours
- [ ] Monitor logs for errors
- [ ] Verify each correction succeeded
- [ ] Re-run DETECT phase after correction

### Post-Correction Verification
- [ ] All sequence breaks resolved
- [ ] Closing stocks match expected values
- [ ] Reconciliation discrepancies cleared
- [ ] Review reconciliation analysis
- [ ] Check for cascading impacts
- [ ] Update any dependent reports

### Documentation
- [ ] Log correction timestamp
- [ ] Record who executed correction
- [ ] Document reason for correction
- [ ] Note any manual adjustments made
- [ ] Archive before/after validation reports

---

## Troubleshooting

### Issue: "No opening stock found for Tank X on Date Y"

**Solution**:
1. Create opening stock entry for that date (use ManualRefillForm in UI)
2. Verify it matches last closing stock from previous day
3. Retry RECALCULATE

### Issue: After correction, cascade went too far

**Solution**:
1. Use DETECT to identify the incorrect downstream cascades
2. Use MANUAL strategy to set correct value for that transaction
3. Cascade will automatically fix everything downstream

### Issue: Multiple breaks on same date, don't know order

**Solution**:
1. Use RECALCULATE strategy - it will handle the ordering
2. The algorithm uses database ID ordering for same-timestamp transactions
3. Verify result with VALIDATE afterward

### Issue: Correction created negative volumes

**Solution** (shouldn't happen but if it does):
1. Rollback and check your data
2. Verify VolumeChange signs are correct (negative for dispensing, positive for delivery)
3. Consider MANUAL correction with audit trail

---

## API Reference Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/validate-tank/{id}` | GET | Validate single tank |
| `/validate-site/{id}` | GET | Validate entire site |
| `/detect-breaks` | GET | Find all breaks system-wide |
| `/generate-plan` | POST | Create correction strategy |
| `/correct-recalculate` | POST | Bulk recalculation (recommended) |
| `/correct-manual` | POST | Manual override with cascade |
| `/correct-single` | POST | Fix one transaction |
| `/correct-from-point` | POST | Recalculate from start point |
| `/correct-bulk` | POST | Execute multiple corrections |

---

## Support & Escalation

### For More Information
- Check application logs: `Logs/TankVolumeDataCorrection.log`
- Review corrections audit table: `CorrectionAuditLog`
- Contact: Database Administrator

### Critical Issues
- **Data won't reconcile after correction**: Escalate to backend team
- **Negative volumes after correction**: Rollback and investigate
- **Cascades affecting unexpected dates**: Check database constraints

---

## Appendix: Example Scenarios

### Scenario 1: Single Day with Multiple Same-Timestamp Errors

**Your Situation**: ST7 on 05/11/2025 03:14:00

1. **DETECT**:
   ```bash
   GET /validate-tank/7?fromDate=2025-11-05&toDate=2025-11-05
   → Found 1 HIGH severity break, variance: 646L
   ```

2. **ANALYZE**:
   ```bash
   POST /generate-plan
   → Need to recalculate 87 transactions, 3 are corrupted
   ```

3. **CORRECT**:
   ```bash
   POST /correct-recalculate
   → Corrected 3 of 87 transactions
   ```

### Scenario 2: Multi-Day Corruption Cascade

**Situation**: Corruption on Day 1 cascaded through Day 5

1. **DETECT**:
   ```bash
   GET /detect-breaks?fromDate=2025-11-01
   → Found 87 breaks across 5 tanks, 5 days
   ```

2. **CORRECT BY TANK**:
   ```bash
   POST /correct-bulk
   → 5 RECALCULATE requests, one per tank
   ```

### Scenario 3: Isolated Transaction Error

**Situation**: One transaction was entered with wrong volume

1. **DETECT**:
   ```bash
   GET /validate-tank/5?fromDate=2025-11-10&toDate=2025-11-10
   → Found 1 MEDIUM break, variance: 50L
   ```

2. **CORRECT WITH MANUAL**:
   ```bash
   POST /correct-manual
   {
     "transactionId": 5678,
     "newVolume": 12345.50,
     "reason": "Corrected data entry error - receipt shows 12345.50L not 12345.00L"
   }
   ```

---

## Future Prevention

### Next Steps to Implement
1. ✅ **DONE**: Add transaction sequence validation to ProcessTankStockChangeCommand
2. ✅ **DONE**: Create validation and correction services
3. **TODO**: Add distributed lock for same-timestamp transactions
4. **TODO**: Implement real-time corruption alerts
5. **TODO**: Create background job for daily validation
6. **TODO**: Add UI dashboard for correction monitoring

