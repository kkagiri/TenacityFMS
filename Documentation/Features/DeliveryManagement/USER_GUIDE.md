# Delivery Management - Quick Start Guide

## Accessing Delivery Management

1. Navigate to **Tank Stock** module
2. Click on **Management** section
3. Select the **Delivery Management** tab (truck icon)

## Using Filters

The delivery list automatically uses the filters from the header:
- **Date Range**: Select start and end dates
- **Site**: Choose specific site(s) or "All Sites"
- **Tank**: Optionally filter by specific tanks

Click **Refresh** to reload data with current filters.

## Creating a New Delivery

### Steps:
1. Click **New Delivery** button (top right)
2. Fill in required fields:
   - **Tank**: Select the tank receiving delivery
   - **Supplier**: Choose the supplier
   - **Delivery Date & Time**: When the delivery occurred (cannot be future)
   - **Delivery Amount**: Quantity in liters (must be > 0)
3. Optional fields:
   - LPO Number
   - Price Per Liter
   - Sensor Amount
   - Temperature, Density, Mass
   - Stock Before/After Delivery
4. Click **Create Delivery**

### Important Notes:
- ✅ Only **one delivery per tank per day** is allowed
- ✅ Tank must have **opening stock** for the delivery date
- ✅ Tank must have **enough capacity** for the delivery
- ✅ Cannot add delivery **after closing stock** without new opening stock
- ✅ Automatically creates **TankVolumeHistory** record

## Editing a Delivery (Correction)

### Steps:
1. Find the delivery in the grid
2. Click the **Edit** button (pencil icon)
3. Modify the necessary fields
4. **Important**: Provide a **Correction Reason** (required)
5. Click **Update Delivery**

### What Happens:
- Creates a **correction entry** with updated values
- **Soft deletes** the original delivery (not permanently removed)
- Updates **TankVolumeHistory** accordingly
- Maintains full **audit trail**

### Notes:
- ⚠️ Cannot change the **tank** when editing
- ⚠️ Must provide **correction reason**
- ✅ Correction entries are flagged in the grid (Is Correction column)

## Deleting a Delivery

### Steps:
1. Find the delivery in the grid
2. Click the **Delete** button (trash icon)
3. Confirm the deletion

### What Happens:
- **Soft deletes** the delivery (sets IsDeleted = true, not permanently removed)
- Updates **DeletedAt** timestamp and **DeletedBy** user
- Soft deletes associated **TankVolumeHistory** record
- Updates tank's **current stock** if using bookkeeping

### Important:
- ⚠️ Deletion is **soft delete**, data is preserved for audit
- ⚠️ Validates **future records policy** for historical deletions
- ✅ Can be recovered by database administrator if needed

## Grid Features

### Sorting
- Click any column header to sort
- Click again to reverse sort order

### Filtering
- Use the **filter row** (text boxes under headers)
- Use **header filters** (funnel icon) for multi-select
- Use **Filter Panel** for complex filters

### Grouping
- Drag column headers to the **Group Panel** at top
- Groups can be collapsed/expanded
- Shows group summaries

### Export
- Click **Export** button to download to Excel
- Includes all visible columns and current filters
- Formatted with dates, numbers, and currency

### Summary Row
- Shows at bottom of grid
- **Total Manual Amount**: Sum of all manual delivery amounts
- **Total Sensor Amount**: Sum of all sensor delivery amounts

## Columns Explained

| Column | Description |
|--------|-------------|
| **ID** | Unique delivery identifier |
| **Delivery Date** | When the delivery occurred |
| **Site** | Site where tank is located |
| **Tank** | Tank that received delivery |
| **Product** | Fuel type (Diesel, Petrol, etc.) |
| **Manual Amount** | Delivery quantity in liters (manually entered) |
| **Sensor Amount** | Quantity detected by ATG sensor (optional) |
| **Stock Before** | Tank level before delivery |
| **Stock After** | Tank level after delivery |
| **Supplier** | Company that supplied the fuel |
| **LPO Number** | Local Purchase Order number |
| **Price/L** | Cost per liter |
| **Temp (°C)** | Temperature at delivery |
| **Density** | Fuel density measurement |
| **Created On** | When record was created |
| **Is Correction** | Indicates if this is a correction entry |
| **Actions** | Edit and Delete buttons |

## Permissions Required

You need specific permissions to perform actions:

| Action | Permission | Description |
|--------|-----------|-------------|
| View deliveries | `_Read_Delivery` | Required to see delivery list |
| Create delivery | `_Create_Delivery` | Required to add new deliveries |
| Edit delivery | `_Update_Delivery` | Required to modify deliveries |
| Delete delivery | `_Delete_Delivery` | Required to remove deliveries |

**Note**: If you don't have permission, the corresponding button will not appear.

## Common Workflows

### Workflow 1: Recording Today's Delivery
1. Ensure opening stock exists for today
2. Click **New Delivery**
3. Select tank and supplier
4. Enter delivery amount from delivery note
5. Optionally enter price and LPO number
6. Click **Create Delivery**
7. Verify tank stock updated correctly

### Workflow 2: Correcting an Error
1. Find the incorrect delivery
2. Click **Edit** button
3. Correct the wrong values
4. Enter reason (e.g., "Corrected delivery amount from delivery note")
5. Click **Update Delivery**
6. Verify correction entry created

### Workflow 3: Removing Invalid Entry
1. Identify the invalid delivery
2. Click **Delete** button
3. Confirm deletion
4. Verify delivery removed from active list
5. Check tank volume history updated

### Workflow 4: Monthly Report Export
1. Set date range to desired month
2. Select "All Sites" or specific site
3. Apply any additional filters
4. Click **Export** button
5. Open Excel file
6. Review delivery totals and details

## Troubleshooting

### "Opening stock not found" Error
**Problem**: Tank doesn't have opening stock for the delivery date.
**Solution**:
1. Go to Transaction Hub
2. Create opening stock for the tank for that date
3. Return to Delivery Management
4. Try creating delivery again

### "Tank does not have enough space" Error
**Problem**: Delivery amount exceeds tank capacity.
**Solution**:
1. Check tank volume (capacity)
2. Check current stock level
3. Verify delivery amount is correct
4. If correct, may need to adjust tank configuration

### "A delivery already exists on this date" Error
**Problem**: One delivery per tank per day limit reached.
**Solution**:
1. Check if delivery already recorded
2. If incorrect, delete existing delivery first
3. Or edit the existing delivery instead
4. Or split delivery across multiple days if appropriate

### Can't See Edit/Delete Buttons
**Problem**: Missing permissions.
**Solution**:
1. Contact system administrator
2. Request `_Update_Delivery` or `_Delete_Delivery` permission
3. Permissions are role-based, may need role change

### Delivery Not Updating Tank Stock
**Problem**: BookKeeping setting may be off.
**Solution**:
1. Check tank configuration
2. Verify `UseBookKeeping` is enabled
3. Current stock only updates for same-day deliveries
4. Historical deliveries don't update current stock

## Best Practices

### ✅ DO:
- Record deliveries on the same day they occur
- Enter accurate delivery amounts from delivery notes
- Include LPO numbers for tracking
- Provide clear correction reasons when editing
- Verify stock levels before and after delivery
- Export monthly reports for reconciliation

### ❌ DON'T:
- Create multiple deliveries for same tank on same day
- Enter future-dated deliveries
- Delete deliveries without valid reason
- Modify deliveries without correction reason
- Skip opening/closing stock entries
- Ignore validation error messages

## Tips & Tricks

1. **Quick Tank Selection**: Type to search in tank dropdown
2. **Date Shortcuts**: Use date picker's "Today" button
3. **Bulk Review**: Use grouping by site or supplier
4. **Audit Trail**: Check "Is Correction" column to see corrections
5. **Quick Export**: Export filtered data for specific analysis
6. **Stock Verification**: Compare Manual Amount vs Sensor Amount for accuracy

## Related Features

- **Transaction Hub**: View all tank transactions including deliveries
- **Tank Configuration**: Set up tank capacity and bookkeeping
- **Opening/Closing Stock**: Manage daily stock readings
- **Adjustments**: Handle stock corrections outside deliveries
- **Reports**: Generate delivery and stock reports

## Need Help?

Contact your system administrator if you:
- Need additional permissions
- Encounter persistent errors
- Need to recover deleted deliveries
- Require training on the system
- Have questions about business rules

---

**Version**: 1.0
**Last Updated**: 2025-11-18
**Module**: Tank Stock Management > Delivery Management
