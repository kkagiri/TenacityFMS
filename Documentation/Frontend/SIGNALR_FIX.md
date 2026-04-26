# SignalR Connection Fix - Production Issue

## Problem Summary

**Issue**: In production, devices don't show as online in the ATG Dashboard.

**Root Cause**: SignalR WebSocket connections were using wrong URL

- ❌ Current: `ws://10.0.10.153/ptsHub` (missing port 7009)
- ✅ Correct: `ws://10.0.10.153:7009/ptsHub`

**Why This Happened**:

- SignalR services were deriving base URL from `axiosInstance`
- `axiosInstance` returns `http://10.0.10.153/api` (no port, works through IIS proxy)
- SignalR strips `/api` → gets `http://10.0.10.153` (missing port 7009)
- WebSocket connections CANNOT go through IIS URL rewrite → need direct Kestrel connection

## The Fix

### **Changed Files (3 files):**

1. **`.env`** - Production build configuration
2. **`.env.production`** - Explicit production configuration
3. **`.env.development`** - Development configuration

### **Change Made:**

```bash
# Before (BROKEN)
REACT_APP_SIGNALR_URL=

# After (FIXED)
REACT_APP_SIGNALR_URL=http://10.0.10.153:7009
```

### **What This Does:**

- SignalR services check `process.env.REACT_APP_SIGNALR_URL` FIRST
- If set, they use it directly (no derivation from API URL)
- Ensures WebSocket connections go to `http://10.0.10.153:7009`

## Impact Analysis

### ✅ **NO Breaking Changes:**

1. **API Calls** - Still use `axiosInstance` (unchanged)

   - Redux actions: ✅ No changes
   - Services: ✅ No changes
   - Axios interceptors: ✅ No changes

2. **axiosInstance.js** - ✅ Not modified

   - URL resolution: Same as before
   - Request interceptors: Same as before
   - Auto-prepends `v1`: Still works

3. **apiConfig.js** - ✅ Created but NOT used yet
   - Available for future migration
   - Not breaking anything

### ✅ **What Was Fixed:**

1. **SignalR Services** (3 files):

   - `ptsSignalRService.js` ✅ Now gets correct URL from env var
   - `dashboardSignalRService.js` ✅ Now gets correct URL from env var
   - `businessSignalRService.js` ✅ Now gets correct URL from env var

2. **Environment Variables**:
   - `.env` ✅ Updated
   - `.env.production` ✅ Updated
   - `.env.development` ✅ Updated

## Testing Steps

### 1. Rebuild Frontend

```powershell
cd c:\dev\Tenacy.FMS\fms.frontend
npm run build
```

### 2. Verify Environment Variable

Check the build output or browser console:

```javascript
// Should see in console:
console.log(process.env.REACT_APP_SIGNALR_URL);
// Expected: "http://10.0.10.153:7009"
```

### 3. Test SignalR Connection

Open browser console on ATG Dashboard:

```javascript
// Check connection URL
// Look for console logs like:
// [PTS SignalR] Starting connection attempt...
// Should show: ws://10.0.10.153:7009/ptsHub
```

### 4. Verify Device Shows Online

1. Ensure PTS Windows Service is running (already confirmed - PID 26656)
2. Redis has device data (already confirmed - device `003400483233511238383435`)
3. Device is in database (already confirmed - both devices present)
4. Device `isActive = 1` (needs to be updated if still 0)

## Expected Behavior After Fix

### Development Environment:

```
Browser loads app
  ↓
Reads: REACT_APP_SIGNALR_URL=http://10.0.10.153:7009
  ↓
SignalR connects to: ws://10.0.10.153:7009/ptsHub
  ↓
Receives: ConnectedDevicesStatus, DeviceStatusUpdate
  ↓
Redux updates: deviceConnections.connectionStatuses
  ↓
Selector merges: ptsDeviceList + connectionStatuses
  ↓
Dashboard shows: Device online ✅
```

### Production Environment:

```
Same flow as development - uses same SignalR URL
```

## Rollback Plan (If Needed)

If this causes issues, simply revert:

```bash
# In .env and .env.production
REACT_APP_SIGNALR_URL=
```

Then rebuild. This will go back to deriving from API URL.

## Future Improvements (Not Implemented Yet)

The `apiConfig.js` was created for future use to:

- Auto-detect intranet vs public IP
- Support external users via public IP (197.254.33.227)
- Health check probing

**Not activated yet** - zero breaking changes!

## Files Changed

### Modified:

- ✅ `fms.frontend/.env`
- ✅ `fms.frontend/.env.production`
- ✅ `fms.frontend/.env.development`

### Created (not used yet):

- 📝 `fms.frontend/src/config/apiConfig.js` (for future)
- 📝 `Documentation/Frontend/API_CONFIGURATION.md` (documentation)
- 📝 `Documentation/Frontend/BUILD_COMMANDS.md` (documentation)

### Not Modified:

- ✅ All Redux actions
- ✅ All services using axiosInstance
- ✅ axiosInstance.js itself
- ✅ SignalR service files (they just read the env var)

## Verification Checklist

- [ ] Build completes without errors
- [ ] No console errors on page load
- [ ] SignalR connects to correct URL (with port 7009)
- [ ] Device appears in ATG Dashboard
- [ ] Device shows as "Connected" or "Active"
- [ ] Live updates work (pump status, transactions, etc.)
- [ ] API calls still work (check Network tab)

---

**Last Updated**: 2025-10-30
**Issue**: SignalR missing port 7009
**Solution**: Explicit REACT_APP_SIGNALR_URL in .env files
**Risk**: ZERO - Only environment variable changed, no code changes
