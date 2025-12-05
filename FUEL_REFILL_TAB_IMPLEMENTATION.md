# Fuel Refill Tab Implementation Guide

## Overview
A new **Fuel Refill Data** tab has been added to the FuelDataComparison module, providing a comprehensive interface for viewing, filtering, and managing fuel refill records. This tab integrates seamlessly with the existing StockFilterContext and admin permission system.

## Features

### 1. **Tabbed Interface**
- **Comparison Dashboard**: Existing fuel data comparison view
- **Fuel Refill Data**: New tab for fuel refill management

### 2. **Filtering Capabilities**
- **Date Range Filter**: Select audit period (start and end dates)
- **Site Filter**: Filter by specific site
- **Tank Filter**: Filter by specific tank(s)
- Uses `HeaderStockFilters` component (same as StockAnalysis)

### 3. **Editable Table**
- Display fuel refill records with the following columns:
  - ID
  - Vehicle (lookup)
  - Site (lookup)
  - Date
  - Fuel Amount (L)
  - Previous Meter Reading
  - Current Meter Reading
  - Consumption (L)
  - Driver ID
  - Tag ID
  - Comment
  - Created Date
  - Actions (Edit/Delete)

### 4. **Admin-Only Operations**
- **Edit**: Requires `_Update_tankStock` permission
- **Delete**: Requires `_Delete_tankStock` permission
- Permission checks are enforced both on frontend and backend via `RequirePermissionAttribute`

### 5. **Statistics Dashboard**
Displays key metrics:
- Total Refills (count)
- Total Fuel (liters)
- Average Refill (liters)
- Unique Vehicles (count)

### 6. **Data Management**
- **Edit Modal**: Modify fuel amount, meter readings, and comments
- **Delete Modal**: Soft delete with mandatory reason
- **Export to Excel**: Download filtered data

### 7. **Real-time Data Sync**
- Data refreshes when filters change
- Automatic reload after edit/delete operations

## Files Created

### Frontend Components

#### 1. **API Client**
📄 `fms.frontend/src/api/fuelRefillClient.js`
- `getFuelRefillList()` - Fetch fuel refills with filters
- `getFuelRefillById()` - Get single record
- `getFuelRefillSummary()` - Get summary data
- `getFuelRefillSummaryBySite()` - Summary by site
- `createFuelRefill()` - Create new record
- `updateFuelRefill()` - Update record
- `deleteFuelRefill()` - Delete record

#### 2. **Main Tab Component**
📄 `fms.frontend/src/pages/tankStock/fueldatacomparison/FuelRefillTab.js`
- Integrates with `StockFilterContext`
- Manages data loading and filtering
- Displays statistics
- Renders the data table
- Handles filter application

#### 3. **Data Grid Component**
📄 `fms.frontend/src/pages/tankStock/fueldatacomparison/components/FuelRefillTable.js`
- DevExtreme DataGrid implementation
- Features: search, filter, sort, column chooser
- Action buttons (edit/delete)
- Excel export functionality
- Permission-based action visibility

#### 4. **Edit Modal**
📄 `fms.frontend/src/pages/tankStock/fueldatacomparison/modals/FuelRefillEditModal.js`
- Edit fuel amount, meter readings, comments
- Input validation
- Submit to API

#### 5. **Delete Modal**
📄 `fms.frontend/src/pages/tankStock/fueldatacomparison/modals/FuelRefillDeleteModal.js`
- Confirm deletion with fuel refill details
- Mandatory deletion reason
- Audit trail (reason is tracked on backend)

#### 6. **Main Router (Updated)**
📄 `fms.frontend/src/pages/tankStock/fueldatacomparison/FuelDataComparisonMain.js`
- Added TabPanel with two tabs
- Tab routing and state management
- Maintains existing functionality

### Styling Files
- `FuelDataComparisonMain.scss` - Tab panel styling
- `FuelRefillTab.scss` - Tab content styling
- `components/FuelRefillTable.scss` - Table styling
- `modals/FuelRefillEditModal.scss` - Edit modal styling
- `modals/FuelRefillDeleteModal.scss` - Delete modal styling

## Integration Points

### 1. **Context Integration**
```javascript
const {
  startDate,
  endDate,
  selectedSiteIds,
  selectedTankIds
} = useStockFilters();
```
Uses `StockFilterContext` from TankStock module for consistent filtering.

### 2. **Permission System**
```javascript
const { hasPermission } = usePermissions();
const canEdit = hasPermission('_Update_tankStock');
const canDelete = hasPermission('_Delete_tankStock');
```
Leverages existing `usePermissions()` hook for permission checks.

### 3. **Redux Integration**
```javascript
const sites = useSelector((state) => state.site?.sites || []);
const vehicles = useSelector((state) => state.vehicle?.vehicles || []);
```
Retrieves sites and vehicles from Redux store for lookups.

### 4. **Notifications**
Uses `devextreme/ui/notify` for user feedback on operations.

## Backend Requirements

### Existing Endpoints Used
All endpoints already exist in the codebase:

1. **GET** `/api/v1/FuelRefill`
   - Parameters: `take`, `skip`, `startDate`, `endDate`, `siteId`
   - Permission: `_Read_FuelRefill`

2. **PUT** `/api/v1/FuelRefill/{id}` (if available, otherwise create)
   - Updates fuel refill record
   - Permission: `_Update_tankStock`

3. **DELETE** `/api/v1/FuelRefill/{id}` (if available, otherwise create)
   - Soft delete with reason tracking
   - Permission: `_Delete_tankStock`

### API Client Endpoints Available
- `FuelRefillController.cs` - Already has:
  - `CreateFuelRefil` (POST)
  - `GetFuelRefil` (GET by ID)
  - `GetFuelRefillSummary` (GET summary)
  - `GetFuelRefilList` (GET with filters)

### If Update/Delete Endpoints Don't Exist
You'll need to create these endpoints in `FuelRefillController.cs`:

```csharp
[HttpPut("{id}")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
[RequirePermission("_Update_tankStock")]
public async Task<IActionResult> UpdateFuelRefill(int id, [FromBody] FuelRefilDTO dto)
{
    var command = new UpdateFuelRefillCommand(id, dto);
    var result = await _mediator.Send(command);
    return Ok(result);
}

[HttpDelete("{id}")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
[RequirePermission("_Delete_tankStock")]
public async Task<IActionResult> DeleteFuelRefill(int id)
{
    var command = new DeleteFuelRefillCommand(id);
    var result = await _mediator.Send(command);
    return Ok(result);
}
```

## Usage Guide

### For Users

#### Accessing Fuel Refill Tab
1. Navigate to **TankStock > Fuel Data Comparison**
2. Click the **"Fuel Refill Data"** tab
3. Set date range, site, and tank filters
4. Click **"Apply"** to load data

#### Editing Records (Admin Only)
1. Click the **Edit** icon (pencil) on a row
2. Modify the fuel amount, meter readings, or comment
3. Click **"Save"** to apply changes

#### Deleting Records (Admin Only)
1. Click the **Delete** icon (trash) on a row
2. Review the fuel refill details
3. Enter a reason for deletion
4. Click **"Delete"** to confirm

#### Exporting Data
1. Filter data as desired
2. Click the **Export** button (top right of table)
3. Select **Excel** format
4. File downloads as `FuelRefills_YYYY-MM-DD.xlsx`

### For Developers

#### Adding Additional Columns
Edit `FuelRefillTable.js` and add a new `<Column>` component:

```javascript
<Column
  dataField="fieldName"
  caption="Display Name"
  width={100}
  dataType="string"
  alignment="left"
/>
```

#### Customizing Filters
Modify the `HeaderStockFilters` component in `FuelRefillTab.js`:

```javascript
<HeaderStockFilters
  showUserFilter={true}  // Add user filter
  onApplyFilters={handleApplyFilters}
/>
```

#### Adding Statistics
Update the `statistics` useMemo in `FuelRefillTab.js`:

```javascript
const statistics = useMemo(() => {
  return {
    totalRefills: fuelRefillData.length,
    // Add new metrics here
  };
}, [fuelRefillData]);
```

## Security Considerations

1. **Permission-Based Access**: All edit/delete operations require specific permissions
2. **Audit Trail**: Delete operations capture the reason in the database
3. **Input Validation**: Both frontend and backend validate all inputs
4. **Authorization Filter**: Backend enforces `RequirePermissionAttribute` on all endpoints
5. **Data Filtering**: Filters are applied server-side to ensure data integrity

## Performance Optimizations

1. **Pagination**: Table uses 20 items per page by default
2. **Virtual Scrolling**: Enabled for efficient handling of large datasets
3. **Memoization**: Components and calculations are memoized to prevent unnecessary re-renders
4. **Lazy Loading**: Data loads only when filters are applied
5. **Search Optimization**: Uses DevExtreme's built-in search panel

## Troubleshooting

### No Data Showing
- Verify date range is selected
- Check if filters are too restrictive
- Ensure FuelRefill records exist in the selected period/site/tank

### Edit/Delete Buttons Disabled
- User lacks `_Update_tankStock` or `_Delete_tankStock` permission
- Contact admin to assign required permissions

### API Errors
- Check network tab for response details
- Verify backend endpoints are accessible
- Ensure JWT token is valid

### Export Not Working
- Verify Excel export is enabled on DevExtreme
- Check browser popup blocker settings
- Ensure data is loaded before attempting export

## Future Enhancements

1. **Bulk Operations**: Select multiple rows for batch edit/delete
2. **Advanced Filtering**: Add vehicle type, driver name filters
3. **Trend Analysis**: Charts showing fuel refill trends over time
4. **Duplicate Detection**: Alert on suspicious duplicate refills
5. **Integration with Fuel Audit**: Link refills to audit records
6. **CSV Import**: Bulk upload fuel refill data

## File Structure

```
fms.frontend/src/
├── api/
│   └── fuelRefillClient.js (NEW)
├── pages/tankStock/
│   └── fueldatacomparison/
│       ├── FuelDataComparisonMain.js (UPDATED)
│       ├── FuelDataComparisonMain.scss (NEW)
│       ├── FuelRefillTab.js (NEW)
│       ├── FuelRefillTab.scss (NEW)
│       ├── components/
│       │   ├── FuelRefillTable.js (NEW)
│       │   └── FuelRefillTable.scss (NEW)
│       └── modals/
│           ├── FuelRefillEditModal.js (NEW)
│           ├── FuelRefillEditModal.scss (NEW)
│           ├── FuelRefillDeleteModal.js (NEW)
│           └── FuelRefillDeleteModal.scss (NEW)
```

## Dependencies

- React 18+
- DevExtreme React Components
- Redux
- React Router
- Tailwind CSS
- ExcelJS (for export)
- File-saver (for download)

## Testing Checklist

- [ ] Tab navigation works correctly
- [ ] Filters apply and refresh data
- [ ] Statistics update with filtered data
- [ ] Edit modal opens and saves changes
- [ ] Delete modal captures reason and deletes
- [ ] Export to Excel generates correct file
- [ ] Permission checks work (test with non-admin user)
- [ ] Pagination works for large datasets
- [ ] Search/filter in table works
- [ ] Column chooser allows hiding/showing columns
- [ ] Responsive design works on mobile

---

**Created**: 2025-12-04
**Status**: Ready for Testing
