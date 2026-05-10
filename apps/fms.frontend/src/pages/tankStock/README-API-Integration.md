# Tank Volume History API Integration

This document explains how to use the `/api/tankvolumehistory/filtered` endpoint in your FMS frontend application.

## API Endpoint

```
GET http://10.0.11.90:7009/api/tankvolumehistory/filtered
```

## Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `siteId` | number | No | Filter by specific site ID. Omit for all sites | `22` |
| `startDate` | string | No | Start date in YYYY-MM-DD format | `2025-07-31` |
| `endDate` | string | No | End date in YYYY-MM-DD format | `2025-07-31` |
| `includeVehicleNames` | boolean | No | Include vehicle names in response | `true` |
| `take` | number | No | Maximum number of records to return | `100` |

## Example API Call

Your specific example:
```
http://10.0.11.90:7009/api/tankvolumehistory/filtered?siteId=22&startDate=2025-07-31&endDate=2025-07-31&includeVehicleNames=true
```

## Implementation Files Created

### 1. Service Layer
- **File**: `src/services/tankVolumeHistoryService.js`
- **Purpose**: Centralized service for API calls
- **Key Methods**:
  - `fetchFiltered()` - Generic filtered fetch
  - `fetchForSiteAndDateRange()` - Your specific use case
  - `fetchTodayForSite()` - Today's data for a site
  - `normalizeData()` - Data normalization
  - `getStatistics()` - Data analysis

### 2. React Hook
- **File**: `src/pages/tankStock/shared/hooks/useTankVolumeHistory.js`
- **Purpose**: React hook for state management
- **Features**:
  - Real-time data fetching
  - Filter management
  - Statistics calculation
  - Data normalization

### 3. UI Components
- **File**: `src/pages/tankStock/dashboard/components/VehicleTransactionsPanel.js`
- **Purpose**: Display vehicle transaction data
- **Features**:
  - DataGrid with filtering
  - Vehicle-specific data highlighting
  - Real-time updates

### 4. Demo Component
- **File**: `src/pages/tankStock/demo/TankVolumeHistoryDemo.js`
- **Purpose**: Interactive demo of the API
- **Features**:
  - Parameter testing
  - Real-time API calls
  - Statistics display

## Usage Examples

### 1. Using the Service Directly

```javascript
import TankVolumeHistoryService from '../services/tankVolumeHistoryService';

// Your specific example
const result = await TankVolumeHistoryService.fetchForSiteAndDateRange(
  22,
  '2025-07-31',
  '2025-07-31',
  true
);

console.log(`Loaded ${result.recordCount} records`);
```

### 2. Using the React Hook

```javascript
import { useTankVolumeHistory } from '../hooks/useTankVolumeHistory';

const MyComponent = () => {
  const {
    data,
    loading,
    fetchForSiteAndDateRange,
    statistics
  } = useTankVolumeHistory();

  const loadData = async () => {
    await fetchForSiteAndDateRange(22, '2025-07-31', '2025-07-31', true);
  };

  return (
    <div>
      <button onClick={loadData}>Load Data</button>
      {loading ? 'Loading...' : `${data.length} records loaded`}
    </div>
  );
};
```

### 3. Integration in Enhanced Tank Stock Dashboard

The Enhanced Tank Stock Dashboard now includes:
- Real-time volume history data
- Vehicle transaction panel
- Statistics display
- Quick action to demo your API endpoint

## Data Structure

The API returns records with the following structure:

```javascript
{
  id: number,
  timestamp: string,
  tankId: number,
  tankName: string,
  newVolume: number,
  volumeChange: number,
  changeReason: number, // 0-6 (see reason enum)
  referenceType: string,
  vehicleName: string, // Only if includeVehicleNames=true
  recordedBy: string
}
```

## Change Reason Enum

| Value | Description |
|-------|-------------|
| 0 | Opening Stock |
| 1 | Closing Stock |
| 2 | Delivery |
| 3 | Transfer In |
| 4 | Transfer Out |
| 5 | Adjustment |
| 6 | Dispensing |

## Testing the Integration

1. **Demo Component**: Navigate to the TankVolumeHistoryDemo page to test API calls interactively
2. **Enhanced Dashboard**: Use the "Demo API Endpoint" quick action
3. **Console Logs**: Check browser console for detailed API call information
4. **Network Tab**: Monitor network requests to see actual API calls

## Error Handling

The service includes comprehensive error handling:
- Network errors
- API response errors
- Data validation errors
- User-friendly error messages via DevExtreme notify

## Next Steps

1. **Authentication**: Ensure JWT tokens are properly configured
2. **Permissions**: Verify user has `_Read_tankVolumeHistory` permission
3. **Real-time Updates**: Consider integrating with SignalR for live updates
4. **Caching**: Implement data caching for performance optimization
5. **Export Features**: Add Excel/PDF export functionality

## Support

For issues or questions:
1. Check browser console for error details
2. Verify API endpoint accessibility
3. Ensure proper authentication tokens
4. Review network requests in DevTools
