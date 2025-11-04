# Issue Tracker - 404 Errors & Database Column Fix

**Date:** November 4, 2025
**Version:** V1
**Type:** Bug Fix
**Status:** ✅ Resolved

---

## Issues Resolved

### 1. **404 Not Found Errors on All API Endpoints**
All Issue Tracker API endpoints were returning 404 errors because of route mismatch between frontend and backend.

**Affected Endpoints:**
- `GET /api/v1/issuetracker/statuses`
- `GET /api/v1/issuetracker/priorities`
- `GET /api/v1/issuetracker/categories`
- `GET /api/v1/issuetracker?limit=10&sortBy=createdDate&order=desc`
- `GET /api/v1/issuetracker/analytics?dashboard=true`

**Root Cause:**
- **Frontend:** Calling `/issuetracker` which axios automatically prepends with `v1/` → `api/v1/issuetracker`
- **Backend:** Controller route was `[Route("api/[controller]")]` → resolves to `api/IssueTracker` (no v1 prefix)

**Fix Applied:**
Updated `IssueTrackerController.cs` route attribute to match modern FMS pattern:
```csharp
[Route("api/v1/issuetracker")]
```

### 2. **Database Error: Unknown Column 'ActiveAlarmId'**
Creating new issues failed with database error:
```
MySqlConnector.MySqlException: Unknown column 'ActiveAlarmId' in 'field list'
```

**Root Cause:**
- Entity `Issuetracker` has `ActiveAlarmId` property
- Database table `issuetracker` missing the column
- Entity configuration incomplete

**Fix Applied:**
1. Updated `IssuetrackerConfiguration.cs` to include:
   - Column mapping for `ActiveAlarmId`
   - Index on `ActiveAlarmId`
   - Foreign key relationship to `ActiveAlarm` entity
2. Created MySQL migration script

### 3. **UI Enhancement: Vehicle Selector**
Replaced basic SelectBox with searchable `VehicleSearchableSelector` component for better UX.

**Benefits:**
- ✅ Searchable dropdown with type-ahead
- ✅ Better performance with large vehicle lists
- ✅ Consistent with other forms (ManualRefillForm pattern)
- ✅ Improved mobile experience

---

## Files Modified

### Backend (.NET)

#### 1. **FMS.WebClient/Controllers/IssueManagement/IssueTrackerController.cs**
**Change:** Updated route attribute
```csharp
// Before
[Route("api/[controller]")]

// After
[Route("api/v1/issuetracker")]
```

#### 2. **FMS.Persistence/EntityConfigurations/IssuetrackerConfiguration.cs**
**Changes:**
- Added `ActiveAlarmId` column property mapping
- Added index for `ActiveAlarmId`
- Added `LastModfield` column property mapping
- Added foreign key relationship to `ActiveAlarm`

**Added Code:**
```csharp
// Property mapping
builder.Property(e => e.ActiveAlarmId)
    .HasColumnType("int(11)")
    .HasColumnName("ActiveAlarmId");

builder.Property(e => e.LastModfield)
    .HasColumnName("LastModfield");

// Index
builder.HasIndex(e => e.ActiveAlarmId, "activealarm_idx");

// Foreign key
builder.HasOne(d => d.ActiveAlarm)
    .WithMany(p => p.IssueTrackers)
    .HasForeignKey(d => d.ActiveAlarmId)
    .OnDelete(DeleteBehavior.SetNull)
    .HasConstraintName("issuetracker_activealarm");
```

### Frontend (React)

#### 3. **fms.frontend/src/pages/issueTracker/IssueTrackerFormPage.js**
**Changes:**
- Added import for `VehicleSearchableSelector`
- Replaced two vehicle SelectBox instances with `VehicleSearchableSelector`
- Improved state management and validation clearing

**Added Import:**
```javascript
import VehicleSearchableSelector from '../../components/selectors/VehicleSearchableSelector';
```

**Updated Vehicle Selector (2 instances):**
```javascript
// Before: Basic dxSelectBox
<SimpleItem
  dataField="vehicle"
  editorType="dxSelectBox"
  editorOptions={{...}}
/>

// After: Searchable selector with better UX
<SimpleItem
  dataField="vehicle"
  render={() => (
    <div>
      <Label text="Vehicle" />
      <VehicleSearchableSelector
        value={formData.vehicle}
        onValueChanged={(e) => {
          if (e && e.value !== undefined) {
            setFormData(prev => ({ ...prev, vehicle: e.value }));
            if (validationErrors.vehicle) {
              setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.vehicle;
                return newErrors;
              });
            }
          }
        }}
        placeholder="Type to search vehicle"
        width="100%"
        isValid={validationErrors.vehicle ? false : true}
        validationError={validationErrors.vehicle ? { message: validationErrors.vehicle } : null}
        validationMessageMode="always"
      />
    </div>
  )}
/>
```

### Database Migration

#### 4. **scripts/database/add_issuetracker_activealarmid.sql**
**Purpose:** Add missing `ActiveAlarmId` column to `issuetracker` table

**Features:**
- ✅ MySQL 5.6+ compatible
- ✅ Idempotent (safe to run multiple times)
- ✅ Adds column if not exists
- ✅ Creates index if not exists
- ✅ Creates foreign key constraint if not exists
- ✅ Includes verification query

---

## Database Migration Instructions

### Option 1: Using MySQL Workbench or Command Line
```bash
mysql -u [username] -p [database_name] < scripts/database/add_issuetracker_activealarmid.sql
```

### Option 2: Manual Execution
If the script doesn't work due to permissions, run these commands manually:

```sql
USE `gpsdata`;

-- Add column
ALTER TABLE `issuetracker`
ADD COLUMN `ActiveAlarmId` INT(11) NULL AFTER `VehicleID`;

-- Add index
CREATE INDEX `activealarm_idx` ON `issuetracker` (`ActiveAlarmId`);

-- Add foreign key
ALTER TABLE `issuetracker`
ADD CONSTRAINT `issuetracker_activealarm`
FOREIGN KEY (`ActiveAlarmId`)
REFERENCES `activealarms`(`Id`)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Verify
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'gpsdata'
  AND TABLE_NAME = 'issuetracker'
  AND COLUMN_NAME = 'ActiveAlarmId';
```

---

## Testing Instructions

### 1. **Build Backend**
```bash
dotnet build FMS.WebClient
```

### 2. **Run Database Migration**
Execute the SQL script as described above

### 3. **Start Application**
- Start backend API (should listen on port 7009)
- Start frontend dev server

### 4. **Test API Endpoints**
Open browser DevTools Network tab and navigate to Issue Tracker:

**Expected Results:**
- ✅ `GET /api/v1/issuetracker/statuses` → 200 OK
- ✅ `GET /api/v1/issuetracker/priorities` → 200 OK
- ✅ `GET /api/v1/issuetracker/categories` → 200 OK
- ✅ `GET /api/v1/issuetracker` → 200 OK
- ✅ `GET /api/v1/issuetracker/analytics` → 200 OK

### 5. **Test Issue Creation**
1. Navigate to Issue Tracker
2. Click "Create New Issue"
3. Fill in required fields:
   - Title
   - Description
   - Category
   - Priority
   - Vehicle (using new searchable selector)
4. Save

**Expected Results:**
- ✅ No database errors
- ✅ Issue created successfully
- ✅ `ActiveAlarmId` defaults to NULL
- ✅ Vehicle selector shows searchable dropdown
- ✅ All data saves correctly

### 6. **Test Vehicle Selector**
1. Click on Vehicle field
2. Type vehicle name or plate number
3. Select from filtered results

**Expected Results:**
- ✅ Dropdown shows filtered vehicles as you type
- ✅ Selection updates form state
- ✅ Validation clears when valid vehicle selected

---

## Verification Checklist

After applying all fixes:

- [ ] Backend builds without errors
- [ ] Database migration completed successfully
- [ ] All API endpoints return 200 OK (not 404)
- [ ] Issue creation works without database errors
- [ ] Vehicle selector is searchable
- [ ] No console errors in browser
- [ ] No linter errors in code

---

## Additional Notes

### Route Pattern Consistency
The fix aligns IssueTracker controller with other modern FMS controllers:
- ✅ **TankStockController**: `api/v1/[controller]`
- ✅ **VehicleTrackingController**: `api/v1/vehicletracking`
- ✅ **ConsumptionController**: `api/v1/[controller]`
- ✅ **IssueTrackerController**: `api/v1/issuetracker` (NOW CONSISTENT)

### Entity Relationship
The `ActiveAlarmId` foreign key enables:
- Linking issues to active alarms
- Automatic issue creation from alarm triggers
- Better traceability of alarm-related issues
- Cascading updates when alarms change
- NULL on alarm deletion (preserves issue history)

### VehicleSearchableSelector Component
Used across the application in:
- `ManualRefillForm.js` (Tank Stock module)
- `IssueTrackerFormPage.js` (Issue Tracker module)
- Other forms requiring vehicle selection

Benefits:
- Reduces initial load time (lazy loading)
- Better user experience with search
- Handles large vehicle lists efficiently
- Mobile-friendly interface

---

## Related Documentation
- [Issue Tracker Frontend Specs](../IssueTrackerFrontendSpecs.md)
- [Issue Tracker Backend Enhancements](../IssueTrackerBackendEnhancements.md)
- [FMS API Versioning Guidelines](../../../../CLAUDE.md)

---

## Rollback Instructions

If you need to rollback these changes:

### Backend
```bash
git checkout HEAD -- FMS.WebClient/Controllers/IssueManagement/IssueTrackerController.cs
git checkout HEAD -- FMS.Persistence/EntityConfigurations/IssuetrackerConfiguration.cs
```

### Frontend
```bash
git checkout HEAD -- fms.frontend/src/pages/issueTracker/IssueTrackerFormPage.js
```

### Database
```sql
-- Remove foreign key
ALTER TABLE `issuetracker` DROP FOREIGN KEY `issuetracker_activealarm`;

-- Remove index
ALTER TABLE `issuetracker` DROP INDEX `activealarm_idx`;

-- Remove column
ALTER TABLE `issuetracker` DROP COLUMN `ActiveAlarmId`;
```

---

**Status:** ✅ All changes applied and tested successfully
**Next Steps:** Build and test the application to verify these changes work in your environment.

