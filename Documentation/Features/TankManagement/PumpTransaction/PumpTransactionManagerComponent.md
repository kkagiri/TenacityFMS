# Pump Transaction Manager Component

## Overview
The `PumpTransactionManager` component provides a comprehensive interface for viewing, filtering, and managing pump transactions within the FMS Stock Management system. It integrates with the Redux store to fetch and display pump transaction data using DevExtreme DataGrid.

## Features

### 🔍 **Advanced Filtering**
- **Multiple Filter Types**: Vehicle ID, Tank ID, PTS ID, Date Range, Processing Status
- **Quick Filters**: Predefined filters for common scenarios (Last 7 days, Last 30 days, Today, Unprocessed)
- **Real-time Filter Application**: Immediate data updates when filters are applied
- **Filter Persistence**: Shows active filters and allows clearing

### 📊 **Data Visualization**
- **Comprehensive DataGrid**: All pump transaction fields with proper formatting
- **Summary Statistics**: Total transactions, volume, amount, processed/pending counts
- **Status Indicators**: Visual badges for processed/pending transactions
- **Responsive Design**: Mobile-friendly grid layout

### ⚡ **Performance Features**
- **State Persistence**: Grid state saved to localStorage
- **Lazy Loading**: Data loaded only when needed
- **Optimized Rendering**: Uses DevExtreme's virtual scrolling for large datasets
- **Caching**: Stores last fetch time and applied filters

### 🛠️ **Management Tools**
- **Export Functionality**: Export data to Excel
- **Data Refresh**: Reload data with current filters
- **Clear Data**: Remove all loaded data
- **Column Customization**: Show/hide columns as needed

## Component Structure

```javascript
<PumpTransactionManager
    selectedSite={selectedSite}
    dateRange={dateRange}
/>
```

### Props
- `selectedSite`: Currently selected site (optional)
- `dateRange`: Array with start and end dates for default filtering

## Usage Examples

### Basic Integration
```javascript
import PumpTransactionManager from './components/PumpTransactionManager';

const StockManagementTab = () => {
    const [selectedSite, setSelectedSite] = useState('all');
    const dateRange = [
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        new Date() // today
    ];

    return (
        <PumpTransactionManager
            selectedSite={selectedSite}
            dateRange={dateRange}
        />
    );
};
```

### With Custom Date Range
```javascript
const MyComponent = () => {
    const [dateRange, setDateRange] = useState([
        new Date('2024-01-01'),
        new Date('2024-01-31')
    ]);

    return (
        <PumpTransactionManager
            selectedSite="site1"
            dateRange={dateRange}
        />
    );
};
```

## Filter Options

### Available Filters
1. **Vehicle ID**: Filter by specific vehicle
2. **Tank ID**: Filter by specific tank
3. **PTS ID**: Filter by PTS device identifier
4. **Start Date**: Filter from specific date
5. **End Date**: Filter to specific date
6. **Processing Status**: All, Processed Only, Unprocessed Only

### Quick Filter Buttons
- **Last 7 Days**: Sets date range to last week
- **Last 30 Days**: Sets date range to last month
- **Today**: Sets date range to current day
- **Unprocessed Only**: Shows only pending transactions

## Data Grid Features

### Columns
- **PTS ID**: Device identifier with search capability
- **Pump/Transaction/Nozzle**: Hardware identifiers
- **Vehicle ID/Tank ID**: Related entity IDs
- **Fuel Grade**: Type of fuel dispensed
- **Volume/TC Volume**: Fuel quantities with precision formatting
- **Price/Amount**: Financial data with currency formatting
- **Date/Time**: Transaction timestamps
- **Status**: Visual processing status indicators

### Grid Capabilities
- **Filtering**: Header filters, search panel, filter row
- **Sorting**: Multi-column sorting support
- **Selection**: Multiple row selection
- **Export**: Excel export functionality
- **Column Chooser**: Show/hide columns
- **State Persistence**: Saves grid preferences

## Redux Integration

### Actions Used
```javascript
import {
    fetchPumpTransactions,
    clearPumpTransactions
} from '../redux/actions/consumptionActions';
```

### State Properties
```javascript
const {
    pumpTransactions,           // Array of transaction data
    pumpTransactionsLoading,    // Loading state
    pumpTransactionsError,      // Error message
    pumpTransactionsLastFetch,  // Last fetch timestamp
    pumpTransactionsFilters     // Applied filters
} = useSelector(state => state.consumption);
```

## Styling

### CSS Classes
The component uses a combination of Tailwind CSS and custom SCSS:

```scss
// Main component
.pump-transaction-manager {
    // Custom DataGrid styling
    // Summary card styling
    // Filter panel styling
}
```

### Responsive Design
- **Desktop**: Full grid with all columns visible
- **Tablet**: Optimized column widths and toolbar wrapping
- **Mobile**: Condensed view with essential columns

## Event Handling

### User Interactions
- **Filter Application**: Validates and applies filters, shows notifications
- **Data Refresh**: Reloads data with current filters
- **Export**: Triggers export functionality
- **Clear**: Removes all data and shows confirmation

### Error Handling
- **Validation Errors**: Shows user-friendly messages for invalid filters
- **API Errors**: Displays error notifications with retry options
- **Network Issues**: Graceful degradation with offline indicators

## Performance Considerations

### Optimization Features
- **Virtual Scrolling**: Handles large datasets efficiently
- **State Caching**: Avoids unnecessary API calls
- **Debounced Search**: Prevents excessive filtering
- **Lazy Rendering**: Loads components only when needed

### Memory Management
- **Component Cleanup**: Clears data when component unmounts
- **Event Listeners**: Properly removes event handlers
- **State Management**: Efficient Redux state updates

## Accessibility

### Features
- **Keyboard Navigation**: Full keyboard support for grid and filters
- **Screen Reader Support**: ARIA labels and descriptions
- **Focus Management**: Proper focus handling in popups and forms
- **Color Contrast**: Meets WCAG guidelines for text and backgrounds

## API Integration

### Endpoint Used
```
GET /api/consumption/pumptransactions
```

### Filter Parameters
```javascript
{
    vehicleId: number,      // Optional
    tankId: number,         // Optional
    ptsId: string,          // Optional
    startDate: Date,        // Optional
    endDate: Date,          // Optional
    processedOnly: boolean  // Optional
}
```

### Response Format
```javascript
{
    isSuccess: boolean,
    message: string,
    data: [
        {
            ptsId: string,
            vehicleId: number,
            tankId: number,
            volume: number,
            amount: number,
            dateTime: string,
            hasBeenProcessed: boolean,
            // ... other fields
        }
    ]
}
```

## Troubleshooting

### Common Issues

1. **No Data Displayed**
   - Check if filters are too restrictive
   - Verify API endpoint is accessible
   - Check browser console for errors

2. **Slow Performance**
   - Reduce date range for large datasets
   - Use more specific filters
   - Check network connection

3. **Filter Not Working**
   - Ensure at least one filter is provided
   - Check date range validity
   - Verify filter values are correct

### Debug Information
The component provides debug information through:
- Summary statistics display
- Last fetch timestamp
- Active filter indicators
- Console logging for API calls

## Future Enhancements

### Planned Features
- **Bulk Operations**: Select and process multiple transactions
- **Advanced Analytics**: Charts and graphs for transaction data
- **Real-time Updates**: Live data updates via SignalR
- **Custom Columns**: User-defined column configurations
- **Saved Filters**: Store and reuse common filter combinations

### Integration Possibilities
- **Reporting Module**: Integration with FMS reporting system
- **Notification System**: Alerts for specific transaction events
- **Audit Trail**: Track user actions and data changes
- **Mobile App**: Dedicated mobile interface for transaction management
