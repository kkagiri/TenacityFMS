# Pump Transaction Frontend Usage Examples

## Redux Actions Usage

### Basic Usage Examples

```javascript
import {
    fetchPumpTransactions,
    fetchPumpTransactionsByVehicle,
    fetchPumpTransactionsByTank,
    fetchUnprocessedPumpTransactions,
    clearPumpTransactions
} from '../redux/actions/consumptionActions';

// Example 1: Fetch all pump transactions by tank with date range
const fetchTankTransactions = async (dispatch, tankId) => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    const result = await dispatch(fetchPumpTransactionsByTank(tankId, startDate, endDate));

    if (result.success) {
        console.log('Transactions loaded:', result.data);
    } else {
        console.error('Error loading transactions:', result.message);
    }
};

// Example 2: Fetch vehicle transactions with all filters
const fetchVehicleTransactionsWithFilters = async (dispatch) => {
    const filters = {
        vehicleId: 123,
        tankId: 45,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        processedOnly: false // Only unprocessed transactions
    };

    const result = await dispatch(fetchPumpTransactions(filters));
    return result;
};

// Example 3: Fetch unprocessed transactions
const fetchPendingTransactions = async (dispatch) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Last 7 days
    const endDate = new Date();

    const result = await dispatch(fetchUnprocessedPumpTransactions(startDate, endDate));
    return result;
};

// Example 4: Clear pump transactions data
const clearTransactionData = (dispatch) => {
    dispatch(clearPumpTransactions());
};
```

### React Component Integration

```jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPumpTransactions } from '../redux/actions/consumptionActions';

const PumpTransactionList = () => {
    const dispatch = useDispatch();
    const {
        pumpTransactions,
        pumpTransactionsLoading,
        pumpTransactionsError,
        pumpTransactionsLastFetch,
        pumpTransactionsFilters
    } = useSelector(state => state.consumption);

    const [filters, setFilters] = useState({
        vehicleId: null,
        tankId: null,
        startDate: null,
        endDate: null,
        processedOnly: null
    });

    const handleFetchTransactions = async () => {
        // Remove null/undefined values from filters
        const cleanFilters = Object.fromEntries(
            Object.entries(filters).filter(([_, value]) => value !== null && value !== undefined)
        );

        const result = await dispatch(fetchPumpTransactions(cleanFilters));

        if (!result.success) {
            // Handle error - could show notification, etc.
            console.error('Failed to fetch transactions:', result.message);
        }
    };

    useEffect(() => {
        // Auto-fetch on component mount with default date range
        const defaultStartDate = new Date();
        defaultStartDate.setDate(defaultStartDate.getDate() - 30); // Last 30 days

        setFilters(prev => ({
            ...prev,
            startDate: defaultStartDate,
            endDate: new Date()
        }));
    }, []);

    useEffect(() => {
        if (filters.startDate && filters.endDate) {
            handleFetchTransactions();
        }
    }, [filters.startDate, filters.endDate]);

    return (
        <div className="tw-p-4">
            <h2 className="tw-text-lg tw-font-semibold tw-mb-4">Pump Transactions</h2>

            {/* Filter Controls */}
            <div className="tw-grid tw-grid-cols-3 tw-gap-4 tw-mb-4">
                <input
                    type="number"
                    placeholder="Vehicle ID"
                    value={filters.vehicleId || ''}
                    onChange={(e) => setFilters(prev => ({
                        ...prev,
                        vehicleId: e.target.value ? parseInt(e.target.value) : null
                    }))}
                    className="tw-border tw-rounded tw-px-2 tw-py-1"
                />

                <input
                    type="number"
                    placeholder="Tank ID"
                    value={filters.tankId || ''}
                    onChange={(e) => setFilters(prev => ({
                        ...prev,
                        tankId: e.target.value ? parseInt(e.target.value) : null
                    }))}
                    className="tw-border tw-rounded tw-px-2 tw-py-1"
                />

                <select
                    value={filters.processedOnly === null ? '' : filters.processedOnly}
                    onChange={(e) => setFilters(prev => ({
                        ...prev,
                        processedOnly: e.target.value === '' ? null : e.target.value === 'true'
                    }))}
                    className="tw-border tw-rounded tw-px-2 tw-py-1"
                >
                    <option value="">All Transactions</option>
                    <option value="true">Processed Only</option>
                    <option value="false">Unprocessed Only</option>
                </select>
            </div>

            <button
                onClick={handleFetchTransactions}
                disabled={pumpTransactionsLoading}
                className="tw-bg-blue-500 tw-text-white tw-px-4 tw-py-2 tw-rounded tw-mb-4 disabled:tw-opacity-50"
            >
                {pumpTransactionsLoading ? 'Loading...' : 'Fetch Transactions'}
            </button>

            {/* Results */}
            {pumpTransactionsError && (
                <div className="tw-bg-red-100 tw-border tw-border-red-400 tw-text-red-700 tw-px-4 tw-py-3 tw-rounded tw-mb-4">
                    Error: {pumpTransactionsError}
                </div>
            )}

            {pumpTransactionsLastFetch && (
                <div className="tw-text-sm tw-text-gray-600 tw-mb-2">
                    Last updated: {new Date(pumpTransactionsLastFetch).toLocaleString()}
                </div>
            )}

            <div className="tw-overflow-x-auto">
                <table className="tw-min-w-full tw-bg-white tw-border tw-border-gray-300">
                    <thead className="tw-bg-gray-50">
                        <tr>
                            <th className="tw-px-4 tw-py-2 tw-border-b">PTS ID</th>
                            <th className="tw-px-4 tw-py-2 tw-border-b">Vehicle ID</th>
                            <th className="tw-px-4 tw-py-2 tw-border-b">Tank ID</th>
                            <th className="tw-px-4 tw-py-2 tw-border-b">Volume</th>
                            <th className="tw-px-4 tw-py-2 tw-border-b">Date</th>
                            <th className="tw-px-4 tw-py-2 tw-border-b">Processed</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pumpTransactions.map((transaction, index) => (
                            <tr key={index} className="tw-hover:tw-bg-gray-50">
                                <td className="tw-px-4 tw-py-2 tw-border-b">{transaction.ptsId}</td>
                                <td className="tw-px-4 tw-py-2 tw-border-b">{transaction.vehicleId}</td>
                                <td className="tw-px-4 tw-py-2 tw-border-b">{transaction.tankId}</td>
                                <td className="tw-px-4 tw-py-2 tw-border-b">{transaction.volume}</td>
                                <td className="tw-px-4 tw-py-2 tw-border-b">
                                    {new Date(transaction.dateTime).toLocaleDateString()}
                                </td>
                                <td className="tw-px-4 tw-py-2 tw-border-b">
                                    <span className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs ${
                                        transaction.hasBeenProcessed
                                            ? 'tw-bg-green-100 tw-text-green-800'
                                            : 'tw-bg-yellow-100 tw-text-yellow-800'
                                    }`}>
                                        {transaction.hasBeenProcessed ? 'Processed' : 'Pending'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {pumpTransactions.length === 0 && !pumpTransactionsLoading && (
                    <div className="tw-text-center tw-py-8 tw-text-gray-500">
                        No transactions found with current filters
                    </div>
                )}
            </div>
        </div>
    );
};

export default PumpTransactionList;
```

### DevExtreme DataGrid Integration

```jsx
import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid } from 'devextreme-react/data-grid';
import { fetchPumpTransactions } from '../redux/actions/consumptionActions';

const PumpTransactionDataGrid = () => {
    const dispatch = useDispatch();
    const { pumpTransactions, pumpTransactionsLoading } = useSelector(state => state.consumption);

    const columns = [
        { dataField: 'ptsId', caption: 'PTS ID', width: 120 },
        { dataField: 'vehicleId', caption: 'Vehicle ID', width: 100 },
        { dataField: 'tankId', caption: 'Tank ID', width: 100 },
        { dataField: 'volume', caption: 'Volume', format: 'fixedPoint', precision: 2 },
        { dataField: 'amount', caption: 'Amount', format: 'currency' },
        {
            dataField: 'dateTime',
            caption: 'Date/Time',
            dataType: 'datetime',
            format: 'dd/MM/yyyy HH:mm'
        },
        {
            dataField: 'hasBeenProcessed',
            caption: 'Status',
            cellRender: (data) => (
                <span className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs ${
                    data.value
                        ? 'tw-bg-green-100 tw-text-green-800'
                        : 'tw-bg-yellow-100 tw-text-yellow-800'
                }`}>
                    {data.value ? 'Processed' : 'Pending'}
                </span>
            )
        }
    ];

    const onToolbarPreparing = useCallback((e) => {
        e.toolbarOptions.items.unshift({
            location: 'before',
            widget: 'dxButton',
            options: {
                text: 'Refresh',
                icon: 'refresh',
                onClick: () => {
                    const filters = {
                        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                        endDate: new Date()
                    };
                    dispatch(fetchPumpTransactions(filters));
                }
            }
        });
    }, [dispatch]);

    useEffect(() => {
        // Initial load
        const filters = {
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            endDate: new Date()
        };
        dispatch(fetchPumpTransactions(filters));
    }, [dispatch]);

    return (
        <DataGrid
            dataSource={pumpTransactions}
            columns={columns}
            loading={pumpTransactionsLoading}
            showBorders={true}
            showRowLines={true}
            showColumnLines={true}
            rowAlternationEnabled={true}
            columnAutoWidth={true}
            onToolbarPreparing={onToolbarPreparing}
            filterRow={{ visible: true }}
            searchPanel={{ visible: true }}
            paging={{ pageSize: 20 }}
            pager={{
                visible: true,
                allowedPageSizes: [10, 20, 50, 100],
                showPageSizeSelector: true,
                showInfo: true
            }}
        />
    );
};

export default PumpTransactionDataGrid;
```

## Redux State Structure

```javascript
// State structure in the consumption reducer
state.consumption = {
    // ... other consumption state

    // Pump transactions specific
    pumpTransactions: [],                    // Array of transaction objects
    pumpTransactionsLoading: false,         // Loading state
    pumpTransactionsError: null,            // Error message
    pumpTransactionsLastFetch: null,        // ISO string of last fetch time
    pumpTransactionsFilters: null           // Last used filters
}
```

## API Endpoint

```
GET /api/consumption/pumptransactions
```

### Query Parameters
- `vehicleId` (optional): Filter by vehicle ID
- `ptsId` (optional): Filter by PTS device ID
- `tankId` (optional): Filter by tank ID
- `startDate` (optional): Filter from date (ISO string)
- `endDate` (optional): Filter to date (ISO string)
- `processedOnly` (optional): Filter by processing status (boolean)

### Response Format
```json
{
    "isSuccess": true,
    "message": "Pump transactions retrieved successfully",
    "data": [
        {
            "ptsId": "PTS001",
            "vehicleId": 123,
            "tankId": 45,
            "volume": 150.75,
            "amount": 225.50,
            "dateTime": "2024-01-15T10:30:00Z",
            "hasBeenProcessed": false,
            "fuelGradeName": "Diesel",
            "pump": 1,
            "transaction": 12345
        }
    ]
}
```
