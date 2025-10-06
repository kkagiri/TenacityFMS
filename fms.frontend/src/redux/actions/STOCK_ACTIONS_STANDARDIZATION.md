# Opening & Closing Stock Actions Standardization

**Date:** October 5, 2025  
**Purpose:** Ensure consistent behavior between opening and closing stock actions

---

## Summary

Both `createOpeningStock` and `createClosingStock` actions now follow the **same pattern**:

1. ✅ Use **query parameters** (not JSON body)
2. ✅ Format dates as ISO strings
3. ✅ Consistent error handling
4. ✅ Support both `success` and `isSuccess` response properties
5. ✅ Detailed error messages with HTTP status codes

---

## API Endpoint Format

Both actions use the same query parameter format:

```javascript
// Opening Stock
POST /tankstock/openingstock?tankId={id}&amount={amount}&dateTime={isoString}

// Closing Stock
POST /tankstock/closingstock?tankId={id}&amount={amount}&dateTime={isoString}
```

**Example:**
```javascript
POST /tankstock/openingstock?tankId=5&amount=1000&dateTime=2025-10-05T10:30:00.000Z
POST /tankstock/closingstock?tankId=5&amount=950&dateTime=2025-10-05T18:30:00.000Z
```

---

## Changes Made

### File: `ClosingStockActions.js`

**1. Enhanced Date Formatting**
```javascript
// BEFORE
const formatDateTime = (date) => {
  if (!date) return new Date().toISOString();
  if (typeof date === 'string') return date;
  return new Date(date).toISOString();
};

// AFTER (with better comments)
const formatDateTime = (date) => {
  if (!date) return new Date().toISOString();
  
  // If date is already a string in ISO format, return it
  if (typeof date === 'string') {
    // Handle ISO format strings directly
    return date;
  }
  
  // Convert Date object to ISO string (UTC format)
  return new Date(date).toISOString();
};
```

**2. Support Both `date` and `dateTime` Properties**
```javascript
// BEFORE
const formattedDate = formatDateTime(formData.date);

// AFTER (supports both)
const formattedDate = formatDateTime(formData.dateTime || formData.date);
```

**3. Enhanced Success Handling**
```javascript
// BEFORE
if (response.data.success) {
  dispatch({ type: CREATE_CLOSING_STOCK_SUCCESS, payload: response.data });
  return response.data;
}

// AFTER (checks both success and isSuccess)
if (response.data.success === true || response.data.isSuccess === true) {
  dispatch({ type: CREATE_CLOSING_STOCK_SUCCESS, payload: response.data });
  return {
    success: true,
    message: response.data.message || 'Closing stock created successfully',
    data: response.data
  };
}
```

**4. Enhanced Error Handling**
```javascript
// BEFORE
} catch (error) {
  const errorMessage = error.response?.data?.message || error.message || 'Error creating closing stock';
  dispatch({ type: CREATE_CLOSING_STOCK_FAILURE, payload: errorMessage });
  return { success: false, message: errorMessage };
}

// AFTER (distinguishes HTTP errors from network errors)
} catch (error) {
  // Handle HTTP error responses (like 400, 500, etc.)
  if (error.response) {
    // Server responded with error status
    const errorData = error.response.data;
    const errorMessage = errorData?.message || errorData?.error || 
                        `HTTP ${error.response.status}: ${error.response.statusText}`;
    
    dispatch({ type: CREATE_CLOSING_STOCK_FAILURE, payload: errorMessage });
    return {
      success: false,
      message: errorMessage,
      data: errorData
    };
  } else {
    // Network or other error
    const errorMessage = error.message || 'Error creating closing stock';
    dispatch({ type: CREATE_CLOSING_STOCK_FAILURE, payload: errorMessage });
    return {
      success: false,
      message: errorMessage,
      error: error
    };
  }
}
```

---

## Usage in Forms

### Opening Stock Form
```javascript
import { createOpeningStock } from '../../../redux/actions/tankStockAction';

const preparedData = {
  tankId: formData.tankId,
  amount: formData.amount,
  dateTime: formData.date ? new Date(formData.date).toISOString() : null
};

const response = await dispatch(createOpeningStock(preparedData));

if (response && response.success === true) {
  // Success handling
  showNotification(response.message || 'Opening stock created successfully', 'success');
} else {
  // Error handling
  setBackendError({ message: response?.message || 'Failed to create opening stock' });
}
```

### Closing Stock Form
```javascript
import { createClosingStock } from '../../../redux/actions/ClosingStockActions';

const preparedData = {
  tankId: formData.tankId,
  amount: formData.amount,
  dateTime: formData.date ? new Date(formData.date).toISOString() : null
  // OR date: formData.date (both work now)
};

const response = await dispatch(createClosingStock(preparedData));

if (response && response.success === true) {
  // Success handling
  showNotification(response.message || 'Closing stock created successfully', 'success');
} else {
  // Error handling
  setBackendError({ message: response?.message || 'Failed to create closing stock' });
}
```

---

## Response Format

Both actions now return consistent response objects:

### Success Response
```javascript
{
  success: true,
  message: "Opening stock created successfully",
  data: {
    // Backend response data
    success: true,
    message: "Opening stock created successfully",
    // ... other fields
  }
}
```

### Failure Response (Validation Error)
```javascript
{
  success: false,
  message: "An opening stock already exists for this tank on 2025-10-05 without a subsequent closing stock",
  data: {
    success: false,
    message: "An opening stock already exists...",
    // ... other error details
  }
}
```

### Failure Response (HTTP Error)
```javascript
{
  success: false,
  message: "HTTP 400: Bad Request",
  data: {
    message: "Invalid tank ID",
    errors: { ... }
  }
}
```

### Failure Response (Network Error)
```javascript
{
  success: false,
  message: "Network Error",
  error: NetworkError { ... }
}
```

---

## Error Handling Comparison

| Scenario | Opening Stock | Closing Stock | Status |
|----------|--------------|---------------|--------|
| Missing tankId | ✅ Validated | ✅ Validated | ✅ Same |
| Invalid amount | ✅ Validated | ✅ Validated | ✅ Same |
| Date format | ✅ ISO String | ✅ ISO String | ✅ Same |
| Query params | ✅ Yes | ✅ Yes | ✅ Same |
| Success check | ✅ Both props | ✅ Both props | ✅ Same |
| HTTP errors | ✅ Detailed | ✅ Detailed | ✅ Same |
| Network errors | ✅ Handled | ✅ Handled | ✅ Same |

---

## Benefits of Standardization

1. **✅ Consistent API Calls**
   - Both use query parameters
   - Same date format (ISO string)
   - Predictable URL structure

2. **✅ Consistent Error Handling**
   - Distinguishes between HTTP and network errors
   - Provides detailed error messages
   - Returns structured error objects

3. **✅ Consistent Success Detection**
   - Checks both `success` and `isSuccess` properties
   - Handles backend inconsistencies
   - Always returns normalized response

4. **✅ Better Developer Experience**
   - Same pattern for both actions
   - Easier to maintain
   - Clear error messages

5. **✅ Improved User Experience**
   - More informative error messages
   - Consistent behavior across forms
   - Better error recovery

---

## Testing Checklist

### ✅ Opening Stock Form
- [ ] Select site → tanks filtered correctly
- [ ] Select tank → form fields populated
- [ ] Enter amount → validation works
- [ ] Submit → success notification shown
- [ ] Submit with error → inline error displayed
- [ ] Check Network tab → query parameters in URL

### ✅ Closing Stock Form
- [ ] Select site → tanks filtered correctly
- [ ] Select tank → form fields populated
- [ ] Enter amount → validation works
- [ ] Submit → success notification shown
- [ ] Submit with error → inline error displayed
- [ ] Check Network tab → query parameters in URL

### ✅ Error Scenarios
- [ ] Invalid tankId → "Invalid Tank ID" error
- [ ] Amount = 0 → validation error
- [ ] Server error (500) → HTTP error message
- [ ] Network failure → network error message
- [ ] Duplicate entry → backend validation error

---

## Backend Endpoints

Both endpoints are in `TankStockController.cs`:

```csharp
// Opening Stock
[HttpPost("openingstock")]
public async Task<ActionResult<FMSResponse<TankStockDTO>>> CreateOpeningStock(
    [FromQuery] int tankId,
    [FromQuery] decimal amount,
    [FromQuery] DateTime dateTime)
{
    // Implementation...
}

// Closing Stock
[HttpPost("closingstock")]
public async Task<ActionResult<FMSResponse<TankStockDTO>>> CreateClosingStock(
    [FromQuery] int tankId,
    [FromQuery] decimal amount,
    [FromQuery] DateTime dateTime)
{
    // Implementation...
}
```

Both use **query parameters** (`[FromQuery]`), not request body.

---

## Related Files

- `tankStockAction.js` - Opening stock action (reference implementation)
- `ClosingStockActions.js` - Closing stock action (updated to match)
- `OpeningStockForm.js` - Uses opening stock action
- `ClosingStockForm.js` - Uses closing stock action

---

## Summary

✅ **Changes Complete:**
- Enhanced `ClosingStockActions.js` to match `createOpeningStock` pattern
- Consistent error handling across both actions
- Better date handling (supports both `date` and `dateTime`)
- Improved success detection (checks both `success` and `isSuccess`)
- Detailed error messages with HTTP status codes

✅ **Result:**
- Both actions now work identically
- Consistent user experience
- Easier to maintain
- Better error messages

**Status:** Ready for testing! Both actions now follow the same reliable pattern.
