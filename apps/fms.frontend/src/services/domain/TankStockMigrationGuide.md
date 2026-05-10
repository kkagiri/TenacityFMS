# TankStock Service Migration Guide

This guide demonstrates how to migrate from old `tankStockAction.js` to the new `TankStockService` using `ServiceFactory`.

## Migration Overview

### Old Pattern (tankStockAction.js)
```javascript
// OLD WAY - Using Redux actions directly
import {
  fetchTankStocks,
  createOpeningStock,
  createTankTransfer
} from '../redux/actions/tankStockAction';

// In component
const dispatch = useDispatch();

const handleFetchStocks = async () => {
  const result = await dispatch(fetchTankStocks({ siteId: 1 }));
  if (result.success) {
    console.log('Tank stocks:', result.data);
  } else {
    console.error('Error:', result.message);
  }
};
```

### New Pattern (TankStockService)
```javascript
// NEW WAY - Using ServiceFactory
import serviceFactory from '../services/core';

const TankStockComponent = () => {
  const [tankStocks, setTankStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get service instance
  const tankStockService = serviceFactory.getTankStockService();

  const handleFetchStocks = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await tankStockService.fetchTankStocks({ siteId: 1 });

      if (response.success) {
        setTankStocks(response.data);
        console.log('Tank stocks fetched successfully:', response.data);
      } else {
        setError(response.message);
        console.error('Failed to fetch tank stocks:', response.message);

        // Handle specific error types
        if (response.errorType === 'AUTHENTICATION') {
          // Redirect to login
        } else if (response.errorType === 'AUTHORIZATION') {
          // Show access denied message
        }
      }
    } catch (error) {
      setError('Unexpected error occurred');
      console.error('Exception:', error);
    } finally {
      setLoading(false);
    }
  };
};
```

## Available Methods

### Core Operations
- `fetchTankStocks(filters)` - Get tank stocks with filtering
- `fetchTankStockById(id)` - Get single tank stock
- `createTankStock(tankStock)` - Create new tank stock
- `updateTankStock(id, tankStock)` - Update tank stock
- `deleteTankStock(id)` - Delete tank stock

### Stock Entry Operations
- `createOpeningStock(params)` - Create opening stock entry
- `createClosingStock(params)` - Create closing stock entry
- `createTankTransfer(transferData)` - Create tank transfer

### Discrepancies & Reconciliation
- `fetchStockDiscrepancies(filters)` - Get stock discrepancies
- `reconcileStocks(reconciliationData)` - Reconcile stocks
- `createStockAdjustment(adjustmentData)` - Create stock adjustment
- `fetchStockAdjustments(filters)` - Get stock adjustments

### Future Records Validation
- `validateHistoricalEntry(params)` - Validate historical entries
- `getFutureRecordsPolicy()` - Get policy configuration
- `updateFutureRecordsPolicy(policy)` - Update policy

## Benefits of New Architecture

### ✅ Centralized Error Handling
- Consistent error format across all services
- Automatic retry for transient failures
- Proper HTTP status code handling

### ✅ FMSResponse<T> Format
```javascript
{
  success: boolean,
  data: T | null,
  message: string,
  errors: string[],
  errorType?: string
}
```

### ✅ Automatic v1 API Versioning
- All requests automatically include `API-Version: v1` header
- URL paths automatically prepended with `/v1/`

### ✅ Built-in Caching
- Intelligent caching of frequently accessed data
- Cache invalidation on data mutations
- Configurable cache TTL per endpoint

### ✅ Enterprise Patterns
- Dependency injection via ServiceFactory
- Service health monitoring
- Performance metrics collection
- Standardized logging

## Migration Checklist

- [ ] Replace `tankStockAction` imports with `serviceFactory`
- [ ] Remove Redux dispatch calls
- [ ] Update error handling to use FMSResponse format
- [ ] Add proper loading states
- [ ] Use async/await instead of Redux thunks
- [ ] Implement proper error boundaries
- [ ] Add validation feedback
- [ ] Update unit tests
- [ ] Remove old action files after migration

## Custom Hook Pattern

```javascript
import { useState, useEffect, useCallback } from 'react';
import serviceFactory from '../services/core';

export const useTankStock = (initialFilters = {}) => {
  const [tankStocks, setTankStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tankStockService = serviceFactory.getTankStockService();

  const fetchTankStocks = useCallback(async (filters = initialFilters) => {
    try {
      setLoading(true);
      setError(null);

      const response = await tankStockService.fetchTankStocks(filters);

      if (response.success) {
        setTankStocks(response.data);
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError('Failed to fetch tank stocks');
    } finally {
      setLoading(false);
    }
  }, [tankStockService, initialFilters]);

  const createOpeningStock = useCallback(async (params) => {
    try {
      const response = await tankStockService.createOpeningStock(params);

      if (response.success) {
        await fetchTankStocks(); // Refresh data
        return { success: true, data: response.data };
      } else {
        return { success: false, message: response.message, errors: response.errors };
      }
    } catch (error) {
      return { success: false, message: 'Failed to create opening stock' };
    }
  }, [tankStockService, fetchTankStocks]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchTankStocks();
  }, [fetchTankStocks]);

  return {
    tankStocks,
    loading,
    error,
    fetchTankStocks,
    createOpeningStock,
    clearError: () => setError(null)
  };
};
```

## Error Handling Examples

### Authentication Errors
```javascript
if (response.errorType === 'AUTHENTICATION') {
  // Clear token and redirect to login
  localStorage.removeItem('token');
  window.location.href = '/login';
}
```

### Validation Errors
```javascript
if (response.errorType === 'VALIDATION' && response.errors) {
  response.errors.forEach(error => {
    console.error('Validation error:', error);
    // Show error in UI
  });
}
```

### Network Errors
```javascript
if (response.errorType === 'NETWORK' || response.errorType === 'TIMEOUT') {
  // Show retry option
  setShowRetryButton(true);
}
```

This migration provides a much more robust, maintainable, and enterprise-ready architecture for tank stock operations.