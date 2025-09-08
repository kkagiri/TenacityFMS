# Dashboard System Integration Guide

This document explains how to use the integrated dashboard system that connects the frontend widget configuration modal to the backend dashboard metrics API.

## Overview

The dashboard system consists of:

### Backend Components (Already Implemented)
- **DashboardMetricsController.cs** - RESTful API endpoints for metrics
- **DashboardMetricsService.cs** - Business logic for data aggregation
- **DTOs** - Request/response data transfer objects
- **Database Integration** - TankVolumeHistory and Vehicleconsumption entities

### Frontend Components (Just Created)
- **DashboardMetricsService.js** - API client service
- **WidgetConfigModal.js** - Widget configuration interface (updated)
- **DashboardWidget.js** - Individual widget component
- **DashboardGrid.js** - Widget management and display
- **DashboardPage.js** - Example usage page

## Quick Start

### 1. Backend Setup
The backend API is already implemented and running at `/api/dashboardmetrics`. Make sure the following endpoints are accessible:

```
POST /api/dashboardmetrics/metric
GET  /api/dashboardmetrics/fuel-dispensed
GET  /api/dashboardmetrics/fuel-used-gps
GET  /api/dashboardmetrics/engine-hours
GET  /api/dashboardmetrics/distance-travelled
GET  /api/dashboardmetrics/health
```

### 2. Frontend Integration

#### Option A: Use the Complete Dashboard Page
```jsx
import DashboardPage from './pages/DashboardPage';

function App() {
  return <DashboardPage />;
}
```

#### Option B: Use Individual Components
```jsx
import DashboardGrid from './components/dashboard/DashboardGrid';

function MyDashboard() {
  const [sites, setSites] = useState([]);

  return (
    <DashboardGrid
      sites={sites}
      sitesLoading={false}
      sitesError={null}
    />
  );
}
```

#### Option C: Use Single Widget
```jsx
import DashboardWidget from './components/dashboard/DashboardWidget';

const widgetConfig = {
  id: 'fuel_today',
  label: 'Today Fuel Dispensed',
  metric: 'fuel_dispense',
  mode: 'live',
  datePreset: 'today',
  sitesMode: 'all',
  enabled: true
};

function MyWidget() {
  return (
    <DashboardWidget
      config={widgetConfig}
      autoRefresh={true}
      refreshInterval={30000}
    />
  );
}
```

## API Integration Details

### Authentication
The system expects JWT Bearer tokens. The token should be stored in:
- `localStorage.getItem('authToken')` or
- `sessionStorage.getItem('authToken')` or
- `localStorage.getItem('token')` or
- `sessionStorage.getItem('token')`

### Available Metrics
1. **fuel_dispense** - Fuel dispensed from tanks
2. **fuel_used_gps** - Fuel consumption from GPS tracking
3. **engine_hours** - Engine runtime hours
4. **km_travel** - Distance travelled

### Data Modes
- **live** - Real-time current data
- **cumulative** - Historical aggregated data

### Date Presets
- **Live mode**: today, this_week, this_month, this_year
- **Cumulative mode**: yesterday, last_week, last_month, last_year

## Widget Configuration

### Widget Config Object Structure
```javascript
{
  id: 'unique_widget_id',
  label: 'Display Name',
  enabled: true,
  metric: 'fuel_dispense',
  category: 'key_statistics',
  mode: 'live',
  datePreset: 'today',
  sitesMode: 'all', // or 'custom'
  siteIds: [] // array of site IDs when sitesMode = 'custom'
}
```

### Categories
- `key_statistics` - Key performance metrics
- `system_alerts` - Alert and notification widgets
- `performance_metrics` - Performance tracking
- `issue_tracking` - Issue management
- `tank_levels` - Tank monitoring
- `pump_status` - Pump status monitoring

## Features

### Widget Management
- **Add/Edit/Delete** widgets through the configuration modal
- **Enable/Disable** widgets without deleting
- **Preview** widget data before saving
- **Test** existing widget data connections
- **Organize** widgets by categories

### Real-time Updates
- **Auto-refresh** for live mode widgets (30 seconds)
- **Manual refresh** button on each widget
- **Status indicators** showing data freshness
- **Error handling** with retry options

### Data Display
- **Formatted values** with appropriate units
- **Status indicators** (success, warning, error)
- **Additional info** showing relevant details
- **Responsive design** for different screen sizes

## API Response Format

```javascript
{
  "metric": "fuel_dispense",
  "value": 1250.75,
  "unit": "L",
  "period": "today",
  "status": "success",
  "lastUpdated": "2024-01-15T10:30:00Z",
  "additionalInfo": {
    "site_count": 3,
    "tank_count": 8
  }
}
```

## Error Handling

### API Errors
- **Network errors** - Handled with retry options
- **Authentication errors** - Clear error messages
- **Data errors** - Fallback to cached data when possible
- **Timeout errors** - Automatic retry with backoff

### Frontend Errors
- **Invalid configurations** - Validation before saving
- **Missing data** - Graceful fallback displays
- **Component errors** - Error boundaries prevent crashes

## Customization

### Styling
The components use Tailwind CSS classes. You can customize:
- **Colors** by modifying the CSS classes
- **Layout** by adjusting grid configurations
- **Animations** by updating the CSS animations

### Refresh Intervals
```javascript
// Different refresh rates for different modes
const refreshInterval = widget.mode === 'live' ? 30000 : 300000; // 30s vs 5min
```

### API Endpoints
```javascript
// Customize base URL in DashboardMetricsService
const apiService = new DashboardMetricsService('/api/custom-metrics');
```

## Testing

### API Testing
Use the `ApiTestExample` component to test all endpoints:
```jsx
import { ApiTestExample } from './pages/DashboardPage';

function TestPage() {
  return <ApiTestExample />;
}
```

### Widget Testing
Each widget has a "Test Data" button that shows a preview of the API response.

### Health Check
The system includes an API health check endpoint for monitoring:
```javascript
const health = await apiService.healthCheck();
```

## Troubleshooting

### Common Issues

1. **"Failed to load widget data"**
   - Check API endpoint availability
   - Verify authentication token
   - Check network connectivity

2. **"Preview not available"**
   - Only fuel_dispense, fuel_used_gps, engine_hours, and km_travel support preview
   - Other metric types need custom implementation

3. **Widget not updating**
   - Check auto-refresh is enabled
   - Verify widget is in 'live' mode for real-time updates
   - Check browser console for errors

4. **Configuration not saving**
   - Check localStorage is available
   - Verify JSON serialization is working
   - Check for browser storage limits

### Debug Mode
In development mode, API health status is shown in the top-right corner.

## Performance Considerations

### Optimization Tips
- **Limit concurrent widgets** - Too many auto-refreshing widgets can impact performance
- **Use appropriate refresh intervals** - Live widgets refresh more frequently
- **Cache data when possible** - Cumulative data can be cached longer
- **Lazy loading** - Only load widget data when visible

### Monitoring
- **API response times** - Monitor backend performance
- **Frontend render times** - Use React DevTools
- **Memory usage** - Check for memory leaks in auto-refresh
- **Network requests** - Minimize unnecessary API calls

## Next Steps

1. **Add more metric types** - Extend the API for additional metrics
2. **Implement SignalR** - Real-time push updates instead of polling
3. **Add data visualization** - Charts and graphs for historical data
4. **Export functionality** - Allow exporting widget data
5. **User preferences** - Save personal dashboard layouts
6. **Alert thresholds** - Configurable alerts for metric values

## Support

For issues or questions about the dashboard system:
1. Check the browser console for errors
2. Verify API endpoints are accessible
3. Test individual components using the examples
4. Check the backend logs for API errors
