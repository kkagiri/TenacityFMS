# Manual Dispensing Feature - Quick Testing Checklist

## Pre-Testing Setup
- [ ] Backend API is running
- [ ] Frontend dev server is running (`npm start`)
- [ ] Database has sample data in both TankVolumeHistory and TankStock tables
- [ ] At least one tank has manual dispensing records in TankStock

## Quick Verification Tests

### ✅ Test 1: UI Element Visible (2 min)
1. Navigate to Tank Stock → Transaction Hub
2. Look for "Use Manual Dispensing" checkbox in the blue filter section
3. **PASS IF**: Checkbox is visible and unchecked by default

### ✅ Test 2: Default Behavior (2 min)
1. Open browser DevTools Network tab
2. Load Transaction Hub
3. Check the API call to `/api/v1/tankvolumehistory/filtered`
4. **PASS IF**:
   - URL includes `useManualDispensing=false`
   - DataGrid shows dispensing records

### ✅ Test 3: Toggle to Manual Dispensing (3 min)
1. Check the "Use Manual Dispensing" checkbox
2. Watch the Network tab for new API call
3. Observe DataGrid refresh
4. **PASS IF**:
   - API call includes `useManualDispensing=true`
   - DataGrid shows "Manual Dispensing - [VehicleName]" entries
   - Sensor dispensing entries are NOT visible

### ✅ Test 4: Toggle Back to Sensor (2 min)
1. Uncheck the "Use Manual Dispensing" checkbox
2. **PASS IF**:
   - DataGrid returns to showing sensor dispensing
   - Manual dispensing entries disappear

### ✅ Test 5: Filter Persistence (3 min)
1. Check "Use Manual Dispensing"
2. Click "Previous Day" button
3. Click "Next Day" button
4. **PASS IF**: Checkbox remains checked after navigation

### ✅ Test 6: Reset Filters (2 min)
1. Check "Use Manual Dispensing"
2. Click "Reset to All Sites" button
3. **PASS IF**: Checkbox returns to unchecked state

## Backend API Tests (Optional - Use Postman/Browser)

### Test API Endpoint Directly

#### Default (Sensor Dispensing)
```
GET http://localhost:5000/api/v1/tankvolumehistory/filtered?startDate=2025-01-01T00:00:00Z&endDate=2025-01-15T23:59:59Z
```

Expected: All transactions including sensor dispensing

#### Manual Dispensing Mode
```
GET http://localhost:5000/api/v1/tankvolumehistory/filtered?startDate=2025-01-01T00:00:00Z&endDate=2025-01-15T23:59:59Z&useManualDispensing=true
```

Expected: Non-dispensing from TankVolumeHistory + manual dispensing from TankStock

## Console Log Checks

### Look for these in browser console:
```
Fetching tank volume history with URL: /tankvolumehistory/filtered?useManualDispensing=true
API Response: [array of transaction data]
```

### No errors should appear related to:
- CheckBox component
- handleToggleManualDispensing function
- currentFilters.useManualDispensing

## Common Issues & Solutions

### ❌ Issue: Checkbox not visible
**Solution**: Check that CheckBox was imported: `import CheckBox from 'devextreme-react/check-box';`

### ❌ Issue: Toggle doesn't reload data
**Solution**: Check `handleToggleManualDispensing` calls `loadTransactionData(updatedFilters)`

### ❌ Issue: No manual dispensing records appear
**Solution**:
1. Verify TankStock table has entries with `EntryType = 'Dispensing'`
2. Check date range includes those entries
3. Verify backend query logic in `GetTankVolumeHistoryWithManualDispensingAsync()`

### ❌ Issue: Sensor dispensing still appears with manual mode
**Solution**: Check exclusion logic in backend:
```csharp
.Where(tvh => tvh.ChangeReason != VolumeChangeReasonEnum.Dispensing
           && tvh.ChangeReason != VolumeChangeReasonEnum.AutomatedDispensing)
```

### ❌ Issue: Filter resets on toggle
**Solution**: Ensure `handleToggleManualDispensing` preserves all other filters:
```javascript
const updatedFilters = {
  ...currentFilters,  // This preserves all existing filters
  useManualDispensing: value
};
```

## Performance Check

### Monitor these metrics:
- [ ] API response time < 2 seconds
- [ ] DataGrid refresh is smooth (no flickering)
- [ ] No console errors or warnings
- [ ] Network tab shows only ONE API call per toggle

## Final Verification

### Compare with PivotGrid
1. Open PivotGrid with manual dispensing
2. Note total dispensing volume for today
3. Open TransactionHub with manual dispensing
4. Filter to today
5. **PASS IF**: Totals match between both views

## Sign-Off

- [ ] All 6 quick tests passed
- [ ] No console errors
- [ ] Backend API responds correctly
- [ ] UI is responsive and intuitive
- [ ] Data accuracy verified against PivotGrid

**Tested By**: ________________
**Date**: ________________
**Result**: ☐ PASS  ☐ FAIL
**Notes**:

---

## Next Steps After Testing

If all tests pass:
1. Commit changes to Git
2. Create pull request
3. Request code review
4. Deploy to staging environment
5. Perform UAT (User Acceptance Testing)

If tests fail:
1. Document specific failures
2. Review implementation against this checklist
3. Check browser console and network logs
4. Review backend logs
5. Refer to MANUAL_DISPENSING_IMPLEMENTATION.md for details
