# Shared Form Data Implementation for Tank Stock Forms

## Overview

Implemented a shared context system to persist date and site selection across all tank stock forms, making data entry faster and more user-friendly. When a user selects a date and site in one form (e.g., OpeningStock), these values are automatically available in other forms (TankDelivery, ManualRefill, TankTransfer).

## Implementation Date

November 27, 2025

## Problem Solved

Previously, users had to manually enter the same date and site information repeatedly when working with multiple forms in the same data entry session. This was time-consuming and error-prone, especially during daily stock reconciliation tasks where all transactions typically occur on the same date and at the same site.

## Solution

Created a **TankStockFormContext** that:

- ✅ Persists date and siteId across all tank stock forms
- ✅ Stores data in localStorage for persistence across page refreshes
- ✅ Automatically updates when user changes date or site in any form
- ✅ Provides hooks for easy access (`useTankStockFormData`)

## Files Created

### 1. TankStockFormContext.js

**Location**: `fms.frontend/src/pages/tankstock/shared/context/TankStockFormContext.js`

**Purpose**: Central context provider for managing shared form data

**Key Features**:

- `TankStockFormProvider` - Wraps the entire tank stock module
- `useTankStockFormData()` - Hook for accessing shared data
- `updateDate(newDate)` - Updates shared date
- `updateSiteId(newSiteId)` - Updates shared site
- `updateBoth(date, siteId)` - Updates both at once
- `resetFormData()` - Resets to defaults
- `getFormattedDate()` - Returns formatted date string

**Storage**: Uses localStorage with key `tankStockFormData`

## Files Modified

### 2. OpeningStockForm.js

**Changes**:

- ✅ Imported `useTankStockFormData` hook
- ✅ Initialized `formData.date` and `formData.siteId` from shared context
- ✅ Updated `handleChange` to call `updateDate()` when date changes
- ✅ Updated `handleSiteChange` to call `updateSiteId()` when site changes

### 3. TankDeliveryForm.js

**Changes**:

- ✅ Imported `useTankStockFormData` hook
- ✅ Initialized `formData.deliveryDate` and `formData.siteId` from shared context
- ✅ Updated `handleChange` to call `updateDate()` when deliveryDate changes
- ✅ Updated `handleChange` to call `updateSiteId()` when siteId changes

### 4. ManualRefillForm.js

**Changes**:

- ✅ Imported `useTankStockFormData` hook
- ✅ Initialized `formData.date` and `formData.siteId` from shared context
- ✅ Updated `handleDateChange` to call `updateDate()` when date changes
- ✅ Updated `handleSiteChange` to call `updateSiteId()` when site changes

### 5. TankTransferForm.js

**Changes**:

- ✅ Imported `useTankStockFormData` hook
- ✅ Initialized `formData.date` and `formData.sourceSiteId` from shared context
- ✅ Updated `handleChange` to call `updateDate()` when date changes
- ✅ Updated `handleSourceSiteChange` to call `updateSiteId()` when source site changes

### 6. TankStockMain.js

**Changes**:

- ✅ Imported `TankStockFormProvider`
- ✅ Wrapped entire tank stock module with provider
- ✅ Provider wraps all routes, making shared context available everywhere

## Usage Flow

### User Workflow

1. User opens **Opening Stock Form**
2. Selects date: `2025-11-27` and site: `Main Station`
3. Fills in tank and amount, submits
4. User opens **Tank Delivery Form**
5. 🎉 Date and site are automatically pre-filled with `2025-11-27` and `Main Station`
6. User only needs to select tank and enter delivery amount
7. Same applies to **Manual Refill Form** and **Tank Transfer Form**

### Technical Flow

```javascript
// 1. User changes date in OpeningStockForm
handleChange(e) {
  // Update local state
  setFormData({ ...formData, date: e.value });

  // Update shared context
  updateDate(e.value); // ✅ This makes it available to all forms
}

// 2. User opens TankDeliveryForm
const [formData, setFormData] = useState({
  deliveryDate: sharedDate, // ✅ Automatically loaded from context
  siteId: sharedSiteId, // ✅ Automatically loaded from context
  // ... other fields
});
```

## Context Structure

```javascript
{
  date: Date,           // Shared date across all forms
  siteId: number|null,  // Shared site ID across all forms
  lastUpdated: string,  // ISO timestamp of last update

  // Methods
  updateDate: (newDate) => void,
  updateSiteId: (newSiteId) => void,
  updateBoth: (date, siteId) => void,
  resetFormData: () => void,
  getFormattedDate: () => string
}
```

## localStorage Schema

```javascript
{
  "date": "2025-11-27T10:30:00.000Z",
  "siteId": 5,
  "lastUpdated": "2025-11-27T10:30:15.123Z"
}
```

## Benefits

1. **Improved User Experience**

   - Reduces repetitive data entry
   - Faster form completion
   - Less chance of date/site entry errors

2. **Data Consistency**

   - All forms use the same date and site during a data entry session
   - Reduces inconsistencies in transaction records

3. **Persistence**

   - Data persists across page refreshes
   - User can close and reopen forms without losing context

4. **Clean Implementation**
   - Uses React Context API (built-in)
   - No external dependencies
   - Easy to extend with additional fields if needed

## Testing Checklist

- [x] Open Opening Stock Form, set date and site
- [x] Open Tank Delivery Form, verify date and site are pre-filled
- [x] Change date in Tank Delivery Form
- [x] Open Manual Refill Form, verify new date is reflected
- [x] Change site in Manual Refill Form
- [x] Open Tank Transfer Form, verify new site is reflected
- [x] Refresh page, verify date and site persist from localStorage
- [x] Close browser, reopen, verify persistence
- [x] Test with multiple tabs (each tab should share the same context)

## Future Enhancements

### Potential Additions:

1. **Add tankId to shared context** - For scenarios where user works with same tank
2. **Add time range presets** - Quick selection of "Today", "Yesterday", "This Week"
3. **Add site favorites** - Store frequently used sites
4. **Add form session history** - Track last 5 date/site combinations
5. **Add multi-user sync** - If multiple users work on same workstation

### Example Extension:

```javascript
// Add tankId to context
const [formData, setFormData] = useState({
  date: new Date(),
  siteId: null,
  tankId: null, // ✅ NEW
  lastUpdated: new Date().toISOString(),
});

// Update hook
const updateTankId = useCallback((newTankId) => {
  setFormData((prev) => ({
    ...prev,
    tankId: newTankId,
    lastUpdated: new Date().toISOString(),
  }));
}, []);
```

## Related Files

- `fms.frontend/src/pages/tankstock/shared/context/StockFilterContext.js` - Existing context for dashboard filters
- `fms.frontend/src/pages/tankstock/TankStockMain.js` - Main routing component
- `fms.frontend/src/pages/tankstock/forms/*` - All form components

## Migration Notes

- No breaking changes
- Forms work independently if context is not available (graceful degradation)
- Backward compatible with existing implementations

## Support

For questions or issues, contact the development team or refer to:

- React Context API: https://react.dev/reference/react/useContext
- localStorage API: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

---

**Last Updated**: November 27, 2025
**Author**: Development Team
**Status**: ✅ Implemented and Tested
