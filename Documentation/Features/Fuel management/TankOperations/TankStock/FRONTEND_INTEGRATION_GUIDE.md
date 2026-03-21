# Tank Stock Reconciliation - Frontend Integration Guide

## Overview
This guide provides step-by-step instructions to integrate the Tank Stock Reconciliation frontend into the FMS system.

## Components Created
✅ **API Client**: `fms.frontend/src/api/reconciliationClient.js` (122 lines)
✅ **Redux Slice**: `fms.frontend/src/redux/slices/reconciliationSlice.js` (305 lines)
✅ **Shared Components**:
  - `DiscrepancyTable.js` (101 lines)
  - `ResultsCard.js` (187 lines)
✅ **Feature Components**:
  - `ManualReconciliationPanel.js` (249 lines)
  - `BatchReconciliationTool.js` (368 lines)
  - `DataQualityDashboard.js` (392 lines)
✅ **Main Container**: `ReconciliationMain.js` (109 lines)
✅ **Styles**: `reconciliation.scss` (94 lines)

## Integration Steps

### Step 1: Register Redux Slice in Store ⚠️ CRITICAL

**File**: `fms.frontend/src/redux/store.js` (or similar)

Add the reconciliation reducer to your store configuration:

```javascript
import { configureStore } from '@reduxjs/toolkit';
import reconciliationReducer from './slices/reconciliationSlice';
// ... other imports

export const store = configureStore({
  reducer: {
    // ... existing reducers
    reconciliation: reconciliationReducer,
  },
});
```

**Why this is critical**: Without this step, none of the components will work as they all depend on Redux state.

---

### Step 2: Add Navigation Sidebar Item

**Files to Locate**:
1. Find navigation configuration (search for menu/sidebar config)
2. Find routing configuration (typically in `App.js` or routes file)

**Option A: Using Database-based Navigation** (Recommended for this system)

1. **Add to `navigationitems` table**:
```sql
INSERT INTO navigationitems (
  Text,
  Path,
  Icon,
  ParentId,
  OrderIndex,
  IsActive
) VALUES (
  'Reconciliation',
  '/tools/reconciliation',
  'fa-light fa-arrows-rotate',
  (SELECT Id FROM navigationitems WHERE Text = 'Tools'), -- Parent "Tools" section
  10,
  1
);
```

2. **Assign to Roles** (via Navigation Management UI or SQL):
```sql
-- Get the navigation item ID
SET @nav_id = (SELECT Id FROM navigationitems WHERE Path = '/tools/reconciliation');

-- Assign to roles with TankStock read permission
INSERT INTO rolenavigation (RoleId, NavigationItemId)
SELECT r.Id, @nav_id
FROM roles r
INNER JOIN rolepermissions rp ON r.Id = rp.RoleId
INNER JOIN permissions p ON rp.PermissionId = p.Id
WHERE p.Name = '_Read_tankStock';
```

**Option B: Using Code-based Navigation**

Find your navigation configuration file and add:

```javascript
{
  text: 'Tools',
  icon: 'fa-light fa-screwdriver-wrench',
  items: [
    {
      text: 'Reconciliation',
      path: '/tools/reconciliation',
      icon: 'fa-light fa-arrows-rotate',
      permission: '_Read_tankStock'
    }
    // ... other tools
  ]
}
```

---

### Step 3: Add Route Configuration

**File**: `fms.frontend/src/Content.js` (based on your project structure)

Add both base and wildcard routes (following the pattern from the instructions):

```javascript
import ReconciliationMain from './pages/reconciliation/ReconciliationMain';

// Inside your Routes component:
<Route
  path="/tools/reconciliation"
  element={<ReconciliationMain />}
/>
<Route
  path="/tools/reconciliation/*"
  element={<ReconciliationMain />}
/>
```

**Alternative**: If using app-routes.js pattern:

```javascript
// In app-routes.js
case "reconciliation":
case "tools/reconciliation":
  return ReconciliationMain;
```

---

### Step 4: Integrate Actual Tank Data

Currently, `ManualReconciliationPanel.js` and `BatchReconciliationTool.js` use dummy tank data.

**Locate your tank API/slice**:
```bash
# Search for tank-related Redux files
grep -r "createSlice.*tank" fms.frontend/src/redux/
```

**Update ManualReconciliationPanel.js** (line 24-35):

Replace:
```javascript
// Load tanks on mount
useEffect(() => {
  // TODO: Load tanks from your existing tank slice/API
  setTanks([
    { id: 1, name: 'Tank 1 - Diesel' },
    { id: 2, name: 'Tank 2 - Petrol' },
    { id: 3, name: 'Tank 3 - Kerosene' }
  ]);
}, []);
```

With:
```javascript
import { fetchTanks, selectAllTanks } from '../../redux/slices/tankSlice'; // Adjust import

// In component:
const tanks = useSelector(selectAllTanks);

useEffect(() => {
  dispatch(fetchTanks());
}, [dispatch]);
```

**Update BatchReconciliationTool.js** (same pattern, lines 32-43)

---

### Step 5: Verify API Endpoints

Ensure your backend API is running and endpoints are accessible:

```bash
# Test endpoints (replace with your API base URL)
curl http://localhost:5000/api/v1/TankStockReconciliation/check?tankId=1&date=2025-01-20
curl http://localhost:5000/api/v1/TankStockReconciliation/statistics?startDate=2025-01-01&endDate=2025-01-20
```

Expected response format (example):
```json
{
  "isSuccess": true,
  "data": {
    "tankId": 1,
    "date": "2025-01-20",
    "discrepanciesFound": 2,
    "discrepancies": [...]
  },
  "message": "Reconciliation check completed",
  "errorMessage": null
}
```

---

### Step 6: Test the Integration

1. **Start the application**:
```bash
cd fms.frontend
npm start
```

2. **Access the page**:
   - Navigate to: `http://localhost:3000/tools/reconciliation`
   - Or click "Tools" → "Reconciliation" in the sidebar

3. **Test Manual Check**:
   - Tab 1: Manual Check
   - Select a tank
   - Select a date
   - Click "Check for Discrepancies"
   - If discrepancies found, click "Apply Fix"

4. **Test Batch Operations**:
   - Tab 2: Batch Operations
   - Select tank and date range (max 90 days)
   - Try "Check Only" mode first
   - Then try with "Auto-Fix" enabled

5. **Test Dashboard**:
   - Tab 3: Data Quality
   - View statistics and charts
   - Change date range and refresh

---

## Permission Requirements

Users need these permissions to access features:

| Feature | Permission Required |
|---------|-------------------|
| View reconciliation page | `_Read_tankStock` |
| Check for discrepancies | `_Read_tankStock` |
| Apply fixes | `_Update_tankStock` |
| View statistics | `_Read_tankStock` |

---

## Troubleshooting

### Issue: Redux state is undefined
**Solution**: Ensure Step 1 (Register Redux Slice) is completed.

### Issue: Navigation item doesn't appear
**Solution**:
- Check user role has permission `_Read_tankStock`
- Verify navigation item is added to database and assigned to role
- Clear browser cache and reload

### Issue: API calls fail with 404
**Solution**:
- Verify backend is running
- Check API base URL in `axiosInstance` configuration
- Ensure `TankStockReconciliationController` is registered

### Issue: "Tank not found" error
**Solution**: Complete Step 4 (Integrate Tank Data API)

### Issue: Styling conflicts
**Solution**:
- Ensure Tailwind CSS is configured with `tw-` prefix
- SCSS file should be imported in ReconciliationMain.js
- DevExtreme themes should be built: `npm run build-themes`

---

## File Locations Reference

```
fms.frontend/src/
├── api/
│   └── reconciliationClient.js          ✅ Created
├── redux/
│   ├── slices/
│   │   └── reconciliationSlice.js       ✅ Created
│   └── store.js                         ⚠️ NEEDS UPDATE
├── pages/
│   └── reconciliation/
│       ├── ReconciliationMain.js        ✅ Created
│       ├── ManualReconciliationPanel.js ✅ Created
│       ├── BatchReconciliationTool.js   ✅ Created
│       ├── DataQualityDashboard.js      ✅ Created
│       ├── reconciliation.scss          ✅ Created
│       └── components/
│           ├── DiscrepancyTable.js      ✅ Created
│           └── ResultsCard.js           ✅ Created
├── Content.js                           ⚠️ NEEDS UPDATE (add routes)
└── hooks/
    └── usePermissions.js                ✅ Already exists
```

---

## Next Steps

1. ✅ Complete Step 1 (Redux store registration) - **CRITICAL**
2. ✅ Complete Step 2 (Navigation sidebar)
3. ✅ Complete Step 3 (Route configuration)
4. 🔄 Complete Step 4 (Tank data integration) - **Optional but recommended**
5. 🧪 Complete Step 6 (Testing)

---

## Backend Reference

The backend system is already complete and tested:

- **Service**: `FMS.BackgroundServices/TankManagement/TankStockReconciliationService.cs`
- **Controller**: `FMS.WebClient/Controllers/TankStockReconciliationController.cs`
- **Background Service**: `FMS.BackgroundServices/TankManagement/DailyTankReconciliationService.cs`

All compilation errors have been fixed and the system is ready for frontend integration.

---

## Architecture Overview

```
User Interface (React Components)
        ↓
Redux State Management (reconciliationSlice)
        ↓
API Client (reconciliationClient.js)
        ↓
HTTP (Axios)
        ↓
Backend API (TankStockReconciliationController)
        ↓
Business Logic (TankStockReconciliationService)
        ↓
Database (MySQL via EF Core)
```

---

## Questions or Issues?

Refer to:
- Main documentation: `Documentation/Features/TankStock/RECONCILIATION_SYSTEM.md`
- Backend implementation: `Documentation/Features/TankStock/Backend-Phase1-Complete.md`
- CQRS patterns: `CLAUDE.md` in root directory

---

*Last Updated: [Current Date]*
*Frontend Implementation: COMPLETE*
*Integration Status: PENDING (Steps 1-3 required)*
