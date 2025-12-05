# Fuel Refill Tab - Quick Start Guide

## What Was Built

A new **"Fuel Refill Data"** tab in FuelDataComparison showing fuel refill records in an editable table with filters.

## New Files Created

### Frontend Code (7 components)
1. **fuelRefillClient.js** - API methods to fetch/create/update/delete fuel refills
2. **FuelRefillTab.js** - Main tab component with filters and statistics
3. **FuelRefillTable.js** - Data grid table component
4. **FuelRefillEditModal.js** - Modal to edit refill records
5. **FuelRefillDeleteModal.js** - Modal to delete with reason tracking

### Updated Files
- **FuelDataComparisonMain.js** - Added tab panel with two tabs

### Styling (5 SCSS files)
- FuelDataComparisonMain.scss
- FuelRefillTab.scss
- FuelRefillTable.scss
- FuelRefillEditModal.scss
- FuelRefillDeleteModal.scss

## Key Features

✅ **Tabbed Interface** - Dashboard + Refill Data tabs
✅ **Filters** - Date range, Site, Tank (uses HeaderStockFilters)
✅ **Editable Table** - View all refill records with 10+ columns
✅ **Admin-Only** - Edit/Delete restricted to users with permissions
✅ **Statistics** - Shows total refills, fuel amount, averages
✅ **Export** - Download filtered data to Excel
✅ **Search** - Find records by any column
✅ **Pagination** - 20 items per page, configurable

## How It Works

### User Flow
1. Go to TankStock > Fuel Data Comparison
2. Click "Fuel Refill Data" tab
3. Set date range, site, tank filters
4. Click "Apply" to see data
5. Edit/Delete records if admin
6. Export to Excel if needed

### Admin Controls
- **Edit**: Click pencil icon to modify amount, readings, comments
- **Delete**: Click trash icon, provide reason, confirm
- Requires `_Update_tankStock` and `_Delete_tankStock` permissions

### Data Flow
```
User Filters → API Call → Load Data → Display in Table
                ↓
         Edit/Delete → Modal → API → Refresh Table
```

## Backend Requirements

### Existing Endpoints
The implementation uses these existing endpoints:
- `GET /api/v1/FuelRefill` - List with filters
- `GET /api/v1/FuelRefill/{id}` - Get by ID
- `GET /api/v1/FuelRefill/summary` - Summary data

### If Missing Endpoints
Need to add to `FuelRefillController.cs`:
- `PUT /api/v1/FuelRefill/{id}` - Update record
- `DELETE /api/v1/FuelRefill/{id}` - Delete record

## Integration Points

### Context
Uses `StockFilterContext` for date/site/tank filters (shared with StockAnalysis)

### Permissions
Uses `usePermissions()` hook for `_Update_tankStock` and `_Delete_tankStock`

### State Management
Gets sites/vehicles from Redux store for lookups

## Testing Checklist

- [ ] Can see two tabs: "Comparison Dashboard" and "Fuel Refill Data"
- [ ] Filters work (date, site, tank)
- [ ] Data loads when "Apply" is clicked
- [ ] Statistics show correct counts
- [ ] Non-admin users can't see Edit/Delete buttons
- [ ] Admin users can edit records
- [ ] Admin users can delete with reason
- [ ] Export to Excel works
- [ ] Search finds records
- [ ] Pagination works for large datasets

## Common Tweaks

### Change Items Per Page
Edit `FuelRefillTable.js` line ~200:
```javascript
pageSize: 50  // Instead of 20
```

### Add New Column
In `FuelRefillTable.js`, add:
```javascript
<Column
  dataField="fieldName"
  caption="Label"
  width={100}
/>
```

### Change Statistics
In `FuelRefillTab.js`, update the `statistics` useMemo.

### Hide User Filter
In `FuelRefillTab.js`, already set to `showUserFilter={false}`

## API Client Methods

All in `fuelRefillClient.js`:

```javascript
// Get list with filters
getFuelRefillList(take, skip, startDate, endDate, siteId)

// Get one record
getFuelRefillById(id)

// Get summary
getFuelRefillSummary(startDate, endDate)

// Get summary by site
getFuelRefillSummaryBySite(siteId, startDate, endDate)

// Create new
createFuelRefill(fuelRefillDTO)

// Update existing
updateFuelRefill(id, fuelRefillDTO)

// Delete record
deleteFuelRefill(id)
```

## Permissions Needed

For edit/delete to work, users need one of:
- `_Update_tankStock` - For editing
- `_Delete_tankStock` - For deleting
- Or `_Admin` - Admin override

Permission system checks both frontend and backend.

## File Locations

```
✅ fms.frontend/src/api/fuelRefillClient.js
✅ fms.frontend/src/pages/tankStock/fueldatacomparison/FuelRefillTab.js
✅ fms.frontend/src/pages/tankStock/fueldatacomparison/components/FuelRefillTable.js
✅ fms.frontend/src/pages/tankStock/fueldatacomparison/modals/FuelRefillEditModal.js
✅ fms.frontend/src/pages/tankStock/fueldatacomparison/modals/FuelRefillDeleteModal.js
✅ fms.frontend/src/pages/tankStock/fueldatacomparison/FuelDataComparisonMain.js (UPDATED)
```

## Next Steps

1. **Verify Backend Endpoints** - Ensure PUT and DELETE endpoints exist
2. **Test with Real Data** - Check filters work with your fuel refill data
3. **Verify Permissions** - Make sure permission system recognizes new operations
4. **Train Users** - Explain edit/delete functionality to admins
5. **Monitor Usage** - Track deletion reasons in audit log

## Support

See `FUEL_REFILL_TAB_IMPLEMENTATION.md` for detailed documentation and troubleshooting.

---

**Last Updated**: 2025-12-04
**Status**: Ready for Integration Testing
