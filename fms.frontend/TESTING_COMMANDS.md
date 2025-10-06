# SignalR Fix - Commands & Testing Reference

## 🛠️ Useful Commands

### Build & Test
```bash
# Build the project
npm run build

# Start development server
npm start

# Run linting
npm run lint

# Run tests (if available)
npm test
```

### Git Workflow
```bash
# Create feature branch for Phase 1
git checkout -b fix/signalr-phase1

# Check status
git status

# Add changes
git add .

# Commit with message
git commit -m "fix: Phase 1 - SignalR optimization for tank stock forms"

# Push to remote
git push origin fix/signalr-phase1

# Create PR (use GitHub web interface)
```

### Scanner Script
```powershell
# Run from fms.frontend directory
cd fms.frontend
.\find-signalr-fixes.ps1

# View results
Import-Csv signalr-fix-status.csv | Out-GridView

# View in Excel
Start-Process signalr-fix-status.csv
```

---

## 🧪 Testing Checklist

### Before Starting
- [ ] Backup current code (commit to Git)
- [ ] Create feature branch
- [ ] Document current Redux action count
- [ ] Take screenshots of problematic forms

### After Each File Fix
```powershell
# 1. Check syntax errors
npm run lint

# 2. Build check
npm run build

# 3. Start dev server
npm start

# 4. Manual test
# - Open the fixed component
# - Test all functionality
# - Check browser console
# - Check Redux DevTools
```

### Browser Testing
1. **Open Browser Console** (F12)
   - Look for: `[SignalR Middleware]` logs
   - Check for errors (should be none)

2. **Open Redux DevTools**
   - Watch action counter
   - Verify actions are batched
   - Check for duplicate actions (should decrease)

3. **Test Component**
   - For forms: Type in all fields, check no focus loss
   - For grids: Scroll, sort, filter - check no jumping
   - For modals: Open, interact, close - check no flickering

4. **Test Real-time Updates**
   - Verify SignalR connection active
   - Check data still updates in real-time
   - Verify no data loss

---

## 🔍 Debugging

### Common Error: Import Path Wrong
```javascript
// ERROR: Cannot find module 'useSignalRSelector'

// Check your current file location:
// pages/tankStock/forms/TankTransferForm.js
// Path should be:
import { useSignalRSelector } from '../../../hooks/useSignalRSelector';

// How to calculate:
// forms -> tankStock -> pages -> src (3 levels up)
// Then: hooks/useSignalRSelector
```

### Common Error: Syntax Error
```javascript
// ERROR: Unexpected token

// Make sure you removed old import:
// WRONG:
import { useDispatch, useSelector } from 'react-redux';
import { useSignalRSelector } from '../../../hooks/useSignalRSelector';

// RIGHT:
import { useDispatch } from 'react-redux';
import { useSignalRSelector } from '../../../hooks/useSignalRSelector';
```

### Common Error: Component Not Re-rendering
```javascript
// If component doesn't update when data changes:

// 1. Check SignalR connection
// Redux DevTools -> State -> signalR -> dashboard/pts -> connected

// 2. Check action is in middleware whitelist
// Open: src/signalR/signalRReduxMiddleware.js
// Find: SIGNALR_ACTION_TYPES array
// Add your action type if missing

// 3. Check selector is correct
const data = useSignalRSelector(state => {
  console.log('Selector called with:', state);
  return state.module.data;
});
```

---

## 📊 Performance Monitoring

### Track Redux Actions
```javascript
// In browser console:
let actionCount = 0;
const interval = setInterval(() => {
  console.log(`Redux actions in last minute: ${actionCount}`);
  actionCount = 0;
}, 60000);

// In Redux DevTools, count actions per minute
// Target: 50-80 actions/min (down from 150-200)
```

### React Profiler
```javascript
// 1. Open React DevTools
// 2. Click "Profiler" tab
// 3. Click record button
// 4. Interact with component
// 5. Stop recording
// 6. Review render times and counts
```

---

## 🎯 Quick Tests Per Component Type

### Forms
```
Test Steps:
1. Open form
2. Type in first field
3. Press Tab to next field
4. Type in second field
5. Use dropdown/select
6. Type while watching console

Expected:
✅ Typing smooth
✅ No focus loss
✅ Console shows: "[SignalR Middleware] Skipping..."
✅ Redux actions reduced
✅ Form submits correctly
```

### Data Grids
```
Test Steps:
1. Open grid page
2. Scroll down
3. Scroll up
4. Sort column
5. Filter data
6. Watch for flickering

Expected:
✅ Scroll position maintained
✅ No flickering
✅ Sorting works
✅ Filtering works
✅ Console shows fewer actions
```

### Modals/Popups
```
Test Steps:
1. Open modal
2. Interact with form inside
3. Type in fields
4. Close modal
5. Reopen modal

Expected:
✅ Modal stable (no flickering)
✅ Form inside works smoothly
✅ Modal doesn't close unexpectedly
✅ Data persists correctly
```

### Dashboard Widgets
```
Test Steps:
1. Open dashboard
2. Watch widgets update
3. Check update frequency
4. Verify data accuracy
5. Check console logs

Expected:
✅ Data updates in real-time
✅ Updates are smooth (not jumpy)
✅ Console shows batched updates
✅ No duplicate data
✅ Correct data displayed
```

---

## 📝 Test Log Template

Copy this for each phase:

```
=== Phase X Testing Log ===

Date: ___________
Branch: ___________
Files Fixed: ___________

Before Metrics:
- Redux actions/min: _____
- User complaints: _____
- Build time: _____

After Metrics:
- Redux actions/min: _____
- User complaints: _____
- Build time: _____

Files Tested:
[ ] file1.js - Status: _____ Notes: _____
[ ] file2.js - Status: _____ Notes: _____
[ ] file3.js - Status: _____ Notes: _____

Issues Found:
1. _____
2. _____

Resolutions:
1. _____
2. _____

Regression Tests:
[ ] Old features still work
[ ] No new errors
[ ] Performance improved
[ ] User feedback positive

Sign-off: ___________
```

---

## 🔄 Rollback Plan

If something goes wrong:

```bash
# 1. Check what changed
git status
git diff

# 2. Rollback specific file
git checkout -- path/to/file.js

# 3. Rollback all changes in current branch
git reset --hard HEAD

# 4. Switch back to main branch
git checkout main

# 5. Delete feature branch
git branch -D fix/signalr-phase1

# 6. Review what went wrong
# - Check error logs
# - Review documentation
# - Ask for help
```

---

## 📞 Support

### If You're Stuck

1. **Check Documentation**
   - SIGNALR_FIX_GUIDE.md
   - SIGNALR_FIX_QUICK_REFERENCE.md
   - EXAMPLE_FIX_TankTransferForm.md

2. **Check Console**
   - Browser console for errors
   - Redux DevTools for state
   - React DevTools for renders

3. **Review Example**
   - Compare your code to EXAMPLE_FIX_TankTransferForm.md
   - Check import paths
   - Verify all selectors replaced

4. **Test in Isolation**
   - Comment out new code
   - Test original code
   - Add new code back incrementally

---

## ✅ Definition of Done

A file is "done" when:
- [ ] All `useSelector` replaced with `useSignalRSelector`
- [ ] Forms wrapped with `<IsolatedForm>` (if applicable)
- [ ] File builds without errors
- [ ] Component renders correctly
- [ ] All features work as before
- [ ] No console errors
- [ ] Real-time updates still work
- [ ] Console shows middleware logs
- [ ] Tested manually
- [ ] Committed to Git

---

## 🎉 Celebration Checklist

After Phase 1:
- [ ] Tank stock forms are smooth
- [ ] Users notice improvement
- [ ] Redux actions reduced 20-30%
- [ ] No new bugs introduced
- [ ] Team celebrates! 🎊

After All Phases:
- [ ] All forms butter-smooth 🧈
- [ ] Redux actions reduced 60-70%
- [ ] Performance optimal
- [ ] Users happy
- [ ] Team celebrates BIG! 🎊🎉🥳

---

**Keep this file open while working - it's your quick reference!**
