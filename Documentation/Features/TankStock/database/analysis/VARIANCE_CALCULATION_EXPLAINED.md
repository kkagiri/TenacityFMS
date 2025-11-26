# Tank Stock Variance Detection Calculation

## Overview
This document explains how variance detection is calculated in the FMS Tank Stock system, including the formulas for expected stock, actual stock, and variance analysis.

---

## Core Calculation Formula

### 1. Expected Closing Stock Calculation

**Formula:**
```
Expected Closing = Opening Stock + Net Change

Where:
Net Change = (Inflow) - (Outflow)
Inflow = Delivery + Transfer In
Outflow = Dispensing + Transfer Out
```

**Detailed Example:**
```
Opening Stock:    1000 L
Delivery:         +500 L  (fuel delivered to tank)
Transfer In:      +200 L  (fuel transferred from another tank)
Dispensing:       -300 L  (fuel sold/dispensed)
Transfer Out:     -100 L  (fuel transferred to another tank)

Calculation:
Inflow = 500 + 200 = 700 L
Outflow = 300 + 100 = 400 L
Net Change = 700 - 400 = 300 L

Expected Closing = 1000 + 300 = 1300 L
```

### 2. Actual Stock
**Source:** Physical measurement from:
1. **Manual Reading** (preferred) - Physical dip stick or manual measurement
2. **Sensor Reading** (fallback) - Automatic tank level sensor

**Priority Logic:**
```csharp
actualStock = ManualClosingLevel ?? SensorClosingLevel ?? 0
```

### 3. Daily Variance Calculation

**Formula:**
```
Daily Variance = Actual Closing Stock - Expected Closing Stock
```

**Interpretation:**
- **Positive Variance (+)**: More stock than expected (possible gains, measurement errors, or unrecorded inflows)
- **Negative Variance (-)**: Less stock than expected (possible losses, theft, evaporation, leaks, or measurement errors)
- **Zero Variance (0)**: Stock matches expectation perfectly

**Example:**
```
Expected Closing:  1300 L
Actual Closing:    1280 L

Daily Variance = 1280 - 1300 = -20 L
Interpretation: 20 liters less than expected (potential loss)
```

### 4. Cumulative Variance

**Formula:**
```
Cumulative Variance = Sum of all Daily Variances from start date to current date
```

**Example over 3 days:**
```
Day 1: Daily Variance = -20 L  →  Cumulative = -20 L
Day 2: Daily Variance = +15 L  →  Cumulative = -20 + 15 = -5 L
Day 3: Daily Variance = -10 L  →  Cumulative = -5 + (-10) = -15 L
```

### 5. Variance Percentage

**Formula:**
```
Variance % = (Daily Variance / Expected Closing Stock) × 100
```

**Example:**
```
Daily Variance:    -20 L
Expected Closing:  1300 L

Variance % = (-20 / 1300) × 100 = -1.54%
```

---

## Data Source Structure

### Tankstock Table Records

Each day has multiple entries by `EntryType`:

```sql
EntryType Options:
1. OpeningStock    - Start of day reading
2. ClosingStock    - End of day reading
3. Delivery        - Fuel delivery transaction
4. Dispensing      - Fuel sales/dispensing
5. TransferIn      - Fuel transferred into tank
6. TransferOut     - Fuel transferred out of tank
```

### Daily Data Example

```json
{
    "date": "2025-10-01T00:00:00",
    "dateString": "Oct 01",
    "expectedStock": 1300.00,        // Calculated: Opening + Net Change
    "actualStock": 1280.00,           // Physical measurement
    "dailyVariance": -20.00,          // Actual - Expected
    "cumulativeVariance": -20.00,     // Running sum
    "variancePercent": -1.54,         // (Variance/Expected) × 100
    "delivery": 500.00,               // Sum of Delivery entries
    "dispensing": 300.00,             // Sum of Dispensing entries
    "transferIn": 200.00,             // Sum of TransferIn entries
    "transferOut": 100.00,            // Sum of TransferOut entries
    "expectedDispensing": 300.00      // Currently same as actual dispensing
}
```

---

## Backend Implementation Details

### Handler Location
`FMS.Application/Features/TankManagement/Queries/GetTankVarianceAnalysisQueryHandler.cs`

### Key Logic Steps

#### 1. Data Retrieval
```csharp
// Get all tankstock records for date range
var tankStockData = await _context.Tankstocks
    .Where(ts => ts.TankId == request.TankId
        && ts.EntryDate >= request.StartDate
        && ts.EntryDate <= request.EndDate)
    .OrderBy(ts => ts.EntryDate)
    .ToListAsync();
```

#### 2. Daily Grouping
```csharp
// Group by date
var dailyGroups = tankStockData
    .GroupBy(ts => ts.EntryDate.Date)
    .OrderBy(g => g.Key)
    .ToList();
```

#### 3. Opening/Closing Stock Extraction
```csharp
var openingEntry = dailyGroup.FirstOrDefault(
    ts => ts.EntryType == VolumeChangeReasonEnum.OpeningStock);

var closingEntry = dailyGroup.FirstOrDefault(
    ts => ts.EntryType == VolumeChangeReasonEnum.ClosingStock);

// Prefer manual over sensor
decimal openingStock = openingEntry.ManualOpeningLevel
    ?? openingEntry.SensorOpeningLevel ?? 0;

decimal actualClosing = closingEntry.ManualClosingLevel
    ?? closingEntry.SensorClosingLevel ?? 0;

decimal expectedClosing = closingEntry.ExpectedClosingLevel
    ?? actualClosing;
```

#### 4. Transaction Volume Calculation
```csharp
// Delivery volume (positive inflow)
var deliveryVolume = dailyGroup
    .Where(ts => ts.EntryType == VolumeChangeReasonEnum.Delivery)
    .Sum(ts => (ts.ManualClosingLevel ?? ts.SensorClosingLevel ?? 0)
             - (ts.ManualOpeningLevel ?? ts.SensorOpeningLevel ?? 0));

// Dispensing volume (positive outflow)
var dispensingVolume = dailyGroup
    .Where(ts => ts.EntryType == VolumeChangeReasonEnum.Dispensing)
    .Sum(ts => Math.Abs((ts.ManualClosingLevel ?? ts.SensorClosingLevel ?? 0)
                      - (ts.ManualOpeningLevel ?? ts.SensorOpeningLevel ?? 0)));

// Transfer In (positive inflow)
var transferInVolume = dailyGroup
    .Where(ts => ts.EntryType == VolumeChangeReasonEnum.TransferIn)
    .Sum(ts => (ts.ManualClosingLevel ?? ts.SensorClosingLevel ?? 0)
             - (ts.ManualOpeningLevel ?? ts.SensorOpeningLevel ?? 0));

// Transfer Out (positive outflow)
var transferOutVolume = dailyGroup
    .Where(ts => ts.EntryType == VolumeChangeReasonEnum.TransferOut)
    .Sum(ts => Math.Abs((ts.ManualClosingLevel ?? ts.SensorClosingLevel ?? 0)
                      - (ts.ManualOpeningLevel ?? ts.SensorOpeningLevel ?? 0)));
```

#### 5. Variance Calculation
```csharp
// Daily variance = Actual - Expected
decimal dailyVariance = actualClosing - expectedClosing;

// Cumulative variance (running sum)
cumulativeVariance += dailyVariance;

// Variance percentage
decimal variancePercent = expectedClosing != 0
    ? dailyVariance / expectedClosing * 100
    : 0;
```

---

## How Expected Closing is Initially Set

### During Bulk Import
**Location:** `BulkImportTankStockCommandHandler.cs`

```csharp
// Calculate expected closing during import
var expectedClosing = entry.CalculateExpectedClosing();

// Formula in BulkImportRowDTO.cs
public decimal? CalculateExpectedClosing()
{
    if (!Opening.HasValue) return null;

    // Expected = Opening + (Inflows - Outflows)
    var netChange = CalculateNetChange();
    return Opening.Value + netChange;
}

public decimal CalculateNetChange()
{
    var inflow = (TransferIn ?? 0) + (Delivery ?? 0);
    var outflow = (Dispensing ?? 0) + (TransferOut ?? 0);
    return inflow - outflow;
}
```

**Stored in Database:**
```csharp
new Tankstock
{
    TankId = entry.TankId,
    EntryDate = entry.Date,
    EntryType = VolumeChangeReasonEnum.ClosingStock,

    ManualOpeningLevel = entry.Opening,
    ManualClosingLevel = entry.Closing,  // Actual physical measurement

    ExpectedClosingLevel = expectedClosing,  // Calculated value
    Discrepancy = entry.Closing - expectedClosing,  // Variance

    // Transaction details stored in separate records
    // with EntryType = Delivery, Dispensing, etc.
}
```

---

## Complete Data Flow Example

### Day: October 1, 2025

#### Database Records (Tankstock Table)
```
EntryId | TankId | EntryDate  | EntryType    | ManualOpeningLevel | ManualClosingLevel | ExpectedClosingLevel
--------|--------|------------|--------------|-------------------|-------------------|---------------------
1001    | 5      | 2025-10-01 | OpeningStock | 1000.00           | NULL              | NULL
1002    | 5      | 2025-10-01 | Delivery     | 1000.00           | 1500.00           | NULL
1003    | 5      | 2025-10-01 | Dispensing   | 1500.00           | 1200.00           | NULL
1004    | 5      | 2025-10-01 | TransferIn   | 1200.00           | 1400.00           | NULL
1005    | 5      | 2025-10-01 | TransferOut  | 1400.00           | 1300.00           | NULL
1006    | 5      | 2025-10-01 | ClosingStock | NULL              | 1280.00           | 1300.00
```

#### Calculation Process
```
1. Opening Stock: 1000 L (from record 1001)

2. Transactions:
   - Delivery:     1500 - 1000 = +500 L
   - Dispensing:   1500 - 1200 = 300 L (absolute)
   - Transfer In:  1400 - 1200 = +200 L
   - Transfer Out: 1400 - 1300 = 100 L (absolute)

3. Expected Closing:
   = 1000 + 500 + 200 - 300 - 100
   = 1300 L

4. Actual Closing: 1280 L (from record 1006)

5. Daily Variance:
   = 1280 - 1300
   = -20 L (shortage)

6. Variance Percentage:
   = (-20 / 1300) × 100
   = -1.54%
```

#### JSON Output
```json
{
    "date": "2025-10-01T00:00:00",
    "dateString": "Oct 01",
    "expectedStock": 1300.00,
    "actualStock": 1280.00,
    "dailyVariance": -20.00,
    "cumulativeVariance": -20.00,
    "variancePercent": -1.54,
    "delivery": 500.00,
    "dispensing": 300.00,
    "transferIn": 200.00,
    "transferOut": 100.00,
    "expectedDispensing": 300.00
}
```

---

## Common Variance Scenarios

### Scenario 1: Perfect Match (No Variance)
```
Opening: 1000 L
Delivery: +500 L
Dispensing: -300 L
Expected: 1200 L
Actual: 1200 L
Variance: 0 L ✅
```

### Scenario 2: Stock Loss (Negative Variance)
```
Opening: 1000 L
Delivery: +500 L
Dispensing: -300 L
Expected: 1200 L
Actual: 1180 L
Variance: -20 L ⚠️ (Possible theft, leak, evaporation)
```

### Scenario 3: Stock Gain (Positive Variance)
```
Opening: 1000 L
Delivery: +500 L
Dispensing: -300 L
Expected: 1200 L
Actual: 1220 L
Variance: +20 L ⚠️ (Possible unrecorded delivery, measurement error)
```

### Scenario 4: Large Cumulative Loss
```
Day 1: Variance = -20 L → Cumulative = -20 L
Day 2: Variance = -25 L → Cumulative = -45 L
Day 3: Variance = -18 L → Cumulative = -63 L
Day 4: Variance = -22 L → Cumulative = -85 L

Alert: Consistent losses indicate systematic issue (leak, theft, sensor calibration)
```

---

## Variance Analysis Statistics

The system also calculates summary statistics:

```csharp
var statistics = new VarianceStatistics
{
    // Final cumulative variance
    FinalCumulativeVariance = cumulativeVariance,

    // Total volumes
    TotalDelivery = dailyDataList.Sum(d => d.DeliveryVolume),
    TotalDispensing = dailyDataList.Sum(d => d.DispensingVolume),

    // Average daily variance (absolute value)
    AvgDailyVariance = dailyDataList.Average(d => Math.Abs(d.DailyVariance)),

    // Maximum cumulative variance (absolute value)
    MaxVariance = dailyDataList.Max(d => Math.Abs(d.CumulativeVariance)),

    // Final stock levels
    ExpectedClosingStock = dailyDataList.Last().ExpectedStock,
    ActualClosingStock = dailyDataList.Last().ActualStock,

    // Number of days analyzed
    DaysAnalyzed = dailyDataList.Count,

    // Stock accuracy percentage
    StockAccuracyPercent = (ActualClosingStock / ExpectedClosingStock) × 100
};
```

---

## Frontend Data Display

### VarianceAnalysis.js Chart
- **X-Axis:** Date (dateString)
- **Y-Axis:** Stock Level (liters)
- **Series:**
  1. Expected Stock (line) - Blue line showing calculated expected levels
  2. Actual Stock (line) - Red line showing physical measurements
  3. Daily Variance (bar) - Bars showing daily variance (green = positive, red = negative)
  4. Cumulative Variance (line) - Orange line showing running total

### Redux State
```javascript
varianceAnalysis: {
  data: {
    tankId: 5,
    tankName: "Tank A",
    startDate: "2025-10-01",
    endDate: "2025-10-31",
    dailyData: [...],  // Array of daily variance data
    statistics: {...}   // Summary statistics
  },
  loading: false,
  error: null
}
```

---

## Summary

### Key Formulas
1. **Expected Closing** = Opening + (Delivery + TransferIn) - (Dispensing + TransferOut)
2. **Daily Variance** = Actual Closing - Expected Closing
3. **Cumulative Variance** = Sum of all Daily Variances
4. **Variance %** = (Daily Variance / Expected Closing) × 100

### Data Sources
- **Opening/Closing Stock:** From EntryType = OpeningStock/ClosingStock records
- **Transactions:** From EntryType = Delivery/Dispensing/TransferIn/TransferOut records
- **Priority:** Manual readings > Sensor readings

### Variance Interpretation
- **Negative (-)** = Shortage (losses, theft, leaks, errors)
- **Positive (+)** = Excess (unrecorded inflows, measurement errors)
- **Zero (0)** = Perfect match (ideal scenario)

---

**Document Version:** 1.0
**Last Updated:** November 15, 2025
**Related Files:**
- `GetTankVarianceAnalysisQueryHandler.cs`
- `BulkImportRowDTO.cs`
- `BulkImportTankStockCommandHandler.cs`
- `VarianceAnalysis.js`
