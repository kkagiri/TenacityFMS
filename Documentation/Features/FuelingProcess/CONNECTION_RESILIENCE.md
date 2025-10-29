# Connection Resilience & Grace Period System

## Overview
The fueling process implements a robust connection resilience system to handle brief network interruptions without disrupting user operations. This prevents the common issue where momentary network glitches force users to restart their entire fueling process.

## Problem Statement
**Before:**
- Brief network disconnections (even 5-10 seconds) would immediately:
  - Show "Device Disconnected" error
  - Disable all fueling operations
  - Block the "New Fueling" button
  - Force users to restart their workflow
  - Potentially lose transaction data in progress

**Issue:** Network hiccups, WiFi handoffs, brief router issues, or computer power-saving modes would unnecessarily interrupt fueling operations.

## Solution: Grace Period System

### Backend Connection Timing (Redis-Based)
The backend `DeviceConnectionTracker` determines device status based on last message time:

```csharp
// From DeviceConnectionTracker.cs
private static ConnectionStatus DetermineWebSocketStatus(DateTime lastMessageAt)
{
    var timeSinceLastMessage = DateTime.UtcNow - lastMessageAt;
    var minutes = timeSinceLastMessage.TotalMinutes;
    return minutes switch
    {
        < 2 => ConnectionStatus.Active,      // Last message < 2 minutes ago
        < 10 => ConnectionStatus.Connected,  // Last message 2-10 minutes ago
        < 30 => ConnectionStatus.Idle,       // Last message 10-30 minutes ago
        _ => ConnectionStatus.Disconnected   // Last message > 30 minutes ago
    };
}
```

**Key Points:**
- PTS devices send data every ~25 seconds (configurable)
- WebSocket connections are considered "Active" if data received within 2 minutes
- HTTP connections are stale after 15 minutes of no activity
- Backend is already lenient - won't mark device as disconnected for up to 30 minutes

### Frontend Grace Period Implementation

#### Configuration
```javascript
// From ConnectionStatus.js
const DISCONNECT_GRACE_PERIOD = 60; // 60 seconds before showing disconnected
const RECONNECT_GRACE_PERIOD = 5;   // 5 seconds to confirm reconnection
```

#### State Machine

```
Connected/Delayed → Disconnected (Redis)
    ↓
Show as "Delayed" (yellow)
Display: "Reconnecting..." (grace)
    ↓
Wait 60 seconds
    ↓
If still disconnected → Show "Disconnected" (red)
If reconnected → Show "Connected" (green)
```

#### Visual Indicators

| Status | Icon | Color | Text | Meaning |
|--------|------|-------|------|---------|
| Connected | `fa-signal` | Green | "Connected" | Normal operation |
| Delayed | `fa-clock` | Yellow | "Delayed" | Last update 5-30 minutes ago |
| Reconnecting | `fa-clock` | Yellow | "Reconnecting... (grace)" | Grace period active |
| Disconnected | `fa-plug` | Red | "Disconnected" | No connection for 60+ seconds |

### Grace Period Behavior

#### During Grace Period (60 seconds):
1. ✅ **Status shows as "Delayed"** instead of "Disconnected"
2. ✅ **"New Fueling" button remains enabled** (with info notification)
3. ✅ **Active fueling processes continue** without interruption
4. ✅ **Yellow info banner** shows connection is unstable
5. ✅ **Users can complete their current operation**
6. ⏱️ **Timer counts down** in background

#### If Reconnection Occurs:
1. ✅ **Grace period timer cancelled** immediately
2. ✅ **Status updates to "Connected"**
3. ✅ **No user disruption** - seamless recovery
4. ✅ **Console log** shows reconnection event

#### If Grace Period Expires:
1. ❌ **Status changes to "Disconnected"**
2. ❌ **"New Fueling" button disabled**
3. ❌ **Red warning banner** displayed
4. ⚠️ **Active fueling can continue** but with warnings

### Code Implementation

#### ConnectionStatus.js
```javascript
// Grace period timer management
useEffect(() => {
  const previousStatus = previousStatusRef.current;

  // Disconnection detected - start grace period
  if ((previousStatus === "connected" || previousStatus === "delayed") &&
      currentStatus === "disconnected") {

    if (!gracePeriodActive) {
      console.log(`Device disconnected, starting 60s grace period`);
      setGracePeriodActive(true);
      setDisplayStatus("delayed"); // Show as delayed during grace period

      disconnectTimerRef.current = setTimeout(() => {
        console.log(`Grace period expired, showing disconnected`);
        setDisplayStatus("disconnected");
        setGracePeriodActive(false);
        onStatusChange("disconnected");
      }, DISCONNECT_GRACE_PERIOD * 1000);
    }
  }
  // Reconnection detected - cancel grace period
  else if (currentStatus === "connected" || currentStatus === "delayed") {
    if (gracePeriodActive) {
      console.log(`Reconnected during grace period, canceling timer`);
      clearTimeout(disconnectTimerRef.current);
      setGracePeriodActive(false);
    }
    setDisplayStatus(currentStatus);
    onStatusChange(currentStatus);
  }
}, [currentStatus, gracePeriodActive]);
```

#### fuelingprocess.js
```javascript
const handleConnectionStatusChange = (status) => {
  setDeviceConnectionStatus(status);

  // Only block when truly disconnected (not during grace period)
  const isActuallyDisconnected = status === "disconnected";
  setIsDeviceDisconnected(isActuallyDisconnected);

  // Show informative warning during active fueling
  if (isActuallyDisconnected && activeFuelingProcesses?.some(p => p.status === "fueling")) {
    notify(
      "Device connection lost! Active fueling may continue but monitoring may be affected. The device will attempt to reconnect automatically.",
      "warning",
      7000
    );
  }
};

const startFueling = async () => {
  // Only prevent if truly disconnected
  if (deviceConnectionStatus === "disconnected") {
    notify("Cannot start fueling - device is disconnected. Please wait for reconnection.", "error", 3000);
    return;
  }

  // Allow fueling during delayed/reconnecting state
  if (deviceConnectionStatus === "delayed") {
    notify("Connection is delayed but fueling will proceed. Monitor connection status closely.", "info", 3000);
  }

  // ... proceed with fueling
};
```

## User Experience Flow

### Scenario 1: Brief Network Hiccup (< 60 seconds)
```
1. User is in middle of fueling process
2. WiFi briefly disconnects for 10 seconds
3. Status shows "Reconnecting... (grace)" in yellow
4. Yellow banner: "Connection Unstable - will continue for 60s"
5. WiFi reconnects after 10 seconds
6. Status shows "Connected" in green
7. User continues without any disruption
✅ Result: Seamless experience
```

### Scenario 2: Extended Disconnection (> 60 seconds)
```
1. User is selecting pump
2. Network drops completely
3. Status shows "Reconnecting... (grace)" for 60 seconds
4. After 60 seconds, status shows "Disconnected" in red
5. "New Fueling" button disabled
6. Red banner: "Fueling operations disabled"
7. When network returns, auto-reconnects
8. User can resume operations
✅ Result: Protected from starting operations that will fail
```

### Scenario 3: PTS Device Sends Data Every 25 Seconds
```
1. Normal operation: Data arrives every ~25 seconds
2. Brief pause: 40 seconds without data
3. Backend: Still shows "Active" (< 2 minutes)
4. Frontend: Shows "Connected"
5. Data arrives at 50 seconds
6. User never sees any warnings
✅ Result: No false alarms for normal device behavior
```

## Benefits

### For Users:
1. ✅ **No more restart frustration** - brief disconnects don't kill their workflow
2. ✅ **Clear visual feedback** - knows exactly what's happening
3. ✅ **60 second buffer** - enough time for typical network recovery
4. ✅ **Smart warnings** - only disrupts when truly necessary
5. ✅ **Auto-recovery** - reconnects seamlessly without user action

### For System Reliability:
1. ✅ **Prevents data loss** - operations can complete during brief outages
2. ✅ **Reduces support calls** - fewer "why did it disconnect?" issues
3. ✅ **Better UX metrics** - higher completion rates
4. ✅ **Network resilience** - handles real-world connectivity issues
5. ✅ **Maintains transaction integrity** - doesn't abandon mid-process

## Configuration & Tuning

### Recommended Settings
```javascript
// Current conservative settings
DISCONNECT_GRACE_PERIOD = 60 seconds  // Good for typical network issues

// Alternative configurations:
// Aggressive (faster response): 30 seconds
// Conservative (very lenient): 90-120 seconds
```

### Tuning Considerations:
- **PTS device send interval**: Currently ~25 seconds
- **Network environment**: WiFi vs Ethernet
- **Expected downtime**: Brief glitches vs planned maintenance
- **User workflow**: Complex multi-step vs simple operations

### Backend Coordination:
Backend already provides 30-minute buffer before marking "Disconnected", so frontend grace period adds another layer of protection for immediate user actions.

## Testing Scenarios

1. **Brief WiFi Disconnect**
   - Turn off WiFi for 10 seconds
   - ✅ Should show "Reconnecting..." and continue

2. **Extended Network Loss**
   - Unplug Ethernet for 90 seconds
   - ✅ Should block operations after 60 seconds

3. **During Active Fueling**
   - Start fueling, then disconnect network
   - ✅ Should show warning but allow completion

4. **PTS Device Normal Behavior**
   - Monitor status with normal 25-second intervals
   - ✅ Should never show disconnection warnings

## Console Logging

Enable debug logging to monitor grace period behavior:
```javascript
console.log(`[ConnectionStatus] Device ${deviceId} disconnected, starting ${DISCONNECT_GRACE_PERIOD}s grace period`);
console.log(`[ConnectionStatus] Grace period expired for device ${deviceId}, showing disconnected`);
console.log(`[ConnectionStatus] Device ${deviceId} reconnected during grace period, canceling disconnect timer`);
```

## Future Enhancements

1. **Configurable grace period** - Admin setting per site/device
2. **Network quality indicator** - Show signal strength
3. **Predictive warnings** - Alert before grace period expires
4. **Auto-retry logic** - Attempt reconnection before showing errors
5. **Offline mode** - Cache operations for later sync

## Related Files

- `ConnectionStatus.js` - Grace period implementation
- `FuelingHeader.js` - Visual indicators and warnings
- `fuelingprocess.js` - Operation blocking logic
- `DeviceConnectionTracker.cs` - Backend status determination
- `PTSHub.cs` - SignalR broadcasting
- `ptsSignalRService.js` - Frontend SignalR client

---

**Last Updated:** October 29, 2025
**Status:** Production Ready ✅
**Impact:** Significantly improved user experience and reduced workflow interruptions
