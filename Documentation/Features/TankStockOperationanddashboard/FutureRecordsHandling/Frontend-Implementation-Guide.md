# Tank Stock Future Records Handling - Frontend Implementation Guide

## Overview

This document describes the frontend implementation for handling "future records" warnings when users enter historical tank stock data. The solution provides user-friendly warnings, confirmations, and policy-based restrictions in the FMS frontend application.

## Frontend Architecture

### Component Structure

```
src/
├── services/
│   └── tankStockFutureRecordsService.js     # API service for validation
├── hooks/
│   └── useFutureRecordsValidation.js        # Custom hook for validation logic
├── components/
│   └── tank-stock/
│       ├── FutureRecordsWarning.js          # Warning display component
│       └── FutureRecordsWarning.scss        # Component styles
└── pages/
    └── tankStock/
        └── forms/
            ├── OpeningStockForm.js           # Updated with validation
            ├── ClosingStockForm.js           # Updated with validation
            └── ...                           # Other stock forms
```

## Implementation Details

### 1. API Service Layer

#### TankStockFutureRecordsService
```javascript
class TankStockFutureRecordsService {
  /**
   * Validates if a historical tank stock entry can be processed
   */
  async validateHistoricalEntry(params) {
    const response = await axiosInstance.post('/api/tank-stock/validate-historical-entry', params);
    return response.data;
  }

  /**
   * Gets warning type configuration for UI rendering
   */
  getWarningTypeConfig(warningType) {
    // Returns UI configuration for different warning types
  }

  /**
   * Formats validation result for display in UI
   */
  formatValidationResult(validationResult) {
    const config = this.getWarningTypeConfig(validationResult.warningType);
    return {
      ...validationResult,
      config,
      formattedMessage: this.formatMessage(validationResult),
      canProceed: validationResult.isAllowed && !config.blockSubmission,
      needsUserConfirmation: config.requiresConfirmation || validationResult.requiresUserConfirmation
    };
  }
}
```

### 2. Custom Hook for Validation State

#### useFutureRecordsValidation
```javascript
export const useFutureRecordsValidation = () => {
  const [validationState, setValidationState] = useState({
    isValidating: false,
    validationResult: null,
    error: null,
    userConfirmed: false,
    showWarning: false
  });

  /**
   * Validates a historical entry against future records policy
   */
  const validateHistoricalEntry = useCallback(async (tankId, entryDate, entryType) => {
    // Skip validation for current or future dates
    const entryDateObj = new Date(entryDate);
    const today = new Date();

    if (entryDateObj >= today) {
      // Reset validation state for current/future dates
      return { canProceed: true, needsValidation: false };
    }

    // Perform validation for historical dates
    // ...validation logic
  }, []);

  return {
    // State
    ...validationState,
    canSubmit: canSubmit(),

    // Actions
    validateHistoricalEntry,
    confirmProceed,
    cancelProceed,
    resetValidation
  };
};
```

### 3. Warning Display Component

#### FutureRecordsWarning
```javascript
const FutureRecordsWarning = ({
  validationResult,
  onConfirm,
  onCancel,
  isVisible = true,
  className = ''
}) => {
  const { config, formattedMessage, detailedWarning, policy } = validationResult;

  const getAlertClassName = () => {
    switch (config.alertType) {
      case 'error': return 'tw-bg-red-50 tw-border-red-200 tw-text-red-800';
      case 'warning': return 'tw-bg-yellow-50 tw-border-yellow-200 tw-text-yellow-800';
      case 'info': return 'tw-bg-blue-50 tw-border-blue-200 tw-text-blue-800';
      default: return 'tw-bg-gray-50 tw-border-gray-200 tw-text-gray-800';
    }
  };

  return (
    <div className={`${getAlertClassName()} tw-rounded tw-p-4 tw-mb-4`}>
      {/* Warning content with icon, message, and actions */}
    </div>
  );
};
```

### 4. Form Integration

#### OpeningStockForm Updates
```javascript
const OpeningStockForm = ({ updateFormData, isLoading, onSubmit, onCancel }) => {
  // Future records validation hook
  const {
    isValidating,
    validationResult,
    showWarning,
    canSubmit: canSubmitForm,
    validateHistoricalEntry,
    confirmProceed,
    cancelProceed,
    resetValidation
  } = useFutureRecordsValidation();

  // Validate on date change
  const handleDateChange = useCallback(async (e) => {
    const newDate = e.value;
    setFormData(prev => ({ ...prev, date: newDate }));

    // Reset validation when date changes
    resetValidation();

    // Validate if historical entry with tank selected
    if (newDate && formData.tankId) {
      await validateHistoricalEntry(formData.tankId, newDate, 'OpeningStock');
    }
  }, [formData.tankId, validateHistoricalEntry, resetValidation]);

  // Form submission with validation check
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    // Check if we can submit based on future records validation
    if (!canSubmitForm) {
      showNotification('Please resolve the validation warnings before submitting', 'warning');
      return;
    }

    // Proceed with submission...
  }, [validateForm, canSubmitForm]);

  return (
    <div>
      {/* Form fields */}

      {/* Future Records Warning */}
      {showWarning && (
        <FutureRecordsWarning
          validationResult={validationResult}
          onConfirm={confirmProceed}
          onCancel={cancelProceed}
          isVisible={showWarning}
        />
      )}

      {/* Submit button with validation state */}
      <Button
        text="Save"
        onClick={handleSubmit}
        disabled={isSubmitting || !canSubmitForm || isValidating}
      />
    </div>
  );
};
```

## Warning Types and UI Behavior

### Warning Type Configurations

#### BLOCKED (Policy: BLOCK)
```javascript
{
  showWarning: true,
  icon: 'fas fa-ban',
  iconClass: 'tw-text-red-500',
  alertType: 'error',
  blockSubmission: true
}
```
- **UI**: Red error alert with ban icon
- **Behavior**: Submit button disabled, no proceed option
- **Message**: "Historical entry blocked: X future records exist..."

#### WARN_RECONCILE (Policy: WARN_RECONCILE)
```javascript
{
  showWarning: true,
  icon: 'fas fa-exclamation-triangle',
  iconClass: 'tw-text-orange-500',
  alertType: 'warning',
  requiresConfirmation: true,
  recommendedAction: 'Manual reconciliation recommended after entry'
}
```
- **UI**: Orange warning alert with triangle icon
- **Behavior**: "Proceed Anyway" and "Cancel" buttons
- **Message**: Warning about future records with reconciliation recommendation

#### WARN_RECALCULATE (Policy: WARN_RECALCULATE)
```javascript
{
  showWarning: true,
  icon: 'fas fa-exclamation-triangle',
  iconClass: 'tw-text-yellow-500',
  alertType: 'warning',
  requiresConfirmation: true,
  recommendedAction: 'Automatic recalculation will be performed'
}
```
- **UI**: Yellow warning alert with triangle icon
- **Behavior**: "Proceed Anyway" and "Cancel" buttons
- **Message**: Warning about automatic recalculation

#### INFO_RECALCULATE (Policy: ALLOW_RECALCULATE)
```javascript
{
  showWarning: true,
  icon: 'fas fa-info-circle',
  iconClass: 'tw-text-blue-500',
  alertType: 'info',
  requiresConfirmation: false,
  recommendedAction: 'Automatic recalculation enabled'
}
```
- **UI**: Blue info alert with info icon
- **Behavior**: Informational only, no confirmation required
- **Message**: Information about automatic recalculation

## User Experience Flow

### 1. Standard Entry (Current Date)
```
User selects current date → No validation → Form submits normally
```

### 2. Historical Entry with No Future Records
```
User selects past date → Validation occurs → No warning → Form submits normally
```

### 3. Historical Entry with Future Records (WARN_RECONCILE)
```
User selects past date → Validation occurs → Warning displays →
User chooses:
  - "Proceed Anyway" → Form can submit
  - "Cancel" → Warning dismissed, form cannot submit
```

### 4. Historical Entry with Future Records (BLOCK)
```
User selects past date → Validation occurs → Error displays →
Form cannot submit until date changed or policy updated
```

## Responsive Design

### Mobile Adaptations
```scss
@media (max-width: 768px) {
  .future-records-warning {
    @apply tw-mx-2;
  }

  .future-records-warning .tw-flex.tw-space-x-2 {
    @apply tw-flex-col tw-space-x-0 tw-space-y-2;
  }
}
```

### Key Mobile Considerations
- Warning alerts are properly sized for mobile screens
- Action buttons stack vertically on small screens
- Touch-friendly button sizing
- Readable font sizes and spacing

## Integration Examples

### Opening Stock Form
```javascript
// In handleDateChange
if (newDate && formData.tankId) {
  const validation = await validateHistoricalEntry(formData.tankId, newDate, 'OpeningStock');
  if (validation.error) {
    showNotification(validation.error, 'error');
  }
}
```

### Closing Stock Form
```javascript
// Similar integration with 'ClosingStock' entry type
await validateHistoricalEntry(formData.tankId, newDate, 'ClosingStock');
```

### Tank Transfer Form
```javascript
// Validate both source and destination tanks
const sourceValidation = await validateHistoricalEntry(
  formData.sourceTankId, transferDate, 'TransferOut');
const destValidation = await validateHistoricalEntry(
  formData.destinationTankId, transferDate, 'TransferIn');
```

### Fuel Refill Form
```javascript
// Validate with 'Dispensing' entry type
await validateHistoricalEntry(formData.tankId, refillDate, 'Dispensing');
```

## Error Handling

### API Errors
```javascript
try {
  const result = await tankStockFutureRecordsService.validateHistoricalEntry(params);
  // Handle success
} catch (error) {
  const errorMessage = error.response?.data?.message || 'Failed to validate historical entry';
  setValidationState({
    ...state,
    error: errorMessage,
    showWarning: true
  });
}
```

### Network Issues
- Show generic error message
- Allow user to retry validation
- Gracefully degrade to allowing submission with warning

### Validation Timeouts
```javascript
const validationPromise = validateHistoricalEntry(tankId, entryDate, entryType);
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Validation timeout')), 10000)
);

try {
  await Promise.race([validationPromise, timeoutPromise]);
} catch (error) {
  // Handle timeout or validation error
}
```

## Performance Optimizations

### Debounced Validation
```javascript
const debouncedValidation = useMemo(
  () => debounce(validateHistoricalEntry, 500),
  [validateHistoricalEntry]
);
```

### Caching
```javascript
const validationCache = new Map();

const getCachedValidation = (tankId, entryDate, entryType) => {
  const key = `${tankId}-${entryDate}-${entryType}`;
  return validationCache.get(key);
};
```

### Minimal Re-renders
- Use `useCallback` for event handlers
- Memoize expensive computations
- Optimize component re-render triggers

## Testing Guidelines

### Unit Tests
```javascript
describe('useFutureRecordsValidation', () => {
  it('should validate historical entry correctly', async () => {
    const { result } = renderHook(() => useFutureRecordsValidation());

    await act(async () => {
      const validation = await result.current.validateHistoricalEntry(
        1, '2024-01-01', 'OpeningStock'
      );
      expect(validation.canProceed).toBe(true);
    });
  });
});
```

### Integration Tests
```javascript
describe('OpeningStockForm with Future Records', () => {
  it('should show warning for historical entry with future records', async () => {
    // Mock API response
    mockApi.post('/api/tank-stock/validate-historical-entry')
      .reply(200, { warningType: 'WARN_RECONCILE', /* ... */ });

    render(<OpeningStockForm />);

    // Select past date
    fireEvent.change(screen.getByRole('textbox', { name: /date/i }), {
      target: { value: '2024-01-01' }
    });

    // Expect warning to appear
    await waitFor(() => {
      expect(screen.getByText(/future records exist/i)).toBeInTheDocument();
    });
  });
});
```

### E2E Tests
```javascript
test('Historical entry workflow with warnings', async ({ page }) => {
  await page.goto('/tank-stock/opening');

  // Fill form with past date
  await page.fill('[data-testid="date-input"]', '2024-01-01');
  await page.selectOption('[data-testid="tank-select"]', '1');

  // Wait for validation warning
  await expect(page.locator('.future-records-warning')).toBeVisible();

  // Confirm proceed
  await page.click('button:has-text("Proceed Anyway")');

  // Submit form
  await page.click('button:has-text("Save")');

  // Verify success
  await expect(page.locator('.success-notification')).toBeVisible();
});
```

## Accessibility Considerations

### ARIA Labels
```javascript
<div
  role="alert"
  aria-labelledby="warning-title"
  aria-describedby="warning-message"
  className="future-records-warning"
>
  <h4 id="warning-title">Confirmation Required</h4>
  <p id="warning-message">{formattedMessage}</p>
</div>
```

### Keyboard Navigation
- All buttons are keyboard accessible
- Focus management for warning dialogs
- Proper tab order in forms

### Screen Reader Support
- Clear, descriptive warning messages
- ARIA live regions for dynamic content
- Alternative text for icons

## Troubleshooting

### Common Issues

#### 1. Validation Not Triggering
**Symptoms**: No warnings shown for historical dates
**Solutions**:
- Check API endpoint configuration
- Verify date format being sent to API
- Check browser console for JavaScript errors

#### 2. Warning Persists After Date Change
**Symptoms**: Warning remains visible after changing to current date
**Solutions**:
- Ensure `resetValidation()` is called on date change
- Check validation hook state management
- Verify date comparison logic

#### 3. Submit Button Remains Disabled
**Symptoms**: Cannot submit form even after confirmation
**Solutions**:
- Check `canSubmitForm` state in hook
- Verify `userConfirmed` state is set correctly
- Review validation result processing

### Debug Tools
```javascript
// Add debug logging to validation hook
useEffect(() => {
  console.log('Validation State:', validationState);
}, [validationState]);

// Add debug props to warning component
<FutureRecordsWarning
  validationResult={validationResult}
  debug={process.env.NODE_ENV === 'development'}
  // ...other props
/>
```

## Related Documentation
- [Tank Stock Forms Architecture](../Forms/tank-stock-forms-guide.md)
- [Custom Hooks Guide](../../../../Frontend/custom-hooks-guide.md)
- [API Integration Patterns](../../../../Frontend/api-integration-guide.md)
- [Component Testing Strategies](../../../../Frontend/testing-guide.md)
