# Tank Stock Bulk Import - Implementation Plan

## 📋 Overview

This document outlines the phased implementation plan for the Tank Stock Bulk Import feature. The feature allows users to import historical tank stock data from Excel files, with comprehensive backend validation using advanced anomaly detection.

**Key Design Principles:**
- ✅ Leverage existing reconciliation infrastructure (`DiscrepancyDetectionService`, `ReconciliationDiscrepancy`, etc.)
- ✅ All anomaly detection happens in the **backend** (not frontend)
- ✅ Frontend only displays validation results and collects user decisions
- ✅ Use Excel Option B structure (separate Transfer IN and Transfer OUT columns)
- ✅ No duplicates - user chooses to Skip or Replace
- ✅ Tank identifier = `Tank.Name` (case-insensitive)

---

## 🎯 Feature Scope

### What This Feature Does:
1. Import historical tank stock data from Excel files
2. Validate data integrity using 11 advanced anomaly detection algorithms
3. Detect cumulative variances over periods (e.g., 10-day analysis)
4. Validate meter readings against dispensing volumes
5. Populate `Tankstock` table entries for record-keeping
6. Store detected anomalies in `ReconciliationDiscrepancy` table
7. Provide detailed validation reports for user review

### What This Feature Does NOT Do (Initially):
- ❌ Process `TankVolumeHistory` records (Phase 2 feature)
- ❌ Update `Tank.CurrentStock` in real-time
- ❌ Trigger automatic reconciliation actions
- ❌ Send notifications during import (optional in Phase 3)

---

## 📊 Excel Template Structure

### Recommended Format: Option B

```
┌────────┬────────────┬─────────┬────────────┬─────────────┬──────────────┬──────────┬─────────┬───────────────┬───────────────┬───────┐
│ Tank   │ Date       │ Opening │ Dispensing │ Transfer IN │ Transfer OUT │ Delivery │ Closing │ Opening Meter │ Closing Meter │ Notes │
├────────┼────────────┼─────────┼────────────┼─────────────┼──────────────┼──────────┼─────────┼───────────────┼───────────────┼───────┤
│ FT02   │ 01/09/2025 │ 25400   │ 1726       │             │              │          │ 23674   │ 2718366       │ 2723592       │       │
│ FT02   │ 02/09/2025 │ 23674   │ 620        │             │              │          │ 23054   │ 2723592       │ 2724212       │       │
│ ST02   │ 01/09/2025 │ 15000   │ 800        │             │              │          │ 14200   │ 1234567       │ 1234890       │       │
│ FT02   │ 06/09/2025 │ 1268    │ 168        │ 2000        │              │ 7000     │ 8100    │ 503531        │ 503694        │       │
│ ST02   │ 06/09/2025 │ 10000   │ 500        │             │ 2000         │          │ 7500    │ 1000000       │ 1000500       │       │
└────────┴────────────┴─────────┴────────────┴─────────────┴──────────────┴──────────┴─────────┴───────────────┴───────────────┴───────┘
```

### Column Definitions:

| Column | Type | Required | Description | Validation |
|--------|------|----------|-------------|------------|
| **Tank** | Text | ✅ Yes | Tank name matching `Tank.Name` | Case-insensitive, must exist in DB |
| **Date** | Date | ✅ Yes | Transaction date | DD/MM/YYYY or MM/DD/YYYY |
| **Opening** | Decimal | ✅ Yes | Opening stock (liters) | > 0, <= Tank capacity |
| **Dispensing** | Decimal | ❌ Optional | Dispensed volume (liters) | >= 0 or blank |
| **Transfer IN** | Decimal | ❌ Optional | Volume transferred IN (liters) | >= 0 or blank |
| **Transfer OUT** | Decimal | ❌ Optional | Volume transferred OUT (liters) | >= 0 or blank |
| **Delivery** | Decimal | ❌ Optional | Delivery volume (liters) | >= 0 or blank |
| **Closing** | Decimal | ✅ Yes | Closing stock (liters) | > 0, <= Tank capacity |
| **Opening Meter** | Decimal | ❌ Optional | Meter reading at opening | Whole number |
| **Closing Meter** | Decimal | ❌ Optional | Meter reading at closing | >= Opening Meter (unless reset) |
| **Notes** | Text | ❌ Optional | Additional comments | Max 500 characters |

### Data Conventions:

**Transfer Direction:**
- `Transfer IN`: Positive number = volume received from another tank
- `Transfer OUT`: Positive number = volume sent to another tank
- Blank or 0 = no transfer

**Example:**
```
ST02 transfers 2000L to FT02:

ST02 row: Transfer IN = blank,  Transfer OUT = 2000
FT02 row: Transfer IN = 2000,   Transfer OUT = blank
```

---

## 🏗️ Architecture Overview

### Backend Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    Bulk Import Flow                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  TankStockController.cs                                         │
│  POST /api/v1/tankstock/bulk-import                            │
│  • Receives Excel file or parsed JSON                           │
│  • Authenticates user                                           │
│  • Delegates to MediatR command                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  BulkImportTankStockCommand.cs                                 │
│  • Orchestrates validation and import process                   │
│  • Calls validation service                                     │
│  • Returns detailed results                                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  BulkImportValidationService.cs  ⭐ CORE VALIDATOR              │
│  • Runs all 11 anomaly detection checks                        │
│  • Integrates with DiscrepancyDetectionService                 │
│  • Generates comprehensive validation report                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Advanced Anomaly Detectors (11 types)                         │
│  1. Daily Balance                  7. Zero/Negative Stock       │
│  2. Continuity Break               8. Transfer Reciprocity      │
│  3. Cumulative Drift ⭐            9. Zero Movement             │
│  4. Meter Rollback ⭐              10. Implausible Dispensing   │
│  5. Meter Mismatch ⭐              11. Delivery Without Space   │
│  6. Capacity Overflow                                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Database Operations                                            │
│  • Insert into Tankstock table                                  │
│  • Create ReconciliationDiscrepancy records for anomalies      │
│  • Create Dailytankreconciliation summaries                    │
│  • Populate Discrepancy and ExpectedClosingLevel fields        │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend Components

```
┌─────────────────────────────────────────────────────────────────┐
│  Stock Management → Bulk Import Tab                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  BulkImportManager.js (React Component)                        │
│  • Excel file upload                                            │
│  • Client-side parsing (xlsx library)                          │
│  • Data preview grid                                            │
│  • Validation report display                                    │
│  • User decision interface                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Advanced Anomaly Detection (11 Types)

All anomaly detection happens in the **backend**. Frontend only displays results.

### 1. Daily Balance Anomaly

**What:** Daily closing doesn't match the balance equation.

**Formula:**
```
Expected Closing = Opening + Delivery + Transfer IN - Dispensing - Transfer OUT
Variance = Actual Closing - Expected Closing
```

**Threshold:**
- Liters: 50L
- Percent: 2%

**Example:**
```
Opening:     1,268 L
Delivery:   +7,000 L
Transfer IN: +2,000 L
Dispensing:   -168 L
Expected:   10,100 L
Actual:      8,100 L  ❌ Variance: -2,000L (19.8%)
```

**Severity:**
- Low: 50-200L or 2-5%
- Medium: 200-1000L or 5-10%
- High: >1000L or >10%

---

### 2. Continuity Break Anomaly

**What:** Today's opening doesn't match yesterday's closing.

**Formula:**
```
Variance = Current Day Opening - Previous Day Closing
```

**Threshold:**
- Liters: 100L
- Percent: 5%

**Example:**
```
Day 1 Closing:  21,164 L
Day 2 Opening:   2,416 L  ❌ Break: -18,748L (88.6%)
```

**Common Causes:**
- Tank replacement/swap
- Large unreported transfer
- Data entry error
- Manual stock adjustment not recorded

---

### 3. Cumulative Drift Anomaly ⭐

**What:** Over a period (e.g., 10 days), the total doesn't add up.

**Formula:**
```
Expected Final = Initial Opening + ΣDeliveries + ΣTransfer IN
                 - ΣDispensing - ΣTransfer OUT

Cumulative Variance = Actual Final Closing - Expected Final
```

**Threshold:**
- Liters: 100L
- Percent: 2%

**Example:**
```
Period: 10 days
Initial:          0 L
Total Deliveries: 10,000 L
Total Dispensing: 7,000 L
Expected Final:   3,000 L
Actual Final:     2,500 L  ❌ Shortage: -500L (16.7%)
```

**Additional Analysis:**
- Identify which day(s) contributed most to variance
- Calculate running cumulative variance
- Detect patterns (systematic vs. random)

---

### 4. Meter Rollback Anomaly ⭐

**What:** Meter reading decreased (possible reset/replacement).

**Detection:**
```
if (Closing Meter < Opening Meter)
    → Meter Rollback Detected
```

**Classification:**
- **Counter Rollover**: Decrease > 1,000,000 (normal for odometer-style counters)
- **Meter Replacement**: Moderate decrease (500K - 1M)
- **Error**: Small decrease (<500K) - likely data entry error

**Example:**
```
Opening Meter: 2,731,002
Closing Meter:   503,531  ⚠️ Decrease: -2,227,471 (Counter Rollover)
```

**Action:** Flag as warning, cannot validate meter vs dispensing

---

### 5. Meter Mismatch Anomaly ⭐

**What:** Meter change doesn't match recorded dispensing volume.

**Formula:**
```
Meter Dispensing = Closing Meter - Opening Meter
Variance = |Meter Dispensing - Recorded Dispensing|
Tolerance = Recorded Dispensing × 5%
```

**Threshold:**
- Percent: 5%
- Minimum: 20L (ignore small variances)

**Example:**
```
Opening Meter:    503,531
Closing Meter:    503,694
Meter Dispensing: 163 L
Recorded:         168 L
Variance:         -5 L (2.98%)  ✓ Within tolerance

Another case:
Meter Dispensing: 200 L
Recorded:         168 L
Variance:         32 L (19%)  ❌ Exceeds 5% threshold
```

**Common Causes:**
- Manual dispensing not recorded in meter
- Meter calibration drift
- Multiple dispensing points (only one metered)
- Data entry error

---

### 6. Capacity Overflow Anomaly

**What:** Stock exceeds tank physical capacity.

**Detection:**
```
if (Opening > Tank.TankVolume || Closing > Tank.TankVolume)
    → Capacity Overflow
```

**Example:**
```
Tank Capacity: 10,000 L
Closing Stock: 11,500 L  ❌ Overflow by 1,500L
```

**Severity:** Critical (blocks import)

---

### 7. Zero/Negative Stock Anomaly

**What:** Stock went negative or unexpectedly zero.

**Detection:**
```
if (Closing < 0)
    → Critical Error (negative stock impossible)

if (Closing == 0 && Dispensing > 0)
    → Warning (complete depletion)
```

**Example:**
```
Opening:    100 L
Dispensing: 500 L
Closing:   -400 L  ❌ Negative stock (impossible)
```

**Severity:**
- Negative: Critical (blocks import)
- Zero with activity: Low warning

---

### 8. Transfer Reciprocity Anomaly

**What:** On same day, Transfer OUT from Tank A ≠ Transfer IN to Tank B.

**Detection:**
```
For each date:
    Total Transfer OUT (all tanks) ≟ Total Transfer IN (all tanks)
```

**Threshold:** 10L tolerance (for rounding)

**Example:**
```
06/09/2025:
ST02 Transfer OUT: 2,000 L
FT02 Transfer IN:  1,500 L  ❌ Imbalance: -500L
```

**Common Causes:**
- Missing transfer entry
- Wrong date on one side
- Volume measurement difference
- Evaporation/spillage during transfer

---

### 9. Zero Movement Anomaly

**What:** No transactions recorded but stock changed.

**Detection:**
```
if (Delivery == 0 && Dispensing == 0 && Transfer IN == 0 && Transfer OUT == 0
    && Opening != Closing)
    → Zero Movement with Stock Change
```

**Example:**
```
Opening:     5,000 L
Delivery:    0 L
Dispensing:  0 L
Transfers:   0 L
Closing:     4,500 L  ⚠️ Lost 500L with no activity
```

**Possible Causes:**
- Evaporation
- Leak
- Theft
- Unreported dispensing
- Measurement error

---

### 10. Implausible Dispensing Anomaly

**What:** Dispensing volume exceeds tank capacity in one day.

**Detection:**
```
if (Dispensing > Tank.TankVolume)
    → Implausible Dispensing
```

**Example:**
```
Tank Capacity: 10,000 L
Dispensing:    15,000 L  ❌ More than tank can hold
```

**Severity:** High (likely data entry error)

---

### 11. Delivery Without Space Anomaly

**What:** Delivery volume exceeds available tank space.

**Formula:**
```
Available Space = Tank Capacity - Opening Stock
```

**Detection:**
```
if (Delivery > Available Space)
    → Delivery Exceeds Space
```

**Example:**
```
Tank Capacity:   10,000 L
Opening Stock:    7,000 L
Available Space:  3,000 L
Delivery:         8,000 L  ❌ Exceeds space by 5,000L
```

**Action:**
- Critical if no overflow protection
- Warning if tank has overflow valve

---

## 📈 Anomaly Severity Classification

| Severity | Description | User Action | Impact |
|----------|-------------|-------------|---------|
| **Info** | FYI only, no concern | None required | No impact |
| **Low** | Minor variance, likely acceptable | Review recommended | Minimal |
| **Medium** | Should review but can proceed | Confirm before import | Moderate |
| **High** | Significant issue, needs attention | Fix recommended | High |
| **Critical** | Must fix before import | Blocks import | Severe |

---

## 🎯 Implementation Phases

### **PHASE 1A: Foundation & Basic Import** (Week 1-2)
**Goal:** Basic bulk import with minimal validation

#### Backend Tasks:
- [ ] Create `BulkImportRowDTO.cs` model
- [ ] Create `BulkImportTankStockCommand.cs` (MediatR)
- [ ] Create `BulkImportTankStockCommandHandler.cs`
- [ ] Add controller endpoint: `POST /api/v1/tankstock/bulk-import`
- [ ] Implement basic field validation (tank exists, dates valid, positive numbers)
- [ ] Insert records into `Tankstock` table
- [ ] Handle duplicate detection (skip or replace logic)
- [ ] Return basic success/failure response

#### Frontend Tasks:
- [ ] Create `BulkImportManager.js` component
- [ ] Add Excel file upload (DevExtreme FileUploader)
- [ ] Implement Excel parsing (using `xlsx` library)
- [ ] Add data preview grid (DevExtreme DataGrid)
- [ ] Display basic validation errors
- [ ] Add tab to `StockManagement.js`
- [ ] Create downloadable Excel template

#### Database:
No schema changes required (using existing `Tankstock` table)

#### Deliverables:
✅ Basic import functionality working
✅ Excel template available
✅ Basic error handling

---

### **PHASE 1B: Advanced Anomaly Detection** (Week 3-4)
**Goal:** Implement all 11 anomaly detection algorithms in backend

#### Backend Tasks:
- [ ] Create `BulkImportValidationService.cs`
- [ ] Implement **Daily Balance** validator (#1)
- [ ] Implement **Continuity Break** validator (#2)
- [ ] Implement **Cumulative Drift** validator (#3) ⭐
- [ ] Implement **Meter Rollback** validator (#4) ⭐
- [ ] Implement **Meter Mismatch** validator (#5) ⭐
- [ ] Implement **Capacity Overflow** validator (#6)
- [ ] Implement **Zero/Negative Stock** validator (#7)
- [ ] Implement **Transfer Reciprocity** validator (#8)
- [ ] Implement **Zero Movement** validator (#9)
- [ ] Implement **Implausible Dispensing** validator (#10)
- [ ] Implement **Delivery Without Space** validator (#11)
- [ ] Create `ValidationAnomaly.cs` result model
- [ ] Create `BulkImportValidationResult.cs` comprehensive report
- [ ] Add configurable thresholds in `SystemConfiguration` table
- [ ] Populate `Tankstock.ExpectedClosingLevel` field
- [ ] Populate `Tankstock.Discrepancy` field
- [ ] Write unit tests for all validators

#### Frontend Tasks:
- [ ] Create `ValidationReportPanel.js` component
- [ ] Display anomalies grouped by severity
- [ ] Show daily variance breakdown
- [ ] Show cumulative variance chart (DevExtreme Chart)
- [ ] Add per-row decision UI (Skip/Fix/Proceed)
- [ ] Add "Download Validation Report" button
- [ ] Highlight problematic rows in preview grid

#### Models:
```csharp
// New models to create
- BulkImportRowDTO.cs
- BulkImportValidationResult.cs
- ValidationAnomaly.cs
- DailyVarianceContribution.cs
- CumulativeValidationSummary.cs
- MeterValidationResult.cs
```

#### Deliverables:
✅ All 11 anomaly detections working
✅ Comprehensive validation report
✅ Frontend displays all anomalies clearly
✅ User can review and decide per anomaly

---

### **PHASE 1C: Discrepancy Integration** (Week 5)
**Goal:** Store detected anomalies in reconciliation system

#### Backend Tasks:
- [ ] Create `ReconciliationDiscrepancy` records for each significant anomaly
- [ ] Create `Dailytankreconciliation` summary for each tank/date
- [ ] Link anomalies to import batch (add `ImportBatchId` field)
- [ ] Integrate with existing `DiscrepancyDetectionService`
- [ ] Calculate business impact using `InventoryCostingService`
- [ ] Add import audit trail (who, when, what)

#### Database Changes:
```sql
-- Optional: Add to track import batches
ALTER TABLE tankstocks
ADD ImportBatchId INT NULL,
ADD ImportedAt DATETIME NULL,
ADD ImportSource VARCHAR(50) NULL; -- 'BulkImport', 'Manual', 'API'

-- Optional: Link discrepancies to import batches
ALTER TABLE reconciliationdiscrepancies
ADD ImportBatchId INT NULL;
```

#### Deliverables:
✅ Anomalies stored in reconciliation system
✅ Historical tracking of imports
✅ Integration with existing discrepancy workflows

---

### **PHASE 2: TankVolumeHistory Processing** (Week 6-8)
**Goal:** Process imported data into TankVolumeHistory for full reconciliation

**Note:** This is a FUTURE phase. Phase 1 only inserts into `Tankstock` table.

#### Backend Tasks:
- [ ] Create "Process to Volume History" command
- [ ] Call existing commands sequentially:
  - `OpeningStockCommand`
  - `CreateDeliveryCommand`
  - `CreateDispensingVolumeCommand`
  - `CreateTankTransfer`
  - `ClosingStockCommand`
- [ ] Handle `ProcessTankStockChangeCommand` integration
- [ ] Update `Tank.CurrentStock` appropriately
- [ ] Trigger reconciliation analysis
- [ ] Handle rollback on errors

#### Frontend Tasks:
- [ ] Add "Process to Volume History" button
- [ ] Show processing progress
- [ ] Display processing results

#### Deliverables:
✅ Full historical data processing
✅ TankVolumeHistory populated
✅ Tank.CurrentStock updated
✅ Reconciliation triggered

---

### **PHASE 3: Advanced Features** (Future)
**Goal:** Polish and additional capabilities

#### Features:
- [ ] Batch processing (background jobs for large files)
- [ ] Email notifications on import completion
- [ ] Export validation report to PDF
- [ ] Import template generator (pre-filled with tank names)
- [ ] Historical comparison (compare imports across periods)
- [ ] Duplicate import prevention (checksum validation)
- [ ] Undo/Rollback import functionality
- [ ] Import scheduling (recurring imports)
- [ ] Multi-site import support
- [ ] Advanced charts and analytics

---

## 📊 Data Flow Diagram

```
┌─────────────────┐
│ User uploads    │
│ Excel file      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Frontend: Parse Excel → JSON            │
│ • Read rows                             │
│ • Map columns                           │
│ • Basic format validation              │
└────────┬────────────────────────────────┘
         │
         ▼ HTTP POST /api/v1/tankstock/bulk-import
┌─────────────────────────────────────────┐
│ Backend: Receive Import Request        │
│ • Authenticate user                     │
│ • Validate request format               │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Validation Service: Run All Checks     │
│ • Tank lookup (Name → TankId)          │
│ • Daily Balance (#1)                    │
│ • Continuity Break (#2)                 │
│ • Cumulative Drift (#3) ⭐              │
│ • Meter Rollback (#4) ⭐                │
│ • Meter Mismatch (#5) ⭐                │
│ • Capacity Overflow (#6)                │
│ • Zero/Negative Stock (#7)              │
│ • Transfer Reciprocity (#8)             │
│ • Zero Movement (#9)                    │
│ • Implausible Dispensing (#10)          │
│ • Delivery Without Space (#11)          │
│ • Duplicate detection                   │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Generate Validation Report              │
│ • Group anomalies by severity           │
│ • Calculate cumulative stats            │
│ • Identify top contributors             │
│ • Format user-friendly messages         │
└────────┬────────────────────────────────┘
         │
         ▼ Return Report to Frontend
┌─────────────────────────────────────────┐
│ Frontend: Display Validation Report    │
│ • Show errors (must fix)                │
│ • Show warnings (user decides)          │
│ • Show info (FYI)                       │
│ • Per-row actions                       │
└────────┬────────────────────────────────┘
         │
         ▼ User confirms import
┌─────────────────────────────────────────┐
│ Backend: Execute Import                 │
│ • Create Tankstock entries              │
│ • Populate Discrepancy fields           │
│ • Create ReconciliationDiscrepancy      │
│ • Create Dailytankreconciliation        │
│ • Handle Skip/Replace for duplicates    │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Return Import Results                   │
│ • Success count                         │
│ • Skipped count                         │
│ • Failed count                          │
│ • Anomaly summary                       │
└─────────────────────────────────────────┘
```

---

## 🔧 Configuration & Thresholds

### System Configuration (Stored in Database)

```json
{
  "BulkImport": {
    "Validation": {
      "DailyBalance": {
        "enabled": true,
        "thresholdLiters": 50,
        "thresholdPercent": 2,
        "severity": {
          "low": { "liters": 50, "percent": 2 },
          "medium": { "liters": 200, "percent": 5 },
          "high": { "liters": 1000, "percent": 10 }
        }
      },
      "ContinuityBreak": {
        "enabled": true,
        "thresholdLiters": 100,
        "thresholdPercent": 5
      },
      "CumulativeDrift": {
        "enabled": true,
        "thresholdLiters": 100,
        "thresholdPercent": 2
      },
      "MeterValidation": {
        "enabled": true,
        "matchTolerancePercent": 5,
        "minimumVarianceLiters": 20,
        "allowReset": true,
        "rolloverThreshold": 1000000
      },
      "TransferReciprocity": {
        "enabled": true,
        "toleranceLiters": 10
      }
    },
    "Import": {
      "maxRowsPerImport": 1000,
      "allowHistoricalImport": true,
      "maxHistoricalDays": 365,
      "duplicateHandling": "UserChoice", // "Skip", "Replace", "UserChoice"
      "processSynchronously": true
    }
  }
}
```

### Environment-Specific Settings

**Development:**
- Relaxed thresholds for testing
- Detailed logging enabled
- Sample data generation

**Production:**
- Strict thresholds
- Error logging only
- Notification alerts enabled

---

## 🧪 Testing Strategy

### Unit Tests

**Validation Service Tests:**
```csharp
// Test each anomaly detector independently
[Fact]
public void DailyBalance_DetectsVarianceAboveThreshold()
{
    // Arrange
    var row = new BulkImportRowDTO {
        Opening = 1000,
        Delivery = 500,
        Dispensing = 200,
        Closing = 1100 // Expected: 1300
    };

    // Act
    var result = _validator.ValidateDailyBalance(row);

    // Assert
    Assert.True(result.HasAnomaly);
    Assert.Equal(-200, result.Variance);
}

[Fact]
public void MeterMismatch_DetectsDispensingMismatch()
{
    // Arrange
    var row = new BulkImportRowDTO {
        OpeningMeter = 100000,
        ClosingMeter = 100200,
        Dispensing = 150 // Meter shows 200, recorded 150
    };

    // Act
    var result = _validator.ValidateMeterReadings(row);

    // Assert
    Assert.True(result.HasMeterMismatch);
    Assert.Equal(50, result.Variance);
}

[Fact]
public void CumulativeDrift_DetectsMultiDayVariance()
{
    // Arrange
    var rows = new List<BulkImportRowDTO> {
        new() { Date = Day1, Opening = 0, Delivery = 10000, Dispensing = 0, Closing = 10000 },
        // ... 8 more days
        new() { Date = Day10, Opening = 3500, Dispensing = 1000, Closing = 2500 } // Should be 2500
    };

    // Act
    var result = _validator.ValidateCumulativePeriod(rows);

    // Assert
    Assert.True(result.HasSignificantVariance);
    Assert.Equal(-500, result.CumulativeVariance);
}
```

### Integration Tests

**End-to-End Import Tests:**
```csharp
[Fact]
public async Task BulkImport_ValidData_SuccessfullyImports()
{
    // Arrange
    var importData = CreateValidImportData();
    var command = new BulkImportTankStockCommand(importData, userId);

    // Act
    var result = await _mediator.Send(command);

    // Assert
    Assert.True(result.IsSuccess);
    Assert.Equal(10, result.Data.SuccessfulRows);
    Assert.Equal(0, result.Data.FailedRows);

    // Verify database
    var tankstocks = await _context.Tankstocks
        .Where(t => t.RecordedBy == userId)
        .ToListAsync();
    Assert.Equal(50, tankstocks.Count); // 10 rows × 5 entries per row
}
```

### Manual Testing Scenarios

1. **Happy Path:** Import 10 rows of clean data
2. **Meter Reset:** Import with counter rollover
3. **Cumulative Drift:** 10-day period with 500L shortage
4. **Transfer Mismatch:** Transfer OUT ≠ Transfer IN
5. **Duplicate Handling:** Import same data twice
6. **Large File:** 1000+ rows performance test
7. **Mixed Anomalies:** Multiple anomaly types in one import
8. **Historical Import:** Import data from 6 months ago

---

## 📝 API Specification

### Endpoint: Bulk Import

**POST** `/api/v1/tankstock/bulk-import`

**Request:**
```json
{
  "entries": [
    {
      "tankName": "FT02",
      "date": "2025-09-01",
      "opening": 25400,
      "dispensing": 1726,
      "transferIn": null,
      "transferOut": null,
      "delivery": null,
      "closing": 23674,
      "openingMeter": 2718366,
      "closingMeter": 2723592,
      "notes": ""
    }
  ],
  "validateOnly": false,
  "duplicateHandling": "UserChoice" // "Skip" | "Replace" | "UserChoice"
}
```

**Response (Validation Mode):**
```json
{
  "isSuccess": true,
  "message": "Validation completed",
  "data": {
    "totalRows": 10,
    "validRows": 8,
    "rowsWithWarnings": 2,
    "rowsWithErrors": 0,
    "anomalies": [
      {
        "type": "CumulativeDrift",
        "severity": "Medium",
        "tankName": "FT02",
        "startDate": "2025-09-01",
        "endDate": "2025-09-10",
        "message": "Cumulative shortage of 500L detected over 10 days",
        "variance": -500,
        "variancePercent": 16.7,
        "details": {
          "expectedClosing": 3000,
          "actualClosing": 2500,
          "topContributors": [
            { "date": "2025-09-10", "variance": -1000 },
            { "date": "2025-09-05", "variance": -200 }
          ]
        }
      }
    ],
    "duplicates": [],
    "summary": "8 rows ready to import, 2 rows with warnings requiring review"
  }
}
```

**Response (Import Mode):**
```json
{
  "isSuccess": true,
  "message": "Import completed successfully",
  "data": {
    "totalRows": 10,
    "successfulRows": 9,
    "skippedRows": 1,
    "failedRows": 0,
    "entriesCreated": 45,
    "discrepanciesCreated": 3,
    "importBatchId": "IMPORT-2025-11-13-001",
    "details": [
      {
        "rowIndex": 1,
        "tankName": "FT02",
        "date": "2025-09-01",
        "status": "Success",
        "entriesCreated": 3,
        "message": "Opening, Dispensing, and Closing entries created"
      }
    ]
  }
}
```

---

## 🚀 Deployment Checklist

### Before Deployment

- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] Code review completed
- [ ] Documentation updated
- [ ] API documentation generated
- [ ] Excel template finalized
- [ ] Configuration settings documented
- [ ] Database backup created
- [ ] Rollback plan prepared

### Deployment Steps

1. **Backend Deployment:**
   ```powershell
   # Build solution
   dotnet build Tenacy.Fms.sln --configuration Release

   # Run tests
   dotnet test

   # Deploy to server
   # (Your specific deployment process)
   ```

2. **Frontend Deployment:**
   ```bash
   cd fms.frontend
   npm run build:prod
   # Deploy to web server
   ```

3. **Configuration:**
   - Update `appsettings.json` with threshold values
   - Enable bulk import feature flag (if using)

4. **Verification:**
   - Test endpoint accessibility
   - Upload sample file
   - Verify validation works
   - Test actual import

---

## 📚 User Documentation

### For End Users

**Quick Start Guide:**
1. Navigate to Stock Management → Bulk Import tab
2. Download Excel template
3. Fill in data following template structure
4. Upload file
5. Review validation report
6. Make decisions on warnings
7. Confirm import
8. Verify imported data

**Excel Template Instructions:**
- Tank names must match exactly (case-insensitive)
- Dates can be DD/MM/YYYY or MM/DD/YYYY
- Blank cells = 0 or no transaction
- Transfer IN and Transfer OUT are separate columns
- Meter readings are optional but recommended
- Notes column for additional context

**Common Validation Messages:**

| Message | Meaning | Action |
|---------|---------|--------|
| "Cumulative shortage detected" | More dispensing than deliveries over period | Verify dispensing volumes |
| "Meter reading decreased" | Possible counter reset | Confirm if meter was replaced |
| "Transfer imbalance" | Transfer OUT ≠ Transfer IN | Check if both tanks have entries |
| "Capacity overflow" | Stock exceeds tank size | Verify closing stock value |

---

## 🔐 Security Considerations

### Authentication & Authorization
- Requires `_Create_tankStock` permission
- User ID tracked for audit trail
- Import batch linked to user

### Data Validation
- Input sanitization
- SQL injection prevention (parameterized queries)
- File size limits (max 10MB)
- Row limits (max 1000 rows per import)

### Audit Trail
- All imports logged
- User actions tracked
- Changes stored in `Tankstock.Comment`
- Anomalies stored in `ReconciliationDiscrepancy`

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue:** "Tank not found"
- **Cause:** Tank name doesn't match database
- **Solution:** Check exact tank name spelling, verify tank exists

**Issue:** "Duplicate entry detected"
- **Cause:** Data already exists for tank/date
- **Solution:** Choose Skip or Replace option

**Issue:** "Cumulative variance too high"
- **Cause:** Missing transactions or data entry errors
- **Solution:** Review each day's transactions, verify meter readings

### Performance Guidelines

**Optimal File Size:** 100-500 rows
**Maximum File Size:** 1000 rows
**Processing Time:** ~10-30 seconds for 500 rows

For larger imports, consider:
- Breaking into smaller batches
- Using async processing (Phase 3 feature)
- Importing during off-peak hours

---

## 📅 Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1A** | Week 1-2 | Basic import, Excel template, duplicate handling |
| **Phase 1B** | Week 3-4 | All 11 anomaly detections, validation report |
| **Phase 1C** | Week 5 | Discrepancy integration, audit trail |
| **Phase 2** | Week 6-8 | TankVolumeHistory processing (future) |
| **Phase 3** | TBD | Advanced features (future) |

**Total Duration (Phase 1 Complete):** 5 weeks

---

## ✅ Success Criteria

**Phase 1A:**
- [ ] User can upload Excel file
- [ ] Basic validation works
- [ ] Data imports into Tankstock table
- [ ] Duplicates handled correctly

**Phase 1B:**
- [ ] All 11 anomaly types detected
- [ ] Validation report shows all issues
- [ ] User can review and decide
- [ ] Meter readings validated
- [ ] Cumulative variance calculated

**Phase 1C:**
- [ ] Anomalies stored in ReconciliationDiscrepancy
- [ ] Daily summaries in Dailytankreconciliation
- [ ] Audit trail complete
- [ ] Integration with existing reconciliation system

---

## 🎓 Training Materials Needed

1. **Video Tutorial:** "How to Use Bulk Import"
2. **Excel Template Guide:** Column-by-column explanation
3. **Validation Report Guide:** Understanding anomalies
4. **Best Practices:** Data preparation tips
5. **FAQ Document:** Common questions and answers

---

## 📊 Metrics & KPIs

**Track:**
- Import success rate
- Average rows per import
- Most common anomaly types
- Time to complete import
- User satisfaction score

**Dashboard:**
- Total imports (daily/weekly/monthly)
- Anomaly detection rate
- Data quality score
- Processing time trends

---

## 🔄 Future Enhancements (Post-Phase 3)

1. **AI-Powered Anomaly Detection:**
   - Machine learning to detect patterns
   - Predict likely anomalies
   - Smart recommendations

2. **Mobile App Support:**
   - Field data collection
   - Photo attachment (meter readings)
   - Offline mode

3. **Advanced Reporting:**
   - Trend analysis across imports
   - Comparative analytics
   - Predictive shortage alerts

4. **Integration:**
   - Export to accounting systems
   - Sync with inventory management
   - API for third-party tools

---

## 📖 References

- **Related Documentation:**
  - `TANKSTOCK_METER_READING_IMPLEMENTATION.md`
  - `Stock-Reconciliation-Architecture.md`
  - `STOCK_MANAGEMENT_FEATURE_SUMMARY.md`

- **Related Code:**
  - `ClosingStockCommand.cs`
  - `OpeningStockCommand.cs`
  - `DiscrepancyDetectionService.cs`
  - `ProcessTankStockChangeCommand.cs`

- **Database Tables:**
  - `tankstocks`
  - `reconciliationdiscrepancies`
  - `dailytankreconciliations`
  - `tanks`

---

## 👥 Team Responsibilities

| Role | Responsibilities |
|------|------------------|
| **Backend Developer** | Validation service, anomaly detection, API endpoints |
| **Frontend Developer** | Upload UI, validation report display, user interaction |
| **QA Engineer** | Test all 11 anomaly types, edge cases, performance |
| **Product Owner** | Review validation rules, approve thresholds |
| **DevOps** | Deployment, monitoring, performance tuning |

---

**Document Version:** 1.0
**Last Updated:** November 13, 2025
**Author:** Development Team
**Status:** Planning Phase
