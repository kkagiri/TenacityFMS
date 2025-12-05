# Fuel Audit Wizard - DOM RemoveChild Error Fix

## Problem Description

**Error:** `NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node`

This error occurred when navigating between wizard steps (Step 1 → Step 2 → Step 3), causing the entire wizard to crash and triggering the GlobalErrorBoundary.

## Root Cause Analysis

The error was caused by a **race condition** between multiple concurrent operations during step transitions:

1. **DevExtreme Component Lifecycle**: DevExtreme components (TagBox, DateBox, DataGrid) perform internal DOM manipulation and cleanup
2. **Auto-save Draft Operation**: When clicking "Next", the wizard triggers an XHR request to save the draft
3. **React Component Unmounting**: React tries to unmount the current step component to render the next step
4. **DOM Conflict**: The XHR completion callback attempts to update Redux state, causing React to re-render while DevExtreme is still cleaning up its DOM nodes

### Timeline of the Issue:
```
User clicks "Next" button
  ↓
saveCurrentStepDraft() fires XHR request (async)
  ↓
React begins unmounting current step component
  ↓
DevExtreme components start cleanup (TagBox, DataGrid, etc.)
  ↓
XHR request completes and tries to update Redux state
  ↓
React tries to re-render while DevExtreme is mid-cleanup
  ↓
ERROR: Node removal conflict
```

## Solution Implementation

### 1. Increased Transition Delays (index.js)

**Before:**
```javascript
// 50ms delay - too fast for DevExtreme cleanup
setTimeout(() => {
  dispatch(setWizardStep(currentStep + 1));
  setTimeout(() => setIsTransitioning(false), 100);
}, 50);
```

**After:**
```javascript
// 100ms initial delay + 100ms for save + 150ms final = 350ms total
setTimeout(() => {
  saveCurrentStepDraft(currentStep);

  setTimeout(() => {
    if (currentStep < TOTAL_STEPS) {
      dispatch(setWizardStep(currentStep + 1));
    }
    setTimeout(() => setIsTransitioning(false), 150);
  }, 100);
}, 100);
```

**Why:** Gives DevExtreme components enough time to complete their internal cleanup before React attempts to remove nodes.

### 2. Component Mounted Ref (index.js)

**Added:**
```javascript
const isMountedRef = useRef(true);

useEffect(() => {
  isMountedRef.current = true;
  return () => {
    isMountedRef.current = false;
  };
}, []);

// In saveCurrentStepDraft:
if (!isMountedRef.current) {
  return;
}
```

**Why:** Prevents state updates from XHR callbacks if the wizard component has already unmounted, avoiding React warnings and potential errors.

### 3. DevExtreme Component Disposal (Step1, Step2, Step3)

**Step1SitePeriod.js:**
```javascript
const tagBoxRef = useRef(null);
const selectBoxRef = useRef(null);
const dateBoxStartRef = useRef(null);
const dateBoxEndRef = useRef(null);

useEffect(() => {
  return () => {
    const refs = [tagBoxRef, selectBoxRef, dateBoxStartRef, dateBoxEndRef];
    refs.forEach(ref => {
      if (ref.current?.instance) {
        try {
          ref.current.instance.dispose();
        } catch (e) {
          // Ignore disposal errors
        }
      }
    });
  };
}, []);
```

**Step2TankSelection.js:**
```javascript
const gridRefs = useRef({});

useEffect(() => {
  return () => {
    Object.values(gridRefs.current).forEach(ref => {
      if (ref?.instance) {
        try {
          ref.instance.dispose();
        } catch (e) {
          // Ignore disposal errors
        }
      }
    });
    gridRefs.current = {};
  };
}, []);
```

**Step3TankPreview.js:**
```javascript
useEffect(() => {
  return () => {
    if (gridRef.current?.instance) {
      try {
        gridRef.current.instance.dispose();
      } catch (e) {
        // Ignore disposal errors
      }
    }
  };
}, []);
```

**Why:** Explicitly disposes DevExtreme component instances before React unmounts the component, ensuring clean DOM cleanup and preventing conflicts.

### 4. Transition Overlay Enhancement (index.js)

**Already existed but now more effective:**
```javascript
{isTransitioning && (
  <div className="tw-absolute tw-inset-0 tw-bg-white tw-bg-opacity-80 tw-flex tw-items-center tw-justify-center tw-z-50">
    <div className="tw-text-center">
      <div className="tw-w-8 tw-h-8 tw-border-4 tw-border-blue-600 tw-border-t-transparent tw-rounded-full tw-animate-spin tw-mx-auto tw-mb-2"></div>
      <span className="tw-text-sm tw-text-gray-500">Loading...</span>
    </div>
  </div>
)}
```

**Why:** Prevents user interaction during the critical transition period, avoiding multiple rapid clicks that could compound the race condition.

## Files Modified

1. **fms.frontend/src/pages/tankStock/fuelAudit/components/wizard/index.js**
   - Increased transition delays
   - Added mounted ref check
   - Improved saveCurrentStepDraft safety

2. **fms.frontend/src/pages/tankStock/fuelAudit/components/wizard/step1/Step1SitePeriod.js**
   - Added refs for DevExtreme components
   - Implemented cleanup on unmount

3. **fms.frontend/src/pages/tankStock/fuelAudit/components/wizard/step2/Step2TankSelection.js**
   - Added refs for DataGrid components
   - Implemented cleanup on unmount

4. **fms.frontend/src/pages/tankStock/fuelAudit/components/wizard/step3/Step3TankPreview.js**
   - Added DataGrid ref
   - Implemented cleanup on unmount

## Testing Checklist

- [x] Step 1 → Step 2 navigation (no error)
- [x] Step 2 → Step 3 navigation (no error)
- [x] Step 3 → Step 4 navigation (no error)
- [x] Back navigation (Step 2 → Step 1, etc.)
- [x] Rapid clicking "Next" button (should be prevented by transition state)
- [x] Multi-site selection with multiple DataGrid instances
- [x] Single site selection
- [x] Draft auto-save functionality still works
- [x] No console errors or warnings
- [x] SignalR connection not affected

## Technical Details

### DevExtreme Component Lifecycle

DevExtreme components maintain their own internal DOM state and event handlers. When React unmounts a component containing DevExtreme widgets:

1. React removes the component from the virtual DOM
2. React attempts to remove DOM nodes
3. DevExtreme may still be processing internal cleanup
4. **Conflict occurs if React removes a node DevExtreme is trying to access**

### Proper Disposal Pattern

```javascript
// CORRECT - Explicitly dispose before React cleanup
useEffect(() => {
  return () => {
    if (componentRef.current?.instance) {
      componentRef.current.instance.dispose();
    }
  };
}, []);

// INCORRECT - Let React handle cleanup
// DevExtreme components need explicit disposal!
```

### Race Condition Prevention

The fix uses a **multi-layered approach**:

1. **Time delays**: Give DevExtreme components breathing room
2. **Explicit disposal**: Clean up DevExtreme before React cleanup
3. **Mounted checks**: Prevent post-unmount state updates
4. **Transition state**: Prevent user actions during critical periods

## Performance Impact

- **Minimal**: Added ~350ms transition delay (barely noticeable to users)
- **Benefits**: Eliminates crashes and provides smoother UX with loading indicator
- **Trade-off**: Slight delay is acceptable for stability

## Prevention Guidelines

When using DevExtreme components in React:

1. **Always use refs** for DevExtreme components
2. **Always dispose explicitly** in cleanup functions
3. **Avoid state updates during transitions** (use mounted ref checks)
4. **Test rapid navigation** scenarios
5. **Monitor console** for disposal warnings

## Related Issues

- SignalR WebSocket connection occasionally drops during wizard use (separate issue)
- GlobalErrorBoundary catches the error but entire wizard resets

## Future Improvements

1. Consider using React Suspense for better async handling
2. Implement request cancellation for draft saves when transitioning
3. Add telemetry to track transition timings
4. Consider refactoring to use DevExtreme's built-in wizard component

## References

- DevExtreme React Integration: https://js.devexpress.com/Documentation/Guide/React_Components/DevExtreme_React_Components/
- React Component Lifecycle: https://react.dev/learn/lifecycle-of-reactive-effects
- DOM Manipulation Best Practices: https://react.dev/learn/manipulating-the-dom-with-refs

---

**Fix Implemented:** December 4, 2025
**Tested By:** Development Team
**Status:** ✅ Resolved
