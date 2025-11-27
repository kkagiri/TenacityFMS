# GPS Volume Integration - Implementation Summary

## Overview
Implemented GPS volume display in Fuel Data Comparison feature and TransactionHub DataGrid. This allows users to compare manual fuel entries, PTS transactions, and GPS-reported volumes side-by-side.

## Changes Made

### 1. Fuel Data Comparison - Debug Improvements

#### Backend Changes
**File**: `FMS.Application/Features/FuelComparison/Queries/GetComparisonDataQuery.cs`

**Changes**:
- Added enhanced logging to track GPS data retrieval
- Added log after fetching GPS entries: `_logger.LogInformation($"Retrieved {gpsEntries.Count} GPS entries from database")`
- Added statistics logging for GPS data:
  ```csharp
  var recordsWithGps = result.Count(r => r.GpsVolume.HasValue);
  var recordsWithModifiedGps = result.Count(r => r.IsGpsModified);
  _logger.LogInformation($"GPS Data Stats - Total records: {result.Count}, With GPS: {recordsWithGps}, Modified: {recordsWithModifiedGps}");
  ```

#### Frontend Changes
**File**: `fms.frontend/src/pages/tankStock/fueldatacomparison/dashboard/FuelDataComparisonDashboard.js`

**Changes**:
- Added console logging to track GPS data in retrieved records:
  ```javascript
  const details = response.data?.details || [];
  const totalRecords = details.length;
  const recordsWithGps = details.filter(d => d.gpsVolume != null).length;
  const recordsWithEffectiveGps = details.filter(d => d.effectiveGpsVolume != null).length;
  console.log('[Fuel Comparison] Data loaded:', {
    totalRecords,
    recordsWithGps,
    recordsWithEffectiveGps,
    sampleRecord: details[0]
  });
  ```

**Purpose**: These changes help diagnose why GPS data might not be appearing in the fuel comparison grid.

---

### 2. TransactionHub - GPS Volume Column Integration

#### Backend API Client
**File**: `fms.frontend/src/api/fuelComparisonClient.js`

**Status**: Already exists - no changes needed
- `getComparisonData()` function fetches fuel comparison data including GPS volumes

#### Frontend Component
**File**: `fms.frontend/src/pages/tankStock/management/components/TransactionHub.js`

**Changes**:

1. **Import Statement** (Line 54):
   ```javascript
   import { getComparisonData } from '../../../../api/fuelComparisonClient';
   ```

2. **New State Variables** (Lines 155-157):
   ```javascript
   const [showGpsVolume, setShowGpsVolume] = useState(false); // Toggle for GPS volume column
   const [gpsVolumeData, setGpsVolumeData] = useState({}); // GPS volume lookup by vehicle/date
   const [isLoadingGpsData, setIsLoadingGpsData] = useState(false);
   ```

3. **New Function - Load GPS Data** (Lines 263-308):
   ```javascript
   const loadGpsVolumeData = useCallback(async () => {
     if (!showGpsVolume || !headerStartDate || !headerEndDate) {
       return;
     }

     try {
       setIsLoadingGpsData(true);
       console.log('[GPS Volume] Fetching GPS data for date range:', { headerStartDate, headerEndDate });

       const params = {
         startDate: headerStartDate.toISOString(),
         endDate: headerEndDate.toISOString(),
         filterType: 'all',
         showDeleted: false
       };

       const response = await getComparisonData(params);

       if (response.isSuccess && response.data) {
         // Build lookup map: vehicleId_date -> effectiveGpsVolume
         const gpsLookup = {};
         response.data.forEach(item => {
           if (item.vehicleId && item.dispenseDate && item.effectiveGpsVolume != null) {
             const dateKey = new Date(item.dispenseDate).toISOString().split('T')[0];
             const key = `${item.vehicleId}_${dateKey}`;
             gpsLookup[key] = item.effectiveGpsVolume;
           }
         });

         console.log('[GPS Volume] Loaded GPS data:', {
           totalRecords: response.data.length,
           lookupKeys: Object.keys(gpsLookup).length
         });

         setGpsVolumeData(gpsLookup);
       }
     } catch (error) {
       console.error('[GPS Volume] Error loading GPS data:', error);
       setGpsVolumeData({});
     } finally {
       setIsLoadingGpsData(false);
     }
   }, [showGpsVolume, headerStartDate, headerEndDate]);
   ```

4. **useEffect Hook** (Lines 334-339):
   ```javascript
   // Load GPS volume data when toggle is enabled or date range changes
   useEffect(() => {
     if (showGpsVolume && isInitialized) {
       console.log('[GPS Volume] Toggle enabled, loading GPS data...');
       loadGpsVolumeData();
     }
   }, [showGpsVolume, headerStartDate, headerEndDate, isInitialized, loadGpsVolumeData]);
   ```

5. **UI Toggle Checkbox** (Lines 1047-1055):
   ```javascript
   {/* GPS Volume Checkbox */}
   <div className="tw-flex tw-items-end tw-pb-1">
     <CheckBox
       text="Show GPS Volume"
       value={showGpsVolume}
       onValueChanged={(e) => setShowGpsVolume(e.value)}
       hint="Show GPS-reported fuel volume for dispensing transactions"
     />
   </div>
   ```

6. **DataGrid Column** (Lines 1292-1322):
   ```javascript
   {/* GPS Volume Column - Only visible when toggle is enabled */}
   {showGpsVolume && (
     <Column
       caption="GPS Volume (L)"
       minWidth={130}
       alignment="right"
       calculateCellValue={(rowData) => {
         // Only show GPS volume for dispensing transactions (changeReason 6 or 7)
         if (rowData.changeReason !== 6 && rowData.changeReason !== 7) {
           return null;
         }

         // Get vehicle ID from transaction
         const vehicleId = rowData.vehicleId;
         if (!vehicleId) return null;

         // Get date key from timestamp
         const dateKey = new Date(rowData.timestamp).toISOString().split('T')[0];
         const lookupKey = `${vehicleId}_${dateKey}`;

         // Return GPS volume from lookup map
         return gpsVolumeData[lookupKey] || null;
       }}
       customizeText={(cellInfo) => {
         if (cellInfo.value === null || cellInfo.value === undefined) {
           return '-';
         }
         return cellInfo.value.toFixed(2);
       }}
       cssClass="gps-volume-column"
     />
   )}
   ```

**Features**:
- ✅ Toggle checkbox to show/hide GPS volume column
- ✅ Only displays GPS volume for dispensing transactions (changeReason 6 or 7)
- ✅ Automatically fetches GPS data when toggle is enabled
- ✅ Matches vehicle ID and date to show corresponding GPS volume
- ✅ Displays "-" when no GPS data is available
- ✅ Formats volume with 2 decimal places

---

## How It Works

### TransactionHub GPS Volume Flow

1. **User enables "Show GPS Volume" checkbox**
   - `showGpsVolume` state changes to `true`
   - useEffect detects the change

2. **Load GPS Data**
   - `loadGpsVolumeData()` is called
   - Fetches fuel comparison data via `getComparisonData()` API
   - Builds a lookup map: `vehicleId_date -> effectiveGpsVolume`
   - Stores in `gpsVolumeData` state

3. **Display GPS Volume in Grid**
   - GPS Volume column appears in DataGrid
   - For each row, `calculateCellValue` checks:
     - Is this a dispensing transaction? (changeReason 6 or 7)
     - Does the vehicle have a valid ID?
     - Extract date from timestamp
     - Lookup GPS volume using `${vehicleId}_${date}` key
   - Display volume or "-" if not found

4. **Data Updates**
   - When date range changes, GPS data is automatically reloaded
   - When toggle is disabled, column is hidden (data remains in state for quick re-enable)

---

## Testing Instructions

### 1. Test Fuel Data Comparison GPS Display

1. Navigate to **Tank Stock → Fuel Data Comparison**
2. Select date range with known GPS data
3. Click "Fetch GPS Data" to retrieve GPS entries
4. Check browser console for logs:
   ```
   [Fuel Comparison] Data loaded: { totalRecords: X, recordsWithGps: Y, ... }
   ```
5. Verify GPS Volume and Effective GPS columns display data
6. Check backend logs for GPS retrieval statistics

### 2. Test TransactionHub GPS Volume Column

1. Navigate to **Tank Stock → Transaction Hub**
2. Select date range with dispensing transactions
3. Check the "Show GPS Volume" checkbox
4. Verify:
   - GPS data is fetched (check console logs)
   - New "GPS Volume (L)" column appears
   - GPS volumes display for dispensing transactions
   - Non-dispensing transactions show "-" in GPS column
   - Volumes are formatted with 2 decimal places

5. **Test Toggle Behavior**:
   - Uncheck "Show GPS Volume" → Column disappears
   - Re-check → Column reappears without reloading data

6. **Test Date Range Changes**:
   - Change date range in header filters
   - Verify GPS data is automatically reloaded

---

## Pending Items

### PivotGrid GPS Volume Integration

**File**: `fms.frontend/src/pages/tankStock/analytics/components/reporting/PivotGridReport.js`

**Status**: Not yet implemented

**Reason**: PivotGrid requires GPS data to be included in the source data structure, not as a calculated column. This requires:
1. Backend API changes to include GPS volume in pivot data
2. PivotGrid field configuration to include GPS volume as a data field
3. Custom aggregation logic if needed

**Recommendation**: Implement this based on user feedback after testing TransactionHub GPS column. May require:
- New backend endpoint or modification to `TankStockReportsService.getPivotData()`
- GPS volume aggregation strategy (sum, average, etc.)
- Pivot field configuration

---

## Database Requirements

**Table**: `gpsgate_report_entries`

**Required Columns**:
- `VehicleId` - Links to vehicles table
- `DispenseDate` - Date of refueling event
- `RefillVolume` - Original GPS-reported volume
- `ModifiedVolume` - User-edited volume (nullable)
- `IsDeleted` - Soft delete flag

**Query**: The `GetComparisonDataQuery` already handles GPS data retrieval properly. Ensure:
1. GPS data is being fetched and saved via "Fetch GPS Data" feature
2. Vehicle IDs in GPS data match vehicle IDs in transactions
3. Dates align between transactions and GPS entries

---

## Troubleshooting

### GPS Data Not Showing in Fuel Comparison

**Check**:
1. Backend logs for GPS entry count
2. Frontend console for `recordsWithGps` count
3. Verify GPS data exists in `gpsgate_report_entries` table for selected date range
4. Check vehicle ID mapping between GPS and local vehicles

### GPS Volume Column Empty in TransactionHub

**Check**:
1. Console logs: `[GPS Volume] Loaded GPS data: { totalRecords: X, lookupKeys: Y }`
2. If `lookupKeys: 0` → No GPS data fetched
3. Verify dispensing transactions have valid `vehicleId`
4. Check date format matching in lookup key

### Performance Issues

**If GPS data loading is slow**:
1. Consider caching GPS data for current date range
2. Add debouncing to date range changes
3. Limit GPS data fetch to selected sites/tanks only

---

## Related Files

### Backend
- `FMS.Application/Features/FuelComparison/Queries/GetComparisonDataQuery.cs`
- `FMS.Application/Features/FuelComparison/Queries/GetVarianceReportQuery.cs`
- `FMS.Application/Features/FuelComparison/DTOs/FuelDataComparisonDto.cs`
- `FMS.Domain/Entities/Features/FuelComparison/GpsGateReportEntry.cs`
- `FMS.WebClient/Controllers/FuelComparisonController.cs`

### Frontend
- `fms.frontend/src/pages/tankStock/fueldatacomparison/dashboard/FuelDataComparisonDashboard.js`
- `fms.frontend/src/pages/tankStock/management/components/TransactionHub.js`
- `fms.frontend/src/api/fuelComparisonClient.js`

---

## Next Steps

1. **Test GPS data display** in Fuel Data Comparison dashboard
2. **Test GPS volume column** in TransactionHub
3. **Gather user feedback** on GPS volume display
4. **Decide on PivotGrid implementation** based on user requirements
5. **Add GPS volume variance indicators** (optional enhancement)

---

**Last Updated**: 2025-11-26
**Implemented By**: AI Assistant
**Status**: Ready for Testing
