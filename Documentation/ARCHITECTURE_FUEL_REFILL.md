# Fuel Refill Tab - Architecture & Data Flow

## Component Hierarchy

```
FuelDataComparisonMain (Router + TabPanel)
├── Tab 1: FuelDataComparisonDashboard (Existing)
└── Tab 2: FuelRefillTab (NEW)
    ├── HeaderStockFilters
    │   ├── DateRangeBox
    │   ├── Site TagBox
    │   ├── Tank TagBox
    │   └── Apply/Reset Buttons
    ├── Statistics Cards (4 stats)
    └── FuelRefillTable (DataGrid)
        ├── Columns (11 total)
        ├── Search Panel
        ├── Filter Row
        ├── Pager
        └── Toolbar (Export button)
```

## Data Flow Diagram

### Initial Load
```
User Opens FuelRefillTab
    ↓
useEffect triggers with empty filters
    ↓
setIsLoading(true)
    ↓
loadFuelRefillData() called
    ↓
Notification: "Select dates and click Apply"
    ↓
setIsLoading(false)
```

### Filter Application
```
User Sets Filters → Clicks Apply
    ↓
handleApplyFilters()
    ↓
loadFuelRefillData()
    ↓
getFuelRefillList(take, skip, startDate, endDate, siteId)
    ↓
API Call to GET /api/v1/FuelRefill
    ↓
[Response: Array of FuelRefillDTO]
    ↓
Filter by selectedTankIds (client-side)
    ↓
setFuelRefillData(filteredData)
    ↓
Calculate statistics
    ↓
Render Table with data
```

### Edit Flow
```
User Clicks Edit Icon
    ↓
setSelectedRowForEdit(row)
    ↓
FuelRefillEditModal Opens
    │
    ├─ User Modifies Fields
    ├─ User Clicks Save
    │
    ↓
handleSave() validates data
    ↓
updateFuelRefill(id, updateData)
    ↓
API Call to PUT /api/v1/FuelRefill/{id}
    ↓
[Response: Success/Error]
    ↓
notify(message)
    ↓
onSave callback → loadFuelRefillData()
    ↓
Table refreshes with updated data
```

### Delete Flow
```
User Clicks Delete Icon
    ↓
setSelectedRowForDelete(row)
    ↓
FuelRefillDeleteModal Opens
    │
    ├─ User Enters Deletion Reason
    ├─ Reason validation (not empty)
    ├─ User Clicks Delete
    │
    ↓
handleConfirmDelete(deleteReason)
    ↓
setIsDeleting(true)
    ↓
deleteFuelRefill(id)
    ↓
API Call to DELETE /api/v1/FuelRefill/{id}
    │ (Reason sent to backend)
    │
    ↓
[Response: Success/Error]
    ↓
notify(message)
    ↓
onRefresh callback → loadFuelRefillData()
    ↓
Table refreshes, deleted row removed
```

## State Management

### Component State (FuelRefillTab.js)
```javascript
isLoading              // Data loading state
fuelRefillData         // Array of fuel refill records
allSites              // Sites from Redux
allVehicles           // Vehicles from Redux
```

### Context State (StockFilterContext)
```javascript
startDate             // Filter: Start date
endDate               // Filter: End date
selectedSiteIds       // Filter: Selected sites array
selectedTankIds       // Filter: Selected tanks array
setStartDate          // Setter
setEndDate            // Setter
setSelectedSiteIds    // Setter
setSelectedTankIds    // Setter
```

### Local Component State (FuelRefillTable.js)
```javascript
selectedRowForEdit     // Row being edited
selectedRowForDelete   // Row being deleted
isDeleting            // Delete operation state
```

## API Endpoints

### Read Operations
```
GET /api/v1/FuelRefill
├─ Parameters:
│  ├─ take (default: 100)
│  ├─ skip (default: 0)
│  ├─ startDate (ISO 8601)
│  ├─ endDate (ISO 8601)
│  └─ siteId (optional)
├─ Authorization: JWT + _Read_FuelRefill
└─ Returns: FuelRefilDTO[]

GET /api/v1/FuelRefill/{id}
├─ Authorization: JWT + _Read_FuelRefill
└─ Returns: FuelRefilDTO

GET /api/v1/FuelRefill/summary
├─ Parameters:
│  ├─ startDate
│  └─ endDate
├─ Authorization: JWT + _Read_FuelRefill
└─ Returns: Summary data

GET /api/v1/FuelRefill/summary/{siteId}
├─ Parameters:
│  ├─ startDate
│  └─ endDate
├─ Authorization: JWT + _Read_FuelRefill
└─ Returns: Summary data by site
```

### Write Operations (To Be Implemented)
```
PUT /api/v1/FuelRefill/{id}
├─ Body: FuelRefilDTO
├─ Authorization: JWT + _Update_tankStock
└─ Returns: { success, message }

DELETE /api/v1/FuelRefill/{id}
├─ Body: { reason: string }
├─ Authorization: JWT + _Delete_tankStock
└─ Returns: { success, message }
```

## Permission System

### Frontend Permission Check
```javascript
const { hasPermission } = usePermissions();
const canEdit = hasPermission('_Update_tankStock');
const canDelete = hasPermission('_Delete_tankStock');

// Actions disabled/hidden if permissions false
{canEdit && <Button onClick={edit} />}
{canDelete && <Button onClick={delete} />}
```

### Backend Permission Check
```csharp
[RequirePermission("_Update_tankStock")]
public async Task<IActionResult> UpdateFuelRefill(...)

[RequirePermission("_Delete_tankStock")]
public async Task<IActionResult> DeleteFuelRefill(...)
```

### Permission Flow
```
User Clicks Edit
    ↓
Frontend: hasPermission('_Update_tankStock') check
    ├─ If false: Button disabled/hidden
    └─ If true: Open modal
        ↓
    User Clicks Save
        ↓
    API Call with JWT token
        ↓
    Backend: Extract user claims
        ↓
    Backend: RequirePermissionAttribute checks permission
        ├─ If false: Return 403 Forbidden
        └─ If true: Process request
```

## Data Validation

### Client-Side (Modal Validation)
```
Edit Modal:
├─ Vehicle: Required
├─ Site: Required
├─ Date: Required (not future)
├─ Fuel Amount: > 0
├─ Meter Readings: >= 0
└─ Comment: Max 500 chars

Delete Modal:
└─ Reason: Required, Min 1 char, Max 500 chars
```

### Server-Side (Backend)
```
UpdateFuelRefillCommand:
├─ Validate FuelRefilDTO properties
├─ Check fuel amount > 0
├─ Verify vehicle exists
├─ Verify site exists
└─ Check for duplicate entries

DeleteFuelRefillCommand:
├─ Verify record exists
├─ Capture deletion reason
├─ Soft delete (mark as deleted)
└─ Create audit log entry
```

## Filter Logic

### Date Filter
```
startDate < date <= endDate
OR
startDate <= date < endDate
(Server-side filtering via FuelRefillGetListQuery)
```

### Site Filter
```
if (selectedSiteIds.length > 0)
  data.siteId in selectedSiteIds
else
  include all sites
(Server-side filtering via API parameter)
```

### Tank Filter
```
if (selectedTankIds.length > 0)
  data.tankId in selectedTankIds
else
  include all tanks
(Client-side filtering after API response)
```

## Performance Considerations

### Pagination
```
Server: Returns first 100 records
Page Size: 20 rows visible
Allowed: 10, 20, 50, 100 rows per page
Navigation: First, Previous, Next, Last, Go to Page
```

### Virtual Scrolling
```
Enabled: true
Renders only visible rows
Smooth scrolling for 1000+ records
```

### Memoization
```
useMemo: statistics calculation
useMemo: filteredTanks (when site changes)
useCallback: formatters, handlers
```

### Search & Filter Optimization
```
Search Panel: Client-side filtering
Filter Row: Client-side filtering
Header Filters: Client-side filtering
All optimized by DevExtreme DataGrid
```

## Column Definitions

| Field | Type | Format | Width | Filterable |
|-------|------|--------|-------|-----------|
| id | number | - | 70 | No |
| vehicleId | number | Lookup | 120 | Yes |
| siteId | number | Lookup | 120 | Yes |
| date | date | DD/MM/YYYY | 100 | Yes |
| manualFuelrefillAmount | decimal | #,##0.## | 100 | Yes |
| previousMeterReading | decimal | #,##0.## | 110 | Yes |
| currentMeterReading | decimal | #,##0.## | 110 | Yes |
| consumption | decimal | #,##0.## | 120 | Yes |
| driverId | number | - | 80 | Yes |
| tagId | string | - | 80 | Yes |
| comment | string | - | 150 | Yes |
| dateCreated | date | DD/MM/YYYY | 130 | Yes |
| actions | - | Edit/Delete | 100 | No |

## Export Functionality

### Excel Export Flow
```
User Clicks Export Button
    ↓
handleExportToExcel()
    ↓
dataGridRef.current.instance
    ↓
exportDataGrid() from devextreme
    ├─ Headers: Bold, Gray background
    ├─ Data: Formatted values
    └─ Sheet name: "Fuel Refills"
    ↓
new Workbook() from exceljs
    ↓
workbook.xlsx.writeBuffer()
    ↓
new Blob([buffer])
    ↓
saveAs() from file-saver
    ↓
Download: FuelRefills_YYYY-MM-DD.xlsx
```

## Error Handling

### API Errors
```
try {
  const response = await apiCall()
} catch (error) {
  // Log error
  console.error(error)

  // Show notification
  notify({
    message: error?.response?.data?.message || 'Operation failed',
    type: 'error',
    displayTime: 3000
  })
}
```

### Validation Errors
```
Modal saves attempt
    ↓
Validate required fields
    ├─ If invalid: notify(warning)
    └─ If valid: Call API
```

## Responsive Design

### Desktop (1024px+)
```
Header: Full width
Filters: 4 columns (date, site, tank, buttons)
Table: Full width with scrolling
Grid: 11 columns visible
```

### Tablet (768px-1023px)
```
Filters: Stack with sm breakpoints
Table: Horizontal scroll with action sticky
Grid: Column resizing enabled
```

### Mobile (<768px)
```
Filters: Full width stacked
Buttons: Full width at bottom
Table: Horizontal scroll enabled
Actions: Icon-only buttons
```

## Security

### Data Protection
```
✓ JWT token in Authorization header
✓ Server-side permission checks
✓ Input validation (client & server)
✓ SQL injection prevention (ORM)
✓ Soft delete (audit trail maintained)
```

### Audit Trail
```
On Delete:
├─ Record ID
├─ User ID (from JWT claims)
├─ Deletion Reason (from modal)
├─ Timestamp
└─ Previous values (for restore)
```

---

## Sequence Diagram: Complete Edit Operation

```
User                  Frontend              Backend              Database
  │                       │                    │                     │
  ├──Click Edit───────────>│                    │                     │
  │                        │                    │                     │
  │<──Modal Opens──────────┤                    │                     │
  │                        │                    │                     │
  │──Modify Fields─────────>│                    │                     │
  │                        │                    │                     │
  │──Click Save───────────>│                    │                     │
  │                        ├──Validate──────────│                     │
  │                        │                    ├──GET record────────>│
  │                        │                    │<──Record───────────┤
  │                        │<──Response─────────┤                     │
  │                        ├──API Call────────────────PUT─────────────>│
  │                        │                    │<──Updated────────┤
  │                        │<──Success response─┤                     │
  │<──Notification─────────┤                    │                     │
  │                        │                    │                     │
  │──Modal Closes──────────>│                    │                     │
  │                        │                    │                     │
  │                        ├──Refresh data──────────GET list────────>│
  │                        │                    │<──Records──────────┤
  │                        │<──Data─────────────┤                     │
  │<──Table Refreshed──────┤                    │                     │
```

---

**Document Version**: 1.0
**Last Updated**: 2025-12-04
**Status**: Final
