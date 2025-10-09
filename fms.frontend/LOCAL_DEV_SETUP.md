# 🔧 FMS Local Development Environment Setup Guide

## Overview

This guide helps you configure your development PC to run the FMS system locally, with the backend running on `localhost:7009` instead of the production server at `10.0.10.153:7009`.

---

## 🎯 Quick Setup (Recommended)

### Step 1: Configure This Machine as Dev PC

Open PowerShell in the `fms.frontend` directory and run:

```powershell
# Check current status
.\configure-dev-machine.ps1 -Action status

# Enable local development mode
.\configure-dev-machine.ps1 -Action enable
```

This will:
- ✅ Set Windows environment variable `FMS_LOCAL_DEV=true`
- ✅ Create `.env.local` file with localhost configuration
- ✅ Configure axios to prioritize localhost URLs

### Step 2: Restart Your Tools

**IMPORTANT:** Environment variables require restart to take effect:

```powershell
# 1. Close this PowerShell window
# 2. Close VS Code
# 3. Open VS Code fresh
# 4. Open new PowerShell terminal in VS Code
```

### Step 3: Start Backend Locally

Make sure your backend API is running on `localhost:7009`:

**Option A - Visual Studio:**
```powershell
# Open Hyoung.Fms.sln in Visual Studio
# Set FMS.WebClient as startup project
# Press F5 to run
```

**Option B - Command Line:**
```powershell
cd "c:\Users\kkagiri\source\repos\Hyoung.Fms\FMS.WebClient"
dotnet run
```

**Verify backend is running:**
```powershell
# Check if port 7009 is listening
netstat -ano | findstr :7009

# Test health endpoint
curl http://localhost:7009/api/v1/Health
```

### Step 4: Start Frontend

```powershell
cd "c:\Users\kkagiri\source\repos\Hyoung.Fms\fms.frontend"

# Install dependencies (if not done already)
npm install

# Start development server
npm start
```

### Step 5: Verify Configuration

Open browser console (F12) when the app loads. You should see:

```
[Axios] Local dev mode enabled - prioritizing localhost URLs
[Axios] Resolved API base URL: http://localhost:7009/api/
```

If you see `http://10.0.10.153:7009/api/`, the configuration didn't take effect - see Troubleshooting section below.

---

## 🔄 Switching Between Local and Production Backend

### Method 1: PowerShell Script (Recommended)

```powershell
# Switch to LOCAL backend (localhost:7009)
.\configure-dev-machine.ps1 -Action enable

# Switch to PRODUCTION backend (10.0.10.153:7009)
.\configure-dev-machine.ps1 -Action disable

# Check current configuration
.\configure-dev-machine.ps1 -Action status
```

### Method 2: Batch Script (Alternative)

```cmd
# Interactive menu
.\switch-backend.bat
```

---

## 🏗️ How It Works

### Environment Variable Detection

The system uses a Windows environment variable `FMS_LOCAL_DEV` to detect if you're on a development machine:

```javascript
// In axiosInstance.js
const isLocalDev = process.env.REACT_APP_IS_LOCAL_DEV === 'true';
```

### URL Priority Order

When `REACT_APP_IS_LOCAL_DEV=true`, axios tries URLs in this order:

1. `http://localhost:7009/api/` ⭐ **Highest priority**
2. `http://127.0.0.1:7009/api/`
3. Other environment variable URLs
4. Window origin fallback

### Health Check Probing

Axios automatically probes each candidate URL with a health check:

```
GET http://localhost:7009/api/v1/Health
```

If the endpoint responds with HTTP 200, that URL is selected as the base URL.

---

## 📁 Configuration Files

### `.env.local` (Git Ignored)

This file overrides `.env.development` and is automatically created by the setup script:

```env
# Local Development Environment
REACT_APP_IS_LOCAL_DEV=true
REACT_APP_API_URL=http://localhost:7009/api
# ... other localhost URLs
```

**Note:** This file is git-ignored, so each developer can have their own local configuration.

### `.env.development` (Git Tracked)

Default configuration pointing to production server:

```env
REACT_APP_API_URL=http://10.0.10.153:7009/api
# ... other production URLs
```

**Note:** This file is tracked in git and should remain pointing to production.

### React Environment File Priority

React uses this priority order:
1. `.env.local` (highest)
2. `.env.development`
3. `.env` (lowest)

---

## 🔍 Troubleshooting

### Issue: Still Calling Production Server (10.0.10.153)

**Symptoms:**
- Browser console shows: `Resolved API base URL: http://10.0.10.153:7009/api/`
- CORS errors persist

**Solutions:**

1. **Verify environment variable is set:**
   ```powershell
   .\configure-dev-machine.ps1 -Action status
   ```

2. **Restart everything:**
   ```powershell
   # Close VS Code completely
   # Reopen VS Code
   # Stop frontend (Ctrl+C)
   # Start frontend (npm start)
   ```

3. **Check .env.local exists:**
   ```powershell
   Get-Content .env.local
   ```

4. **Clear React cache:**
   ```powershell
   rm -r -fo node_modules/.cache
   npm start
   ```

### Issue: Backend Not Running on Localhost

**Symptoms:**
- axios logs: `Probe failed for http://localhost:7009/api/`
- Fallback to production server

**Solutions:**

1. **Check if backend is running:**
   ```powershell
   netstat -ano | findstr :7009
   ```

2. **Start backend:**
   ```powershell
   cd FMS.WebClient
   dotnet run
   ```

3. **Check backend health:**
   ```powershell
   curl http://localhost:7009/api/v1/Health
   ```

### Issue: CORS Error Even with Localhost

**Symptoms:**
- Error: "No 'Access-Control-Allow-Origin' header"
- Both frontend and backend on localhost

**Solutions:**

1. **Check backend environment:**
   - Backend should run in `Development` mode
   - Check console output when backend starts

2. **Verify CORS configuration:**
   - DevelopmentCorsPolicy should be active
   - Allows `http://localhost:3000`

3. **Check backend launchSettings.json:**
   ```json
   "ASPNETCORE_ENVIRONMENT": "Development"
   ```

### Issue: Changes Not Taking Effect

**Symptoms:**
- Made changes but axios still using old configuration

**Solutions:**

1. **Hard refresh browser:**
   - Press `Ctrl + Shift + R` (Windows)
   - Or open DevTools → Right-click refresh → Empty cache and hard reload

2. **Clear all caches:**
   ```powershell
   # Stop frontend
   rm -r -fo node_modules/.cache
   npm start
   ```

3. **Check browser console:**
   - Look for `[Axios]` logs
   - Verify resolved URL

---

## 🧪 Testing the Setup

### Test 1: Backend Reachability

```powershell
# Test health endpoint
Invoke-WebRequest -Uri "http://localhost:7009/api/v1/Health" -Method GET
```

Expected: HTTP 200 response

### Test 2: Frontend Configuration

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for axios logs:

```
[Axios] Local dev mode enabled - prioritizing localhost URLs
[Axios] Resolved API base URL: http://localhost:7009/api/
```

### Test 3: API Call

Try creating an opening stock entry:
- Frontend should call `http://localhost:7009/api/v1/tankstock/openingstock`
- Check Network tab in DevTools
- Status should be 200 or 201 (not CORS error)

---

## 📋 Environment Comparison

| Configuration | Dev PC (You) | Production Server | Other Devs |
|--------------|--------------|-------------------|------------|
| **Environment Variable** | `FMS_LOCAL_DEV=true` | Not set | Not set |
| **Frontend URL** | `localhost:3000` | N/A | `10.0.11.x:3000` |
| **Backend URL** | `localhost:7009` | `10.0.10.153:7009` | Via production |
| **`.env.local`** | ✅ Exists | N/A | ❌ Not needed |
| **API Target** | localhost | Production | Production |

---

## 🚀 Daily Development Workflow

### Starting Work

```powershell
# 1. Start backend
cd FMS.WebClient
dotnet run

# 2. In another terminal, start frontend
cd fms.frontend
npm start

# 3. Verify in browser console
# Should see: [Axios] Resolved API base URL: http://localhost:7009/api/
```

### Switching to Production Mode

If you need to test against production server:

```powershell
.\configure-dev-machine.ps1 -Action disable
# Restart frontend (Ctrl+C, then npm start)
```

### Switching Back to Local

```powershell
.\configure-dev-machine.ps1 -Action enable
# Restart frontend (Ctrl+C, then npm start)
```

---

## 📝 Notes

- **Git Ignore:** `.env.local` is git-ignored, so your local config won't affect other developers
- **Team Impact:** Other developers continue using production server via `.env.development`
- **Environment Variables:** Set at User level (no admin required) and System level (requires admin)
- **Persistence:** Configuration persists across reboots
- **Health Checks:** Axios probes URLs automatically - no manual configuration needed

---

## 🆘 Getting Help

If you encounter issues:

1. Run diagnostic:
   ```powershell
   .\configure-dev-machine.ps1 -Action status
   ```

2. Check axios logs in browser console (F12)

3. Verify backend is running:
   ```powershell
   netstat -ano | findstr :7009
   ```

4. Check backend health:
   ```powershell
   curl http://localhost:7009/api/v1/Health
   ```

---

## ✅ Success Checklist

- [ ] Ran `configure-dev-machine.ps1 -Action enable`
- [ ] Restarted VS Code and terminal
- [ ] Backend running on localhost:7009
- [ ] Frontend running on localhost:3000
- [ ] Browser console shows: `Resolved API base URL: http://localhost:7009/api/`
- [ ] Can create opening stock without CORS error
- [ ] Network tab shows calls to localhost, not 10.0.10.153

---

**You're now set up for local FMS development! 🎉**
