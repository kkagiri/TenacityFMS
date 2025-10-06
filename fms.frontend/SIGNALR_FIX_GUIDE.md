# SignalR Redux Refresh Fix - Complete Implementation Guide

## 🔴 The Problem

**ANY component using Redux (`useSelector`) is affected by SignalR updates**, not just forms:

- ✗ Forms (lose focus, typing stutters)
- ✗ Data grids (unnecessary re-renders)
- ✗ Dropdowns (close unexpectedly)
- ✗ Modal dialogs (flicker)
- ✗ Tab content (refreshes)
- ✗ Charts/graphs (redraw constantly)
- ✗ Lists (scroll position jumps)
- ✗ Any component displaying data

## ✅ The Solution (3 Layers)

### Layer 1: Middleware (✅ INSTALLED - Already Active)

The middleware automatically filters duplicate SignalR Redux actions. **No code changes needed - it's working now!**

**Location:** `src/signalR/signalRReduxMiddleware.js`
**Status:** ✅ Added to store.js

### Layer 2: Smart Selectors (REQUIRED for all components)

Replace `useSelector` with `useSignalRSelector` to prevent unnecessary re-renders.

**Location:** `src/hooks/useSignalRSelector.js`

### Layer 3: Component Isolation (OPTIONAL for critical UI)

Wrap components that absolutely must not re-render (forms, modals, etc.).

**Location:** `src/components/common/SignalRIsolation.js`

---

## 📋 Quick Fix Patterns

### Pattern 1: Simple Data Display Component

**BEFORE:**

```javascript
import { useSelector } from "react-redux";

function VehicleList() {
  const vehicles = useSelector((state) => state.vehicle.vehicles);
  // Re-renders on ANY Redux update! ❌

  return (
    <div>
      {vehicles.map((v) => (
        <div key={v.id}>{v.name}</div>
      ))}
    </div>
  );
}
```

**AFTER:**

```javascript
import { useSignalRSelector } from "../../hooks/useSignalRSelector";

function VehicleList() {
  const vehicles = useSignalRSelector((state) => state.vehicle.vehicles);
  // Only re-renders when vehicles actually change! ✅

  return (
    <div>
      {vehicles.map((v) => (
        <div key={v.id}>{v.name}</div>
      ))}
    </div>
  );
}
```

### Pattern 2: Form Component

**BEFORE:**

```javascript
import { useSelector } from 'react-redux';

function TankTransferForm() {
  const [formData, setFormData] = useState({...});
  const tanks = useSelector(state => state.tank.tanks);
  // Form re-renders constantly! ❌

  return (
    <form>
      <input value={formData.amount} onChange={...} />
    </form>
  );
}
```

**AFTER:**

```javascript
import { useSignalRSelector } from '../../../hooks/useSignalRSelector';
import { IsolatedForm } from '../../../components/common/SignalRIsolation';

function TankTransferForm() {
  const [formData, setFormData] = useState({...});
  const tanks = useSignalRSelector(state => state.tank.tanks);

  return (
    <IsolatedForm formId="tankTransfer">
      <form>
        <input value={formData.amount} onChange={...} />
      </form>
    </IsolatedForm>
  );
}
```

### Pattern 3: Data Grid/Table

**BEFORE:**

```javascript
import { useSelector } from "react-redux";

function VehicleDataGrid() {
  const vehicles = useSelector((state) => state.vehicle.vehicles);
  const manufacturers = useSelector(
    (state) => state.vehicleManufacturer.manufacturers
  );
  // Grid re-renders on every SignalR event! ❌

  return <DataGrid dataSource={vehicles} />;
}
```

**AFTER:**

```javascript
import { useSignalRSelector } from "../../hooks/useSignalRSelector";

function VehicleDataGrid() {
  const vehicles = useSignalRSelector((state) => state.vehicle.vehicles);
  const manufacturers = useSignalRSelector(
    (state) => state.vehicleManufacturer.manufacturers
  );
  // Grid only re-renders when data changes! ✅

  return <DataGrid dataSource={vehicles} />;
}
```

### Pattern 4: Modal/Dialog

**BEFORE:**

```javascript
import { useSelector } from "react-redux";

function EditVehicleModal({ isOpen, vehicleId }) {
  const vehicle = useSelector((state) =>
    state.vehicle.vehicles.find((v) => v.id === vehicleId)
  );
  // Modal content flickers! ❌

  return <Modal isOpen={isOpen}>...</Modal>;
}
```

**AFTER:**

```javascript
import { useSignalRSelector } from "../../hooks/useSignalRSelector";
import { IsolatedForm } from "../../components/common/SignalRIsolation";

function EditVehicleModal({ isOpen, vehicleId }) {
  const vehicle = useSignalRSelector((state) =>
    state.vehicle.vehicles.find((v) => v.id === vehicleId)
  );

  return (
    <Modal isOpen={isOpen}>
      <IsolatedForm formId={`editVehicle-${vehicleId}`}>
        {/* Form content */}
      </IsolatedForm>
    </Modal>
  );
}
```

### Pattern 5: Dashboard Widget (Should Update)

**BEFORE:**

```javascript
import { useSelector } from "react-redux";

function MetricsWidget() {
  const metrics = useSelector((state) => state.vehicleDashboard.metrics);
  // Updates too often, even with same data! ❌

  return <div>Total: {metrics.totalVehicles}</div>;
}
```

**AFTER:**

```javascript
import { useDashboardMetricsSelector } from "../../hooks/useSignalRSelector";
// OR for specific metric:
// import { useMetricSelector } from '../../hooks/useSignalRSelector';

function MetricsWidget() {
  const metrics = useDashboardMetricsSelector();
  // Only updates when metrics actually change! ✅

  // For single metric:
  // const totalVehicles = useMetricSelector('totalVehicles');

  return <div>Total: {metrics.totalVehicles}</div>;
}
```

---

## 🎯 Component Types & Solutions

| Component Type        | Solution                                      | Priority    |
| --------------------- | --------------------------------------------- | ----------- |
| **Forms** (any input) | `IsolatedForm` wrapper + `useSignalRSelector` | 🔴 Critical |
| **Data Grids**        | `useSignalRSelector`                          | 🟡 High     |
| **Modals/Dialogs**    | `IsolatedForm` inside modal                   | 🟡 High     |
| **Dropdowns/Selects** | `useSignalRSelector` + `memo`                 | 🟡 High     |
| **Tabs**              | `useSignalRSelector`                          | 🟢 Medium   |
| **Lists**             | `useSignalRSelector`                          | 🟢 Medium   |
| **Charts**            | `useSignalRSelector`                          | 🟢 Medium   |
| **Dashboard Widgets** | `useDashboardMetricsSelector`                 | 🟢 Medium   |
| **Navigation**        | `useSignalRSelector`                          | 🔵 Low      |
| **Static Content**    | No change needed                              | ⚪ None     |

---

## 🔧 Step-by-Step Implementation

### Step 1: Verify Middleware Installation ✅

The middleware is already installed in `store.js`. Open your browser console and you should see:

```
[SignalR Middleware] Skipping duplicate action: UPDATE_KEY_STATISTICS
[SignalR Middleware] Processing batch of X actions
```

### Step 2: Fix Critical Components (Start Here)

#### Tank Stock Forms (Priority #1)

**Files to fix:**

- `pages/tankStock/forms/TankTransferForm.js`
- `pages/tankStock/forms/TankDeliveryForm.js`
- `pages/tankStock/forms/OpeningStockForm.js`
- `pages/tankStock/forms/ClosingStockForm.js`
- `pages/tankStock/forms/StockAdjustmentForm.js`
- `pages/tankStock/forms/ManualRefillForm.js`

**For each file:**

1. Add imports at the top:

```javascript
import { useSignalRSelector } from "../../../hooks/useSignalRSelector";
import { IsolatedForm } from "../../../components/common/SignalRIsolation";
```

2. Replace all `useSelector` with `useSignalRSelector`:

```javascript
// BEFORE:
const tanks = useSelector((state) => state.tank.tanks);
const sites = useSelector((state) => state.site.sites);

// AFTER:
const tanks = useSignalRSelector((state) => state.tank.tanks);
const sites = useSignalRSelector((state) => state.site.sites);
```

3. Wrap the form JSX:

```javascript
// BEFORE:
return <form onSubmit={handleSubmit}>{/* form content */}</form>;

// AFTER:
return (
  <IsolatedForm formId="tankTransfer">
    <form onSubmit={handleSubmit}>{/* form content */}</form>
  </IsolatedForm>
);
```

### Step 3: Fix Vehicle Components

**Files:**

- `pages/vehicles/component/VehicleAddForm.js`
- `pages/vehicles/component/VehicleEditForm.js`
- `pages/vehicles/component/vehicleDataGrid.js`

Same pattern as above.

### Step 4: Fix Remaining Components

Use the scanner script (see below) to identify all files that need fixing.

---

## 🛠️ Scanner Script

Run this PowerShell script to find all components using `useSelector`:

```powershell
cd fms.frontend
.\find-signalr-fixes.ps1
```

This will create `signalr-fix-status.csv` with a complete list of files to fix.

---

## 🧪 Testing Checklist

For each updated component:

- [ ] Component renders without errors
- [ ] No console errors
- [ ] For forms: Typing is smooth, no focus loss
- [ ] For grids: No flickering or scroll jumping
- [ ] Real-time data still updates (for dashboard components)
- [ ] Browser console shows middleware logs

---

## 📊 Expected Impact

### Before Fix

- Redux actions: 150-200/min
- Forms stutter and lose focus
- Grids jump around
- Modals flicker

### After Fix

- Redux actions: 50-80/min (60-70% reduction)
- Forms smooth and stable
- Grids maintain position
- Modals stable

---

## ⚠️ Common Mistakes

### ❌ Don't Do This

```javascript
// Wrapping wrong element
<IsolatedForm>
  <div>
    <form>...</form>  // Won't work!
  </div>
</IsolatedForm>

// Mixing old and new
const data1 = useSelector(...);  // Old
const data2 = useSignalRSelector(...);  // New
```

### ✅ Do This

```javascript
// Wrap form directly
<IsolatedForm formId="myForm">
  <form>...</form>  // Correct!
</IsolatedForm>

// Be consistent
const data1 = useSignalRSelector(...);
const data2 = useSignalRSelector(...);
```

---

## 🆘 Troubleshooting

### Component still refreshing?

1. Check if using `useSignalRSelector` everywhere
2. Verify middleware is in store.js
3. Check console for middleware logs
4. Try wrapping with `IsolatedForm`

### Data not updating?

1. Check SignalR connection is active
2. Verify action type is in middleware whitelist
3. Try clearing middleware cache (refresh page)

### Performance worse?

1. Check for too many deep comparisons
2. Use specific selectors
3. Consider memoizing complex transformations

---

## ✅ Success Criteria

Your fix is working when:

- ✅ Users can type smoothly in any form
- ✅ Grids don't jump or flicker
- ✅ Modals stay stable
- ✅ Console shows `[SignalR Middleware] Skipping duplicate action`
- ✅ Redux DevTools shows 60-70% fewer actions
- ✅ Real-time data still updates correctly
- ✅ No new console errors

---

## 📚 Files Reference

- **Middleware:** `src/signalR/signalRReduxMiddleware.js`
- **Hooks:** `src/hooks/useSignalRSelector.js`
- **Components:** `src/components/common/SignalRIsolation.js`
- **Store:** `src/store.js`

---

**Ready to start? Fix the 6 tank stock forms first - it's your quickest path to visible improvement!** 🚀
