# Period Diagnostic System - Implementation Summary

## Overview

This document describes the comprehensive diagnostic system created to analyze tank stock periods and identify data quality issues. The system combines data from **TankStock**, **TankVolumeHistory**, and **TankTransfers** to provide complete visibility into fuel movements and variances.

---

## Problem Statement

The Transfer Reconciliation analysis for tank FT13 revealed significant data quality issues:

1. **Period 2**: Stock unchanged (1720L → 1720L) but 247.69L dispensing recorded
2. **Periods 5,6,8**: Massive variances (-2220L, -1220L, -930L) with ZERO dispensing recorded
3. **Inconsistent data**: Missing transactions, incorrect stock readings, or unrecorded fuel movements

**Root Cause**: Limited visibility into what data is actually in the database vs what's being calculated.

---

## Solution: Period Diagnostic System

### Features

✅ **Complete Data Retrieval** - Shows ALL transactions in a period:
   - Tank Stock entries (opening/closing/deliveries)
   - Volume History transactions (dispensing, adjustments, reconciliations)
   - Transfer transactions (in/out)

✅ **Step-by-Step Calculations** - Shows exactly how variance is calculated

✅ **Data Quality Warnings** - Automatically detects suspicious patterns:
   - Stock unchanged but dispensing recorded
   - Stock decreased but no dispensing
   - Large variances (>500L or >20%)
   - Missing opening/closing stocks

✅ **Flexible Analysis** - Can include/exclude:
   - All transaction types (Adjustments, Reconciliations)
   - Deleted/soft-deleted records

---

## Backend Implementation

### Files Created

#### 1. DTOs (`FMS.Application/Features/TankManagement/DTOs/`)
- **PeriodDiagnosticResult.cs** - Main result DTO containing:
  - `TankStockEntry[]` - Stock entries in period
  - `VolumeHistoryTransaction[]` - All volume transactions
  - `TransferTransaction[]` - Transfer records
  - `DiagnosticReconciliation` - Calculated reconciliation
  - `DataQualityWarning[]` - Automated warnings

#### 2. Query Handler (`FMS.Application/Features/TankManagement/Queries/`)
- **GetPeriodDiagnosticQuery.cs** - Query definition
- **GetPeriodDiagnosticQueryHandler.cs** - Complete implementation with:
  - Data retrieval from all 3 sources
  - Reconciliation calculation logic
  - Automatic warning generation

#### 3. API Endpoint (`FMS.WebClient/Controllers/FuelManagement/`)
- **TankStockReportsController.cs** - Added endpoint:
  ```
  GET /api/v1/tankstockreports/period-diagnostic
  Parameters:
    - tankId: int (required)
    - startDate: DateTime (required)
    - endDate: DateTime (required)
    - includeAllTransactionTypes: bool (default: true)
    - includeDeletedRecords: bool (default: false)
  ```

---

## Data Retrieval Logic

### 1. Tank Stock Entries
```csharp
Source: Tankstocks table
Filter: TankId, Date Range, !Deleted
Returns:
  - Opening/Closing levels (Manual + Sensor)
  - Meters (Opening/Closing)
  - Calculated usage
  - Comments, RecordedBy
```

### 2. Volume History Transactions
```csharp
Source: TankVolumeHistories table
Filter: TankId, Date Range, !Deleted
Returns ALL transaction types:
  - Dispensing (5)
  - AutomatedDispensing (6)
  - Delivery (2)
  - Adjustment (4)
  - Reconciliation (7)
  - AutomatedReconciliation (8)
  - TransferIn (3)
  - TransferOut (4)
```

### 3. Transfer Transactions
```csharp
Source: TankTransfers table
Queries:
  - Transfers IN: DestinationTankId = targetTank
  - Transfers OUT: SourceTankId = targetTank
Returns:
  - Source/Destination tank details
  - Amount, Date, RecordedBy
  - Correction information
```

---

## Reconciliation Calculation

### Formula
```
Expected Closing = Opening Stock
                 + Transfers IN
                 - Transfers OUT
                 + Deliveries
                 - Total Dispensing
                 + Adjustments (if includeAllTransactionTypes)
                 + Reconciliations (if includeAllTransactionTypes)

Variance = Actual Closing - Expected Closing
Variance % = (|Variance| / |Expected|) × 100
```

### Dispensing Breakdown
```
Total Dispensing = Manual Aggregate (from TankStock)
                 + Sensor Dispensing (TankVolumeHistory.Dispensing)
                 + Automated Dispensing (TankVolumeHistory.AutomatedDispensing)
```

---

## Data Quality Warnings

### Automatic Detection

| Warning | Condition | Severity | Suggested Action |
|---------|-----------|----------|------------------|
| **Ghost Dispensing** | Stock unchanged but dispensing > 50L | Critical | Verify closing stock or check for duplicate dispensing |
| **Large Variance** | \|Variance\| > 500L or > 20% | Critical | Review all transactions for accuracy |
| **Missing Dispensing** | Stock dropped > 100L but dispensing = 0 | Critical | Check if dispensing records missing from TankVolumeHistory |
| **No Opening Stock** | Opening stock = 0 | Warning | Ensure opening stock entry exists |
| **No Closing Stock** | Closing stock = 0 | Warning | Ensure closing stock entry exists |
| **Deleted Records** | Soft-deleted transactions found | Info | Review deleted transactions if variance unexpected |

---

## Example: FT13 Period 5 Diagnostic

### Input
```
Tank: FT13 (ID: 23)
Period: Nov 5, 05:10 → Nov 6, 05:13
```

### Expected Output
```json
{
  "tankId": 23,
  "tankName": "FT13",
  "startDate": "2025-11-05T05:10:00",
  "endDate": "2025-11-06T05:13:00",

  "stockEntries": [
    {
      "entryDate": "2025-11-05T05:10:00",
      "entryType": "OpeningStock",
      "manualOpeningLevel": 1670,
      "recordedBy": "user@example.com"
    },
    {
      "entryDate": "2025-11-06T05:13:00",
      "entryType": "ClosingStock",
      "manualClosingLevel": 800,
      "recordedBy": "user@example.com"
    }
  ],

  "volumeTransactions": [
    // ALL TankVolumeHistory records in this period
    // This will show if dispensing is truly missing
  ],

  "transfers": [
    {
      "transferId": 359,
      "transferDate": "2025-11-05T06:21:00",
      "sourceTankName": "ST2",
      "destinationTankName": "FT13",
      "amount": 1350,
      "direction": "In"
    }
  ],

  "reconciliation": {
    "openingStock": 1670,
    "actualClosing": 800,
    "transfersIn": 1350,
    "transfersOut": 0,
    "dispensingBreakdown": {
      "manualAggregate": 0,
      "sensorDispensing": 0,
      "automatedDispensing": 0,
      "total": 0
    },
    "expectedClosing": 3020,
    "variance": -2220,
    "variancePercentage": 73.5,

    "calculationSteps": [
      "Opening Stock: 1670.00 L",
      "Actual Closing Stock: 800.00 L",
      "Transfers IN: +1350.00 L (1 transactions)",
      "Transfers OUT: -0.00 L (0 transactions)",
      "Manual Dispensing: -0.00 L (0 entries)",
      "Sensor Dispensing: -0.00 L (0 transactions)",
      "Automated Dispensing: -0.00 L (0 transactions)",
      "Total Dispensing: -0.00 L",
      "Expected Closing = 1670.00 + 1350.00 - 0.00 + 0.00 - 0.00",
      "Expected Closing: 3020.00 L",
      "Variance = 800.00 - 3020.00 = -2220.00 L (73.51%)"
    ]
  },

  "warnings": [
    {
      "severity": "critical",
      "category": "missing_data",
      "message": "Stock decreased but no dispensing recorded",
      "details": "Stock dropped 2220.00L with zero dispensing",
      "suggestedAction": "Check if dispensing records are missing from TankVolumeHistory"
    },
    {
      "severity": "critical",
      "category": "suspicious",
      "message": "Large variance detected",
      "details": "Variance: -2220.00L (73.51%)",
      "suggestedAction": "Review all transactions in this period for accuracy"
    }
  ]
}
```

---

## Frontend Integration (Next Steps)

### 1. Create Service (`fms.frontend/src/services/`)
```javascript
// tankStockDiagnosticService.js
class TankStockDiagnosticService {
  async getPeriodDiagnostic(tankId, startDate, endDate, options = {}) {
    const params = {
      tankId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      includeAllTransactionTypes: options.includeAllTransactionTypes ?? true,
      includeDeletedRecords: options.includeDeletedRecords ?? false
    };

    const response = await axiosInstance.get(
      'tankstockreports/period-diagnostic',
      { params }
    );

    return response.data;
  }
}
```

### 2. Create Diagnostic Panel Component
```jsx
// PeriodDiagnosticPanel.js
- Shows stock entries table
- Shows volume transactions table
- Shows transfer transactions table
- Shows reconciliation calculation steps
- Shows warnings with severity badges
- Expandable sections for each data source
```

### 3. Integrate with Transfer Reconciliation Page
```jsx
// Add diagnostic button to each period in grid
<Button
  icon="fa-microscope"
  hint="View Detailed Diagnostic"
  onClick={() => openDiagnostic(period)}
/>

// Show diagnostic panel in modal or side panel
```

---

## Testing the Diagnostic System

### 1. Test FT13 Period 5 (Worst Variance)
```http
GET /api/v1/tankstockreports/period-diagnostic?tankId=23&startDate=2025-11-05T05:10:00Z&endDate=2025-11-06T05:13:00Z
```

**Expected Result**: Should reveal why 2220L of fuel is missing

### 2. Test FT13 Period 2 (Ghost Dispensing)
```http
GET /api/v1/tankstockreports/period-diagnostic?tankId=23&startDate=2025-11-03T14:43:00Z&endDate=2025-11-04T05:18:00Z
```

**Expected Result**: Should show the 247.69L dispensing records that shouldn't exist

### 3. Test FT13 Period 1 (Good Baseline)
```http
GET /api/v1/tankstockreports/period-diagnostic?tankId=23&startDate=2025-11-03T05:16:00Z&endDate=2025-11-03T14:43:00Z
```

**Expected Result**: Should show accurate reconciliation (variance: -1L)

---

## Benefits

### For Operations Team
- ✅ **Visibility**: See exactly what data exists in each period
- ✅ **Root Cause Analysis**: Identify missing or incorrect data quickly
- ✅ **Data Quality**: Automated warnings flag problems immediately

### For Development Team
- ✅ **Debugging**: Understand why calculations produce unexpected results
- ✅ **Verification**: Confirm calculations are correct vs data is wrong
- ✅ **Testing**: Validate data integrity before/after migrations

### For Business
- ✅ **Accuracy**: Identify fuel losses, theft, or measurement errors
- ✅ **Compliance**: Ensure accurate fuel accounting
- ✅ **Cost Savings**: Prevent undetected fuel losses

---

## Future Enhancements

1. **Drill-Down Capability**
   - Click on any variance to open diagnostic
   - Compare expected vs actual for each transaction type

2. **Automated Data Fixes**
   - Suggest corrections for common issues
   - Bulk delete duplicate records
   - Auto-reconcile minor variances

3. **Historical Analysis**
   - Track data quality trends over time
   - Identify tanks with chronic data issues
   - Alert when patterns change

4. **Integration with Variance Analysis**
   - Show diagnostic panel alongside variance charts
   - Cross-reference daily variance with period reconciliation

---

## API Documentation

### Endpoint
```
GET /api/v1/tankstockreports/period-diagnostic
```

### Request Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `tankId` | int | Yes | - | Tank ID to analyze |
| `startDate` | DateTime | Yes | - | Period start date (ISO 8601) |
| `endDate` | DateTime | Yes | - | Period end date (ISO 8601) |
| `includeAllTransactionTypes` | bool | No | true | Include adjustments & reconciliations in calculation |
| `includeDeletedRecords` | bool | No | false | Include soft-deleted records for troubleshooting |

### Response
```json
{
  "isSuccess": true,
  "message": null,
  "data": {
    "tankId": 23,
    "tankName": "FT13",
    "startDate": "2025-11-05T05:10:00Z",
    "endDate": "2025-11-06T05:13:00Z",
    "stockEntries": [...],
    "volumeTransactions": [...],
    "transfers": [...],
    "reconciliation": {...},
    "warnings": [...]
  }
}
```

### Error Responses
- `400 Bad Request` - Invalid parameters
- `403 Forbidden` - Missing `_Read_tankStock` permission
- `404 Not Found` - Tank not found
- `500 Internal Server Error` - Server error

---

## Permissions Required
- `_Read_tankStock` - Required to access diagnostic data

---

## Status
✅ Backend Implementation: **Complete**
⏳ Frontend Service: **Pending**
⏳ Frontend Component: **Pending**
⏳ Integration: **Pending**

---

## Next Steps

1. **Restart backend** to load the new diagnostic endpoint
2. **Test the API** with FT13 period data
3. **Create frontend service** for the diagnostic endpoint
4. **Build diagnostic panel component** to display results
5. **Integrate with Transfer Reconciliation** and Variance Analysis pages

---

## Contact
For questions or issues related to this diagnostic system, contact the development team.

**Created**: 2025-11-17
**Version**: 1.0
**Status**: Backend Complete, Frontend Pending
