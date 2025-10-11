# Historical Entry Notice Implementation

## Issue
Tank stock forms were not showing any visual indication when users entered **historical/backdated entries** (entries with dates in the past), even though the validation API was working correctly.

### Example API Response
```json
{
    "data": {
        "isAllowed": true,
        "requiresUserConfirmation": false,
        "policy": "WARN_RECONCILE",
        "message": "No future records found. Entry can proceed without issues.",
        "warningType": "NONE",
        "futureRecordsCount": 0
    },
    "isSuccess": true
}
```

This response indicates:
- ✅ Entry is allowed
- ✅ No future records exist
- ❌ BUT no visual feedback to user that this is a backdated entry

## Root Cause
The `FutureRecordsWarning` component only displays when:
- `showWarning = true` (future records found requiring confirmation)
- OR `validationError` exists (blocking errors)

For historical entries with **no future records**, neither condition is met, so users get **no feedback** that they're creating a backdated entry that will affect tank stock calculations.

## Solution
Added a **Historical Entry Information Notice** to all tank stock forms that:
1. **Detects** when the selected date is before today
2. **Shows an informational blue notice** explaining the impact
3. **Only appears** when NO warnings or errors exist (to avoid clutter)
4. **Disappears** when warnings or errors appear (they take priority)

### Implementation

#### Visual Design
```jsx
<div className="tw-mb-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3">
  <div className="tw-flex tw-items-start">
    <i className="fa-light fa-calendar-clock tw-text-blue-600 tw-mt-0.5 tw-mr-3"></i>
    <div className="tw-flex-1">
      <h4 className="tw-font-medium tw-text-blue-800 tw-mb-1">
        Historical Entry Detected
      </h4>
      <p className="tw-text-blue-700 tw-text-sm">
        You are creating [entry type] for <strong>[date]</strong> (backdated entry).
      </p>
      <p className="tw-text-blue-700 tw-text-sm tw-mt-1">
        <strong>Impact:</strong> This will recalculate the tank's current stock and affect all subsequent records.
      </p>
    </div>
  </div>
</div>
```

#### Logic
```javascript
{formData.date && formData.tankId && !showWarning && !validationError && (
  (() => {
    const selectedDate = new Date(formData.date);
    const today = new Date();
    const isHistorical = selectedDate < new Date(today.setHours(0, 0, 0, 0));

    if (isHistorical) {
      return (
        // Informational notice JSX here
      );
    }
    return null;
  })()
)}
```

### Display Conditions
The notice appears when ALL of the following are true:
1. ✅ `formData.date` exists (date is selected)
2. ✅ `formData.tankId` exists (tank is selected)
3. ✅ Date is before today (historical entry)
4. ✅ `!showWarning` (no future records warning)
5. ✅ `!validationError` (no validation errors)

The notice does NOT appear when:
- ❌ Date is today or future
- ❌ Future records warning is showing
- ❌ Validation errors are showing
- ❌ No date or tank selected yet

## Files Modified

### 1. OpeningStockForm.js
**Location**: `fms.frontend/src/pages/tankStock/forms/OpeningStockForm.js`

**Changes**:
- Added historical entry notice before `FutureRecordsWarning`
- Message: "You are creating an opening stock entry for..."
- Impact: "This will recalculate the tank's current stock and affect all subsequent records."

### 2. ManualRefillForm.js
**Location**: `fms.frontend/src/pages/tankStock/forms/ManualRefillForm.js`

**Changes**:
- Added historical entry notice before `FutureRecordsWarning`
- Message: "You are creating a manual refill for..."
- Impact: "This will recalculate the tank's current stock and affect all subsequent records."

### 3. ClosingStockForm.js
**Location**: `fms.frontend/src/pages/tankStock/forms/ClosingStockForm.js`

**Changes**:
- Added historical entry notice before `FutureRecordsWarning`
- Message: "You are creating a closing stock for..."
- Impact: "This will recalculate the tank's current stock and affect all subsequent records."

### 4. TankTransferForm.js
**Location**: `fms.frontend/src/pages/tankStock/forms/TankTransferForm.js`

**Changes**:
- Added historical entry notice before `FutureRecordsWarning`
- Message: "You are creating a tank transfer for..."
- Impact: "This will recalculate **both tanks'** current stock and affect all subsequent records."
- Uses `formData.fromTankId` instead of `formData.tankId` for tank selection check

## User Experience Flow

### Scenario 1: Normal Entry (Today's Date)
1. User selects today's date
2. No notice appears ✅
3. User fills form and submits

### Scenario 2: Historical Entry (No Future Records)
1. User selects a past date (e.g., 3 days ago)
2. **Blue informational notice appears** ℹ️
   - "Historical Entry Detected"
   - Shows selected date
   - Explains impact on stock calculations
3. User acknowledges and submits

### Scenario 3: Historical Entry (With Future Records)
1. User selects a past date
2. API validation finds future records
3. **Yellow/Orange warning appears** ⚠️ (replaces blue notice)
   - "Future Records Warning"
   - Lists affected records
   - Requires user confirmation
4. User must confirm or cancel

### Scenario 4: Historical Entry (Blocked)
1. User selects a past date
2. API validation blocks entry (policy violation)
3. **Red error appears** ❌ (replaces blue notice)
   - "Entry Blocked"
   - Explains why entry is not allowed
   - No submit possible
4. User must fix date or cancel

## Benefits

### ✅ User Awareness
Users are now **immediately informed** when they're creating backdated entries, even when no future records exist.

### ✅ Data Integrity
Users understand that historical entries will **recalculate tank stocks**, reducing accidental backdating.

### ✅ Progressive Disclosure
Information is shown at the right time:
- **Blue notice** = FYI, no action needed
- **Yellow warning** = Attention needed, confirmation required
- **Red error** = Action blocked, must fix

### ✅ Consistent UX
All tank stock forms now have identical historical entry feedback.

## Technical Details

### Date Comparison Logic
```javascript
const selectedDate = new Date(formData.date);
const today = new Date();
const isHistorical = selectedDate < new Date(today.setHours(0, 0, 0, 0));
```

This compares dates at **midnight (00:00:00)** to avoid timezone issues:
- Selected: 2025-01-08 10:30 AM
- Today: 2025-01-11 00:00:00
- Result: `isHistorical = true` (3 days ago)

### Priority System
1. **Validation Errors** (highest priority - red)
2. **Future Records Warnings** (medium priority - yellow/orange)
3. **Historical Entry Notice** (lowest priority - blue)
4. **No Notice** (current date, no issues)

### Icon Used
- `fa-light fa-calendar-clock` - Represents backdated/historical time

### Colors
- **Background**: `tw-bg-blue-50`
- **Border**: `tw-border-blue-200`
- **Text**: `tw-text-blue-700` / `tw-text-blue-800`
- **Icon**: `tw-text-blue-600`

## Testing Checklist

### Test Case 1: Today's Date
- [ ] Select today's date
- [ ] Verify NO blue notice appears
- [ ] Form should submit normally

### Test Case 2: Historical Date (No Future Records)
- [ ] Select a date 3 days ago
- [ ] Verify blue notice appears with correct date
- [ ] Verify message says "Historical Entry Detected"
- [ ] Verify impact message is clear
- [ ] Form should allow submission

### Test Case 3: Historical Date (With Future Records)
- [ ] Select a historical date with future records
- [ ] Verify blue notice does NOT appear
- [ ] Verify yellow/orange warning appears instead
- [ ] User must confirm before submitting

### Test Case 4: Historical Date (Blocked)
- [ ] Select a historical date that violates policy
- [ ] Verify blue notice does NOT appear
- [ ] Verify red error appears instead
- [ ] Submit button should be disabled

### Test Case 5: Date Changes
- [ ] Start with today's date (no notice)
- [ ] Change to historical date (notice appears)
- [ ] Change back to today (notice disappears)

### Test Case 6: Tank Not Selected
- [ ] Select historical date
- [ ] Do not select tank yet
- [ ] Verify notice does NOT appear (missing condition)
- [ ] Select tank
- [ ] Verify notice now appears

## Date Fixed
January 11, 2025

## Related Documentation
- Future Records Validation: `Documentation/TWO_PHASE_WIDGET_LOADING_IMPLEMENTATION.md`
- Warning Component: `fms.frontend/src/components/tank-stock/FutureRecordsWarning.js`
- Validation Hook: `fms.frontend/src/hooks/useFutureRecordsValidation.js`
