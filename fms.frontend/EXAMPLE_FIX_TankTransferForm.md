# Example Fix: TankTransferForm.js

## Before Fix

```javascript
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, SimpleItem, Label, RequiredRule, NumericRule } from 'devextreme-react/form';
// ... other imports

const TankTransferForm = ({ updateFormData, isLoading, onSubmit, onCancel }) => {
    const dispatch = useDispatch();
    const tanksFromStore = useSelector((state) => state.tank.tanks);
    const sites = useSelector((state) => state.site.sites);
    
    // ... rest of component
    
    return (
        <div className="tank-transfer-form">
            <Form formData={formData} onFieldDataChanged={handleFieldChange}>
                {/* form fields */}
            </Form>
        </div>
    );
};
```

## After Fix

```javascript
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';  // Remove useSelector
import { useSignalRSelector } from '../../../hooks/useSignalRSelector';  // ✅ ADD THIS
import { IsolatedForm } from '../../../components/common/SignalRIsolation';  // ✅ ADD THIS
import { Form, SimpleItem, Label, RequiredRule, NumericRule } from 'devextreme-react/form';
// ... other imports

const TankTransferForm = ({ updateFormData, isLoading, onSubmit, onCancel }) => {
    const dispatch = useDispatch();
    // ✅ CHANGE: useSelector → useSignalRSelector
    const tanksFromStore = useSignalRSelector((state) => state.tank.tanks);
    const sites = useSignalRSelector((state) => state.site.sites);
    
    // ... rest of component
    
    // ✅ CHANGE: Wrap form with IsolatedForm
    return (
        <IsolatedForm formId="tankTransfer">
            <div className="tank-transfer-form">
                <Form formData={formData} onFieldDataChanged={handleFieldChange}>
                    {/* form fields */}
                </Form>
            </div>
        </IsolatedForm>
    );
};
```

## Changes Summary

### 1. Update Imports
```javascript
// REMOVE:
import { useDispatch, useSelector } from 'react-redux';

// ADD:
import { useDispatch } from 'react-redux';
import { useSignalRSelector } from '../../../hooks/useSignalRSelector';
import { IsolatedForm } from '../../../components/common/SignalRIsolation';
```

### 2. Replace All useSelector Calls
```javascript
// Line ~20-21: BEFORE
const tanksFromStore = useSelector((state) => state.tank.tanks);
const sites = useSelector((state) => state.site.sites);

// Line ~20-21: AFTER
const tanksFromStore = useSignalRSelector((state) => state.tank.tanks);
const sites = useSignalRSelector((state) => state.site.sites);
```

### 3. Wrap the Return JSX
```javascript
// BEFORE:
return (
    <div className="tank-transfer-form">
        <Form formData={formData} onFieldDataChanged={handleFieldChange}>
            {/* form fields */}
        </Form>
    </div>
);

// AFTER:
return (
    <IsolatedForm formId="tankTransfer">
        <div className="tank-transfer-form">
            <Form formData={formData} onFieldDataChanged={handleFieldChange}>
                {/* form fields */}
            </Form>
        </div>
    </IsolatedForm>
);
```

## Testing

After making changes:

1. **Build Check**
   ```bash
   npm run build
   ```

2. **Runtime Test**
   - Open the Tank Transfer form
   - Start typing in any input field
   - Verify typing is smooth (no stuttering)
   - Verify form doesn't lose focus
   - Check browser console for: `[SignalR Middleware] Skipping duplicate action`

3. **Functional Test**
   - Fill out the form completely
   - Submit the transfer
   - Verify it saves correctly
   - Verify data still updates in real-time elsewhere

## Expected Results

### Before Fix
- ❌ Form refreshes while typing
- ❌ Input loses focus
- ❌ Typing stutters
- ❌ Dropdowns close unexpectedly
- ❌ Console shows many Redux actions

### After Fix
- ✅ Smooth typing experience
- ✅ No focus loss
- ✅ Form stays stable
- ✅ Console shows `[SignalR Middleware]` logs
- ✅ 60-70% fewer Redux actions
- ✅ Data still updates correctly

## Apply Same Pattern To

Use this exact pattern for all other tank stock forms:
- `TankDeliveryForm.js`
- `OpeningStockForm.js`
- `ClosingStockForm.js`
- `StockAdjustmentForm.js`
- `ManualRefillForm.js`

**Time to fix all 6 forms: ~30-45 minutes**
