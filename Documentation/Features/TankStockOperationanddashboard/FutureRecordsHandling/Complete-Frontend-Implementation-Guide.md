# Frontend Implementation Guide - Future Records Handling (Complete)

## Overview

This guide covers the complete frontend implementation of robust future records handling for all tank stock management forms. The solution provides a consistent user experience across all forms that modify historical tank stock data.

## Implemented Forms

✅ **OpeningStockForm.js** - Opening stock entry
✅ **ClosingStockForm.js** - Closing stock entry
✅ **TankTransferForm.js** - Tank-to-tank transfers
✅ **ManualRefilPage.js** - Manual fuel refill entries (DataGrid popup editing)

## Core Components

### 1. useFutureRecordsValidation Hook

**Location**: `src/hooks/useFutureRecordsValidation.js`

```javascript
const {
    futureRecords,           // Array of conflicting future records
    selectedFutureRecord,    // Currently selected record for details
    setSelectedFutureRecord, // Function to select a record
    isValidating,           // Loading state during validation
    validationResult,       // Result object with policy info
    validateFutureRecords,  // Function to trigger validation
    resetValidation,        // Function to clear validation state
    canSubmit,             // Boolean indicating if submission is allowed
    requiresConfirmation,   // Boolean indicating if user confirmation needed
    confirmationMessage     // Message to display for confirmation
} = useFutureRecordsValidation();
```

### 2. FutureRecordsWarning Component

**Location**: `src/components/tank-stock/FutureRecordsWarning.js`

Reusable warning component that displays:
- Policy-based messages (BLOCK, WARN_RECONCILE, WARN_RECALCULATE, ALLOW_RECALCULATE)
- List of conflicting future records with details
- User actions when applicable
- Loading states during validation

### 3. Tank Stock Future Records Service

**Location**: `src/services/tankStockFutureRecordsService.js`

Backend integration service for validation API calls.

## Implementation Patterns

### Pattern A: Standard Form Components (Opening/Closing Stock, Tank Transfer)

#### 1. Import Dependencies

```javascript
// Future records validation imports
import { useFutureRecordsValidation } from '../../../hooks/useFutureRecordsValidation';
import FutureRecordsWarning from '../../../components/tank-stock/FutureRecordsWarning';
```

#### 2. Initialize Hook

```javascript
// Future records validation hook
const {
    futureRecords,
    selectedFutureRecord,
    setSelectedFutureRecord,
    isValidating,
    validationResult,
    validateFutureRecords,
    resetValidation,
    canSubmit,
    requiresConfirmation,
    confirmationMessage
} = useFutureRecordsValidation();
```

#### 3. Add Validation Triggers

```javascript
// Tank change handler
const handleTankChange = useCallback((e) => {
    const tankId = e.value;
    const updatedData = { ...formData, tankId };
    setFormData(updatedData);

    // Trigger validation when tank and date are available
    if (tankId && formData.date) {
        validateFutureRecords(tankId, formData.date, 'operation_type');
    } else {
        resetValidation();
    }

    // Clear validation errors for this field
    setValidationErrors(prev => ({ ...prev, tankId: null }));
}, [formData, validateFutureRecords, resetValidation]);

// Date change handler
const handleDateChange = useCallback((e) => {
    const newDate = e.value;
    const updatedData = { ...formData, date: newDate };
    setFormData(updatedData);

    // Trigger validation when date and tank are available
    if (newDate && formData.tankId) {
        validateFutureRecords(formData.tankId, newDate, 'operation_type');
    }

    // Clear validation errors for this field
    setValidationErrors(prev => ({ ...prev, date: null }));
}, [formData, validateFutureRecords]);
```

#### 4. Update Submit Handler

```javascript
const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
        showNotification('Please correct the errors in the form', 'error', 3000);
        return;
    }

    // Check if submission is allowed based on future records validation
    if (!canSubmit) {
        showNotification('Unable to submit due to future records policy. Please check the warnings above.', 'error', 5000);
        return;
    }

    setIsSubmitting(true);
    try {
        const params = prepareParams(formData);
        const response = await dispatch(submitAction(params));

        if (response.success) {
            showNotification(response.message || 'Operation completed successfully', 'success', 3000);
            // Reset validation on success
            resetValidation();
            // Close form
            if (onCancel) onCancel();
            if (onSubmit) onSubmit(formData);
        } else {
            showNotification(response.message || 'Operation failed', 'error', 5000);
        }
    } catch (error) {
        console.error('Error during submission:', error);
        showNotification('An unexpected error occurred', 'error', 3000);
    } finally {
        setIsSubmitting(false);
    }
}, [formData, validateForm, canSubmit, resetValidation, /* other dependencies */]);
```

#### 5. Add Warning Component to Render

```javascript
return (
    <div className="form-container tw-h-full tw-flex tw-flex-col">
        <div className="tw-flex-1 tw-p-4 tw-overflow-auto">
            {/* Form content */}
            <Form>
                {/* Form fields */}
            </Form>

            {/* Future Records Warning */}
            <FutureRecordsWarning
                isVisible={futureRecords.length > 0}
                isValidating={isValidating}
                validationResult={validationResult}
                futureRecords={futureRecords}
                selectedFutureRecord={selectedFutureRecord}
                onFutureRecordSelect={setSelectedFutureRecord}
                requiresConfirmation={requiresConfirmation}
                confirmationMessage={confirmationMessage}
            />

            {/* Other content */}
        </div>

        {/* Footer with buttons */}
        <div className="tw-flex tw-justify-end tw-gap-3 tw-p-4 tw-border-t">
            <Button text="Cancel" onClick={onCancel} disabled={isSubmitting} />
            <Button
                text="Save"
                onClick={handleSubmit}
                disabled={isSubmitting || !canSubmit}
                loading={isSubmitting}
                type="default"
            />
        </div>
    </div>
);
```

### Pattern B: DataGrid Popup Editing (Manual Refill)

#### 1. Add Hook and State

```javascript
// Future records validation hook
const {
    futureRecords,
    selectedFutureRecord,
    setSelectedFutureRecord,
    isValidating,
    validationResult,
    validateFutureRecords,
    resetValidation,
    canSubmit,
    requiresConfirmation,
    confirmationMessage
} = useFutureRecordsValidation();
```

#### 2. Update Field Change Handlers

```javascript
const handleFieldChange = (e) => {
    const { dataField, value } = e;
    setFormData(prevData => {
        const updatedData = {
            ...prevData,
            [dataField]: value
        };

        // Trigger validation when tankId or date changes
        if ((dataField === 'tankId' || dataField === 'date') &&
            updatedData.tankId && updatedData.date) {
            validateFutureRecords(updatedData.tankId, new Date(updatedData.date), 'fuel_refill');
        } else if (dataField === 'tankId' && !value) {
            resetValidation();
        }

        return updatedData;
    });
};

const handleTankChange = (e) => {
    const selectedTankId = e.value;
    setFormData(prevData => {
        const updatedData = {
            ...prevData,
            tankId: selectedTankId
        };

        // Trigger validation when tank and date are available
        if (selectedTankId && updatedData.date) {
            validateFutureRecords(selectedTankId, new Date(updatedData.date), 'fuel_refill');
        } else if (!selectedTankId) {
            resetValidation();
        }

        return updatedData;
    });
};
```

#### 3. Update onSaving Handler

```javascript
const onSaving = async (e) => {
    if (e.changes.length > 0) {
        const change = e.changes[0];
        setSaving(true);
        setLoading(true);

        try {
            if (change.type === 'remove') {
                // Handle delete operation
                await dispatch(deleteFuelRefill(change.key));
                notify('Manual fuel refill deleted successfully.', 'success', 3000);
            } else {
                // Handle insert and update operations
                const updatedData = { ...formData, ...change.data };
                const validation = validateRow(updatedData);

                if (!validation.isValid) {
                    e.cancel = true;
                    notify(validation.message, 'error', 3000);
                    return;
                }

                // Future records validation
                if (updatedData.tankId && updatedData.date) {
                    await validateFutureRecords(updatedData.tankId, new Date(updatedData.date), 'fuel_refill');

                    if (futureRecords.length > 0 && !canSubmit) {
                        e.cancel = true;
                        notify('Unable to save due to future records policy. Please check the warnings and resolve future records first.', 'error', 5000);
                        return;
                    }
                }

                // Proceed with formatted data save...
                const formattedData = {
                    ...updatedData,
                    date: updatedData.date,
                    transactionId: updatedData.transactionId || null,
                    fuelBy: updatedData.fuelBy || user.userName,
                    siteId: updatedData.siteId,
                    tankId: updatedData.tankId
                };

                if (change.type === 'insert') {
                    const response = await dispatch(createFuelRefill(formattedData));
                    if (response.success) {
                        notify('Manual fuel refill created successfully.', 'success', 3000);
                        fetchData();
                    } else {
                        e.cancel = true;
                        notify(response.message || 'Failed to create fuel refill', 'error', 3000);
                    }
                } else if (change.type === 'update') {
                    const response = await dispatch(updateFuelRefill(formattedData));
                    if (response.success) {
                        notify('Manual fuel refill updated successfully.', 'success', 3000);
                        fetchData();
                    } else {
                        e.cancel = true;
                        notify(response.message || 'Failed to update fuel refill', 'error', 3000);
                    }
                }
            }
        } catch (error) {
            e.cancel = true;
            notify('An unexpected error occurred while processing the fuel refill operation.', 'error', 3000);
        } finally {
            setSaving(false);
            setLoading(false);
        }
    }
};
```

#### 4. Add Warning to Form

```javascript
<Form formData={formData} onFieldDataChanged={handleFieldChange}>
    {/* Existing form items */}
    <FItem itemType={'group'} caption={'Refill Details'} colCount={2} colSpan={2}>
        {/* Form fields */}
    </FItem>

    <FItem dataField="comment" editorType="dxTextArea" editorOptions={{ height: 100 }} colSpan={2} />

    {/* Future Records Warning */}
    <FItem itemType={'group'} colSpan={2} cssClass="future-records-warning-container">
        <FutureRecordsWarning
            isVisible={futureRecords.length > 0}
            isValidating={isValidating}
            validationResult={validationResult}
            futureRecords={futureRecords}
            selectedFutureRecord={selectedFutureRecord}
            onFutureRecordSelect={setSelectedFutureRecord}
            requiresConfirmation={requiresConfirmation}
            confirmationMessage={confirmationMessage}
        />
    </FItem>

    <FItem itemType={'group'} caption={'Integration'} colCount={2} colSpan={2}>
        {/* Integration fields */}
    </FItem>
</Form>
```

#### 5. Add Supporting CSS

**File**: `src/pages/manualrefill/manualRefilPage.scss`

```scss
/* Future Records Warning in Manual Refill Form */
.future-records-warning-container .dx-form-group-content {
    padding: 0 !important;
}

.future-records-warning-container .dx-form-group {
    margin-bottom: 0 !important;
}

/* Ensure the warning component has proper spacing within the form */
.future-records-warning-container .future-records-warning {
    margin: 10px 0;
}
```

## Operation Types by Form

| Form | Operation Type | Description |
|------|----------------|-------------|
| OpeningStockForm | `'opening_stock'` | Opening stock entry |
| ClosingStockForm | `'closing_stock'` | Closing stock entry |
| TankTransferForm | `'tank_transfer'` | Tank-to-tank transfers |
| ManualRefilPage | `'fuel_refill'` | Manual fuel refill entries |

## Policy-Based Behavior

### BLOCK Policy
- **UI**: Error-style warning (red background)
- **Button**: Submit disabled (`canSubmit = false`)
- **Message**: "Operation blocked due to future records"
- **Action**: User must resolve future records first

### WARN_RECONCILE Policy
- **UI**: Warning-style message (amber background)
- **Button**: Submit disabled (`canSubmit = false`)
- **Message**: "Please reconcile future records before proceeding"
- **Action**: User must reconcile records manually

### WARN_RECALCULATE Policy
- **UI**: Warning-style message with confirmation
- **Button**: Submit enabled with confirmation (`canSubmit = true, requiresConfirmation = true`)
- **Message**: "Future records will be recalculated. Continue?"
- **Action**: User can proceed with recalculation

### ALLOW_RECALCULATE Policy
- **UI**: No warning displayed
- **Button**: Submit enabled (`canSubmit = true`)
- **Message**: None
- **Action**: Silent recalculation

## Common Implementation Points

### 1. Form Validation Flow
```
User changes tank/date → Trigger validation → Update UI based on policy → Enable/disable submit
```

### 2. Submit Flow
```
User clicks submit → Check canSubmit → Validate form → Process submission → Reset validation
```

### 3. Error Handling
- Network errors during validation
- Invalid API responses
- Concurrent validation requests
- Form state cleanup

### 4. Performance Optimization
- Debounced validation calls
- Memoized validation results
- Efficient re-rendering
- Cleanup on unmount

## Testing Coverage

### Test Scenarios
1. **No Future Records** - Normal operation for all forms
2. **BLOCK Policy** - Verify submission prevented for all forms
3. **WARN_RECONCILE** - Verify warning and submission blocking
4. **WARN_RECALCULATE** - Verify warning and submission allowance with confirmation
5. **ALLOW_RECALCULATE** - Verify silent operation
6. **Loading States** - Verify indicators during validation
7. **Error Handling** - Network failures, invalid responses
8. **Form Reset** - Validation clears when tank/date changes
9. **Mobile Responsive** - Warning display on mobile devices

### Form-Specific Tests
- **Standard Forms**: Tank/date change validation triggers
- **DataGrid Forms**: Popup editing with validation integration
- **Submit Button States**: Proper enabling/disabling
- **Warning Display**: Proper positioning and styling

## Troubleshooting

### Common Issues

#### Validation Not Triggering
- **Cause**: Missing tankId or date
- **Solution**: Ensure both values are present before calling `validateFutureRecords`

#### Submit Button Not Disabling
- **Cause**: `canSubmit` not included in disabled condition
- **Solution**: Update button: `disabled={isSubmitting || !canSubmit}`

#### Warning Not Clearing
- **Cause**: Validation state not reset
- **Solution**: Call `resetValidation()` when tank is cleared

#### DataGrid Warning Not Showing
- **Cause**: CSS class or form structure issues
- **Solution**: Verify CSS class and form item structure

#### Multiple API Calls
- **Cause**: Rapid form changes triggering validation
- **Solution**: Implement debouncing in validation calls

### Debug Tips
1. Check console for validation API calls
2. Verify `futureRecords` array in React DevTools
3. Check `canSubmit` state value
4. Verify operation type parameter
5. Test with different policy configurations

## Future Enhancements

1. **Real-time Validation** - Validate as user types (debounced)
2. **Batch Operations** - Handle multiple record validation
3. **Advanced Reconciliation** - Guided reconciliation workflows
4. **Audit Trail** - Track user decisions and policy applications
5. **Mobile Optimization** - Enhanced mobile experience
6. **Offline Support** - Cache validation results for offline scenarios
7. **Performance Monitoring** - Track validation call performance
8. **A11y Improvements** - Enhanced accessibility features
