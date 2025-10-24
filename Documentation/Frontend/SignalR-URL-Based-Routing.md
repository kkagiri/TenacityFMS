# SignalR URL-Based Connection Routing

## Overview

The FMS frontend uses an intelligent URL-based routing system to automatically manage SignalR connections. The `SignalRConnectionManager` monitors the current route and starts/stops appropriate SignalR services based on the page being viewed.

## Architecture

### Components

1. **SignalRConnectionManager** (`src/signalR/SignalRConnectionManager.js`)
   - Central manager that controls all SignalR services
   - Maps routes to required SignalR services
   - Automatically starts/stops connections based on URL

2. **useSignalRRouting Hook** (`src/hooks/useSignalRRouting.js`)
   - React hook that integrates routing with SignalR lifecycle
   - Monitors route changes via React Router
   - Provides connection status to components

3. **Three SignalR Services**
   - **dashboardSignalRService**: Dashboard metrics, widgets, and real-time analytics
   - **ptsSignalRService**: PTS devices, pumps, fueling, probes, readers
   - **businessSignalRService**: Tank stock, alarms, notifications, deliveries

## Route Patterns

### Dashboard Routes → `dashboardSignalRService`
```javascript
/home
/dashboard
/dashboard/*
/
```

### PTS Routes → `ptsSignalRService`
```javascript
/pts/*
/pump/*
/device/*
/fuel/*
/tag/*
/probe/*
/reader/*
/fueling/*
/atg/*
```

### Business Routes → `businessSignalRService`
```javascript
/tankstock/*
/tank-stock/*
/notifications/*
/issue-tracker/*
/active-alarms/*
/alarms/*
/stock/*
/delivery/*
/consumption/*
/adjustment/*
```

### Admin/Reports Routes → Multiple Services
```javascript
/admin/*        → businessSignalRService
/reports/*      → dashboardSignalRService + businessSignalRService + ptsSignalRService
/analytics/*    → dashboardSignalRService + businessSignalRService + ptsSignalRService
```

### Routes with NO SignalR
```javascript
/vehicles/*
/site/*
/user/*
/roles/*
/permissions/*
/navigation/*
/admin/users/*
/admin/roles/*
/admin/permissions/*
```

## Implementation

### 1. App-Level Setup (Content.js)

```javascript
import { useSignalRRouting } from "./hooks/useSignalRRouting";

export default function Content() {
  // Initialize route-based SignalR management
  const signalRState = useSignalRRouting({
    enabled: true,
    debounceMs: 300,
    onConnectionChange: (status) => {
      console.log('SignalR status changed:', status);
    }
  });

  return (
    <AppDrawerLayout>
      <Routes>
        {/* Your routes */}
      </Routes>

      {/* Connection Status Display */}
      <Footer>
        {signalRState.isDashboardConnected && <span>● Dashboard</span>}
        {signalRState.isPtsConnected && <span>● PTS</span>}
        {signalRState.isBusinessConnected && <span>● Business</span>}
      </Footer>
    </AppDrawerLayout>
  );
}
```

### 2. Component Usage (DO NOT manually start/stop)

#### ✅ CORRECT - Let manager handle connections

```javascript
import dashboardSignalRService from '../signalR/dashboardSignalRService';

function MyDashboardComponent() {
  useEffect(() => {
    // Subscribe to events - connection is already managed
    const unsubscribe = dashboardSignalRService.on('MetricUpdate', (data) => {
      console.log('Metric update:', data);
    });

    return () => unsubscribe();
  }, []);

  return <div>Dashboard Content</div>;
}
```

#### ❌ WRONG - Don't manually start/stop

```javascript
function MyDashboardComponent() {
  useEffect(() => {
    // ❌ DON'T DO THIS - Connection manager handles this
    dashboardSignalRService.start();

    return () => {
      // ❌ DON'T DO THIS - Connection manager handles this
      dashboardSignalRService.stop();
    };
  }, []);
}
```

### 3. Checking Connection Status

```javascript
function MyComponent() {
  const signalR = useSignalRRouting();

  useEffect(() => {
    if (signalR.isDashboardConnected) {
      // Dashboard SignalR is connected and ready
      console.log('Dashboard connected');
    }
  }, [signalR.isDashboardConnected]);

  return <div>Content</div>;
}
```

### 4. Manual Service Control (Advanced/Debugging)

```javascript
const signalR = useSignalRRouting();

// Refresh a specific service
await signalR.refreshService('dashboard');

// Check if service should be active for current route
const shouldBeActive = signalR.shouldServiceBeActive('pts');

// Get full status
const status = signalR.getStatus();
console.log('Active services:', status.activeServices);
```

## How It Works

### 1. Initialization
When the app loads, `useSignalRRouting` hook in `Content.js` initializes the `SignalRConnectionManager` with the current route.

### 2. Route Change Detection
React Router's `useLocation` hook detects URL changes and triggers the manager's `handleRouteChange()` method.

### 3. Service Determination
The manager checks the route against predefined patterns to determine which services are needed:

```javascript
getRequiredServices(path) {
  const services = new Set();

  // Check if route doesn't need SignalR at all
  if (this.matchesPattern(path, ROUTE_PATTERNS.NO_SIGNALR)) {
    return services; // Empty set
  }

  // Add required services based on route patterns
  if (this.matchesPattern(path, ROUTE_PATTERNS.DASHBOARD)) {
    services.add('dashboard');
  }

  if (this.matchesPattern(path, ROUTE_PATTERNS.PTS)) {
    services.add('pts');
  }

  if (this.matchesPattern(path, ROUTE_PATTERNS.BUSINESS)) {
    services.add('business');
  }

  return services;
}
```

### 4. Start/Stop Services
The manager compares required services with currently active services and starts/stops accordingly:

```javascript
async handleRouteChange(newPath) {
  const requiredServices = this.getRequiredServices(newPath);
  const servicesToStart = [];
  const servicesToStop = [];

  // Determine which services to start
  for (const service of requiredServices) {
    if (!this.activeServices.has(service)) {
      servicesToStart.push(service);
    }
  }

  // Determine which services to stop
  for (const service of this.activeServices) {
    if (!requiredServices.has(service)) {
      servicesToStop.push(service);
    }
  }

  // Stop unnecessary services
  await Promise.all(servicesToStop.map(service => this.stopService(service)));

  // Start required services
  await Promise.all(servicesToStart.map(service => this.startService(service)));
}
```

### 5. Request Initial Data
After successfully starting a service, the manager requests initial data:

```javascript
async requestInitialData(serviceName) {
  switch (serviceName) {
    case 'dashboard':
      if (dashboardSignalRService.getConnectionStatus()) {
        await dashboardSignalRService.requestDashboardMetrics();
      }
      break;
    case 'pts':
      if (ptsSignalRService.getConnectionStatus()) {
        await ptsSignalRService.requestDeviceStatusSummary();
      }
      break;
    case 'business':
      // Business service initial data requests if needed
      break;
  }
}
```

## Benefits

### 1. **Resource Optimization**
- Only active connections for routes that need them
- Reduces server load and network traffic
- Prevents unnecessary WebSocket connections

### 2. **Automatic Management**
- No manual connection handling in components
- Centralized connection lifecycle
- Consistent behavior across the app

### 3. **Performance**
- Connections start when needed
- Connections stop when no longer needed
- Prevents memory leaks from orphaned connections

### 4. **Developer Experience**
- Simple component code - just subscribe to events
- No need to manage connection state
- Clear separation of concerns

## Migration Guide

### Before (Manual Management)
```javascript
function MyComponent() {
  useEffect(() => {
    const init = async () => {
      if (!dashboardSignalRService.isConnected) {
        await dashboardSignalRService.start();
      }

      const unsubscribe = dashboardSignalRService.on('event', handler);

      return () => {
        unsubscribe();
        dashboardSignalRService.stop();
      };
    };

    init();
  }, []);
}
```

### After (URL-Based Management)
```javascript
function MyComponent() {
  useEffect(() => {
    // Connection is automatically managed - just subscribe
    const unsubscribe = dashboardSignalRService.on('event', handler);
    return () => unsubscribe();
  }, []);
}
```

## Troubleshooting

### Connection Not Starting
1. Check route patterns in `SignalRConnectionManager.js`
2. Verify the route matches expected patterns
3. Check browser console for connection manager logs: `[SignalRManager]`

### Multiple Connections
1. Ensure no components are calling `.start()` manually
2. Check that legacy hooks/HOCs are removed
3. Verify only one `useSignalRRouting` instance in the app (in `Content.js`)

### Connection Not Stopping
1. Check that route change is detected (watch console logs)
2. Verify route is correctly matched to NO_SIGNALR patterns if applicable
3. Check for memory leaks holding references to services

### Authentication Issues
1. Ensure JWT token is in localStorage
2. Check token expiry
3. Verify token is passed to SignalR in `accessTokenFactory`

## Debugging

### Console Logging
All connection manager activity is logged with prefixes:
- `[SignalRManager]` - Connection manager operations
- `[useSignalRRouting]` - Hook lifecycle events
- `[Dashboard SignalR]` - Dashboard service events
- `[PTS SignalR]` - PTS service events
- `[Business SignalR]` - Business service events

### Status Inspection
```javascript
const signalR = useSignalRRouting();

// Get current status
const status = signalR.getStatus();
console.log('Status:', status);

// Output:
// {
//   initialized: true,
//   currentPath: '/dashboard',
//   activeServices: ['dashboard'],
//   dashboardConnected: true,
//   ptsConnected: false,
//   businessConnected: false
// }
```

### Manual Testing
```javascript
const signalR = useSignalRRouting();

// Force service connection (for testing)
await signalR.connectService('dashboard');

// Force service disconnection (for testing)
await signalR.disconnectService('pts');

// Refresh service
await signalR.refreshService('business');
```

## Best Practices

1. **Single Initialization**: Only initialize `useSignalRRouting` once in `Content.js` or `App.js`

2. **Event Subscriptions**: Always clean up event subscriptions in component cleanup:
   ```javascript
   useEffect(() => {
     const unsubscribe = service.on('event', handler);
     return () => unsubscribe();
   }, []);
   ```

3. **Check Connection Before Invoking**: When manually invoking hub methods:
   ```javascript
   if (dashboardSignalRService.isConnected) {
     await dashboardSignalRService.requestDashboardMetrics();
   }
   ```

4. **Route Pattern Updates**: When adding new routes, update `ROUTE_PATTERNS` in `SignalRConnectionManager.js`

5. **Connection Status Display**: Show users which services are connected in the UI (see `Content.js` footer example)

## Performance Considerations

### Debouncing
Route changes are debounced by default (300ms) to prevent rapid connection cycling during navigation.

```javascript
const signalR = useSignalRRouting({
  debounceMs: 300 // Adjust if needed
});
```

### Connection Pooling
The manager prevents duplicate connections by tracking active services and ignoring redundant start requests.

### Health Monitoring
Each service has its own health check system running every 30 seconds to detect and recover from connection issues.

## Summary

The URL-based SignalR routing system provides:
- ✅ Automatic connection management based on routes
- ✅ Resource optimization (only needed connections)
- ✅ Simplified component code
- ✅ Centralized connection lifecycle
- ✅ Better performance and reduced server load
- ✅ Consistent connection behavior

**Key Rule**: Let the `SignalRConnectionManager` handle connection lifecycle. Components should only subscribe to events.
