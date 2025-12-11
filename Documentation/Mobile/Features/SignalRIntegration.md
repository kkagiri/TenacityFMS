# SignalR Integration - FMS Mobile

## Overview

The FMS Mobile application uses SignalR for real-time communication with the backend server. This enables live pump status updates, transaction monitoring, and instant notifications.

## Architecture

```
┌─────────────────┐                    ┌─────────────────┐
│   FMS Mobile    │                    │   FMS Backend   │
│                 │                    │                 │
│  ┌───────────┐  │                    │  ┌───────────┐  │
│  │ SignalR   │◄─┼───── WebSocket ────┼─►│  PTS Hub  │  │
│  │ Service   │  │    or Long Polling │  │           │  │
│  └───────────┘  │                    │  └───────────┘  │
│       │         │                    │       │         │
│       ▼         │                    │       ▼         │
│  ┌───────────┐  │                    │  ┌───────────┐  │
│  │  Redux    │  │                    │  │   PTS     │  │
│  │  Store    │  │                    │  │ Devices   │  │
│  └───────────┘  │                    │  └───────────┘  │
└─────────────────┘                    └─────────────────┘
```

## Service Implementation

### Location
`src/services/signalRService.js`

### Connection States

```javascript
export const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
};
```

### Hub Paths

```javascript
export const HubPaths = {
  PTS: '/ptsHub',          // Pump Terminal System
  DASHBOARD: '/dashboardHub',
  BUSINESS: '/businessHub',
};
```

## Configuration

### URL Resolution

The service resolves the SignalR URL in this priority:

1. `Config.SIGNALR_BASE_URL` (environment variable)
2. `Config.API_BASE_URL` (environment variable)
3. Stored URL in AsyncStorage (`signalr_base_url`)
4. Default fallback: `http://10.0.2.2:5000` (Android emulator localhost)

### Setting Custom URL

```javascript
import signalRService from '../services/signalRService';

// Set base URL (persisted to AsyncStorage)
await signalRService.setBaseUrl('http://192.168.1.100:5000');
```

## Usage

### Starting Connection

```javascript
import signalRService from '../services/signalRService';

// Start with default PTS hub
await signalRService.start();

// Or specify a different hub
await signalRService.start(HubPaths.DASHBOARD);
```

### Subscribing to Devices

```javascript
// Subscribe to a specific PTS device
await signalRService.subscribeToDevice('PTS001');

// The service tracks subscriptions and auto-resubscribes after reconnection
```

### Unsubscribing

```javascript
// Unsubscribe from device updates
await signalRService.unsubscribeFromDevice('PTS001');
```

### Listening to Events

```javascript
// Register event handler
const unsubscribe = signalRService.on('UploadStatusUpdate', (data) => {
  console.log('Device status updated:', data);
});

// Later: cleanup
unsubscribe();

// Or use off() method
signalRService.off('UploadStatusUpdate', handler);
```

### Stopping Connection

```javascript
await signalRService.stop();
```

## Available Events

### Server → Client Events

| Event Name | Description | Data Structure |
|------------|-------------|----------------|
| `UploadStatusUpdate` | Pump status change | `{ deviceId, status: { Pumps, FuelGrades, ... } }` |
| `TransactionUpdate` | Transaction progress | `{ transactionId, deviceId, pumpId, volume, amount, status }` |
| `EndOfTransaction` | Transaction completed | `{ transactionId, deviceId, finalVolume, finalAmount }` |
| `FuelingEvent` | General fueling event | `{ eventType, deviceId, details }` |
| `DeviceConnectionStatus` | Device connection state | `{ deviceId, isConnected }` |
| `AuthorizationResponse` | Auth request result | `{ success, transactionId, message }` |

### Client → Server Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `SubscribeToDevice` | Subscribe to updates | `deviceId: string` |
| `UnsubscribeFromDevice` | Unsubscribe | `deviceId: string` |

## Integration with Redux

The SignalR service automatically dispatches to Redux:

```javascript
// In signalRService.js

// On UploadStatusUpdate
store.dispatch(updateDeviceStatus({
  deviceId: data.deviceId,
  status: {
    uploadStatus: data.status,
    lastUpdated: Date.now(),
  },
}));

// On TransactionUpdate
store.dispatch(updateTransactionProgress({
  deviceId: data.deviceId,
  transactionId: data.transactionId,
  progress: { volume, amount, status, pumpId, nozzleId },
}));

// On connection state change
store.dispatch(updateConnectionStatus({
  deviceId: 'global',
  status: connectionState,
}));
```

## Auto-Reconnection

The service implements automatic reconnection with exponential backoff:

```javascript
.withAutomaticReconnect({
  nextRetryDelayInMilliseconds: (retryContext) => {
    // 1s, 2s, 4s, 8s... max 30s
    return Math.min(30000, Math.pow(2, retryContext.previousRetryCount) * 1000);
  },
})
```

### Reconnection Events

```javascript
// Listen for reconnection state
signalRService.on('connectionStateChanged', ({ state }) => {
  switch (state) {
    case ConnectionState.RECONNECTING:
      console.log('Attempting to reconnect...');
      break;
    case ConnectionState.CONNECTED:
      console.log('Reconnected successfully');
      break;
  }
});
```

## Token Management

### Authentication

The service includes the JWT token in the connection:

```javascript
.withUrl(hubUrl, {
  accessTokenFactory: () => this.getAuthToken(),
  ...
})
```

### Token Expiration Handling

The service checks token expiration before connecting:

```javascript
isTokenExpired(token, bufferSeconds = 60) {
  // Returns true if token expires within buffer time
}
```

If token is expired, the connection attempt will fail with appropriate error.

## Error Handling

### Connection Errors

```javascript
try {
  await signalRService.start();
} catch (error) {
  if (error.message === 'Not authenticated') {
    // Redirect to login
  } else if (error.message === 'Token expired') {
    // Trigger token refresh
  } else {
    // Show connection error
  }
}
```

### Event Handler Errors

Event handlers are wrapped in try-catch to prevent one handler's error from affecting others:

```javascript
_notifyHandlers(eventName, data) {
  handlers.forEach(handler => {
    try {
      handler(data);
    } catch (error) {
      console.error(`Error in ${eventName} handler:`, error);
    }
  });
}
```

## Example: Complete Integration

```javascript
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import signalRService, { ConnectionState } from '../services/signalRService';

const DeviceMonitor = ({ deviceId }) => {
  const dispatch = useDispatch();
  const connectionStatus = useSelector(
    state => state.fueling.connectionStatuses[deviceId]
  );
  const deviceStatus = useSelector(
    state => state.fueling.deviceStatuses[deviceId]
  );

  useEffect(() => {
    // Start SignalR connection
    const initConnection = async () => {
      try {
        await signalRService.start();
        await signalRService.subscribeToDevice(deviceId);
      } catch (error) {
        console.error('SignalR connection failed:', error);
      }
    };

    initConnection();

    // Custom event handlers
    const unsubscribePump = signalRService.on('UploadStatusUpdate', (data) => {
      if (data.deviceId === deviceId) {
        // Handle pump-specific logic
      }
    });

    // Cleanup
    return () => {
      unsubscribePump();
      signalRService.unsubscribeFromDevice(deviceId);
    };
  }, [deviceId]);

  return (
    <View>
      <Text>Connection: {connectionStatus}</Text>
      <Text>Last Update: {deviceStatus?.lastUpdated}</Text>
    </View>
  );
};
```

## Debugging

### Enable Detailed Logging

The service uses `signalR.LogLevel.Information` by default. For more detailed logs:

```javascript
.configureLogging(signalR.LogLevel.Debug)
```

### Check Connection State

```javascript
console.log('Current state:', signalRService.getConnectionState());
console.log('Is connected:', signalRService.isConnected());
console.log('Subscribed devices:', signalRService.getSubscribedDevices());
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection fails immediately | Check URL configuration and network |
| Frequent disconnections | Check server-side timeout settings |
| Not receiving updates | Verify device subscription succeeded |
| Auth errors | Ensure valid JWT token is stored |

## Related Files

- `redux/slices/fuelingSlice.js` - Redux state management
- `hooks/useDeviceData.js` - Device data hook
- `screens/FuelingProcessScreen.js` - Main consumer
