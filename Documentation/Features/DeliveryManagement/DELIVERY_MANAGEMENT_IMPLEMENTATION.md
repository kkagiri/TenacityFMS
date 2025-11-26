# Delivery Management Feature - Implementation Guide

## Overview
Added comprehensive Delivery Management functionality to the Tank Stock Management system. This feature allows users to manage fuel deliveries with automatic tank volume history integration and future records policy enforcement.

## Implementation Date
2025-11-18

## Features Implemented

### 1. Backend Implementation

#### A. Soft Delete Command
**File**: `FMS.Application/Features/TankManagement/Deliveries/Commands/SoftDeleteDeliveryCommand.cs`

- Implements soft delete pattern (sets `IsDeleted`, `DeletedAt`, `DeletedBy`)
- Validates user permissions before deletion
- Checks future records policy for historical deletions
- Automatically soft deletes associated `TankVolumeHistory` record
- Updates tank's current stock if using bookkeeping and it's current day
- Comprehensive logging and error handling

**Key Features**:
- Future records validation via `TankStockFutureRecordsService`
- Automatic TankVolumeHistory synchronization
- Bookkeeping stock adjustment
- User tracking (DeletedBy field)

#### B. Controller Endpoints
**File**: `FMS.WebClient/Controllers/DeliveryController.cs`

Added three new endpoints:

1. **PUT /api/v1/Delivery/update**
   - Updates delivery using correction-based approach
   - Creates correction entry and soft deletes original
   - Requires `_Update_Delivery` permission

2. **DELETE /api/v1/Delivery/{id}**
   - Soft deletes delivery by ID
   - Requires `_Delete_Delivery` permission
   - Returns success/failure message

3. **Request Model**: `UpdateDeliveryRequest`
   - Contains `OriginalDeliveryId` and `CorrectionData`

#### C. DTO Updates
**File**: `FMS.Application/Features/TankManagement/Deliveries/DTOs/DeliveryCorrectionDto.cs`

Updated to make optional fields properly nullable:
- `StockBeforeDelivery` - Optional
- `StockAfterDelivery` - Optional
- `PricePerLiter` - Optional

### 2. Frontend Implementation

#### A. API Client
**File**: `fms.frontend/src/api/deliveryApi.js`

Complete API client with methods:
- `getDeliveries()` - Get all deliveries
- `getDeliveriesByDateRange(startDate, endDate)` - Filter by date range
- `getDeliveriesByDateRangeAndSite(startDate, endDate, siteId)` - Filter by date range and site
- `createDelivery(deliveryData)` - Create new delivery
- `updateDelivery(originalDeliveryId, correctionData)` - Update (correction-based)
- `softDeleteDelivery(deliveryId)` - Soft delete delivery

#### B. DeliveryManager Component
**File**: `fms.frontend/src/pages/tankStock/management/components/DeliveryManager.js`

**Features**:
- DevExtreme DataGrid with full CRUD operations
- Uses shared filters from `TankStockLayout` (site, tank, date range)
- JWT-based permission checks:
  - `_Read_Delivery`
  - `_Create_Delivery`
  - `_Update_Delivery`
  - `_Delete_Delivery`
- Excel export functionality
- Enriched data display (tank names, site names, supplier names)
- Responsive layout with loading indicators

**Grid Columns**:
- ID, Delivery Date, Site, Tank, Product
- Manual Amount, Sensor Amount
- Stock Before/After Delivery
- Supplier, LPO Number, Price/Liter
- Temperature, Density, Mass
- Created On, Is Correction
- Action buttons (Edit, Delete)

**Summary Features**:
- Total sum of manual delivery amounts
- Total sum of sensor delivery amounts
- Grouping and filtering capabilities

#### C. DeliveryForm Component
**File**: `fms.frontend/src/pages/tankStock/management/components/forms/DeliveryForm.js`

**Form Sections**:

1. **Delivery Information** (Required)
   - Tank (select box with search)
   - Supplier (select box with search)
   - Delivery Date & Time (datetime picker, max = now)
   - Delivery Amount in Liters (number input)
   - LPO Number (text input)
   - Price Per Liter (currency input)

2. **Additional Details** (Optional)
   - Sensor Delivery Amount
   - Temperature (°C)
   - Density
   - Mass
   - Stock Before Delivery
   - Stock After Delivery

3. **Correction Details** (Edit Mode Only)
   - Correction Reason (required for updates)

**Validation**:
- Tank selection required
- Supplier selection required
- Delivery amount > 0
- Delivery date required
- Correction reason required for edits
- Auto-populates product from selected tank

**Information Notes**:
- Create mode: Explains automatic TankVolumeHistory update and one-per-day rule
- Edit mode: Explains correction entry creation and soft delete process

#### D. Styling
**Files**:
- `DeliveryManager.scss`
- `DeliveryForm.scss`

Uses Tailwind CSS with `tw-` prefix (as per project standards):
- Responsive layouts
- Hover states
- Form styling
- Grid customization
- Color schemes matching existing design

#### E. Integration with StockManagement
**File**: `fms.frontend/src/pages/tankStock/management/StockManagement.js`

Added "Delivery Management" as second tab (index 1):
- Tab icon: `fa-light fa-truck-container`
- Lazy loading support
- Integrated with shared filter context

**Tab Order**:
1. Transaction Hub
2. **Delivery Management** (NEW)
3. Pump Transactions
4. Dispensing Volumes
5. Bulk Import

## Key Business Rules Enforced

### 1. TankVolumeHistory Integration
- **Create**: Automatically creates TankVolumeHistory record with `ChangeReason.Delivery`
- **Update**: Soft deletes old history, creates new history with correction entry
- **Delete**: Soft deletes associated TankVolumeHistory record

### 2. Future Records Policy
As implemented in `CreateDeliveryCommand.cs`:
- Validates historical entries against future records
- Prevents/warns based on system configuration
- Logs warnings for audit trail

### 3. One Delivery Per Day Rule
```csharp
// Prevent multiple deliveries on the same tank within the same calendar day
var deliveryExistsSameDay = await _context.Deliveries
    .AnyAsync(d => d.TankId == tankId && d.DeliveryDate.Date == deliveryDate.Date);
```

### 4. Opening Stock Requirement
- Delivery requires opening stock for the day
- Cannot add delivery after closing stock without new opening stock
- Maintains proper transaction sequence

### 5. Tank Capacity Validation
```csharp
if (tank.TankVolume < tank.CurrentStock + deliveryAmount)
    return Error("Tank does not have enough space");
```

### 6. Bookkeeping Integration
- Updates `tank.CurrentStock` if `UseBookKeeping == 1`
- Only for current day deliveries
- Reversed on soft delete

## Permissions Required

### Backend
- `_Create_Delivery` - Create new deliveries
- `_Read_Delivery` - View deliveries (commented out in some endpoints)
- `_Update_Delivery` - Update deliveries (correction-based)
- `_Delete_Delivery` - Soft delete deliveries

### Frontend
Same permissions checked via JWT token using `usePermissions()` hook.

## Data Flow

### Create Delivery
```
User Form → deliveryApi.createDelivery()
→ POST /api/v1/Delivery/Create
→ CreateDeliveryCommand
→ TankVolumeHistoryIntegrationService.ProcessDeliveryChangeAsync()
→ Database Update
→ Success Response
```

### Update Delivery (Correction)
```
User Form → deliveryApi.updateDelivery()
→ PUT /api/v1/Delivery/update
→ UpdateDeliveryCommand
→ DeleteTankVolumeHistoryCommand (soft delete old)
→ CreateDeliveryCommand (create correction entry)
→ Database Update
→ Success Response
```

### Soft Delete Delivery
```
User Action → deliveryApi.softDeleteDelivery()
→ DELETE /api/v1/Delivery/{id}
→ SoftDeleteDeliveryCommand
→ TankStockFutureRecordsService.ValidateHistoricalDeletionAsync()
→ DeleteTankVolumeHistoryCommand
→ Soft Delete Delivery (IsDeleted = true)
→ Update Tank.CurrentStock (if applicable)
→ Success Response
```

## Filter Integration

Uses shared filters from `StockFilterContext`:
- **Date Range**: `startDate`, `endDate`
- **Site Selection**: `selectedSiteIds` (single or multiple)
- **Tank Selection**: `selectedTankIds` (optional)

Filtering logic:
1. If single site selected → Use `getDeliveriesByDateRangeAndSite()`
2. If all sites or multiple → Use `getDeliveriesByDateRange()`, then filter client-side
3. Apply tank filter if tanks selected

## Error Handling

### Backend
- Validation errors return `FMSResponseMessage.Success = false`
- All exceptions logged via `ILogger`
- User-friendly error messages
- Future records policy violations clearly communicated

### Frontend
- Toast notifications for all operations
- Loading indicators during async operations
- Form validation before submission
- Confirmation dialogs for destructive actions

## Testing Checklist

### Backend Tests
- [ ] Create delivery with valid data
- [ ] Create delivery on same tank/day (should fail)
- [ ] Create delivery without opening stock (should fail)
- [ ] Create delivery exceeding tank capacity (should fail)
- [ ] Update delivery (correction entry created)
- [ ] Soft delete delivery (TankVolumeHistory also deleted)
- [ ] Validate future records policy enforcement
- [ ] Test bookkeeping stock updates

### Frontend Tests
- [ ] Load deliveries with date range filter
- [ ] Filter by single site
- [ ] Filter by multiple sites
- [ ] Filter by tanks
- [ ] Create new delivery
- [ ] Edit existing delivery
- [ ] Soft delete delivery
- [ ] Export to Excel
- [ ] Permission checks (all 4 permissions)
- [ ] Form validation (all required fields)
- [ ] Responsive layout on different screen sizes

## Files Changed/Created

### Backend
1. ✅ `FMS.Application/Features/TankManagement/Deliveries/Commands/SoftDeleteDeliveryCommand.cs` (NEW)
2. ✅ `FMS.WebClient/Controllers/DeliveryController.cs` (MODIFIED - added update & delete endpoints)
3. ✅ `FMS.Application/Features/TankManagement/Deliveries/DTOs/DeliveryCorrectionDto.cs` (MODIFIED - optional fields)

### Frontend
4. ✅ `fms.frontend/src/api/deliveryApi.js` (NEW)
5. ✅ `fms.frontend/src/pages/tankStock/management/components/DeliveryManager.js` (NEW)
6. ✅ `fms.frontend/src/pages/tankStock/management/components/forms/DeliveryForm.js` (NEW)
7. ✅ `fms.frontend/src/pages/tankStock/management/components/DeliveryManager.scss` (NEW)
8. ✅ `fms.frontend/src/pages/tankStock/management/components/forms/DeliveryForm.scss` (NEW)
9. ✅ `fms.frontend/src/pages/tankStock/management/StockManagement.js` (MODIFIED - added tab)

## Dependencies

### Backend
- `FMS.Application.Services.TankStock.TankStockFutureRecordsService`
- `FMS.Application.Services.TankStock.TankVolumeHistoryIntegrationService`
- `FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand.DeleteTankVolumeHistoryCommand`
- `MediatR` for command handling

### Frontend
- `react`, `react-redux`
- `devextreme-react` (DataGrid, Form, Popup, etc.)
- `exceljs`, `file-saver-es` for Excel export
- `usePermissions` hook for JWT permission checks
- `useStockFilters` context for shared filters

## Known Limitations

1. **One Delivery Per Day**: Current business rule allows only one delivery per tank per day
2. **Historical Changes**: Require future records policy compliance
3. **Correction Pattern**: Updates don't modify original, they create correction entries
4. **Date Restrictions**: Cannot create deliveries with future dates

## Future Enhancements

1. Add delivery attachments (invoices, receipts)
2. Implement delivery approval workflow
3. Add delivery comparison reports (manual vs sensor)
4. Integrate with supplier invoicing system
5. Add bulk delivery import from supplier systems
6. Implement delivery notification system
7. Add delivery analytics dashboard
8. Support partial deliveries across multiple days

## Support & Troubleshooting

### Common Issues

**Issue**: "Opening stock not found"
- **Solution**: Create opening stock for the tank for the delivery date first

**Issue**: "Tank does not have enough space"
- **Solution**: Check tank volume and current stock levels, adjust delivery amount

**Issue**: "A delivery already exists on this date"
- **Solution**: Only one delivery per tank per day allowed, edit existing or delete and recreate

**Issue**: "Future records policy violation"
- **Solution**: Check system configuration for historical entry policy, may need admin override

### Debug Points
1. Check `CreateDeliveryCommand` logs for validation failures
2. Verify `TankVolumeHistory` records are created/deleted correctly
3. Check `Tank.CurrentStock` updates for bookkeeping tanks
4. Verify user permissions in JWT token
5. Check browser console for API errors

## Conclusion

The Delivery Management feature provides a comprehensive solution for managing fuel deliveries with proper audit trails, permission controls, and integration with the tank volume history system. The implementation follows the project's established patterns (CQRS, FMSResponse, JWT permissions, Tailwind with tw- prefix) and maintains data integrity through validation and soft delete patterns.
