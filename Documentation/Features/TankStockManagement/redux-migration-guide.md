# Tank Stock Management Redux Migration

## Overview
This document explains the migration from direct axios calls to Redux actions in the tank stock management system to fix the "Maximum update depth exceeded" warning and improve state management.

## Changes Made

### 1. Redux Actions Enhanced (`tankStockAction.js`)
Added new action types and creators for:
- Stock adjustments (create, fetch)
- Stock reconciliation
- Stock reporting
- Enhanced loading states

**New Action Types:**
- `CREATE_STOCK_ADJUSTMENT_REQUEST/SUCCESS/FAILURE`
- `FETCH_STOCK_ADJUSTMENTS_REQUEST/SUCCESS/FAILURE`
- `RECONCILE_STOCKS_REQUEST/SUCCESS/FAILURE`
- `GENERATE_STOCK_REPORT_REQUEST/SUCCESS/FAILURE`
- `FETCH_TANK_STOCKS_REQUEST`

### 2. Redux Reducer Updated (`tankStockReducer.js`)
Enhanced the reducer to handle:
- New loading states for different operations
- Separate loading indicators for adjustments, reconciliation, reports
- Proper error handling for each operation type

**New State Properties:**
```javascript
{
  stockAdjustments: [],
  reconciliationData: [],
  reports: [],
  adjustmentsLoading: false,
  reconciliationLoading: false,
  reportsLoading: false,
  // ... existing state
}
```

### 3. useStockManagement Hook Refactored
**Before:** Direct axios calls with local loading states
**After:** Redux actions with centralized state management

**Key Changes:**
- Removed direct axios dependencies
- Uses Redux actions and selectors
- Proper error handling through Redux
- Consistent loading states

### 4. useStockData Hook Enhanced
Added support for new stock management data:
- Stock adjustments
- Stock discrepancies
- Reconciliation data
- Proper dependency management to prevent infinite re-renders

## Fixing Maximum Update Depth Issues

### Root Causes:
1. **Unstable Dependencies:** Objects/arrays created in render causing infinite useEffect loops
2. **Mutable State Updates:** Direct state mutations triggering re-renders
3. **Missing Dependencies:** useEffect/useCallback missing required dependencies

### Solutions Applied:

#### 1. Stable Dependencies with useMemo
```javascript
// Before: Creates new object every render
const filters = { siteId: selectedSite, startDate, endDate };

// After: Memoized object
const filters = useMemo(() => ({
  siteId: selectedSite !== 'all' ? selectedSite : null,
  startDate: dateRange?.[0],
  endDate: dateRange?.[1]
}), [selectedSite, dateRange]);
```

#### 2. Proper useCallback Dependencies
```javascript
// Before: Missing dateRange dependency
const refreshData = useCallback(async () => {
  // uses dateRange but not in deps
}, [dispatch, selectedSite]);

// After: Complete dependencies
const refreshData = useCallback(async () => {
  // implementation
}, [dispatch, selectedSite, dateRange, dateRangeString]);
```

#### 3. Redux State Normalization
```javascript
// Before: Multiple local loading states
const [isLoading, setIsLoading] = useState(false);
const [adjustmentsLoading, setAdjustmentsLoading] = useState(false);

// After: Centralized Redux loading states
const {
  adjustmentsLoading,
  reconciliationLoading,
  reportsLoading
} = useSelector(state => state.tankStock);
```

#### 4. Preventing Duplicate API Calls
```javascript
// Added fetch tracking to prevent duplicate calls
const [lastFetchParams, setLastFetchParams] = useState(null);
const needsRefresh = useMemo(() => {
  if (!lastFetchParams) return true;
  return (
    lastFetchParams.siteId !== filters.siteId ||
    lastFetchParams.startDate !== filters.startDate ||
    lastFetchParams.endDate !== filters.endDate
  );
}, [lastFetchParams, filters]);
```

## Usage Guidelines

### 1. Using useStockManagement Hook
```javascript
const {
  isLoading,
  stockAdjustments,
  createStockAdjustment,
  fetchStockAdjustments,
  reconcileStocks
} = useStockManagement();

// Create adjustment
const handleCreateAdjustment = async (data) => {
  const result = await createStockAdjustment(data);
  if (result.success) {
    // Handle success
  }
};
```

### 2. Using useStockData Hook
```javascript
const {
  isLoading,
  stockAdjustments,
  stockDiscrepancies,
  refreshData
} = useStockData(selectedSite, dateRange);

// Use memoized dateRange to prevent re-renders
const dateRange = useMemo(() => [startDate, endDate], [startDate, endDate]);
```

### 3. Component Best Practices
```javascript
// Memoize date ranges and filters
const dateRange = useMemo(() => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  return [
    thirtyDaysAgo.toISOString().split('T')[0],
    today.toISOString().split('T')[0]
  ];
}, []); // Empty deps for initial state

// Use stable references for callbacks
const handleSiteChange = useCallback((e) => {
  const newSite = e.value || 'all';
  setSelectedSite(newSite);
  localStorage.setItem('selectedSite', newSite);
}, []);
```

## API Endpoints

The Redux actions now properly utilize these TankStockController endpoints:
- `POST /api/tankstock/adjustments` - Create stock adjustment
- `GET /api/tankstock/adjustments` - Fetch stock adjustments
- `GET /api/tankstock/discrepancies` - Fetch stock discrepancies
- `POST /api/tankstock/reconcile` - Reconcile stocks

## Testing the Changes

1. **Monitor Console:** No more "Maximum update depth exceeded" warnings
2. **Network Tab:** Reduced duplicate API calls
3. **Redux DevTools:** Proper action dispatch and state updates
4. **Component Re-renders:** Use React DevTools Profiler to verify reduced re-renders

## Future Improvements

1. **Add File Export Action:** Replace direct axios call in `exportStockReport`
2. **Implement Optimistic Updates:** For better UX during stock adjustments
3. **Add Caching Strategy:** For frequently accessed data
4. **Real-time Updates:** Integrate SignalR for live stock updates

## Migration Checklist

- [x] Enhanced Redux actions and reducers
- [x] Updated useStockManagement hook
- [x] Updated useStockData hook
- [x] Fixed dependency arrays
- [x] Added proper error handling
- [x] Documented changes
- [ ] Update component imports
- [ ] Test all functionality
- [ ] Performance testing
- [ ] User acceptance testing
