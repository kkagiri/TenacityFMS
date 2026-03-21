# Tank Stock Bulk Import - Quick Reference Guide

## 🎯 Overview

**Purpose:** Import historical tank stock data from Excel with comprehensive validation.

**Status:** Planning Phase → Implementation Phase 1A

**Key Feature:** All 11 anomaly detection algorithms run in **backend** (not frontend).

---

## 📋 Quick Links

| Document | Purpose |
|----------|---------|
| [Full Implementation Plan](BULK_IMPORT_IMPLEMENTATION_PLAN.md) | Complete technical specification |
| [Excel Template](./templates/bulk_import_template.xlsx) | Download template |
| [API Documentation](#api-reference) | Endpoint specs |

---

## 🚀 Quick Start (For Developers)

### Phase 1A Implementation Checklist

**Backend (Week 1-2):**
```
□ Create BulkImportRowDTO.cs
□ Create BulkImportTankStockCommand.cs
□ Create BulkImportValidationService.cs
□ Add controller endpoint
□ Implement basic validation
□ Handle duplicates
```

**Frontend (Week 1-2):**
```
□ Create BulkImportManager.js
□ Add Excel upload (DevExtreme FileUploader)
□ Parse Excel (xlsx library)
□ Preview grid
□ Display validation results
□ Add to StockManagement tabs
```

---

## 📊 11 Anomaly Types (Backend Detection)

| # | Type | Severity | Description |
|---|------|----------|-------------|
| 1 | Daily Balance | Medium | Closing ≠ Opening + IN - OUT |
| 2 | Continuity Break | High | Opening ≠ Previous Closing |
| 3 | **Cumulative Drift** ⭐ | High | Period total doesn't add up |
| 4 | **Meter Rollback** ⭐ | Medium | Meter decreased (reset) |
| 5 | **Meter Mismatch** ⭐ | Low | Meter ≠ Dispensing |
| 6 | Capacity Overflow | Critical | Stock > Tank capacity |
| 7 | Negative Stock | Critical | Stock < 0 |
| 8 | Transfer Imbalance | Medium | OUT ≠ IN same day |
| 9 | Zero Movement | Low | Stock changed with no activity |
| 10 | Implausible Dispensing | High | Dispensing > Capacity |
| 11 | Delivery No Space | High | Delivery > Available space |

---

## 🔧 Configuration (Backend)

### Thresholds

```csharp
// Daily Balance
private const decimal DAILY_VARIANCE_THRESHOLD_LITERS = 50m;
private const decimal DAILY_VARIANCE_THRESHOLD_PERCENT = 2m;

// Cumulative Drift
private const decimal CUMULATIVE_VARIANCE_THRESHOLD_LITERS = 100m;
private const decimal CUMULATIVE_VARIANCE_THRESHOLD_PERCENT = 2m;

// Meter Validation
private const decimal METER_TOLERANCE_PERCENT = 5m;
private const decimal MIN_VARIANCE_THRESHOLD = 20m;

// Transfer Reciprocity
private const decimal TRANSFER_TOLERANCE_LITERS = 10m;
```

---

## 📁 File Structure

### Backend Files to Create

```
FMS.Application/
├── Features/
│   └── TankManagement/
│       └── BulkImport/
│           ├── Commands/
│           │   ├── BulkImportTankStockCommand.cs
│           │   └── BulkImportTankStockCommandHandler.cs
│           ├── DTOs/
│           │   ├── BulkImportRowDTO.cs
│           │   ├── BulkImportValidationResult.cs
│           │   └── ValidationAnomaly.cs
│           ├── Services/
│           │   ├── BulkImportValidationService.cs
│           │   └── MeterReadingValidator.cs
│           └── Models/
│               ├── DailyVarianceContribution.cs
│               └── CumulativeValidationSummary.cs

FMS.WebClient/
└── Controllers/
    └── FuelManagement/
        └── TankStockController.cs (add endpoint)
```

### Frontend Files to Create

```
fms.frontend/src/
└── pages/
    └── tankStock/
        └── management/
            └── components/
                ├── BulkImportManager.js
                ├── BulkImportManager.scss
                ├── ValidationReportPanel.js
                └── ExcelPreviewGrid.js
```

---

## 🔌 API Reference

### Endpoint

```
POST /api/v1/tankstock/bulk-import
Authorization: Bearer {token}
Permission: _Create_tankStock
```

### Request Body

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
  "duplicateHandling": "UserChoice"
}
```

### Response

```json
{
  "isSuccess": true,
  "data": {
    "totalRows": 10,
    "validRows": 8,
    "anomalies": [
      {
        "type": "CumulativeDrift",
        "severity": "Medium",
        "variance": -500,
        "message": "Cumulative shortage of 500L over 10 days"
      }
    ]
  }
}
```

---

## 🧪 Testing Checklist

### Unit Tests

```csharp
□ Daily balance validator
□ Continuity break validator
□ Cumulative drift validator
□ Meter rollback detector
□ Meter mismatch detector
□ All 11 anomaly types
```

### Integration Tests

```
□ End-to-end import (valid data)
□ Duplicate handling
□ Meter reset scenario
□ Cumulative variance detection
□ Large file (1000+ rows)
```

### Manual Test Cases

```
1. Happy path (clean data)
2. Meter reset (counter rollover)
3. Cumulative drift (10-day shortage)
4. Transfer imbalance
5. Duplicate entries
6. Historical import (old dates)
```

---

## 📦 Dependencies

### NuGet Packages (Backend)

```xml
<PackageReference Include="MediatR" Version="12.0.0" />
<PackageReference Include="AutoMapper" Version="12.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.0" />
```

### NPM Packages (Frontend)

```json
{
  "xlsx": "^0.18.5",
  "file-saver": "^2.0.5",
  "devextreme-react": "^23.2.0"
}
```

---

## 🎨 UI Components

### Tab Addition

```javascript
// In StockManagement.js, add to tabData:
const tabData = [
  { text: "Transaction Hub", icon: "fa-light fa-exchange-alt" },
  { text: "Bulk Import", icon: "fa-light fa-file-upload" }, // NEW
  // ... other tabs
];
```

### Bulk Import Manager Layout

```
┌─────────────────────────────────────────────┐
│  📊 Bulk Import Tank Stock Data             │
├─────────────────────────────────────────────┤
│  Step 1: Upload File                        │
│  [📁 Choose File] [📥 Download Template]    │
├─────────────────────────────────────────────┤
│  Step 2: Preview Data                       │
│  [DataGrid with 10 columns]                 │
│  [✓ Validate Data]                          │
├─────────────────────────────────────────────┤
│  Step 3: Review Anomalies                   │
│  ❌ 0 errors   ⚠️ 2 warnings   ✅ 8 valid    │
│  [Expandable anomaly list]                  │
│  [🔽 Download Report]                       │
├─────────────────────────────────────────────┤
│  Step 4: Import                             │
│  Duplicate Handling: [Skip ▼]              │
│  [Cancel] [Import Data]                     │
└─────────────────────────────────────────────┘
```

---

## 🗄️ Database Impact

### Tables Modified

**Tankstock** (existing - new entries added)
- `ExpectedClosingLevel` - populated during import
- `Discrepancy` - populated during import
- Optional: `ImportBatchId`, `ImportedAt`, `ImportSource`

**ReconciliationDiscrepancy** (existing - new records created)
- One record per detected anomaly
- Links to import batch

**Dailytankreconciliation** (existing - summaries created)
- One record per tank per day

### No Schema Changes Required (Phase 1A)

Optional enhancements for Phase 1C:
```sql
ALTER TABLE tankstocks
ADD ImportBatchId INT NULL,
ADD ImportedAt DATETIME NULL,
ADD ImportSource VARCHAR(50) NULL;
```

---

## 🔍 Anomaly Examples

### Example 1: Cumulative Drift

```
Day 1:  Opening = 0,     Delivery = 10000, Closing = 10000 ✓
Day 2:  Opening = 10000, Dispensing = 500, Closing = 9500  ✓
...
Day 10: Opening = 3500,  Dispensing = 1000, Closing = 2500 ❌

Expected Final: 0 + 10000 - 7000 = 3000L
Actual Final: 2500L
Variance: -500L (shortage)

Backend Detection:
var cumulativeVariance = actualFinal - expectedFinal;
if (Math.Abs(cumulativeVariance) > 100) {
    // Create anomaly record
}
```

### Example 2: Meter Mismatch

```
Opening Meter: 503531
Closing Meter: 503694
Meter Change:  163L

Dispensing Recorded: 168L
Variance: -5L (2.98%) ✓ Within 5% tolerance

Another case:
Meter Change: 200L
Dispensing: 168L
Variance: 32L (19%) ❌ Exceeds 5% threshold

Backend Detection:
var meterDispensing = closingMeter - openingMeter;
var variance = Math.Abs(meterDispensing - recordedDispensing);
var tolerance = recordedDispensing * 0.05m;
if (variance > tolerance && variance > 20) {
    // Create meter mismatch anomaly
}
```

---

## ⏱️ Performance Targets

| Metric | Target |
|--------|--------|
| Upload time | < 5 seconds (500 rows) |
| Validation time | < 10 seconds (500 rows) |
| Import time | < 30 seconds (500 rows) |
| Max file size | 10 MB |
| Max rows | 1000 per import |

---

## 🚦 Deployment Steps

### Phase 1A Deployment

```bash
# 1. Build backend
dotnet build Hyoung.Fms.sln --configuration Release

# 2. Run tests
dotnet test

# 3. Build frontend
cd fms.frontend
npm run build:prod

# 4. Deploy (your process)

# 5. Verify
curl -X POST https://your-api/api/v1/tankstock/bulk-import \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"entries": [], "validateOnly": true}'
```

---

## 📞 Support Contacts

| Issue Type | Contact |
|------------|---------|
| Backend Issues | Backend Team Lead |
| Frontend Issues | Frontend Team Lead |
| Validation Logic | Product Owner |
| Database Issues | DBA Team |
| Deployment | DevOps Team |

---

## 🔗 Related Documentation

- [Full Implementation Plan](BULK_IMPORT_IMPLEMENTATION_PLAN.md)
- [Tank Stock Architecture](../TANKSTOCK_METER_READING_IMPLEMENTATION.md)
- [Reconciliation System](../../AutomatedReconciliation/Stock-Reconciliation-Architecture.md)
- [Stock Management Summary](../StockManagement/STOCK_MANAGEMENT_FEATURE_SUMMARY.md)

---

## 📝 Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-13 | 1.0 | Initial planning documentation |

---

## ✅ Implementation Status

### Phase 1A: Foundation & Basic Import
```
Backend:  ⬜⬜⬜⬜⬜ 0%
Frontend: ⬜⬜⬜⬜⬜ 0%
Testing:  ⬜⬜⬜⬜⬜ 0%
```

### Phase 1B: Advanced Anomaly Detection
```
Backend:  ⬜⬜⬜⬜⬜ 0%
Frontend: ⬜⬜⬜⬜⬜ 0%
Testing:  ⬜⬜⬜⬜⬜ 0%
```

### Phase 1C: Discrepancy Integration
```
Backend:  ⬜⬜⬜⬜⬜ 0%
Testing:  ⬜⬜⬜⬜⬜ 0%
```

---

**Last Updated:** November 13, 2025
**Status:** 📋 Planning Complete → Ready for Implementation
