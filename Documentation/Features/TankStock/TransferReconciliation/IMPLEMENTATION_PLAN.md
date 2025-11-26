# Transfer-Based Reconciliation Implementation Plan

## Overview
Two-part reconciliation system to improve stock accuracy and identify variances in real-time.

## Part 1: Real-Time Stock Entry Validation

### User Story
**As a** tank stock operator
**I want to** see expected stock values when entering Opening/Closing/Transfer records
**So that** I can identify data entry errors before saving and investigate discrepancies immediately

### Backend Components

#### 1. New Query: `GetExpectedStockQuery.cs`
```csharp
Location: FMS.Application/Features/TankManagement/Queries/
Purpose: Calculate expected stock for a tank at a given timestamp
Inputs:
  - TankId (int)
  - Timestamp (DateTime)
  - StockType (Opening/Closing/Transfer)
Output:
  - ExpectedStock (decimal)
  - PreviousClosing (decimal)
  - DeliveriesSum (decimal)
  - TransfersInSum (decimal)
  - TransfersOutSum (decimal)
  - DispensingSum (decimal)
  - VarianceThreshold (decimal) - from system config
```

#### 2. Query Handler: `GetExpectedStockQueryHandler.cs`
```csharp
Logic:
1. Get last closing stock before the timestamp
2. Get all deliveries since last closing
3. Get all transfers IN since last closing
4. Get all transfers OUT since last closing
5. Get all dispensing (sensor + manual) since last closing
6. Calculate: Expected = LastClosing + Deliveries + TransfersIn - TransfersOut - Dispensing
7. Get acceptable variance threshold from SystemConfiguration
8. Return breakdown with expected value
```

#### 3. Controller Endpoint
```csharp
Location: TankStockController.cs
[HttpGet("expected-stock")]
public async Task<IActionResult> GetExpectedStock(
    [FromQuery] int tankId,
    [FromQuery] DateTime timestamp,
    [FromQuery] string stockType)
```

### Frontend Components

#### 1. Hook: `useStockValidation.js`
```javascript
Location: fms.frontend/src/pages/tankStock/shared/hooks/
Purpose: Fetch expected stock and calculate variance
Features:
  - Debounced API call when tank/date changes
  - Returns { expectedStock, breakdown, variance, isWithinThreshold }
```

#### 2. Component: `StockVarianceAlert.js`
```javascript
Location: fms.frontend/src/pages/tankStock/shared/components/
Purpose: Show color-coded variance warning
Display:
  - Green: Within threshold
  - Yellow: Moderate variance (threshold to 2x threshold)
  - Red: High variance (> 2x threshold)
  - Breakdown tooltip showing calculation
```

#### 3. Integration Points
- Opening Stock form
- Closing Stock form
- Transfer form
- Show alert below volume input field
- Require confirmation if variance exceeds threshold

---

## Part 2: Transfer-Based Reconciliation Analysis

### User Story
**As a** fleet manager
**I want to** analyze fuel truck stock movements from stationary tank transfers
**So that** I can identify fuel losses during truck operations and verify dispensing accuracy

### Backend Components

#### 1. New Query: `GetTransferReconciliationAnalysisQuery.cs`
```csharp
Location: FMS.Application/Features/TankManagement/Queries/
Purpose: Analyze stock reconciliation for transfer-based operations
Inputs:
  - TankId (int) - Fuel truck tank
  - StartDate (DateTime)
  - EndDate (DateTime)
  - IncludeTransferDetails (bool)
Output: TransferReconciliationResult
  - Periods[] - array of reconciliation periods between physical stock entries
  - Summary - overall statistics
```

#### 2. Result DTO: `TransferReconciliationResult.cs`
```csharp
Properties:
  - TankId (int)
  - TankName (string)
  - VehicleRegistration (string?) - if fuel truck
  - StartDate (DateTime)
  - EndDate (DateTime)
  - Periods (List<ReconciliationPeriod>)
  - Summary (ReconciliationSummary)

ReconciliationPeriod:
  - PeriodNumber (int)
  - StartDate (DateTime)
  - EndDate (DateTime)
  - OpeningStock (decimal)
  - TransfersIn (decimal)
  - TransfersOut (decimal)
  - DispensingVolume (decimal)
  - ExpectedClosing (decimal)
  - ActualClosing (decimal)
  - Variance (decimal)
  - VariancePercentage (decimal)
  - IsWithinThreshold (bool)
  - TransferDetails (List<TransferDetail>) - optional
  - DispensingBreakdown (DispensingBreakdown)

TransferDetail:
  - TransferId (int)
  - Timestamp (DateTime)
  - FromTank (string)
  - ToTank (string)
  - Volume (decimal)
  - RecordedBy (string)

DispensingBreakdown:
  - SensorDispensing (decimal)
  - ManualDispensing (decimal)
  - AutomatedDispensing (decimal)
  - TotalDispensing (decimal)

ReconciliationSummary:
  - TotalPeriods (int)
  - TotalTransfersIn (decimal)
  - TotalDispensing (decimal)
  - TotalVariance (decimal)
  - AverageVariance (decimal)
  - PeriodsWithinThreshold (int)
  - PeriodsOutsideThreshold (int)
  - LargestVariance (decimal)
  - LargestVarianceDate (DateTime)
```

#### 3. Query Handler: `GetTransferReconciliationAnalysisQueryHandler.cs`
```csharp
Logic:
1. Validate tank exists and is a fuel truck (optional check)
2. Get all physical stock entries (Opening/Closing) in date range - these define periods
3. For each period between stock entries:
   a. Get opening stock (from previous closing or opening entry)
   b. Get all transfers IN to this tank
   c. Get all transfers OUT from this tank
   d. Get all dispensing (sensor + manual + automated)
   e. Calculate expected closing: Opening + TransfersIn - TransfersOut - Dispensing
   f. Get actual closing stock entry
   g. Calculate variance
   h. Check against threshold
4. Calculate summary statistics
5. Return structured result
```

#### 4. Controller Endpoint
```csharp
Location: TankStockController.cs
[HttpGet("transfer-reconciliation")]
public async Task<IActionResult> GetTransferReconciliation(
    [FromQuery] int tankId,
    [FromQuery] DateTime startDate,
    [FromQuery] DateTime endDate,
    [FromQuery] bool includeTransferDetails = false)
```

### Frontend Components

#### 1. Main Component: `TransferReconciliation.js`
```javascript
Location: fms.frontend/src/pages/tankStock/analytics/
Purpose: Main analysis page for transfer-based reconciliation
Features:
  - Tank selector (filter to fuel trucks or show all)
  - Date range selector
  - Apply button to fetch data
  - Summary cards showing key metrics
  - Variance trend chart
  - Detailed periods DataGrid
  - Export to Excel functionality
```

#### 2. Components Structure:
```
TransferReconciliation.js (Main)
├── TransferReconciliationHeader.js (Filters + Help)
├── TransferReconciliationSummary.js (Summary Cards)
├── TransferVarianceChart.js (Line/Bar Chart)
└── TransferReconciliationGrid.js (DataGrid with expandable rows)
```

#### 3. Charts:
**Variance Trend Chart:**
- X-axis: Period dates
- Y-axis: Variance (liters)
- Series:
  - Expected Closing (line)
  - Actual Closing (line)
  - Variance (bar, colored by threshold)

**Volume Movement Chart:**
- Stacked bar showing: Opening + TransfersIn - TransfersOut - Dispensing = Closing

#### 4. DataGrid Columns:
- Period # (auto-numbered)
- Start Date
- End Date
- Opening Stock (L)
- Transfers In (L)
- Transfers Out (L)
- Dispensing (L) - expandable to show breakdown
- Expected Closing (L)
- Actual Closing (L)
- Variance (L) - color-coded
- Variance % - color-coded
- Status (icon: ✓ Within / ⚠ Outside threshold)

#### 5. Redux Actions:
```javascript
Location: fms.frontend/src/redux/actions/tankStockAction.js
New Actions:
  - fetchTransferReconciliation(tankId, startDate, endDate, includeDetails)
  - clearTransferReconciliation()
```

#### 6. Help Content: `TransferReconciliationHelp.js`
```javascript
Sections:
  - What is Transfer Reconciliation?
  - How to Use This Analysis
  - Understanding the Periods
  - Reading the Variance Chart
  - Interpreting the Grid Data
  - Common Patterns and What They Mean
  - Troubleshooting High Variances
```

---

## Database Considerations

### No New Tables Required
All data exists in current tables:
- `tankstock` - Opening/Closing physical entries
- `tanktransfer` - Transfer transactions
- `tankvolumehistory` - Dispensing records
- `systemconfiguration` - Variance thresholds

### Suggested System Configuration Keys
```sql
-- Add to systemconfiguration table
INSERT INTO systemconfiguration (ConfigKey, ConfigValue, Description, Category)
VALUES
  ('Stock.VarianceThreshold.Percentage', '5', 'Acceptable variance percentage for stock entries', 'TankStock'),
  ('Stock.VarianceThreshold.AbsoluteLiters', '50', 'Acceptable absolute variance in liters', 'TankStock'),
  ('TransferReconciliation.DefaultDaysRange', '30', 'Default date range for transfer reconciliation', 'TankStock');
```

---

## Navigation Setup

### Add to Navigation Items
```sql
-- Add under Tank Stock Analytics section
INSERT INTO navigationitems (NavigationItemName, NavigationItemLink, ParentId, Icon, DisplayOrder)
VALUES
  ('Transfer Reconciliation', '/tankstock/transfer-reconciliation',
   (SELECT NavigationItemId FROM navigationitems WHERE NavigationItemLink = '/tankstock'),
   'fa-light fa-exchange-alt', 3);
```

### Route Configuration
```javascript
// app-routes.js
case "transfer reconciliation":
  return TransferReconciliation;

// Content.js
<Route path="/tankstock/transfer-reconciliation" element={<TransferReconciliation />} />
```

---

## Implementation Phases

### Phase 1: Real-Time Validation (Quick Win - 4-6 hours)
1. ✅ Create GetExpectedStockQuery + Handler (Backend)
2. ✅ Add controller endpoint (Backend)
3. ✅ Create useStockValidation hook (Frontend)
4. ✅ Create StockVarianceAlert component (Frontend)
5. ✅ Integrate into Opening/Closing/Transfer forms (Frontend)
6. ✅ Add system configuration entries (Database)
7. ✅ Test with real data

### Phase 2: Transfer Reconciliation Analysis (Full Feature - 8-12 hours)
1. ✅ Create GetTransferReconciliationAnalysisQuery + DTOs (Backend)
2. ✅ Create query handler with period calculation logic (Backend)
3. ✅ Add controller endpoint (Backend)
4. ✅ Create Redux actions (Frontend)
5. ✅ Create main TransferReconciliation component (Frontend)
6. ✅ Create summary cards component (Frontend)
7. ✅ Create variance chart component (Frontend)
8. ✅ Create periods DataGrid component (Frontend)
9. ✅ Create help content component (Frontend)
10. ✅ Add navigation item (Database)
11. ✅ Configure routing (Frontend)
12. ✅ Comprehensive testing

---

## Benefits

### Real-Time Validation
- ✅ Immediate feedback during data entry
- ✅ Catch errors before they're saved
- ✅ Reduce reconciliation work later
- ✅ Improve data quality at source

### Transfer Reconciliation
- ✅ Track fuel truck operations accurately
- ✅ Identify losses during transfers
- ✅ Verify sensor accuracy
- ✅ Audit trail for fuel movements
- ✅ Support investigation of variances
- ✅ Evidence for insurance/theft claims

---

## Testing Scenarios

### Real-Time Validation Testing
1. Enter closing stock matching expected value → Green alert
2. Enter closing stock 3% off expected → Yellow alert
3. Enter closing stock 10% off expected → Red alert, require confirmation
4. Test with missing previous closing stock
5. Test with multiple deliveries in period
6. Test with transfers in/out

### Transfer Reconciliation Testing
1. Single period with one transfer and dispensing
2. Multiple periods with regular patterns
3. Period with high variance
4. Truck with no physical stock entries (no periods)
5. Date range with no transfers
6. Export functionality
7. Expandable rows for transfer details

---

## Future Enhancements
- Auto-suggest correction based on sensor data
- Variance trend alerts (email/notification)
- Comparison across multiple trucks
- Fuel efficiency metrics (liters per km)
- Integration with GPS data for trip validation
