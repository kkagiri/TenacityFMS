# Tank Stock Reconciliation - Quick Integration Checklist

## ✅ Completed (No Action Needed)
- [x] API Client created (reconciliationClient.js)
- [x] Redux slice created (reconciliationSlice.js)
- [x] All 8 components created
- [x] Styles configured (reconciliation.scss)
- [x] Backend API ready and tested

## ⚠️ Critical - Required for Functionality

### 1. Register Redux Slice (5 minutes)
**File**: `fms.frontend/src/redux/store.js`

```javascript
import reconciliationReducer from './slices/reconciliationSlice';

export const store = configureStore({
  reducer: {
    reconciliation: reconciliationReducer, // Add this line
    // ... other reducers
  },
});
```

**Test**: Open browser console, type: `store.getState().reconciliation`
Should see: `{ singleCheckResult: null, loading: {...}, ... }`

---

### 2. Add Navigation Route (10 minutes)
**File**: `fms.frontend/src/Content.js`

```javascript
import ReconciliationMain from './pages/reconciliation/ReconciliationMain';

// Add these routes:
<Route path="/tools/reconciliation" element={<ReconciliationMain />} />
<Route path="/tools/reconciliation/*" element={<ReconciliationMain />} />
```

**Test**: Navigate to `http://localhost:3000/tools/reconciliation`
Should see: Reconciliation page with 3 tabs

---

### 3. Add Sidebar Menu Item (15 minutes)
**Option A - Database** (Recommended):
```sql
INSERT INTO navigationitems (Text, Path, Icon, ParentId, OrderIndex, IsActive)
VALUES ('Reconciliation', '/tools/reconciliation', 'fa-light fa-arrows-rotate',
        (SELECT Id FROM navigationitems WHERE Text = 'Tools'), 10, 1);
```

**Option B - Code** (if navigation is in JS/config file):
Find navigation config and add:
```javascript
{
  text: 'Reconciliation',
  path: '/tools/reconciliation',
  icon: 'fa-light fa-arrows-rotate'
}
```

**Test**: Check sidebar, should see "Reconciliation" under "Tools"

---

## 🔄 Optional - Enhancements

### 4. Integrate Real Tank Data (30 minutes)
Replace dummy data in:
- `ManualReconciliationPanel.js` (line 24-35)
- `BatchReconciliationTool.js` (line 32-43)

Find your tank slice:
```bash
grep -r "createSlice.*tank" fms.frontend/src/redux/
```

Update to use actual API:
```javascript
import { fetchTanks, selectAllTanks } from '../../redux/slices/tankSlice';

const tanks = useSelector(selectAllTanks);
useEffect(() => {
  dispatch(fetchTanks());
}, [dispatch]);
```

---

## 🧪 Testing Checklist

After completing steps 1-3:

- [ ] Page loads at `/tools/reconciliation`
- [ ] Tab 1 (Manual Check) displays
- [ ] Can select tank and date
- [ ] "Check for Discrepancies" button works
- [ ] Tab 2 (Batch Operations) displays
- [ ] Can select date range
- [ ] Tab 3 (Data Quality) displays
- [ ] Statistics load correctly
- [ ] Permission checks work (test with user without `_Read_tankStock`)

---

## 🚀 Quick Start Commands

```bash
# 1. Navigate to frontend directory
cd fms.frontend

# 2. Install dependencies (if not done)
npm install

# 3. Start development server
npm start

# 4. Access reconciliation page
# Open browser: http://localhost:3000/tools/reconciliation
```

---

## ⚡ Estimated Time

- Critical Steps (1-3): **30 minutes**
- Optional Enhancements (4): **30 minutes**
- Testing: **15 minutes**
- **Total**: ~1.5 hours

---

## 📞 Quick Troubleshooting

| Symptom | Solution |
|---------|----------|
| "Cannot read property of undefined" | Complete Step 1 (Redux registration) |
| 404 on page load | Complete Step 2 (Add route) |
| Menu item missing | Complete Step 3 (Add navigation) |
| API errors | Verify backend is running |
| No tanks in dropdown | Complete Step 4 (Tank data) |

---

## 📚 Full Documentation

For detailed instructions, see:
- `Documentation/Features/TankStock/FRONTEND_INTEGRATION_GUIDE.md`

---

*Integration Priority: Complete steps 1-3 immediately, step 4 can be done later*
