# Manual Dispensing Implementation - TransactionHub

## Overview
This document describes the implementation of manual dispensing aggregation feature in TransactionHub DataGrid, providing the same functionality already available in PivotGrid.

## Feature Description
The manual dispensing feature allows users to toggle between two data sources for dispensing transactions:

1. **Sensor Dispensing (Default)**: Shows all transactions from `TankVolumeHistory` including sensor-based dispensing
2. **Manual Dispensing**: Shows non-dispensing transactions from `TankVolumeHistory` + manual dispensing aggregates from `TankStock`

## Implementation Details

### Backend Changes

#### 1. Query Handler: `GetTankVolumeHistoryFilteredQuery.cs`
**Location**: `FMS.Application/Features/TankVolumeHistory/Queries/GetTankVolumeHistoryFilteredQuery.cs`

**Changes Made**:
- Added `UseManualDispensing?` property to query record
- Split `Handle` method into branching logic based on `UseManualDispensing` flag
- Created three new methods:
  - `GetTankVolumeHistoryWithSensorDispensingAsync()` - Original behavior (all transactions including sensor dispensing)
  - `GetTankVolumeHistoryWithManualDispensingAsync()` - New feature (combines TankVolumeHistory non-dispensing + TankStock manual dispensing)
  - `MapTankVolumeHistoryToDTO()` - Helper for bulk vehicle name loading

**Logic Flow**:
```csharp
if (UseManualDispensing == true)
{
    // Exclude sensor dispensing from TankVolumeHistory
    var nonDispensingHistory = from TankVolumeHistory
        where ChangeReason != Dispensing && ChangeReason != AutomatedDispensing

    // Get manual dispensing from TankStock
    var manualDispensing = from TankStock
        where EntryType == Dispensing

    // Combine and sort by timestamp descending
    return combined.OrderByDescending(r => r.Timestamp)
}
else
{
    // Default: Return all transactions from TankVolumeHistory
    return TankVolumeHistory.OrderByDescending(r => r.Timestamp)
}
```

**Key Implementation Points**:
- Excludes `VolumeChangeReasonEnum.Dispensing` and `VolumeChangeReasonEnum.AutomatedDispensing` when using manual dispensing
- Maps `TankStock` records to `TankVolumeHistoryDTO` format
- Sets appropriate labels: "Manual Dispensing - {VehicleName}"
- Bulk loads vehicle names to avoid N+1 queries
- Maintains all existing filters (site, tank, date range, recorded by)

#### 2. Controller: `TankVolumeHistoryController.cs`
**Location**: `FMS.WebClient/Controllers/FuelManagement/TankVolumeHistoryController.cs`

**Changes Made**:
- Added `[FromQuery] bool? useManualDispensing = false` parameter to `filtered` endpoint
- Parameter is passed to `GetTankVolumeHistoryFilteredQuery`

**Endpoint**:
```
GET /api/v1/tankvolumehistory/filtered?useManualDispensing={true|false}
```

### Frontend Changes

#### 1. Redux Action: `tankVolumeHistoryActions.js`
**Location**: `fms.frontend/src/redux/actions/tankVolumeHistoryActions.js`

**Changes Made**:
- Added `useManualDispensing: false` to default filters
- Added query parameter to API call

**Default Filters**:
```javascript
const defaultFilters = {
  siteId: null,
  tankId: null,
  recordedBy: null,
  startDate: null,
  endDate: null,
  includeVehicleNames: true,
  useManualDispensing: false  // false = sensor, true = manual from TankStock
};
```

#### 2. TransactionHub Component
**Location**: `fms.frontend/src/pages/tankStock/management/components/TransactionHub.js`

**Changes Made**:
1. Added CheckBox import from `devextreme-react/check-box`
2. Updated `currentFilters` state initialization to include `useManualDispensing: false`
3. Updated all filter initialization points (initial state, useEffect, clearFilters)
4. Created `handleToggleManualDispensing` callback
5. Added CheckBox UI in header's "Active Filters" section

**UI Component**:
```jsx
<CheckBox
  text="Use Manual Dispensing"
  value={currentFilters.useManualDispensing}
  onValueChanged={(e) => handleToggleManualDispensing(e.value)}
  hint="Show manual dispensing from TankStock instead of sensor dispensing"
/>
```

**Handler**:
```javascript
const handleToggleManualDispensing = useCallback((value) => {
  const updatedFilters = {
    ...currentFilters,
    useManualDispensing: value
  };
  setCurrentFilters(updatedFilters);
  loadTransactionData(updatedFilters);
}, [currentFilters, loadTransactionData]);
```

## Testing Guide

### 1. Backend Testing

#### Test 1: Default Behavior (Sensor Dispensing)
```
GET /api/v1/tankvolumehistory/filtered?startDate=2025-01-01&endDate=2025-01-15
```

**Expected Result**:
- Returns all transactions from `TankVolumeHistory`
- Includes sensor dispensing records
- Includes automated dispensing records

#### Test 2: Manual Dispensing Mode
```
GET /api/v1/tankvolumehistory/filtered?startDate=2025-01-01&endDate=2025-01-15&useManualDispensing=true
```

**Expected Result**:
- Returns non-dispensing transactions from `TankVolumeHistory`
- Returns manual dispensing records from `TankStock` (labeled as "Manual Dispensing - {VehicleName}")
- Does NOT include sensor dispensing or automated dispensing from `TankVolumeHistory`

#### Test 3: Combined Filters
```
GET /api/v1/tankvolumehistory/filtered?siteId=1&tankId=5&useManualDispensing=true
```

**Expected Result**:
- All filters applied correctly
- Manual dispensing mode active
- Only records matching site and tank filters

### 2. Frontend Testing

#### Test 1: Initial Load
1. Navigate to TransactionHub
2. **Expected**: Checkbox "Use Manual Dispensing" is unchecked
3. **Expected**: DataGrid shows all transactions including sensor dispensing

#### Test 2: Toggle Manual Dispensing
1. Check "Use Manual Dispensing" checkbox
2. **Expected**: DataGrid reloads
3. **Expected**: Sensor dispensing records disappear
4. **Expected**: Manual dispensing records from TankStock appear with label "Manual Dispensing - {VehicleName}"

#### Test 3: Filter Persistence
1. Check "Use Manual Dispensing"
2. Apply site filter (e.g., Site A)
3. Change date to previous day
4. Click "Next Day" to return
5. **Expected**: Manual dispensing toggle remains checked throughout all operations

#### Test 4: Reset Filters
1. Check "Use Manual Dispensing"
2. Apply various filters
3. Click "Reset to All Sites"
4. **Expected**: Manual dispensing unchecks (returns to default)
5. **Expected**: All filters reset to today with all sites

#### Test 5: Export Functionality
1. Check "Use Manual Dispensing"
2. Click Export to Excel
3. **Expected**: Exported data matches DataGrid content
4. **Expected**: Manual dispensing records included with proper labels

### 3. Data Validation Tests

#### Compare PivotGrid vs TransactionHub
1. Open PivotGrid with manual dispensing enabled
2. Note the total volume for a specific vehicle/date
3. Open TransactionHub with manual dispensing enabled
4. Apply same date filter
5. **Expected**: Totals match between PivotGrid and TransactionHub

#### Verify Exclusion Logic
1. Identify a tank with both sensor and manual dispensing
2. Query with `useManualDispensing=false`
3. Note the dispensing records
4. Query with `useManualDispensing=true`
5. **Expected**: Sensor dispensing records NOT present
6. **Expected**: Only manual dispensing from TankStock present

## Integration Points

### Database Tables
- **TankVolumeHistory**: Primary transaction history (includes sensor dispensing)
- **TankStock**: Stock management entries (source for manual dispensing)
- **Vehicle**: Lookup for vehicle names

### Related Features
- **PivotGrid**: Already has manual dispensing aggregation (reference implementation)
- **Stock Reconciliation**: Uses TankStock data
- **Closing Stock**: Creates entries in both TankVolumeHistory and TankStock

## Performance Considerations

1. **Vehicle Name Loading**: Uses bulk loading to avoid N+1 queries
2. **Query Optimization**: Filters applied at database level
3. **Data Volume**: Both queries sorted by timestamp descending and limited by `take` parameter

## Known Limitations

1. Manual dispensing records from TankStock don't have all fields from TankVolumeHistory
2. Some fields will be NULL or default values (e.g., `AfterVolume`, `BeforeVolume`)
3. The `ChangeReason` is set to "Manual Dispensing" for clarity

## Maintenance Notes

### If Backend Changes Required
- Modify `GetTankVolumeHistoryFilteredQuery.cs`
- Update `GetTankVolumeHistoryWithManualDispensingAsync()` method
- Ensure mapping in `MapTankVolumeHistoryToDTO()` remains accurate

### If Frontend Changes Required
- Modify `TransactionHub.js`
- Update `handleToggleManualDispensing` callback
- Ensure filter persistence in all navigation operations

### Related Documentation
- See `Documentation/Features/TankStock/PivotGrid.md` for PivotGrid implementation
- See `Documentation/Features/TankStock/StockReconciliation.md` for TankStock usage
- See `CLAUDE.md` for general CQRS patterns

## Migration Notes

### Database Migration
No database schema changes required - this is a query-level feature.

### Deployment Checklist
- [ ] Backend code deployed
- [ ] Frontend code deployed
- [ ] API endpoint tested
- [ ] UI toggle tested
- [ ] Data accuracy validated against PivotGrid
- [ ] Export functionality tested
- [ ] Filter persistence verified

## Support Information

### Troubleshooting

**Issue**: Manual dispensing shows no data
- **Check**: TankStock table has entries with `EntryType = Dispensing`
- **Check**: Date range includes manual dispensing records
- **Check**: Site/Tank filters not too restrictive

**Issue**: Duplicate dispensing records appear
- **Check**: Ensure exclusion logic properly filters out sensor dispensing from TankVolumeHistory
- **Check**: Query handler branching logic is correct

**Issue**: Vehicle names not showing
- **Check**: `includeVehicleNames` parameter is true
- **Check**: Vehicle references exist in TankStock records
- **Check**: Vehicle table has corresponding records

### Contact
For questions or issues, refer to the development team or system architect.

---

**Document Version**: 1.0
**Last Updated**: 2025-01-15
**Author**: Development Team
**Status**: Implementation Complete - Pending Testing
