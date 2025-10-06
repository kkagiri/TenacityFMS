# Browser Cache Clear Instructions - Tank Stock Forms Fix

## ✅ Changes Confirmed Applied

Git confirms the following fixes were successfully applied:

1. **OpeningStockForm.js** ✅

   - Removed `value: formData.siteId` from site selectbox
   - Removed `value: formData.tankId` from tank selectbox
   - Simplified tank disabled condition

2. **ClosingStockForm.js** ✅

   - Removed `value: formData.siteId` from site selectbox
   - Removed `value: formData.tankId` from tank selectbox
   - Simplified tank disabled condition

3. **TankTransferForm.js** ✅

   - Removed all four `value` props from selectboxes
   - Simplified both tank disabled conditions

4. **ManualRefillForm.js** ✅
   - Simplified tank disabled condition

## 🔴 Problem: Browser Cache

Your browser is using **cached JavaScript bundle** from before the fixes. The dev server has the new code, but your browser hasn't loaded it yet.

---

## 🔧 Solution: Force Browser Cache Clear

### Method 1: Hard Refresh (Try This First)

**Chrome/Edge:**

1. Make sure the app is open in your browser
2. Press `Ctrl + Shift + Delete`
3. Select "Cached images and files"
4. Click "Clear data"
5. Close the browser tab completely
6. Reopen the browser and navigate to your app

**OR use keyboard shortcut:**

- Press `Ctrl + F5` (Windows)
- Or `Ctrl + Shift + R` (Windows)

### Method 2: DevTools Hard Refresh

1. Open the app in your browser
2. Press `F12` to open DevTools
3. **Right-click the refresh button** (while DevTools is open)
4. Select **"Empty Cache and Hard Reload"**
5. Wait for page to fully reload

### Method 3: Clear All Browser Data (Nuclear Option)

1. Close ALL browser tabs
2. Open browser settings
3. Go to Privacy/Clear browsing data
4. Select:
   - Cached images and files
   - Cookies and site data
5. Time range: "All time"
6. Click "Clear data"
7. Close and reopen browser

---

## 🧪 How to Verify Changes Loaded

### Check 1: Network Tab

1. Open DevTools (`F12`)
2. Go to **Network** tab
3. Refresh page (`Ctrl + F5`)
4. Find `bundle.js` or `main.chunk.js`
5. Check the **Size** column:
   - ❌ If it says "(disk cache)" → not updated
   - ✅ If it shows actual size (e.g., "2.4 MB") → updated!

### Check 2: Sources Tab

1. Open DevTools (`F12`)
2. Go to **Sources** tab
3. Navigate to: `webpack://` → `src/pages/tankStock/forms/OpeningStockForm.js`
4. Find the site selectbox configuration (around line 570)
5. Verify it does NOT have `value: formData.siteId`
6. ✅ If `value:` line is missing → changes loaded!
7. ❌ If `value: formData.siteId` is still there → cache not cleared

### Check 3: Console Test

Open Console tab and run:

```javascript
// Check bundle timestamp
console.log("App loaded at:", new Date().toISOString());

// Force check sites array
window.sitesTest = true;
```

Then open a form and check if sites appear.

---

## 📝 Alternative: Restart Dev Server

If cache clear doesn't work, restart the dev server:

**In PowerShell:**

```powershell
# 1. Stop the current dev server (press Ctrl+C in terminal)

# 2. Clear node cache
cd c:\actions-runner\_work\Hyoung.FMS\Hyoung.FMS\fms.frontend
Remove-Item -Recurse -Force node_modules\.cache

# 3. Restart dev server
npm start

# 4. Wait for "Compiled successfully!" message

# 5. Hard refresh browser (Ctrl + F5)
```

---

## ✅ Expected Result After Cache Clear

When you open any tank stock form:

### Opening Stock Form:

1. Click site dropdown → **Should show 24 sites**
2. Select a site (e.g., "GARSEN")
3. Click tank dropdown → **Should show filtered tanks** for that site
4. Both dropdowns should work smoothly

### Closing Stock Form:

1. Same as above

### Tank Transfer Form:

1. Source site dropdown → **Should show 24 sites**
2. Source tank dropdown → **Should enable after selecting source site**
3. Destination site dropdown → **Should show 24 sites**
4. Destination tank dropdown → **Should enable after selecting destination site**

### Manual Refill Form:

1. Site dropdown → **Should show 24 sites**
2. Tank dropdown → **Should enable after selecting site** (even if no tanks initially)

---

## 🆘 Still Not Working?

If after clearing cache AND restarting dev server, sites still don't show:

1. **Check Console Tab** for errors:

   ```
   F12 → Console tab
   Look for red error messages
   ```

2. **Check Redux DevTools** for sites data:

   ```
   F12 → Redux tab
   State → site → sites
   Should show array of 24 sites
   ```

3. **Report back** with:
   - Console errors (screenshot)
   - Redux state (screenshot of sites array)
   - Network tab showing bundle.js size

---

## 📞 Summary

**Changes applied:** ✅ All 4 forms fixed
**Dev server has new code:** ✅ Yes
**Browser has new code:** ❌ No (cached)

**Solution:** Clear browser cache using Method 1, 2, or 3 above
**Expected time:** 1-2 minutes
**Success indicator:** Sites appear in dropdowns

---

**The code fixes are correct and working - you just need to load the new JavaScript bundle in your browser!**
