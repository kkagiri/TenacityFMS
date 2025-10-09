# Tank Stock Forms Site & Tank Selection Fix

## Issue Summary
All tank stock forms except `TankDeliveryForm.js` had two critical issues:
1. **Site SelectBox not displaying values** - SelectBox was not showing site names in the dropdown
2. **Tank SelectBox not enabling/populating** - After selecting a site, tank dropdown was not being enabled and populated with tanks for that site

## Root Cause
The issue was caused by missing `value` and `onValueChanged` props in the DevExtreme SelectBox `editorOptions` for both site and tank fields. The SelectBox components were not properly bound to the form state and change handlers.

## Files Fixed

### 1. OpeningStockForm.js
**Changes:**
- Added `value={formData.siteId}` to site SelectBox editorOptions
- Added `value={formData.tankId}` to tank SelectBox editorOptions
- Added `onValueChanged={handleTankChange}` to tank SelectBox editorOptions

### 2. ClosingStockForm.js
**Changes:**
- Added `value={formData.tankId}` to tank SelectBox editorOptions
- Added `onValueChanged={handleTankChange}` to tank SelectBox editorOptions
- Wrapped `showNotification` in `useCallback` to fix React Hook dependencies
- Added `showNotification` to dependency arrays where needed

### 3. StockAdjustmentForm.js
**Changes:**
- Added `searchEnabled={true}` to both site and tank SelectBox
- Added `showClearButton={true}` to both site and tank SelectBox
- Enhanced tank placeholder to show appropriate messages based on state
- Updated `handleVolumeChange` to clear tank selection when site changes
- Removed unused validation functions (`validateTank`, `validateVolume`)

### 4. TankTransferForm.js
**Changes:**
- Added `value={formData.sourceTankId}` to source tank SelectBox editorOptions
- Added `onValueChanged={handleSourceTankChange}` to source tank SelectBox editorOptions
- Added `value={formData.destinationTankId}` to destination tank SelectBox editorOptions
- Added `onValueChanged={handleDestinationTankChange}` to destination tank SelectBox editorOptions
- Added validation error clearing in `handleDestinationTankChange`
- Added `showNotification` to `handleSubmit` dependency array

## How the Fix Works

### Site Selection
```javascript
<SimpleItem
  dataField="siteId"
  editorType="dxSelectBox"
  editorOptions={{
    items: sitesAvailable,
    displayExpr: "name",
    valueExpr: "id",
    value: formData.siteId,              // ✅ Added - Binds to form state
    onValueChanged: handleSiteChange,    // ✅ Already present - Triggers filtering
    searchEnabled: true,
    placeholder: "Select a site",
  }}
/>
```

### Tank Selection
```javascript
<SimpleItem
  dataField="tankId"
  editorType="dxSelectBox"
  editorOptions={{
    items: filteredTanks,
    displayExpr: "name",
    valueExpr: "id",
    value: formData.tankId,              // ✅ Added - Binds to form state
    onValueChanged: handleTankChange,    // ✅ Added - Updates form state
    disabled: !formData.siteId,
    placeholder: !formData.siteId
      ? "Select site first"
      : filteredTanks.length > 0
      ? "Select a tank"
      : "No tanks available",
  }}
/>
```

## Expected Behavior After Fix

1. **Site SelectBox**:
   - Displays list of all available sites
   - Shows site names properly in dropdown
   - Allows searching/filtering sites
   - Updates form state on selection

2. **Tank SelectBox**:
   - Initially disabled with message "Select site first"
   - Becomes enabled after site selection
   - Populates with tanks associated with selected site
   - Shows appropriate messages when no tanks are available
   - Updates form state on selection

3. **Form Flow**:
   - User selects site → Tank dropdown becomes enabled
   - System filters tanks by selected site
   - User selects tank → Tank details are loaded
   - Form validation works correctly

## Testing Checklist

- [ ] OpeningStockForm: Site dropdown displays values
- [ ] OpeningStockForm: Tank dropdown enables and populates after site selection
- [ ] ClosingStockForm: Site dropdown displays values
- [ ] ClosingStockForm: Tank dropdown enables and populates after site selection
- [ ] StockAdjustmentForm: Site dropdown displays values
- [ ] StockAdjustmentForm: Tank dropdown enables and populates after site selection
- [ ] TankTransferForm: Source site/tank dropdowns work correctly
- [ ] TankTransferForm: Destination site/tank dropdowns work correctly
- [ ] All forms: No console errors
- [ ] All forms: No linting errors

## Technical Notes

### DevExtreme SelectBox Pattern
DevExtreme's SelectBox requires explicit binding through `value` prop and `onValueChanged` handler when used inside a Form with SimpleItem. The pattern used in `TankDeliveryForm.js` was correct and has been replicated across all forms.

### Dependency Arrays
Ensured all React Hooks (useCallback, useEffect) have complete dependency arrays to prevent stale closures and satisfy ESLint rules.

### Form State Management
All forms now consistently:
1. Maintain site and tank selections in component state
2. Clear dependent selections when parent selections change
3. Update filtered lists based on selections
4. Provide appropriate user feedback through placeholders

## Related Files
- DTOs: `SiteDTO.cs`, `TankDTO.cs`
- Actions: `siteActions.js`, `tankActions.js`
- Reference working implementation: `TankDeliveryForm.js`

## Date Fixed
October 8, 2025

## Developer Notes
This fix ensures consistency across all tank stock forms. Any new forms should follow the pattern established in `TankDeliveryForm.js` and now replicated in all other forms.
