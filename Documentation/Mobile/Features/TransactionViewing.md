# Transaction Viewing - FMS Mobile

## Overview

The Transaction History feature allows users to view, filter, and analyze fuel transactions from their mobile devices. It integrates with the backend API and provides real-time updates for ongoing transactions.

## Screen: TransactionHistoryScreen

**Location:** `src/screens/TransactionHistoryScreen.js`

## Features

### 1. Transaction List

- Paginated transaction display
- Pull-to-refresh functionality
- Infinite scroll for loading more
- Real-time updates for new transactions

### 2. Filtering Options

| Filter | Type | Description |
|--------|------|-------------|
| Date Range | DatePicker | Start and end date |
| Pump | Picker | Filter by pump ID |
| Device | Picker | Filter by PTS device |
| Search | TextInput | Search by transaction ID, vehicle |

### 3. Summary Statistics

- Total transactions count
- Total volume dispensed
- Total amount
- Average per transaction

## Component Structure

```
TransactionHistoryScreen
├── Header
│   ├── Title
│   └── Filter Toggle Button
├── Summary Cards
│   ├── Total Transactions
│   ├── Total Volume
│   └── Total Amount
├── Search Bar
├── Transaction List (FlatList)
│   └── TransactionCard (per item)
│       ├── Transaction ID
│       ├── Status Badge
│       ├── Volume & Amount
│       ├── Vehicle Info
│       └── Timestamp
└── Filter Modal
    ├── Date Range Pickers
    ├── Pump Selector
    ├── Device Selector
    ├── Apply Button
    └── Clear Filters Button
```

## Redux State

```javascript
// transactionSlice.js
{
  transaction: {
    transactions: [],      // Array of transaction objects
    totalCount: 0,        // Total matching transactions
    currentPage: 1,       // Current page number
    pageSize: 20,         // Items per page
    hasMore: true,        // More pages available
    isLoading: false,     // Initial load state
    isLoadingMore: false, // Pagination load state
    error: null,          // Error message if any
    filters: {
      startDate: null,
      endDate: null,
      pumpId: null,
      deviceId: null,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    },
    summary: {
      totalTransactions: 0,
      totalVolume: 0,
      totalAmount: 0,
      averageVolume: 0,
      averageAmount: 0
    }
  }
}
```

## Redux Actions

```javascript
// Fetch transaction history
export const fetchTransactionHistory = createAsyncThunk(
  'transaction/fetchHistory',
  async (filters) => {
    return await ApiService.getTransactionHistory(filters);
  }
);

// Fetch summary statistics
export const fetchTransactionSummary = createAsyncThunk(
  'transaction/fetchSummary',
  async (filters) => {
    return await ApiService.getTransactionSummary(filters);
  }
);

// Update filters
export const updateFilters = createAction('transaction/updateFilters');

// Clear filters
export const clearFilters = createAction('transaction/clearFilters');
```

## API Endpoints

### Get Transaction History

```javascript
GET /api/transaction/history

Query Parameters:
{
  page: number,        // Page number (1-based)
  pageSize: number,    // Items per page
  startDate: string,   // ISO date string
  endDate: string,     // ISO date string
  pumpId: number,      // Filter by pump
  deviceId: string,    // Filter by device
  vehicleId: string,   // Filter by vehicle
  sortBy: string,      // Sort field
  sortOrder: string    // 'asc' or 'desc'
}

Response:
{
  isSuccess: true,
  data: {
    items: [...],
    totalCount: number,
    page: number,
    pageSize: number,
    hasMore: boolean
  }
}
```

### Get Transaction Summary

```javascript
GET /api/transaction/summary

Query Parameters:
{
  startDate: string,
  endDate: string,
  pumpId: number,
  deviceId: string
}

Response:
{
  isSuccess: true,
  data: {
    totalTransactions: number,
    totalVolume: number,
    totalAmount: number,
    averageVolume: number,
    averageAmount: number
  }
}
```

### Get Transaction Details

```javascript
GET /api/transaction/{transactionId}

Response:
{
  isSuccess: true,
  data: {
    id: string,
    transactionNumber: string,
    deviceId: string,
    pumpId: number,
    nozzleId: number,
    vehicleId: string,
    vehiclePlate: string,
    tagId: string,
    volume: number,
    amount: number,
    unitPrice: number,
    status: string,
    authorizationType: string,
    authorizedDose: number,
    startTime: string,
    endTime: string,
    operatorId: string,
    operatorName: string,
    notes: string
  }
}
```

## Transaction Status

| Status | Color | Description |
|--------|-------|-------------|
| Completed | Green | Successfully finished |
| Cancelled | Red | Cancelled before completion |
| Pending | Yellow | Awaiting fueling start |
| Authorized | Blue | Pump authorized, waiting |

## Usage Example

```javascript
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTransactionHistory,
  updateFilters,
} from '../redux/slices/transactionSlice';

const TransactionHistoryScreen = () => {
  const dispatch = useDispatch();
  const { transactions, isLoading, filters } = useSelector(
    state => state.transaction
  );

  useEffect(() => {
    dispatch(fetchTransactionHistory(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (newFilters) => {
    dispatch(updateFilters(newFilters));
  };

  const handleRefresh = () => {
    dispatch(fetchTransactionHistory({ ...filters, page: 1 }));
  };

  return (
    // ... render logic
  );
};
```

## Formatting Utilities

```javascript
// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
};

// Format volume
const formatVolume = (volume) => {
  return `${(volume || 0).toFixed(2)} L`;
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
};

// Format datetime
const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};
```

## Pull-to-Refresh

```javascript
<FlatList
  data={transactions}
  refreshControl={
    <RefreshControl
      refreshing={isLoading}
      onRefresh={handleRefresh}
      colors={['#2563eb']}
    />
  }
  // ...
/>
```

## Infinite Scroll

```javascript
<FlatList
  data={transactions}
  onEndReached={handleLoadMore}
  onEndReachedThreshold={0.5}
  ListFooterComponent={
    isLoadingMore && <ActivityIndicator size="small" color="#2563eb" />
  }
  // ...
/>
```

## Filter Modal

```javascript
const FilterModal = ({ visible, filters, onApply, onClear, onClose }) => {
  const [tempFilters, setTempFilters] = useState(filters);

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modalContent}>
        {/* Date Range */}
        <DateRangePicker
          startDate={tempFilters.startDate}
          endDate={tempFilters.endDate}
          onStartChange={(date) => setTempFilters({...tempFilters, startDate: date})}
          onEndChange={(date) => setTempFilters({...tempFilters, endDate: date})}
        />

        {/* Pump Filter */}
        <Picker
          selectedValue={tempFilters.pumpId}
          onValueChange={(value) => setTempFilters({...tempFilters, pumpId: value})}
        >
          <Picker.Item label="All Pumps" value={null} />
          {pumps.map(pump => (
            <Picker.Item key={pump.id} label={pump.name} value={pump.id} />
          ))}
        </Picker>

        {/* Actions */}
        <Button title="Apply" onPress={() => onApply(tempFilters)} />
        <Button title="Clear" onPress={onClear} />
      </View>
    </Modal>
  );
};
```

## Navigation to Details

```javascript
const handleTransactionPress = (transaction) => {
  navigation.navigate('TransactionDetails', {
    transactionId: transaction.id
  });
};
```

## Error Handling

```javascript
{error && (
  <View style={styles.errorContainer}>
    <Icon name="exclamation-circle" size={48} color="#ef4444" />
    <Text style={styles.errorText}>{error}</Text>
    <TouchableOpacity onPress={handleRefresh}>
      <Text style={styles.retryText}>Tap to retry</Text>
    </TouchableOpacity>
  </View>
)}
```

## Empty State

```javascript
{transactions.length === 0 && !isLoading && (
  <View style={styles.emptyState}>
    <Icon name="receipt" size={64} color="#9ca3af" />
    <Text style={styles.emptyTitle}>No Transactions</Text>
    <Text style={styles.emptyText}>
      {hasActiveFilters
        ? 'No transactions match your filters'
        : 'Transactions will appear here'}
    </Text>
  </View>
)}
```

## Testing Checklist

- [ ] Initial load displays transactions
- [ ] Pull-to-refresh works
- [ ] Infinite scroll loads more
- [ ] Filter by date range works
- [ ] Filter by pump works
- [ ] Filter by device works
- [ ] Clear filters resets list
- [ ] Transaction card tap opens details
- [ ] Summary cards show correct totals
- [ ] Empty state displays correctly
- [ ] Error state displays with retry

## Related Files

- `services/apiService.js` - API client
- `redux/slices/transactionSlice.js` - State management
- `screens/TransactionDetailsScreen.js` - Detail view (if exists)
