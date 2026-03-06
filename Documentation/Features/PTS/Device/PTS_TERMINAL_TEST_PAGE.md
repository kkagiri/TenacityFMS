# PTS Terminal Test Page - Isolated Testing

## Purpose

This is a **completely isolated** test page for debugging the PTS terminal component. It creates its own SignalR connection, separate from the main application's Redux flow and SignalRConnectionManager.

## Access

Navigate to: **`/pts-terminal-test`**

## Features

### Complete Isolation
- ✅ **Own SignalR connection** - Creates HubConnection directly, not shared with app
- ✅ **No Redux** - All state managed locally with useState
- ✅ **No parent dependencies** - Standalone page, no parent re-renders
- ✅ **No route activation** - Bypasses SignalRConnectionManager entirely

### How It Works

1. **User enters Device ID** (e.g., PTS001, PTS002)
2. **Click "Connect"** - Creates new HubConnection to `/ptshub`
3. **Registers all 11 PTS events**:
   - uploadStatus
   - uploadStatusUpdate
   - nozzleStateChange
   - fillingStatus
   - pumpTransactionCompleted
   - pumpOffline
   - rfidTag
   - uploadStatusTagRead
   - probeStatusUpdate
   - readerStatusUpdate
   - fuelingEvent

4. **Filters messages** - Only displays messages for the specified device ID
5. **Displays in terminal** - Real-time streaming with auto-scroll

### Testing Scenarios

#### Test 1: Single Device Monitoring
```
1. Navigate to /pts-terminal-test
2. Enter device ID: PTS001
3. Click "Connect"
4. Wait for messages
5. Verify no crashes or "removeChild" errors
```

#### Test 2: Rapid Messages
```
1. Connect to a busy device
2. Observe multiple rapid messages
3. Verify component doesn't unmount/remount
4. Check console for errors
```

#### Test 3: Connection Stability
```
1. Connect to device
2. Leave page open for extended period
3. Verify connection remains stable
4. Test reconnection if server restarts
```

#### Test 4: Pause/Resume
```
1. Connect and receive messages
2. Click "Pause"
3. Verify no new messages appear
4. Click "Resume"
5. Verify messages continue
```

## Differences from Main Terminal

| Feature | Main Terminal (PTSDeviceTerminal.js) | Test Page |
|---------|--------------------------------------|-----------|
| SignalR | Uses shared ptsSignalRService | Creates own HubConnection |
| Redux | Affected by Redux state updates | No Redux |
| Parent | Inside PTSDeviceDetailPage tabs | Standalone page |
| Route Activation | SignalRConnectionManager activates | Direct connection |
| State | Multiple optimizations (memo, batch) | Simple useState |

## Expected Behavior

### If Test Page Works Fine
- **Issue is in main terminal's integration** (Redux, parent re-renders, memo pattern)
- **Focus on**:
  - Parent component optimization
  - Redux dispatch timing
  - Memo dependencies

### If Test Page Also Crashes
- **Issue is in SignalR message handling** or terminal rendering logic
- **Focus on**:
  - Event handler implementation
  - State update patterns
  - DOM rendering logic

## Configuration

### SignalRConnectionManager
The test page route is added to `NO_SIGNALR` patterns:
```javascript
NO_SIGNALR: [
  // ... other routes
  /^\/pts-terminal-test/, // Test page has its own connection
]
```

This prevents SignalRConnectionManager from activating ptsSignalRService when on the test page.

### Routes
- **Content.js**: Direct route `/pts-terminal-test`
- **app-routes.js**: Case `"pts-terminal-test"` returns `PTSDeviceTerminalTestPage`

## Debugging Tips

### Console Logs
The test page includes detailed console logging:
```javascript
console.log(`[TEST PAGE] ${eventName}:`, data);
```

Look for:
- Connection status changes
- Message arrivals
- Filter matches/mismatches
- Any errors or warnings

### Browser DevTools
1. **Network tab**: Check WebSocket connection to `/ptshub`
2. **Console**: Look for SignalR logs (configured with `LogLevel.Information`)
3. **React DevTools**: Monitor state changes in real-time

### Common Issues

#### No Connection
- Check backend is running
- Verify `/ptshub` endpoint is accessible
- Check CORS settings

#### No Messages Appearing
- Verify device ID matches exactly (case-sensitive)
- Check that device is actually sending messages
- Look for filter logic in console logs

#### Messages for Wrong Device
- Adjust filter logic in event handlers
- Check data structure (PTSID vs ptsid vs PTSId vs deviceId)

## Code Location

**File**: `fms.frontend/src/pages/PTSDevice/PTSDeviceTerminalTestPage.js`

**Key Sections**:
- `connectToSignalR()`: Connection setup with event registration
- `addLog()`: Simple state update (no batching/debouncing)
- Event handlers: Filter by device ID, log to console and terminal

## Next Steps

1. **Run the test page** and trigger some PTS events
2. **Compare behavior** with main terminal
3. **Identify the difference** in stability
4. **Apply learnings** to fix main terminal

---

*This is a diagnostic tool - once the main terminal is stable, this test page can be removed or kept for future debugging.*
