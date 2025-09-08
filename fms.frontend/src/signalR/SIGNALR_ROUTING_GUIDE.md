# SignalR Route-Based Connection Management Guide

## Overview
The SignalR routing system automatically manages SignalR connections based on the current application route, ensuring optimal network usage and performance.

## Architecture Components

### 1. SignalRConnectionManager
Central manager that controls which SignalR services are active based on route patterns.

### 2. useSignalRRouting Hook
React hook that integrates route-based SignalR management into React components.

### 3. Enhanced SignalR Services
Both `ptsSignalRService.js` and `dashboardSignalRService.js` with advanced networking features.

## Route Mapping

### Dashboard Routes (Dashboard SignalR Active)
- `/home` - Main dashboard
- `/dashboard/*` - All dashboard pages
- `/` - Root (redirects to dashboard)
- `/notifications/*` - Notification system
- `/issue-tracker/*` - Issue tracking
- `/active-alarms/*` - Active alarm monitoring
- `/tankstock/*` - Tank stock monitoring

### PTS Routes (PTS SignalR Active)
- `/pts/*` - PTS device management
- `/pump/*` - Pump controls
- `/device/*` - Device management
- `/fuel/*` - Fuel management
- `/tag/*` - RFID tag management
- `/probe/*` - Probe controls
- `/reader/*` - Reader management
- `/fueling/*` - Fueling process
- `/atg/*` - ATG monitoring
- `/vehicles/*` - Vehicle management

### Admin/Reports Routes (Both Services Active)
- `/admin/*` - Administration
- `/reports/*` - Reporting system
- `/analytics/*` - Analytics

## Usage Examples

### 1. Basic Usage in App Component
```javascript
import { useSignalRRouting } from './hooks/useSignalRRouting';

function App() {
  const signalR = useSignalRRouting({
    enabled: true,
    debounceMs: 300,
    onConnectionChange: (status) => {
      console.log('SignalR status:', status);
    }
  });

  return (
    <div>
      {signalR.isDashboardConnected && <span>Dashboard connected</span>}
      {signalR.isPtsConnected && <span>PTS connected</span>}
    </div>
  );
}
```

### 2. HOC Usage
```javascript
import { withSignalRRouting } from './hooks/useSignalRRouting';

const EnhancedComponent = withSignalRRouting(YourComponent, {
  debounceMs: 500
});
```

### 3. Component Integration
```javascript
function DashboardWidget() {
  const signalR = useSignalRRouting();

  useEffect(() => {
    if (signalR.isDashboardConnected) {
      // Dashboard-specific logic
      console.log('Dashboard SignalR is connected');
    }
  }, [signalR.isDashboardConnected]);

  return <div>Widget content</div>;
}
```

## Configuration Options

### useSignalRRouting Options
```javascript
{
  enabled: true,           // Enable/disable SignalR management
  debounceMs: 300,        // Debounce time for route changes
  onConnectionChange: fn  // Callback for connection status changes
}
```

### Connection Status Object
```javascript
{
  initialized: boolean,
  currentPath: string,
  activeServices: string[],
  dashboardConnected: boolean,
  ptsConnected: boolean
}
```

## Network Optimization Features

### 1. Automatic Connection Management
- Connections start only when needed for current route
- Unused connections automatically stop when navigating away
- Connection pooling prevents duplicate connections

### 2. Advanced Error Handling
- Exponential backoff retry (up to 5 attempts)
- Immediate retry for network errors
- Automatic reconnection with intervals: [0, 2000, 5000, 10000, 30000]ms

### 3. Performance Optimization
- Dynamic debouncing based on live data settings
- Event-specific debounce timings
- Health monitoring every 30 seconds
- Automatic data refresh on prolonged failures

### 4. Resource Management
- Clean up on route changes
- Memory leak prevention
- Connection state tracking

## Debugging

### Console Logging
- `[SignalRManager]` - Connection manager events
- `[useSignalRRouting]` - Hook lifecycle events
- `[Dashboard SignalR]` - Dashboard service events
- `[PTS SignalR]` - PTS service events

### Status Checking
```javascript
const status = signalR.getStatus();
console.log('Current status:', status);
```

### Manual Controls
```javascript
// Refresh a service
await signalR.refreshService('dashboard');

// Manual connect/disconnect
await signalR.connectService('pts');
await signalR.disconnectService('dashboard');
```

## Migration from Legacy SignalR

### Before (Legacy)
```javascript
// ❌ Direct service usage
if (!dashboardSignalRService.getConnectionStatus()) {
  await dashboardSignalRService.start();
}
```

### After (Route-based)
```javascript
// ✅ Let the manager handle connections
const unsubscribe = dashboardSignalRService.on('eventName', handler);
// Connection is automatically managed based on route
```

## Best Practices

1. **Use the hook in main components** - App.js or Content.js level
2. **Let the manager handle connections** - Don't manually start/stop services
3. **Subscribe to events directly** - Services are available when needed
4. **Monitor connection status** - Use the provided status indicators
5. **Handle edge cases** - Check connection status before making requests

## Troubleshooting

### Common Issues
1. **Connection not starting** - Check route patterns in SignalRConnectionManager
2. **Multiple connections** - Ensure no manual service.start() calls
3. **Memory leaks** - Always clean up event listeners
4. **Auth issues** - Verify token availability in localStorage

### Performance Tips
1. Use debouncing for high-frequency events
2. Monitor active services count
3. Check network usage in dev tools
4. Verify connection cleanup on route changes
