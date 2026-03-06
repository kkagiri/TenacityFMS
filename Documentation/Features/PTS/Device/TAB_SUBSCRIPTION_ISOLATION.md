# PTS Device Detail - Tab Subscription Isolation

## Problem

The "Node.removeChild" error was caused by **multiple tabs subscribing to the same SignalR events simultaneously**, causing conflicts when React tried to reconcile the DOM.

### Root Cause

When tabbed components all mounted at the same time:
1. **Live Info tab** subscribes to `UploadStatus` and `deviceStatusUpdate`
2. **Terminal tab** subscribes to ALL 11 PTS events (including `uploadStatusUpdate`)
3. Both tabs receive the same SignalR messages
4. Both tabs try to update their state simultaneously
5. Parent component re-renders from Redux
6. React tries to reconcile both tabs' DOM changes at once
7. **DOM node conflict** → "removeChild" error

## Solution: Tab-Based Subscription Isolation

### Strategy

**Only the active tab subscribes to SignalR events**. When you switch tabs:
- Previous tab **unmounts completely** (subscriptions cleaned up)
- New tab **mounts fresh** (creates new subscriptions)
- No subscription conflicts possible

### Implementation

#### 1. Parent Component (PTSDeviceDetailPage.js)

**Only render active tab's component:**

```javascript
const liveInfoComponent = useMemo(() => {
  if (!device || tabLoadingStates[0] || activeTab !== 0) return null;
  return <PTSDeviceLiveInfo ... />;
}, [device, liveData, isWebSocketConnected, tabLoadingStates, activeTab]);

const terminalComponent = useMemo(() => {
  if (!device || tabLoadingStates[1] || activeTab !== 1) return null;
  return <PTSDeviceTerminal ... />;
}, [device?.ptsid, isWebSocketConnected, tabLoadingStates, activeTab]);
```

**Key change:** Added `activeTab !== X` check to return `null` for inactive tabs.

**Parent's own subscriptions are tab-aware:**

```javascript
useEffect(() => {
  if (!deviceid || !realtimeStatus.isLiveDataEnabled) return;

  // Only subscribe when Live Info tab (index 0) is active
  if (activeTab !== 0) {
    console.log(`[PTSDeviceDetail] Live Info not active - skipping parent subscriptions`);
    return;
  }

  console.log(`[PTSDeviceDetail] Live Info active - subscribing to device updates`);

  const handleDeviceUpdate = (data) => {
    if (data.deviceId === deviceid || data.ptsid === deviceid) {
      setLiveData(data);
    }
  };

  const unsubscribeUploadStatus = ptsSignalRService.on("UploadStatus", handleDeviceUpdate);
  const unsubscribeDeviceStatus = ptsSignalRService.on("deviceStatusUpdate", handleDeviceUpdate);

  return () => {
    console.log(`[PTSDeviceDetail] Cleaning up Live Info subscriptions`);
    unsubscribeUploadStatus();
    unsubscribeDeviceStatus();
  };
}, [deviceid, realtimeStatus.isLiveDataEnabled, activeTab]);
```

**Key change:** Added `activeTab` to dependency array, early return if tab not active.

#### 2. Terminal Component (PTSDeviceTerminal.js)

**Simplified to direct state updates (no batching):**

```javascript
const addLog = (eventType, data) => {
  if (isPaused) {
    console.log(`[PTSDeviceTerminal] ⏸️ Skipping log - paused`);
    return;
  }

  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, eventType, data, deviceId: data.deviceId || data.ptsid || deviceId };

  console.log(`[PTSDeviceTerminal] ✓ Adding log entry:`, eventType, logEntry);

  // Direct state update - no batching, no refs
  setLogs((prev) => {
    const newLogs = [...prev, logEntry];
    return newLogs.slice(-maxLogs);
  });
};
```

**Removed:**
- ❌ `pendingLogsRef`
- ❌ `flushTimerRef`
- ❌ `isPausedRef`
- ❌ 50ms debounce batching

**Why this works now:**
- Only one tab subscribes at a time
- No parent re-render conflicts
- Direct state updates are safe

### Tab Behavior

| Action | Live Info Tab (0) | Terminal Tab (1) | Settings Tab (2) | Config Tab (3) |
|--------|-------------------|------------------|------------------|----------------|
| **On Active Tab 0** | ✅ Mounted, subscribed | ❌ Null (unmounted) | ❌ Null (unmounted) | ❌ Null (unmounted) |
| **On Active Tab 1** | ❌ Null (unmounted) | ✅ Mounted, subscribed | ❌ Null (unmounted) | ❌ Null (unmounted) |
| **On Active Tab 2** | ❌ Null (unmounted) | ❌ Null (unmounted) | ✅ Mounted | ❌ Null (unmounted) |
| **On Active Tab 3** | ❌ Null (unmounted) | ❌ Null (unmounted) | ❌ Null (unmounted) | ✅ Mounted |

### Console Log Flow

**When switching to Terminal tab:**
```
[PTSDeviceDetail] Live Info not active - skipping parent subscriptions
[PTSDeviceTerminal] Terminal mounted - setting up subscriptions for device: PTS001
[PTSDeviceTerminal] ✓ Subscribed to uploadStatus
[PTSDeviceTerminal] ✓ Subscribed to uploadStatusUpdate
... (11 events total)
[PTSDeviceTerminal] ✅ All 11 subscriptions active
```

**When receiving a message:**
```
[PTSDeviceTerminal] 📨 Received uploadStatusUpdate: {deviceId: "PTS001", ...}
[PTSDeviceTerminal] ✓ Adding log entry: uploadStatusUpdate {...}
```

**When switching away from Terminal tab:**
```
[PTSDeviceTerminal] 🧹 Cleaning up 11 subscriptions
[PTSDeviceDetail] Live Info active - subscribing to device updates
```

## Benefits

### ✅ No Subscription Conflicts
- Only one tab subscribes at a time
- No competing state updates
- No DOM reconciliation conflicts

### ✅ Clean Memory Management
- Inactive tabs completely unmounted
- No lingering subscriptions
- Proper cleanup on tab switch

### ✅ Predictable Behavior
- Clear console logs show exactly what's happening
- Easy to debug which tab is active
- No mystery re-renders

### ✅ Performance
- Less memory usage (only one tab in memory)
- No unnecessary re-renders
- Faster tab switching

## Testing

### Test 1: Tab Switching
```
1. Open device detail page (Live Info active by default)
2. Check console - should see Live Info subscriptions
3. Switch to Terminal tab
4. Check console - should see:
   - "Cleaning up Live Info subscriptions"
   - "Terminal mounted - setting up subscriptions"
5. Switch back to Live Info
6. Check console - should see:
   - "Cleaning up 11 subscriptions"
   - "Live Info active - subscribing to device updates"
```

### Test 2: Message Reception
```
1. Switch to Terminal tab
2. Trigger device to send messages
3. Messages should appear in terminal
4. No errors in console
5. Switch to Live Info tab
6. Terminal should stop receiving messages
7. Live Info should start updating
```

### Test 3: Multiple Rapid Switches
```
1. Rapidly click between tabs
2. No errors should occur
3. Only active tab should be subscribed
4. Console logs should show proper cleanup
```

## Comparison with Test Page

| Feature | Test Page | Main Terminal (Now) |
|---------|-----------|---------------------|
| Subscriptions | Own connection | Shared ptsSignalRService |
| State Updates | Direct | Direct (simplified) |
| Parent Re-renders | None | Isolated by tab check |
| Batching | None | None (removed) |
| Multiple Tabs | N/A | Tab-isolated |

Both now use the same **direct state update** pattern with **no batching**.

## Key Learnings

1. **Multiple simultaneous subscribers = conflict** - Even with memoization, multiple components subscribing to the same events cause issues
2. **Tab isolation is crucial** - Only mount what you need when you need it
3. **Direct updates work fine** - No need for complex batching when properly isolated
4. **Console logs are essential** - Clear logging makes debugging trivial

## Related Files

- `PTSDeviceDetailPage.js` - Parent with tab-aware rendering
- `PTSDeviceTerminal.js` - Simplified terminal with direct updates
- `PTSDeviceTerminalTestPage.js` - Standalone test page for comparison

---

*Problem solved by ensuring only the active tab subscribes to SignalR events at any given time.*
