# Tankstock Meter Reading Implementation

## Overview

This document details the implementation of optional meter reading fields for opening and closing stock operations in the FMS (Fleet Management System). The feature allows users to optionally record meter readings during stock-taking events for audit and reconciliation purposes.

## Architecture Decision

### Correct Location: Tankstock Entity
Meter readings are stored in the **Tankstock** entity, NOT in TankVolumeHistory. This decision is based on the following architectural principles:

- **Tankstock**: Represents the stock-taking event itself with all its attributes (stock amount, date, meter reading, etc.)
- **TankVolumeHistory**: Serves as a pure ledger/audit trail of volume changes only

### Separation of Concerns
```
Stock-Taking Event (Tankstock)
├── Stock amount (ManualOpeningLevel/ManualClosingLevel)
├── Entry date
├── Meter reading (OpeningMeter/ClosingMeter) ✓ NEW
└── Recorded by

Volume Change Ledger (TankVolumeHistory)
├── Volume change amount
├── Change reason
├── Timestamp
└── Related stock ID (reference only)
```

## Database Changes

### Schema Update
**Table**: `tankstock`

**New Columns**:
```sql
OpeningMeter DECIMAL(10,2) NULL
  COMMENT 'Meter reading recorded during opening stock entry (optional)'

ClosingMeter DECIMAL(10,2) NULL
  COMMENT 'Meter reading recorded during closing stock entry (optional)'
```

**Properties**:
- Data Type: `DECIMAL(10,2)` - Allows up to 99,999,999.99
- Nullable: `YES` - Optional fields for backward compatibility
- Precision: 2 decimal places for accurate readings
- Indexed: No (not frequently queried independently)

### Migration Script
Location: `Database/Scripts/add_tankstock_meter_readings_migration.sql`

**Features**:
- Add columns with comments
- Verification queries
- Data validation checks
- Rollback script (commented)
- Comprehensive notes

## Backend Implementation

### Domain Layer

#### Entity: Tankstock.cs
**Location**: `FMS.Domain/Entities/Features/TankStockManagement/Tankstock.cs`

```csharp
/// <summary>
/// Meter reading recorded during opening stock (optional).
/// Only applicable when EntryType is OpeningStock.
/// </summary>
public decimal? OpeningMeter { get; set; }

/// <summary>
/// Meter reading recorded during closing stock (optional).
/// Only applicable when EntryType is ClosingStock.
/// </summary>
public decimal? ClosingMeter { get; set; }
```

**Design Notes**:
- Nullable to indicate optional nature
- XML documentation explains usage context
- Placed after ManualOpeningLevel/ManualClosingLevel for logical grouping

### Persistence Layer

#### Configuration: TankstockConfiguration.cs
**Location**: `FMS.Persistence/EntityConfigurations/TankstockConfiguration.cs`

```csharp
builder.Property(t => t.OpeningMeter)
    .HasPrecision(10, 2)
    .IsRequired(false)
    .HasComment("Meter reading during opening stock (optional)");

builder.Property(t => t.ClosingMeter)
    .HasPrecision(10, 2)
    .IsRequired(false)
    .HasComment("Meter reading during closing stock (optional)");
```

**Features**:
- Explicit precision configuration
- Not required (maintains backward compatibility)
- Database comments for clarity

### Application Layer

#### Opening Stock Command
**Location**: `FMS.Application/Features/TankManagement/TankStock/Commands/OpeningStockCommand.cs`

**Command Record**:
```csharp
public record OpeningStockCommand(
    int TankId,
    decimal OpeningStock,
    string RecordedBy,
    DateTime? EntryDate = null,
    decimal? OpeningMeter = null) // NEW: Optional parameter
    : IRequest<FMSResponse<TankstockDTO>>;
```

**Handler Update**:
```csharp
var stockTaking = new Tankstock
{
    TankId = request.TankId,
    EntryDate = entryDate,
    EntryType = VolumeChangeReasonEnum.OpeningStock,
    ManualOpeningLevel = request.OpeningStock,
    OpeningMeter = request.OpeningMeter, // NEW: Save meter reading
    RecordedBy = request.RecordedBy,
    SiteId = tank.SiteId
};
```

#### Closing Stock Command
**Location**: `FMS.Application/Features/TankManagement/TankStock/Commands/ClosingStockCommand.cs`

**Command Record**:
```csharp
public record ClosingStockCommand(
    int TankId,
    decimal ClosingStock,
    string RecordedBy,
    DateTime? EntryDate = null,
    decimal? ClosingMeter = null) // NEW: Optional parameter
    : IRequest<FMSResponse<StockReconciliationResult>>;
```

**Handler Update**:
```csharp
var newClosingStock = new Tankstock
{
    TankId = request.TankId,
    EntryDate = entryDate,
    EntryType = VolumeChangeReasonEnum.ClosingStock,
    ManualClosingLevel = request.ClosingStock,
    ClosingMeter = request.ClosingMeter, // NEW: Save meter reading
    RecordedBy = request.RecordedBy,
    SiteId = tank.SiteId
};
```

### Web API Layer

#### Controller Endpoints
**Location**: `FMS.WebClient/Controllers/TankStockController.cs` (assumed)

**Opening Stock**:
```
POST /api/tankstock/openingstock
Query Parameters:
  - tankId (int, required)
  - amount (decimal, required)
  - dateTime (DateTime, required)
  - openingMeter (decimal?, optional) ✓ NEW
```

**Closing Stock**:
```
POST /api/tankstock/closingstock
Query Parameters:
  - tankId (int, required)
  - amount (decimal, required)
  - dateTime (DateTime, required)
  - closingMeter (decimal?, optional) ✓ NEW
```

## Frontend Implementation

### Forms

#### OpeningStockForm.js
**Location**: `fms.frontend/src/pages/tankStock/forms/OpeningStockForm.js`

**State**:
```javascript
const [formData, setFormData] = useState({
  siteId: null,
  tankId: null,
  amount: null,
  openingMeter: null, // NEW: Optional meter reading
  bookBalance: null,
  physicalStockValue: null,
  date: new Date(),
});
```

**UI Field**:
```jsx
<SimpleItem
  dataField="openingMeter"
  editorType="dxNumberBox"
  editorOptions={{
    showSpinButtons: true,
    value: formData.openingMeter || null,
    placeholder: "Enter opening meter reading (optional)",
    width: "100%",
    format: "#,##0.00"
  }}
>
  <Label text="Opening Meter Reading (Optional)" />
</SimpleItem>
```

**Placement**: After "Physical Stock Amount" field, before discrepancy indicator

#### ClosingStockForm.js
**Location**: `fms.frontend/src/pages/tankStock/forms/ClosingStockForm.js`

**State**:
```javascript
const [formData, setFormData] = useState({
  siteId: prefilledData?.siteId || 0,
  tankId: prefilledData?.tankId || 0,
  amount: null,
  closingMeter: null, // NEW: Optional meter reading
  bookBalance: null,
  physicalStockValue: null,
  date: prefilledData?.suggestedDate || new Date(),
});
```

**UI Field**: Mirror of OpeningStockForm pattern

### Redux Actions

#### tankStockAction.js
**Location**: `fms.frontend/src/redux/actions/tankStockAction.js`

**Opening Stock Action**:
```javascript
export const createOpeningStock = (params) => async (dispatch) => {
  const tankId = params.tankId;
  const amount = params.amount;
  const dateTime = params.dateTime || params.date;
  const openingMeter = params.openingMeter; // NEW

  const formattedDate = dateTime instanceof Date
    ? formatDateTime(dateTime)
    : dateTime;

  // Build query string with optional meter
  let queryString = `tankId=${tankId}&amount=${amount}&dateTime=${formattedDate}`;
  if (openingMeter !== null && openingMeter !== undefined) {
    queryString += `&openingMeter=${openingMeter}`;
  }

  const response = await axiosInstance.post(
    `/tankstock/openingstock?${queryString}`
  );
  // ... rest of implementation
};
```

#### ClosingStockActions.js
**Location**: `fms.frontend/src/redux/actions/ClosingStockActions.js`

**Closing Stock Action**: Mirror of opening stock pattern with closingMeter parameter

### Utilities

#### stockDataPreparation.js
**Location**: `fms.frontend/src/utils/stockDataPreparation.js`

```javascript
export const prepareOpeningClosingStockParams = (formData) => ({
  tankId: formData.tankId,
  amount: formData.amount,
  date: formData.date,
  openingMeter: formData.openingMeter || null, // NEW
  closingMeter: formData.closingMeter || null  // NEW
});
```

## Data Flow

### Opening Stock
```
User Input (OpeningStockForm.js)
  ↓ formData { tankId, amount, date, openingMeter }
Redux Action (tankStockAction.js)
  ↓ GET /tankstock/openingstock?...&openingMeter=xxx
API Controller
  ↓ OpeningStockCommand { ..., OpeningMeter }
Command Handler
  ↓ new Tankstock { ..., OpeningMeter = request.OpeningMeter }
Database
  ↓ INSERT INTO tankstock (..., OpeningMeter) VALUES (..., xxx)
```

### Closing Stock
```
User Input (ClosingStockForm.js)
  ↓ formData { tankId, amount, date, closingMeter }
Redux Action (ClosingStockActions.js)
  ↓ GET /tankstock/closingstock?...&closingMeter=xxx
API Controller
  ↓ ClosingStockCommand { ..., ClosingMeter }
Command Handler
  ↓ new Tankstock { ..., ClosingMeter = request.ClosingMeter }
Database
  ↓ INSERT INTO tankstock (..., ClosingMeter) VALUES (..., xxx)
```

## Usage Guidelines

### When to Use Meter Readings

**Use Cases**:
- Fuel dispensing systems with physical meters
- Manual pump stations with mechanical counters
- Reconciliation between physical meters and tank levels
- Audit trail for regulatory compliance
- Identifying meter drift or calibration issues

**Not Required For**:
- Automatic tank gauge (ATG) systems only
- Facilities without physical meters
- Historical data migration (leave as NULL)

### Best Practices

1. **Consistency**: If recording meter readings, do so for all opening/closing stock events at that site
2. **Accuracy**: Enter readings precisely as shown on the meter
3. **Verification**: Cross-check meter readings against tank levels for discrepancies
4. **Documentation**: Note any unusual meter readings or discrepancies
5. **Training**: Ensure staff understand when and how to record meter readings

### Validation Rules

**Backend**:
- No validation enforced (completely optional)
- Accepts NULL or any positive decimal value
- Maximum: 99,999,999.99 (DECIMAL(10,2) limit)

**Frontend**:
- Not required for form submission
- Format: #,##0.00 (two decimal places)
- Placeholder text indicates optional nature
- No minimum/maximum enforced in UI

## Testing Scenarios

### Test Case 1: Opening Stock with Meter
**Input**:
- Tank ID: 5
- Opening Stock: 10000 L
- Opening Meter: 123456.78
- Date: 2025-01-15

**Expected**:
- Tankstock record created with OpeningMeter = 123456.78
- TankVolumeHistory record created WITHOUT meter reading
- Success message displayed
- Form can be submitted successfully

### Test Case 2: Opening Stock without Meter
**Input**:
- Tank ID: 5
- Opening Stock: 10000 L
- Opening Meter: (empty/null)
- Date: 2025-01-15

**Expected**:
- Tankstock record created with OpeningMeter = NULL
- Same behavior as before feature implementation
- Backward compatibility maintained

### Test Case 3: Closing Stock with Meter
**Input**:
- Tank ID: 5
- Closing Stock: 8500 L
- Closing Meter: 124000.50
- Date: 2025-01-16

**Expected**:
- Tankstock record created with ClosingMeter = 124000.50
- Reconciliation calculations unaffected
- Meter reading stored for audit purposes

### Test Case 4: Existing Records
**Validation**:
- Query existing tankstock records
- Verify OpeningMeter and ClosingMeter are NULL for old records
- Confirm no errors or issues with NULL values

## Reporting and Queries

### Useful Queries

**View Recent Opening Stock with Meters**:
```sql
SELECT
    t.TankstockId,
    tk.Name AS TankName,
    t.EntryDate,
    t.ManualOpeningLevel AS OpeningStock,
    t.OpeningMeter,
    t.RecordedBy
FROM tankstock t
JOIN tank tk ON t.TankId = tk.Id
WHERE t.EntryType = 'OpeningStock'
  AND t.OpeningMeter IS NOT NULL
ORDER BY t.EntryDate DESC
LIMIT 20;
```

**View Closing Stock with Meters**:
```sql
SELECT
    t.TankstockId,
    tk.Name AS TankName,
    t.EntryDate,
    t.ManualClosingLevel AS ClosingStock,
    t.ClosingMeter,
    t.RecordedBy
FROM tankstock t
JOIN tank tk ON t.TankId = tk.Id
WHERE t.EntryType = 'ClosingStock'
  AND t.ClosingMeter IS NOT NULL
ORDER BY t.EntryDate DESC
LIMIT 20;
```

**Meter Reading Audit Trail**:
```sql
SELECT
    tk.Name AS TankName,
    t.EntryDate,
    t.EntryType,
    COALESCE(t.OpeningMeter, t.ClosingMeter) AS MeterReading,
    COALESCE(t.ManualOpeningLevel, t.ManualClosingLevel) AS StockLevel,
    t.RecordedBy
FROM tankstock t
JOIN tank tk ON t.TankId = tk.Id
WHERE t.OpeningMeter IS NOT NULL
   OR t.ClosingMeter IS NOT NULL
ORDER BY tk.Name, t.EntryDate;
```

**Meter vs Stock Discrepancies**:
```sql
-- For analysis of meter progression vs stock changes
WITH MeterReadings AS (
    SELECT
        TankId,
        EntryDate,
        COALESCE(OpeningMeter, ClosingMeter) AS MeterValue,
        COALESCE(ManualOpeningLevel, ManualClosingLevel) AS StockValue,
        EntryType
    FROM tankstock
    WHERE OpeningMeter IS NOT NULL OR ClosingMeter IS NOT NULL
)
SELECT
    TankId,
    EntryDate,
    MeterValue,
    StockValue,
    MeterValue - LAG(MeterValue) OVER (PARTITION BY TankId ORDER BY EntryDate) AS MeterChange,
    StockValue - LAG(StockValue) OVER (PARTITION BY TankId ORDER BY EntryDate) AS StockChange
FROM MeterReadings
ORDER BY TankId, EntryDate;
```

## Troubleshooting

### Issue: Meter reading not saved
**Causes**:
- Frontend not passing meter value to action
- Action not including meter in query string
- Backend command not accepting meter parameter
- Handler not saving meter to entity

**Solution**: Verify each layer passes the meter value correctly

### Issue: NULL values in database
**Expected Behavior**:
- NULL is valid for backward compatibility
- Only records created after feature deployment will have values
- Empty/null inputs from frontend result in NULL in database

### Issue: Decimal precision errors
**Causes**:
- Database column not DECIMAL(10,2)
- Frontend not formatting correctly
- API truncating values

**Solution**: Verify database column type and frontend format configuration

## Maintenance Notes

### Future Enhancements
- Add meter reading trend analysis
- Implement meter calibration tracking
- Create meter vs stock variance alerts
- Generate meter reading reports
- Add meter reading history view

### Deprecation
This feature can be deprecated by:
1. Removing UI fields from forms
2. Stopping frontend from sending meter parameters
3. Backend will continue to accept NULL values
4. Database columns can remain (set to NULL by default)

### Performance Impact
- Minimal: Two additional nullable decimal columns
- No indexes added (not frequently queried independently)
- Backward compatible (NULL for all existing records)

## Related Documentation

- **Entity Documentation**: See Tankstock.cs XML comments
- **API Documentation**: See TankStockController Swagger docs
- **Database Schema**: See tankstock table definition
- **Migration Script**: `Database/Scripts/add_tankstock_meter_readings_migration.sql`

## Change History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-01-XX | 1.0 | Initial implementation of meter reading fields | System |

---

**Important**: This feature was initially incorrectly implemented in TankVolumeHistory (ledger) but was corrected to store meter readings in Tankstock (stock-taking event records) per architectural best practices.
