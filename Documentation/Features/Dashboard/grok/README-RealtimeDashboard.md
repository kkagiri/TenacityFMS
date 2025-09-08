# Real-time Dashboard System

This document describes the comprehensive real-time dashboard system implemented for the FMS (Fuel Management System) frontend, integrating with the backend SignalR hub for live updates.

## 🚀 **Overview**

The real-time dashboard system provides:

- **Live Data Updates**: Real-time synchronization with backend metrics
- **SignalR Integration**: Bidirectional communication for instant updates
- **Role-Based Access**: Configurable dashboards based on user permissions
- **Widget Customization**: Dynamic widget configuration and management
- **Responsive Design**: Mobile-friendly interface with modern UI
- **Error Handling**: Robust connection management and fallback mechanisms

## 📁 **Architecture**

### **Frontend Components**

```text
fms.frontend/src/
├── components/dashboard/
│   ├── RealtimeDashboard.js      # Main real-time dashboard component
│   ├── RealtimeDashboard.scss    # Dashboard styling
│   ├── RoleBasedDashboard.js     # Legacy role-based dashboard
│   ├── Dashboard.js              # Entry point component
│   ├── widget/
│   │   ├── StatsCards.js         # Enhanced stats cards with real-time
│   │   └── [other widgets...]
│   └── [configuration modals...]
├── services/
│   ├── signalRService.js         # SignalR client service
│   ├── dashboardService.js       # Dashboard API service
│   ├── dashboardPreferencesService.js  # Preferences management
│   └── DashboardMetricsService.js      # Metrics API service
```

### **Backend Integration**

- **SignalR Hub**: `/frontendHub` for real-time communication
- **API Endpoints**: RESTful APIs for dashboard configuration
- **Authentication**: Integrated with existing auth system

## ⚡ **Real-time Features**

### **Live Updates**

- **Key Statistics**: Fuel dispensed, engine hours, distance travelled
- **Ticker Updates**: Live counters with 5-second intervals
- **Graph Updates**: Chart data with 30-second intervals
- **Device Status**: Real-time connection monitoring

### **Connection Management**

- **Auto-Reconnection**: Automatic reconnection on connection loss
- **Connection Status**: Visual indicators for connection state
- **Error Handling**: Graceful degradation when offline
- **Performance**: Optimized update frequencies to prevent overload

## 🛠 **Setup Instructions**

### **1. Dependencies**

The required dependencies are already included in `package.json`:

```json
{
  "@microsoft/signalr": "^8.0.7",
  "axios": "^1.6.8",
  "react": "^18.2.0",
  "redux": "^5.0.1"
}
```

### **2. Environment Configuration**

Ensure your environment has the correct SignalR hub URL:

```javascript
// In your environment configuration
SIGNALR_HUB_URL: '/frontendHub'
```

### **3. Import and Usage**

```javascript
import RealtimeDashboard from './components/dashboard/RealtimeDashboard';

// Use in your app
function App() {
  return (
    <div className="app">
      <RealtimeDashboard />
    </div>
  );
}
```

## 🔧 **Component API**

### **RealtimeDashboard Props**

```javascript
<RealtimeDashboard
  // No props required - uses Redux for state management
/>
```

### **StatsCards Props**

```javascript
<StatsCards
  pdTotals={previousDayTotals}        // Previous day totals object
  stats={stats}                      // Static stats data
  filterConfig={widgetConfig}        // Widget configuration
  filters={dashboardFilters}         // Filter settings
  sites={sites}                      // Available sites
  metricFilters={metricFilters}      // Metric-specific filters
  realtimeData={realtimeData}        // Real-time data from SignalR
/>
```

## 📊 **Real-time Data Structure**

### **Key Statistics Data**

```javascript
{
  fuel_dispense: 1250.5,      // Current fuel dispensed (L)
  fuel_used_gps: 1180.2,      // Fuel used via GPS (L)
  engine_hours: 45.5,         // Total engine hours
  km_travel: 1250.8,          // Distance travelled (km)
  idling: 12.3               // Idling time (hours)
}
```

### **Ticker Data**

```javascript
{
  fuel_level: 75.5,           // Current fuel level (%)
  active_vehicles: 24,        // Number of active vehicles
  system_load: 68.2          // System load percentage
}
```

### **Graph Data**

```javascript
{
  fuel_consumption_chart: {
    labels: ['00:00', '01:00', '02:00', ...],
    data: [120, 135, 128, ...]
  },
  tank_level_chart: {
    labels: ['Tank 1', 'Tank 2', 'Tank 3'],
    data: [85, 72, 91]
  }
}
```

## 🎨 **Styling**

### **CSS Classes**

```scss
// Main dashboard container
.realtime-dashboard-container {
  // Responsive layout
}

// Connection status indicator
.connection-status {
  &.connected { /* Green styling */ }
  &.disconnected { /* Yellow styling */ }
  &.error { /* Red styling */ }
}

// Real-time update indicators
.realtime-update {
  // Pulse animation for live data
}

// Responsive breakpoints
@media (max-width: 768px) {
  // Mobile-specific styles
}
```

### **Theme Customization**

The dashboard supports theme customization through CSS variables:

```scss
:root {
  --dashboard-primary: #3498db;
  --dashboard-secondary: #2c3e50;
  --dashboard-success: #27ae60;
  --dashboard-warning: #f39c12;
  --dashboard-error: #e74c3c;
}
```

## 🔐 **Security**

### **Authentication Integration**

The dashboard integrates with your existing authentication system:

```javascript
// Automatic token handling via axios interceptors
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### **SignalR Security**

SignalR connections are secured through:

- **JWT Token Authentication**: Automatic token passing
- **CORS Configuration**: Proper cross-origin setup
- **Connection Validation**: Server-side connection authorization

## 📱 **Responsive Design**

### **Breakpoint Strategy**

```scss
// Desktop (default)
.dashboard-grid {
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
}

// Tablet
@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

// Mobile
@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
```

### **Touch Interactions**

- **Swipe Gestures**: Navigate between dashboard sections
- **Tap to Refresh**: Manual widget refresh
- **Long Press**: Context menus for widget configuration

## 🔄 **State Management**

### **Redux Integration**

```javascript
// Dashboard state structure
const dashboardState = {
  connectionStatus: 'connected',     // SignalR connection status
  realtimeData: {},                  // Live data from SignalR
  widgetConfig: {},                  // Widget configuration
  preferences: {},                   // User preferences
  metrics: {}                       // Cached metrics data
};
```

### **Local State Management**

```javascript
const [connectionStatus, setConnectionStatus] = useState('disconnected');
const [realtimeData, setRealtimeData] = useState({
  keyStatistics: {},
  tickers: {},
  graphs: {},
  deviceStatus: {}
});
```

## 🚨 **Error Handling**

### **Connection Errors**

```javascript
// Automatic retry with exponential backoff
signalRService.on('connectionStatusChanged', (connected) => {
  if (!connected) {
    // Show user-friendly error message
    showNotification('Connection lost. Attempting to reconnect...', 'warning');
  } else {
    // Hide error and show success
    showNotification('Connection restored', 'success');
  }
});
```

### **Data Fetching Errors**

```javascript
// Graceful fallback to cached data
try {
  const data = await fetchRealtimeData();
  updateDashboard(data);
} catch (error) {
  console.error('Failed to fetch real-time data:', error);
  // Use cached data or show offline indicator
  showOfflineMode();
}
```

## 📈 **Performance Optimization**

### **Update Throttling**

```javascript
// Throttle rapid updates
const throttledUpdate = useCallback(
  throttle((data) => {
    setRealtimeData(prev => ({ ...prev, ...data }));
  }, 100),
  []
);
```

### **Memory Management**

```javascript
// Cleanup on component unmount
useEffect(() => {
  return () => {
    signalRService.stop();
    clearAllTimers();
    cancelAllRequests();
  };
}, []);
```

## 🧪 **Testing**

### **Unit Tests**

```javascript
describe('RealtimeDashboard', () => {
  it('should establish SignalR connection on mount', () => {
    // Test connection establishment
  });

  it('should update data when receiving SignalR messages', () => {
    // Test real-time data updates
  });

  it('should handle connection failures gracefully', () => {
    // Test error handling
  });
});
```

### **Integration Tests**

```javascript
describe('Dashboard Integration', () => {
  it('should sync data between frontend and backend', () => {
    // Test full data synchronization
  });
});
```

## 🚀 **Deployment**

### **Production Checklist**

- [ ] Configure production SignalR URLs
- [ ] Set up proper CORS policies
- [ ] Enable gzip compression for SignalR
- [ ] Configure connection limits
- [ ] Set up monitoring and logging
- [ ] Test auto-reconnection scenarios

### **Environment Variables**

```bash
# Production environment
REACT_APP_SIGNALR_HUB_URL=wss://api.yourdomain.com/frontendHub
REACT_APP_API_BASE_URL=https://api.yourdomain.com/api
REACT_APP_ENVIRONMENT=production
```

## 📚 **API Reference**

### **SignalR Methods**

#### **Client Methods** (called by server)

- `ReceiveKeyStatisticsUpdate(data)` - Updates key statistics
- `ReceiveTickerUpdate(data)` - Updates ticker values
- `ReceiveGraphUpdate(data)` - Updates chart data
- `ReceiveDeviceStatusUpdate(data)` - Updates device status

#### **Server Methods** (called by client)

- `SubscribeToMetrics(metrics[])` - Subscribe to specific metrics
- `UnsubscribeFromMetrics(metrics[])` - Unsubscribe from metrics
- `RequestAllDevicesStatus()` - Request device status summary

### **Service Methods**

```javascript
// SignalR Service
await signalRService.start(hubUrl);
await signalRService.subscribeToMetrics(['fuel_dispense', 'engine_hours']);
signalRService.on('keyStatisticsUpdate', callback);

// Dashboard Service
await dashboardService.getPreferences();
await dashboardService.savePreferences(preferences);

// Metrics Service
await dashboardMetricsService.getFuelDispensed('live', 'today');
```

## 🐛 **Troubleshooting**

### **Common Issues**

1. **Connection Fails**

   ```javascript
   // Check SignalR hub URL
   console.log('Hub URL:', process.env.REACT_APP_SIGNALR_HUB_URL);
   // Verify CORS configuration
   // Check network connectivity
   ```

2. **Updates Not Received**

   ```javascript
   // Check subscription
   console.log('Subscribed metrics:', signalRService.getSubscriptions());
   // Verify server is sending updates
   // Check browser console for errors
   ```

3. **Performance Issues**

   ```javascript
   // Monitor update frequency
   console.log('Update count:', updateCounter);
   // Check for memory leaks
   // Profile component re-renders
   ```

## 📝 **Migration Guide**

### **From Legacy Dashboard**

1. **Update Imports**

   ```javascript
   // Old
   import RoleBasedDashboard from './RoleBasedDashboard';

   // New
   import RealtimeDashboard from './RealtimeDashboard';
   ```

2. **Update Component Usage**

   ```javascript
   // Old
   <RoleBasedDashboard />

   // New
   <RealtimeDashboard />
   ```

3. **Migrate Preferences**

   ```javascript
   // Preferences are automatically migrated
   // No manual migration required
   ```

## 🎯 **Best Practices**

### **Performance**

- Use `React.memo` for expensive components
- Implement proper memoization with `useMemo`
- Throttle rapid state updates
- Clean up subscriptions on unmount

### **User Experience**

- Show loading states during data fetch
- Provide clear error messages
- Implement offline mode indicators
- Use smooth animations for updates

### **Code Quality**

- Use TypeScript for better type safety
- Write comprehensive unit tests
- Follow React best practices
- Document complex logic

## 📞 **Support**

For issues or questions:

1. Check the browser developer console
2. Review network tab for failed requests
3. Verify SignalR connection status
4. Check server logs for hub activity
5. Test with different browsers/devices

## 🔄 **Version History**

- **v2.0.0**: Complete real-time dashboard rewrite
  - SignalR integration
  - Enhanced UI/UX
  - Improved performance
  - Better error handling
- **v1.5.0**: Legacy role-based dashboard
- **v1.0.0**: Initial dashboard implementation

---

**🎉 Your real-time dashboard is now ready!** The system provides a modern, responsive, and highly interactive dashboard experience with live data updates and comprehensive error handling.
