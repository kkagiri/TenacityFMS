# PTS Device Terminal - React Render Optimization Solution

## Problem Statement

The PTSDeviceTerminal component was crashing with the error:
```
DOMException: Failed to execute 'removeChild' on 'Node':
The node to be removed is not a child of this node
```

This occurred after receiving the first SignalR message, indicating a React reconciliation issue.

## Root Cause Analysis

### The Issue Chain

1. **SignalR Event Dispatch**: When `ptsSignalRService.js` receives an `uploadStatusUpdate` event (line 444), it dispatches to Redux:
   ```javascript
   store.dispatch(updateDeviceStatus(data));
   ```

2. **Parent Re-render**: Redux state update triggers `PTSDeviceDetailPage` to re-render

3. **Component Recreation**: The parent's `useMemo` for terminalComponent was depending on the entire `device` object:
   ```javascript
   useMemo(() => { ... }, [device, isWebSocketConnected, tabLoadingStates])
   ```

   Since Redux creates a new `device` object reference, `useMemo` thought the component needed to be recreated.

4. **Race Condition**: The terminal was updating its internal state (adding log entries) at the same time React was trying to reconcile/unmount the component due to parent re-render.

5. **DOM Mismatch**: React's reconciliation algorithm attempted to remove a DOM node that was already being modified by the terminal's state update, causing the "removeChild" error.

## Solution: Multi-Layer Render Isolation

### Layer 1: Component-Level Memoization (PTSDeviceTerminal.js)

#### React.memo with Custom Comparison
```javascript
export default React.memo(PTSDeviceTerminal, (prevProps, nextProps) => {
  // Only re-render if device ID or connection status actually changes
  return (
    prevProps.device?.ptsid === nextProps.device?.ptsid &&
    prevProps.isConnected === nextProps.isConnected
  );
});
```

**Purpose**: Prevent unnecessary re-renders when parent updates but props haven't meaningfully changed.

**How it works**: Custom comparison function returns `true` when props are "equal" (should NOT re-render), `false` when different (should re-render). Only checks device ID and connection status.

#### useMemo for Computed Values
```javascript
// Filter logs based on selected type
const filteredLogs = useMemo(() => {
  if (filterType === "all") return logs;
  return logs.filter(log => log.type === filterType);
}, [logs, filterType]);

// Pre-render the entire log list JSX
const renderedLogs = useMemo(() => {
  if (filteredLogs.length === 0) {
    return (
      <div className="tw-text-gray-500 tw-text-center tw-py-8">
        {isPaused ? "Log paused - waiting for resume..." :
         !isConnected ? "Device not connected - waiting for messages..." :
         "Waiting for messages..."}
      </div>
    );
  }

  return (
    <div className="terminal-messages">
      {filteredLogs.map((log, idx) => (
        <div
          key={`${log.timestamp}-${idx}`}
          className={`terminal-message ${log.type}`}
        >
          <span className="timestamp">{log.timestamp}</span>
          <span className="type-badge">{log.type}</span>
          <span className="content">{log.content}</span>
        </div>
      ))}
    </div>
  );
}, [filteredLogs, isPaused, isConnected]);
```

**Purpose**: Prevent recalculation of filtered logs and re-creation of log list JSX on every render.

**How it works**: useMemo caches the computed value and only recalculates when dependencies change. The `renderedLogs` memo is especially important - it pre-renders the entire log list JSX so React doesn't recreate virtual DOM nodes unnecessarily.

#### useCallback for Event Handlers
```javascript
const handleTogglePause = useCallback(() => {
  setIsPaused((prev) => !prev);
}, []);

const handleClear = useCallback(() => {
  setLogs([]);
}, []);

const handleExport = useCallback(() => {
  const content = logs
    .map((log) => `[${log.timestamp}] [${log.type}] ${log.content}`)
    .join("\n");
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pts-terminal-${device?.ptsid || "unknown"}-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}, [logs, device?.ptsid]);
```

**Purpose**: Maintain stable function references across renders to prevent child component re-renders.

**How it works**: useCallback returns a memoized version of the callback that only changes if dependencies change. This prevents props from appearing "different" to child components.

### Layer 2: Debounced State Updates

#### Batching Mechanism
```javascript
const pendingLogsRef = useRef([]);
const flushTimerRef = useRef(null);

const addLog = useCallback((type, content) => {
  const timestamp = new Date().toLocaleTimeString("en-GB", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });

  // Queue log entry
  pendingLogsRef.current.push({ timestamp, type, content });

  // Clear existing timer
  if (flushTimerRef.current) {
    clearTimeout(flushTimerRef.current);
  }

  // Schedule batch update after 50ms
  flushTimerRef.current = setTimeout(() => {
    if (pendingLogsRef.current.length > 0) {
      setLogs((prevLogs) => {
        const newLogs = [...prevLogs, ...pendingLogsRef.current];
        return newLogs.slice(-MAX_LOG_LINES);
      });
      pendingLogsRef.current = [];
    }
  }, 50);
}, []);
```

**Purpose**: Batch multiple rapid SignalR events into a single React state update.

**How it works**:
1. Log entries are queued in `pendingLogsRef` (doesn't trigger re-render)
2. Timer is reset on each new log (debounce pattern)
3. After 50ms of no new logs, all queued entries are flushed to state in one update
4. Prevents multiple rapid `setState` calls that could conflict with React's commit phase

### Layer 3: Parent Component Optimization (PTSDeviceDetailPage.js)

#### Precise useMemo Dependencies
```javascript
const terminalComponent = useMemo(() => {
  if (!device || tabLoadingStates[1]) return null;
  return (
    <PTSDeviceTerminal
      key={`terminal-${device?.ptsid}`}
      device={device}
      isConnected={isWebSocketConnected}
    />
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [device?.ptsid, isWebSocketConnected, tabLoadingStates]);
```

**Critical Change**: Depend on `device?.ptsid` instead of entire `device` object.

**Why this matters**:
- Redux creates a new `device` object reference on every update
- Depending on `device` would recreate the component on every Redux update
- Depending on `device?.ptsid` only recreates when device ID changes
- We intentionally use the full `device` object inside but only track ID changes
- ESLint warning disabled because this is intentional optimization

#### Stable Connection Status
```javascript
const isWebSocketConnected = useMemo(() => {
  return device?.webSocketCapable === 1 &&
         device?.connectionStatus === "Connected";
}, [device?.webSocketCapable, device?.connectionStatus]);
```

**Purpose**: Convert connection status to stable boolean value.

**How it works**: Creates a boolean that only changes when actual connection properties change, not when device object reference changes.

## How the Layers Work Together

### Scenario: SignalR Event Received

1. **Event arrives**: `uploadStatusUpdate` received by `ptsSignalRService`
2. **Redux dispatch**: Updates device status in store
3. **Parent re-render**: `PTSDeviceDetailPage` renders with new device object
4. **Parent useMemo check**:
   - `device?.ptsid` unchanged → same value
   - `isWebSocketConnected` unchanged → same boolean
   - `tabLoadingStates` unchanged → same array
   - **Result**: `terminalComponent` useMemo returns cached component (no recreation)
5. **Terminal memo check**:
   - Props passed to terminal: `device` object (new reference), `isConnected` boolean (same)
   - Custom comparison: `prevProps.device?.ptsid === nextProps.device?.ptsid` → true
   - **Result**: Terminal does NOT re-render
6. **Terminal state update**:
   - `addLog` queues entry in `pendingLogsRef`
   - After 50ms, batch flushed to state
   - Terminal re-renders with new logs (from its own state, not parent props)

### Key Insight

The terminal's render lifecycle is now **completely decoupled** from the parent's Redux updates:
- Parent can re-render as much as needed (from Redux, context, etc.)
- Terminal only re-renders when:
  1. Device ID actually changes (switching devices)
  2. Connection status changes (device connects/disconnects)
  3. Internal state changes (new logs, pause, filter)

## Testing the Solution

### Test 1: Single Message
```
✅ Expected: Message appears in terminal
✅ Expected: No console errors
✅ Expected: Component remains mounted
```

### Test 2: Rapid Messages
```
✅ Expected: Multiple messages batched and displayed
✅ Expected: Terminal doesn't flicker or unmount
✅ Expected: No "removeChild" errors
```

### Test 3: Parent State Changes
```
✅ Expected: Switching tabs doesn't remount terminal
✅ Expected: Other device updates don't affect terminal
✅ Expected: Terminal continues receiving messages smoothly
```

### Test 4: Device Switch
```
✅ Expected: Terminal recreates when clicking different device
✅ Expected: Old device's messages cleared
✅ Expected: New device's messages start appearing
```

## Performance Benefits

1. **Reduced Renders**: Terminal only re-renders when necessary
2. **Batched Updates**: Multiple rapid events become single state update
3. **Memoized Calculations**: Filter and render logic only runs when inputs change
4. **Stable Handlers**: Event handlers maintain same reference across renders
5. **Decoupled Lifecycle**: Parent and terminal renders are independent

## Implementation Checklist

- [x] Add React.memo with custom comparison to PTSDeviceTerminal
- [x] Add useMemo for filteredLogs computation
- [x] Add useMemo for renderedLogs JSX
- [x] Add useCallback for all event handlers
- [x] Implement 50ms debounced batching for log updates
- [x] Use unique keys with timestamp+index pattern
- [x] Change parent useMemo to depend on device?.ptsid
- [x] Add ESLint disable for intentional optimization
- [x] Verify isWebSocketConnected is stable useMemo

## Related Files

- `PTSDeviceTerminal.js` - Terminal component with all optimizations
- `PTSDeviceDetailPage.js` - Parent with precise useMemo dependencies
- `ptsSignalRService.js` - SignalR service that dispatches to Redux
- `PTSDeviceTerminal.scss` - Terminal styles (unchanged)

## References

- [React.memo Documentation](https://react.dev/reference/react/memo)
- [useMemo Hook](https://react.dev/reference/react/useMemo)
- [useCallback Hook](https://react.dev/reference/react/useCallback)
- [React Reconciliation](https://react.dev/learn/preserving-and-resetting-state)

---

*This optimization pattern can be applied to other real-time components that suffer from parent-triggered re-renders.*
