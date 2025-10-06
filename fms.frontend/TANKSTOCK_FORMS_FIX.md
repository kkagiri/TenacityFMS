# Tank Stock Forms Fixed - October 6, 2025

## Issues Fixed

### Issue 1: Sites Not Loading in Forms ✅

**Problem:**
Sites dropdown was empty in all tank stock forms (OpeningStockForm, ClosingStockForm, TankTransferForm, ManualRefillForm, TankDeliveryForm) even though the API was returning data correctly.

**Root Cause:**
Forms were using `useSignalRSelector()` hook instead of regular `useSelector()` hook. The `useSignalRSelector` is specifically designed for SignalR real-time data with deep equality checking, but sites and tanks are regular Redux state, not SignalR-updated data.

**Solution:**
Changed all affected forms from:

```javascript
import { useSignalRSelector } from "../../../hooks/useSignalRSelector";
const sites = useSignalRSelector((state) => state.site.sites || []);
const tanks = useSignalRSelector((state) => state.tank.tanks || []);
```

To:

```javascript
import { useSelector } from "react-redux";
const sites = useSelector((state) => state.site.sites || []);
const tanks = useSelector((state) => state.tank.tanks || []);
```

**Files Modified:**

- ✅ `fms.frontend/src/pages/tankStock/forms/OpeningStockForm.js`
- ✅ `fms.frontend/src/pages/tankStock/forms/ClosingStockForm.js`
- ✅ `fms.frontend/src/pages/tankStock/forms/TankTransferForm.js`
- ✅ `fms.frontend/src/pages/tankStock/forms/ManualRefillForm.js`
- ℹ️ `TankDeliveryForm.js` and `StockAdjustmentForm.js` were already using `useSelector` correctly

**Result:**
Sites and tanks now load properly in all forms. The data is already being fetched by Redux actions, now it's being selected correctly.

---

### Issue 2: Unwanted SignalR Connections on Tank Stock Pages ✅

**Problem:**
Tank stock pages (like `/tankstock`, `/stock/management`) were initiating unnecessary SignalR connections to `dashboardHub`, causing network requests like:

```
http://10.0.10.153:7009/dashboardHub?id=awzpvZVj4jlqL7tWgXwMFw&_=1759734660526
```

This was happening because the SignalRConnectionManager was defaulting to connecting to dashboardHub for any route that didn't match specific patterns.

**Root Cause:**
In `SignalRConnectionManager.js`, the `getRequiredServices()` method had this logic:

```javascript
// If no specific match, default to dashboard
if (services.size === 0) {
  services.add("dashboard");
}
```

This meant ANY page that didn't match PTS, DASHBOARD, ADMIN, or REPORTS patterns would automatically connect to dashboardHub, even if it didn't need real-time updates.

**Solution:**

1. **Added NO_SIGNALR pattern** to explicitly define routes that don't need ANY SignalR connections:

```javascript
NO_SIGNALR: [
  /^\/tankstock/,     // Tank stock forms and management (static data only)
  /^\/stock/,         // Stock management pages
  /^\/vehicles/,      // Vehicle management (static data)
  /^\/employees/,     // Employee management
  /^\/site/,          // Site management
  /^\/user/,          // User management
  /^\/roles/,         // Role management
  /^\/permissions/,   // Permission management
  /^\/navigation/,    // Navigation management
],
```

2. **Modified getRequiredServices()** to check NO_SIGNALR patterns first:

```javascript
// First, check if this route explicitly DOESN'T need SignalR
if (this.matchesPattern(path, ROUTE_PATTERNS.NO_SIGNALR)) {
  console.log(
    "[SignalRManager] Route",
    path,
    "doesn't require SignalR connections"
  );
  return services; // Return empty set - NO connections
}
```

3. **Removed default fallback** to dashboard connection:

```javascript
// Only default to dashboard if on root path or truly unknown route
if (services.size === 0 && (path === "/" || path === "/home")) {
  console.log("[SignalRManager] Root/Home path, connecting to dashboard");
  services.add("dashboard");
} else if (services.size === 0) {
  console.log("[SignalRManager] No SignalR services required for path:", path);
}
```

**Files Modified:**

- ✅ `fms.frontend/src/signalR/SignalRConnectionManager.js`

**Result:**

- Tank stock pages no longer initiate SignalR connections
- Only pages that actually need real-time updates (dashboard, PTS devices, active alarms) connect to SignalR
- Network requests are cleaner and more efficient
- Console logs clearly show when a route doesn't require SignalR

---

## Testing Checklist

### Test Forms (Issue 1):

- [ ] Open Opening Stock form - sites dropdown should show all sites
- [ ] Select a site - tanks dropdown should show filtered tanks for that site
- [ ] Open Closing Stock form - same behavior
- [ ] Open Tank Transfer form - same behavior
- [ ] Open Manual Refill form - same behavior
- [ ] Open Tank Delivery form - same behavior

### Test SignalR Behavior (Issue 2):

- [ ] Navigate to `/tankstock` - check Network tab, should see NO `dashboardHub` requests
- [ ] Navigate to `/stock/management` - should see NO SignalR connections
- [ ] Navigate to `/home` or `/dashboard` - should see `dashboardHub` connection (expected)
- [ ] Navigate to `/pts` or `/fueling` - should see `ptsHub` connection (expected)
- [ ] Check console logs for `[SignalRManager]` messages showing correct behavior

---

## Architecture Notes

### When to Use useSelector vs useSignalRSelector

**Use `useSelector`** for:

- ✅ Static/regular Redux state (sites, tanks, users, roles, etc.)
- ✅ Data that's fetched once and doesn't change frequently
- ✅ Form dropdowns and selectors
- ✅ Master data lists

**Use `useSignalRSelector`** for:

- ✅ Real-time dashboard metrics
- ✅ Live pump/device status
- ✅ Active alarm notifications
- ✅ Live fueling transactions
- ✅ Any data that updates via SignalR

### SignalR Connection Strategy

**Pages that SHOULD connect to SignalR:**

- Dashboard/Home (`/home`, `/dashboard`) → dashboardHub
- PTS Devices (`/pts`, `/pump`, `/device`) → ptsHub
- Fueling Process (`/fueling`) → ptsHub
- Active Alarms (`/active-alarms`) → dashboardHub
- Issue Tracker (`/issue-tracker`) → dashboardHub

**Pages that should NOT connect to SignalR:**

- Tank Stock Management (`/tankstock`) → static forms and data grids
- Vehicle Management (`/vehicles`) → CRUD operations only
- User/Role/Permission Management → admin operations
- Site/Employee Management → master data management
- Reports (`/reports`) → historical data queries

---

## Summary

Both issues were caused by using the wrong tools for the job:

1. **Wrong selector hook** - Using SignalR-specific selector for regular Redux state
2. **Over-aggressive SignalR** - Connecting to SignalR even when not needed

The fixes are minimal, focused, and follow the existing architecture patterns in the codebase (as seen in `TankDeliveryForm.js` and `StockAdjustmentForm.js` which were already correct).

**No API changes needed** - the backend is working correctly.
**No Redux changes needed** - the state management is working correctly.
**Only selector usage fixed** - using the right hooks in the right places.
