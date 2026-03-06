# PTS Device Terminal Fix - November 11, 2025

## Problem
PTSDeviceTerminal was experiencing "Node.removeChild" DOMException errors after implementing tab isolation.

## Root Cause
The issue was **NOT** with the tab isolation pattern - that was working correctly. The problem was in the PTSDeviceTerminal component itself:

### The Bug
```javascript
// BEFORE (BROKEN)
useEffect(() => {
  const addLog = (eventType, data) => {
    if (isPaused) {  // ❌ Closure captures stale isPaused value
      return;
    }
    setLogs(prev => [...prev, logEntry]);
  };

  // Set up subscriptions
  const unsub = ptsSignalRService.on('uploadStatus', addLog);

  return () => unsub();
}, [device?.ptsid, isPaused]); // ❌ Recreates subscriptions on every pause/unpause
```

**What was happening:**
1. User clicks "Pause" button
2. `isPaused` state changes from `false` to `true`
3. Effect re-runs because `isPaused` is in dependencies
4. **ALL 11 SignalR subscriptions are recreated**
5. Old subscriptions are cleaned up
6. New subscriptions are created
7. During this recreation, if messages arrive, both old AND new handlers can fire
8. Multiple handlers try to update DOM → "Node.removeChild" error

### Why Including isPaused in Deps Was Wrong
- The effect **doesn't need** to re-run when pause state changes
- Subscriptions should remain stable for the lifetime of the component (while on that tab)
- Only the `addLog` function needs to know about pause state
- Re-creating subscriptions on pause/unpause causes race conditions

## Solution
Use a **ref** to track pause state instead of including it in effect dependencies:

```javascript
// AFTER (FIXED)
const isPausedRef = useRef(false);

// Keep ref in sync with state
useEffect(() => {
  isPausedRef.current = isPaused;
}, [isPaused]);

useEffect(() => {
  const addLog = (eventType, data) => {
    if (isPausedRef.current) {  // ✅ Always reads current value via ref
      return;
    }
    setLogs(prev => [...prev, logEntry]);
  };

  // Set up subscriptions
  const unsub = ptsSignalRService.on('uploadStatus', addLog);

  return () => unsub();
}, [device?.ptsid]); // ✅ Only recreates when device changes
```

**Why this works:**
1. User clicks "Pause" button
2. `isPaused` state changes → updates UI immediately
3. Separate effect updates `isPausedRef.current`
4. **Subscriptions are NOT recreated** (not in deps)
5. Existing handlers continue to use `isPausedRef.current` which now has the new value
6. No race conditions, no DOM conflicts

## Key Principles

### When to Use Refs vs State in Effects
- **Use State** when the value needs to trigger re-renders or be in JSX
- **Use Refs** when the value is only needed inside event handlers/callbacks
- **Never** include a value in effect deps if you only need its current value in handlers

### Effect Dependency Rules
```javascript
// ❌ BAD - Recreates subscriptions unnecessarily
useEffect(() => {
  const handler = () => {
    if (someState) { /* do something */ }
  };
  subscribe(handler);
}, [someState]); // Changes to someState recreate subscription

// ✅ GOOD - Stable subscriptions, dynamic behavior
const someStateRef = useRef(someState);
useEffect(() => { someStateRef.current = someState; }, [someState]);

useEffect(() => {
  const handler = () => {
    if (someStateRef.current) { /* do something */ }
  };
  subscribe(handler);
}, []); // Subscriptions created once
```

## Files Changed
- `fms.frontend/src/pages/PTSDevice/PTSDeviceDetail/components/PTSDeviceTerminal.js`
  - Added `isPausedRef` to track pause state without recreating subscriptions
  - Added separate effect to sync ref with state
  - Changed `addLog` to check `isPausedRef.current` instead of `isPaused` closure
  - Removed `isPaused` from main effect dependencies

## Testing
1. Navigate to a PTS device detail page
2. Click on Terminal tab
3. Verify messages are streaming (check console logs)
4. Click "Pause" button multiple times rapidly
5. Click "Resume" button multiple times rapidly
6. Switch to another tab and back to Terminal
7. **Expected:** No "Node.removeChild" errors, smooth operation
8. **Console should show:** Subscriptions only created/cleaned when switching tabs, NOT when pausing

## Related Patterns
This same pattern should be used anywhere you have:
- SignalR/WebSocket subscriptions in React components
- Event handlers that need to check state but shouldn't recreate on state changes
- Long-lived subscriptions that should remain stable

## VehicleDetails Status
VehicleDetails.js was reported as working correctly - it doesn't have this issue because it doesn't use SignalR subscriptions in the same way. The tab isolation there works perfectly.

## Lesson Learned
**Tab isolation was correct** - the problem was in how pause state was managed within the terminal component. Always consider whether an effect truly needs to re-run when a dependency changes, or if a ref would be more appropriate.
