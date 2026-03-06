# ATG Dashboard "Unknown" Status Fix

## Issue Description

Devices in the ATG Dashboard were showing **"Unknown"** status despite:
- Having "Just now" last activity timestamps
- Being actively connected via WebSocket
- Receiving real-time updates

This created confusion as the devices appeared disconnected in the UI but were actually online and functional.

---

## Root Cause Analysis

### Problem Timeline

1. **Backend sends SignalR event**: `PTSHub.BroadcastConnectedDevicesSummary()` sends `DeviceConnectionSummary` object
2. **SignalR serializes with PascalCase**: By default, SignalR uses .NET's default JSON serialization (PascalCase)
   ```json
   {
     "WebSocketConnections": [
       {
         "DeviceId": "PTS001",
         "Status": 1,  // Enum: 0=Connected, 1=Active, 2=Idle, 3=Disconnected
         "LastMessageAt": "2024-01-15T10:30:00Z",
         "IpAddress": "192.168.1.100"
       }
     ],
     "HttpConnections": []
   }
   ```

3. **Frontend expects camelCase**: Action creator looks for `webSocketConnections` and `httpConnections`
   ```javascript
   export const receiveConnectedDevicesStatus = (statusData) => ({
     type: RECEIVE_CONNECTED_DEVICES_STATUS,
     payload: {
       webSocketConnections: statusData.webSocketConnections || [], // ❌ undefined
       httpConnections: statusData.httpConnections || [],           // ❌ undefined
     },
   });
   ```

4. **Empty arrays processed**: Reducer gets empty arrays, no device statuses are updated
5. **Selector returns "Unknown"**: When merging devices, missing status defaults to "Unknown"

### Why It Happened

- **SignalR JSON serialization was not configured** with camelCase policy
- **Controller JSON serialization** was set to camelCase, but SignalR has separate settings
- This mismatch caused property name incompatibility between backend and frontend

---

## Solution

### Two-Layer Defense

#### 1. Backend Fix: Configure SignalR JSON Serialization (PRIMARY)

**File**: `FMS.WebClient/Extensions/FmsServiceCollectionExtensions.cs`

Added `AddJsonProtocol` with camelCase configuration:

```csharp
var signalRBuilder = services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
    options.MaximumReceiveMessageSize = 102400000; // 100MB
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(60);
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.HandshakeTimeout = TimeSpan.FromSeconds(15);
})
.AddJsonProtocol(options =>
{
    options.PayloadSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.PayloadSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});
```

**Effect**: SignalR now sends camelCase property names:
```json
{
  "webSocketConnections": [...],
  "httpConnections": [...]
}
```

#### 2. Frontend Fix: Handle Both Naming Conventions (DEFENSIVE)

**File**: `fms.frontend/src/redux/actions/ptsActions/deviceConnectionActions.js`

Made action creator handle both PascalCase and camelCase:

```javascript
export const receiveConnectedDevicesStatus = (statusData) => ({
  type: RECEIVE_CONNECTED_DEVICES_STATUS,
  payload: {
    webSocketConnections: statusData.webSocketConnections || statusData.WebSocketConnections || [],
    httpConnections: statusData.httpConnections || statusData.HttpConnections || [],
    timestamp: statusData.timestamp || new Date().toISOString(),
  },
});
```

**File**: `fms.frontend/src/redux/reducers/deviceConnectionReducer.js`

Made reducer handle both naming conventions for nested properties:

```javascript
webSocketConnections.forEach((conn) => {
  // Handle both camelCase and PascalCase property names from SignalR
  const deviceId = conn.deviceId || conn.DeviceId;
  const status = conn.status !== undefined ? conn.status : conn.Status;
  const lastMessageAt = conn.lastMessageAt || conn.LastMessageAt;
  const ipAddress = conn.ipAddress || conn.IpAddress;

  if (deviceId) {
    newStatuses[deviceId] = {
      status: mapStatus(status),
      connectionType: "WebSocket",
      lastActivity: lastMessageAt,
      ipAddress: ipAddress,
      timestamp: summaryTimestamp,
    };
  }
});
```

---

## Status Enum Mapping

The backend `ConnectionStatus` enum is correctly mapped:

| Enum Value | Enum Name      | Frontend Display |
|------------|----------------|------------------|
| 0          | Connected      | "Connected"      |
| 1          | Active         | "Active"         |
| 2          | Idle           | "Idle"           |
| 3          | Disconnected   | "Disconnected"   |

The `mapStatus()` function in the reducer handles both:
- **Number values**: `0, 1, 2, 3`
- **String values**: `"active"`, `"connected"`, `"idle"`, `"disconnected"` (case-insensitive)

---

## Testing Checklist

After deploying this fix, verify:

### Backend Testing
- [ ] SignalR events send camelCase property names
- [ ] No regression in existing SignalR events
- [ ] Redis backplane continues to work correctly

### Frontend Testing
- [ ] Devices no longer show "Unknown" status
- [ ] Status shows as "Active" for recently active devices
- [ ] Status shows as "Connected" for idle devices (2-10 minutes)
- [ ] Status shows as "Idle" for devices with no activity (10-30 minutes)
- [ ] Status shows as "Disconnected" for stale devices (>30 minutes)
- [ ] "Start Fueling" button is enabled for Active/Connected devices
- [ ] "Start Fueling" button is disabled for Disconnected devices
- [ ] Last activity timestamp updates in real-time
- [ ] Connection type shows "via WebSocket" or "via HTTP" correctly

### Real-Time Monitoring
- [ ] Open browser DevTools → Network → WS (WebSocket tab)
- [ ] Watch for `ConnectedDevicesStatus` events
- [ ] Verify JSON payload uses camelCase property names
- [ ] Verify `status` values are numbers (0-3)
- [ ] Verify Redux DevTools shows correct status updates

---

## Debugging Tools

### Browser Console Commands

```javascript
// Check current device connection state in Redux
store.getState().deviceConnections.connectionStatuses

// Check SignalR connection state
window.signalRConnection?.state

// Manually trigger status request
window.signalRConnection?.invoke('RequestDeviceStatusSummary')
```

### Expected Console Output

```javascript
{
  "PTS001": {
    "status": "Active",
    "connectionType": "WebSocket",
    "lastActivity": "2024-01-15T10:30:00Z",
    "ipAddress": "192.168.1.100",
    "timestamp": "2024-01-15T10:30:05Z"
  }
}
```

---

## Related Files

### Backend
- `FMS.WebClient/Extensions/FmsServiceCollectionExtensions.cs` - SignalR configuration
- `FMS.Application/Communication/SignalR/PTSHub.cs` - SignalR hub
- `FMS.Application/Communication/Tracker/DeviceConnectionTracker.cs` - Device status tracking
- `FMS.Application/Communication/Tracker/Common/DeviceConnectionSummary.cs` - DTO definitions

### Frontend
- `fms.frontend/src/redux/actions/ptsActions/deviceConnectionActions.js` - Action creators
- `fms.frontend/src/redux/reducers/deviceConnectionReducer.js` - State management
- `fms.frontend/src/redux/selectors/deviceSelectors.js` - State selectors
- `fms.frontend/src/pages/ATG/ATGDashboard.js` - UI component

---

## Prevention

To prevent similar issues in the future:

1. **Always configure SignalR JSON serialization explicitly**:
   ```csharp
   services.AddSignalR()
       .AddJsonProtocol(options => {
           options.PayloadSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
       });
   ```

2. **Use defensive coding in action creators** to handle both naming conventions
3. **Add TypeScript** to catch property name mismatches at compile time
4. **Add integration tests** that verify SignalR payloads match frontend expectations
5. **Document SignalR event contracts** with expected JSON structure

---

## Impact Assessment

### Before Fix
- ❌ Devices showing "Unknown" status despite being online
- ❌ "Start Fueling" button incorrectly disabled
- ❌ Users cannot verify device connection status
- ❌ Confusion between visual status and actual connectivity

### After Fix
- ✅ Accurate real-time device status display
- ✅ Correct "Start Fueling" button behavior
- ✅ Clear visibility into device health
- ✅ Proper connection type identification (WebSocket vs HTTP)
- ✅ Reliable last activity timestamps

---

## Deployment Notes

### Backend Deployment
1. Build solution with updated SignalR configuration
2. Deploy `FMS.WebClient` service
3. Restart IIS/Kestrel to apply new SignalR settings
4. Verify SignalR endpoints respond correctly

### Frontend Deployment
1. Build frontend with updated action creators/reducers
2. Deploy static assets
3. Clear browser cache to ensure new JS is loaded
4. Verify Redux DevTools shows correct status updates

### Post-Deployment Verification
1. Monitor SignalR logs for any serialization errors
2. Check browser console for any JavaScript errors
3. Verify all devices show correct status within 30 seconds of page load
4. Test "Start Fueling" functionality with real devices

---

## References

- [Previous Fix: ATG Connection Stability](./ATG_CONNECTION_STABILITY_FIX.md)
- [SignalR JSON Configuration Docs](https://learn.microsoft.com/en-us/aspnet/core/signalr/configuration)
- [System.Text.Json CamelCase](https://learn.microsoft.com/en-us/dotnet/api/system.text.json.jsonnamingpolicy.camelcase)
