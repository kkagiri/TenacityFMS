# SignalR Connection Start Guards

## Date: 2025-10-23

## Purpose

Prevent race conditions and duplicate connection attempts when multiple components or the ConnectionManager try to start SignalR services simultaneously.

## Implementation

### Guard Mechanism

Each SignalR service (dashboard, PTS, business) implements a `_isStarting` flag that prevents concurrent connection attempts:

```javascript
class SignalRService {
  constructor() {
    this._isStarting = false; // Guard against concurrent start()
    // ... other properties
  }

  async start(hubUrl = null) {
    // Guard 1: Check if already starting
    if (this._isStarting) {
      console.log("[Service] Start already in progress, skipping");
      return;
    }

    // Guard 2: Check if already connected
    const currentState = this.connection?.state;
    if (currentState === HubConnectionState.Connected) {
      console.log("[Service] Already connected");
      return;
    }

    // Guard 3: Check if connecting/reconnecting
    if (
      currentState === HubConnectionState.Connecting ||
      currentState === HubConnectionState.Reconnecting
    ) {
      console.log("[Service] Connection is in progress, skipping start");
      return;
    }

    try {
      this._isStarting = true; // Set guard

      // Connection logic here...

    } catch (error) {
      console.error("[Service] Connection error:", error);
      throw error;
    } finally {
      this._isStarting = false; // Always reset guard
    }
  }

  async stop() {
    this._isStarting = false; // Reset guard on stop

    if (this.connection) {
      await this.connection.stop();
    }
  }
}
```

## Why This Is Needed

### Scenario 1: Parallel Service Starts (REPORTS route)

When navigating to `/reports/fuel-importer`, the ConnectionManager needs all three services:

```javascript
// SignalRConnectionManager.handleRouteChange()
const requiredServices = ['dashboard', 'business', 'pts'];

// All three start in parallel
await Promise.all([
  this.startService('dashboard'),
  this.startService('business'),
  this.startService('pts')
]);
```

**Without guards**: Services could try to connect multiple times
**With guards**: Second attempt is safely skipped

### Scenario 2: Route Change During Connection

User navigates quickly:
1. `/home` → dashboard service starts connecting
2. `/reports` → manager tries to start dashboard again (already connecting)

**Without guards**: Duplicate connection attempts, errors
**With guards**: Second attempt is skipped, first connection completes

### Scenario 3: Component Manual Start (Legacy)

Some components may still have manual start calls:

```javascript
// Component effect
useEffect(() => {
  if (!dashboardSignalRService.isConnected) {
    dashboardSignalRService.start(); // Manual start
  }
}, []);
```

**Without guards**: If ConnectionManager also starts the service, both attempts conflict
**With guards**: One succeeds, the other is safely skipped

## Console Log Examples

### Normal Behavior (Guards Working)

```
[SignalRManager] Route changed to /reports/fuel-importer
[SignalRManager] Required services: ['dashboard', 'business', 'pts']
[SignalRManager] Starting dashboard service
[Dashboard SignalR] Starting connection attempt (ID: o515oy54k7i)...
[Dashboard SignalR] State: connecting
[SignalRManager] Starting business service
[Business SignalR] Starting connection attempt (ID: 9n69nuabk9h)...
[Business SignalR] Start already in progress, skipping ✅
[SignalRManager] Starting pts service
[PTS SignalR] Starting connection attempt (ID: fb1gkos71pu)...
[PTS SignalR] State: connecting
```

The **"Start already in progress, skipping"** message indicates:
- ✅ The guard is working correctly
- ✅ A connection attempt is already in progress
- ✅ The duplicate attempt was safely prevented
- ✅ **This is GOOD behavior, not an error**

### Problem Behavior (If Guards Were Missing)

```
[Dashboard SignalR] Starting connection attempt (ID: abc123)...
[Dashboard SignalR] Starting connection attempt (ID: def456)... ❌ DUPLICATE
Error: Connection already in progress ❌
WebSocket connection failed ❌
```

## Service Implementation Status

| Service | Has Guard | Location |
|---------|-----------|----------|
| **dashboardSignalRService** | ✅ Yes | `src/signalR/dashboardSignalRService.js:134` |
| **businessSignalRService** | ✅ Yes | `src/signalR/businessSignalRService.js:115` |
| **ptsSignalRService** | ✅ Yes | `src/signalR/ptsSignalRService.js:70` (Added 2025-10-23) |

## Guard States

### `_isStarting = true`
- Connection attempt in progress
- `start()` method is executing
- Will reset in `finally` block

### `_isStarting = false`
- No connection attempt in progress
- Safe to start connection
- Default state

## Edge Cases Handled

### 1. Error During Connection
```javascript
try {
  this._isStarting = true;
  // Error occurs here
  throw new Error("Connection failed");
} catch (error) {
  console.error(error);
  throw error;
} finally {
  this._isStarting = false; // ✅ Guard still reset
}
```

### 2. Early Return
```javascript
async start() {
  if (this._isStarting) {
    return; // ✅ Early return, no finally needed
  }

  if (this.connection?.state === HubConnectionState.Connected) {
    return; // ✅ Early return, no finally needed
  }

  try {
    this._isStarting = true;
    // ...
  } finally {
    this._isStarting = false;
  }
}
```

### 3. Stop Called During Start
```javascript
async stop() {
  this._isStarting = false; // ✅ Reset guard
  await this.connection.stop();
}
```

If `stop()` is called while `start()` is in progress:
1. `stop()` resets `_isStarting = false`
2. `start()` finally block also resets it (safe, already false)
3. Connection is stopped cleanly

## Testing the Guards

### Manual Test

```javascript
// In browser console
const service = dashboardSignalRService;

// Attempt 1
service.start();
// [Dashboard SignalR] Starting connection attempt...

// Attempt 2 (immediate)
service.start();
// [Dashboard SignalR] Start already in progress, skipping ✅

// Wait for connection to complete
// Then attempt 3
service.start();
// [Dashboard SignalR] Already connected ✅
```

### Automated Test Scenarios

1. **Parallel Starts**: Call `start()` multiple times in parallel
2. **Rapid Navigation**: Navigate between routes quickly
3. **Component Mount/Unmount**: Components mounting during connection
4. **Error Recovery**: Test guard reset after connection errors

## Troubleshooting

### "Start already in progress" appears frequently

**Cause**: Multiple components or ConnectionManager starting the same service

**Solution**:
- ✅ This is expected behavior with the guards
- ✅ Review why multiple start attempts are happening
- ✅ Consider removing manual `start()` calls in components

### Connection never completes after "Start already in progress"

**Cause**: Guard may not be resetting properly

**Checklist**:
1. ✅ Verify `finally` block exists in `start()` method
2. ✅ Check that `stop()` resets `_isStarting`
3. ✅ Look for uncaught exceptions preventing finally execution
4. ✅ Check browser console for actual errors

### Service appears stuck in "starting" state

**Diagnosis**:
```javascript
// In browser console
console.log(dashboardSignalRService._isStarting); // Should be false
console.log(dashboardSignalRService.state); // Check current state
console.log(dashboardSignalRService.connection?.state); // Check connection state
```

**Fix**:
```javascript
// Manual reset if truly stuck
dashboardSignalRService._isStarting = false;
dashboardSignalRService.start();
```

## Best Practices

1. **Always use finally block** when setting `_isStarting = true`
2. **Reset guard in stop()** method
3. **Check multiple conditions** (isStarting, isConnected, connection state)
4. **Log guard actions** for debugging
5. **Don't manually modify `_isStarting`** in production code

## Performance Impact

### Guard Overhead
- Minimal: Single boolean check
- Happens before any network operation
- Prevents expensive duplicate connections

### Benefits
- Prevents duplicate WebSocket connections
- Reduces server load
- Eliminates race condition errors
- Faster overall connection establishment

## Summary

The `_isStarting` guard mechanism:
- ✅ Prevents race conditions in SignalR connections
- ✅ Safely handles parallel service start attempts
- ✅ Works with ConnectionManager route-based control
- ✅ Provides clean error recovery
- ✅ Has minimal performance overhead

**When you see "Start already in progress, skipping" in the console, this is GOOD** - it means the guard is protecting against duplicate connection attempts!
