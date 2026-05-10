# FMS Environment Variables Configuration

## ?? Overview

This guide explains how environment variables work in the FMS frontend and how to configure them for different deployment scenarios.

**CRITICAL UNDERSTANDING**: Environment variables are **baked into the JavaScript bundle at build time**. You cannot change them after building without rebuilding the entire application.

---

## ?? How Environment Variables Work

### Build-Time Process

1. **Development**: `npm start` uses `.env` or `.env.development`
2. **Production**: `npm run build` uses `.env.production`
3. React replaces all `process.env.REACT_APP_*` with actual values during build
4. Values are embedded in the JavaScript bundle
5. `public/index.html` placeholders (`%REACT_APP_*%`) are replaced

### Runtime Behavior

- ? Variables are read from JavaScript bundle (fast)
- ? Cannot be changed without rebuilding
- ? `.env` files are NOT deployed to production
- ? Changing `.env` on server has NO effect

---

## ?? Key Environment Variables

### Required Variables

| Variable                       | Purpose              | Example                     |
| ------------------------------ | -------------------- | --------------------------- |
| `REACT_APP_FMS_API_URL`        | Primary API endpoint | `http://197.254.33.227/api` |
| `REACT_APP_PUBLIC_FMS_API_URL` | Public API fallback  | `http://197.254.33.227/api` |

### Optional Variables

| Variable                          | Purpose                   | Example                       |
| --------------------------------- | ------------------------- | ----------------------------- |
| `REACT_APP_SIGNALR_URL`           | Explicit SignalR base URL | `http://197.254.33.227`       |
| `REACT_APP_PRIVATE_FMS_API_URL`   | Internal network API      | `http://10.0.10.153:7009/api` |
| `REACT_APP_IS_LOCAL_DEV`          | Enable local dev mode     | `true`                        |
| `NODE_ENV`                        | Build mode                | `production`                  |
| `REACT_APP_GPSGATE_APP_LOGIN_URL` | GPSGate login endpoint    | `http://197.254.33.227:12175` |
| `REACT_APP_GPSGATE_APP_TRACK_URL` | GPSGate tracks endpoint   | `http://197.254.33.227:12175` |

---

## ?? Environment File Structure

```
fms.frontend/
+-- .env                  # Default (never commit secrets)
+-- .env.development      # Development mode (npm start)
+-- .env.production       # Production mode (npm run build)
+-- .env.local            # Local overrides (git ignored)
+-- public/
    +-- index.html        # Contains %REACT_APP_*% placeholders
```

**Priority Order** (highest to lowest):

1. `.env.production` (when running `npm run build`)
2. `.env.local`
3. `.env`

---

## ?? Configuration by Environment

### 1. Local Development Machine

**File**: `fms.frontend/.env.development`

```bash
# Use localhost backend
REACT_APP_FMS_API_URL=http://localhost:7009/api
REACT_APP_PUBLIC_FMS_API_URL=http://localhost:7009/api
REACT_APP_SIGNALR_URL=http://localhost:7009

# Enable local dev features
REACT_APP_IS_LOCAL_DEV=true

# Development mode
NODE_ENV=development
```

**Start**: `npm start` (uses port 3000)

---

### 2. Internal Network (Development Server)

**File**: `fms.frontend/.env.production`

```bash
# Internal network IP
REACT_APP_FMS_API_URL=http://10.0.10.153:7009/api
REACT_APP_PUBLIC_FMS_API_URL=http://10.0.10.153:7009/api
REACT_APP_SIGNALR_URL=http://10.0.10.153:7009

# Optional: Keep internal as fallback
REACT_APP_PRIVATE_FMS_API_URL=http://10.0.10.153:7009/api

# Production mode
NODE_ENV=production
```

**Build**: `npm run build`
**Deploy**: To internal IIS server for testing

---

### 3. External/Public Production (Current Issue)

**File**: `fms.frontend/.env.production`

```bash
# === CRITICAL: Use public IP or domain name ===
REACT_APP_FMS_API_URL=http://197.254.33.227/api
REACT_APP_PUBLIC_FMS_API_URL=http://197.254.33.227/api

# SignalR must use public URL (no port for IIS proxy)
REACT_APP_SIGNALR_URL=http://197.254.33.227

# Optional: Internal fallback for local network users
REACT_APP_PRIVATE_FMS_API_URL=http://10.0.10.153:7009/api

# GPSGate integration (if used)
REACT_APP_GPSGATE_APP_LOGIN_URL=http://197.254.33.227:12175
REACT_APP_GPSGATE_APP_TRACK_URL=http://197.254.33.227:12175

# Production mode
NODE_ENV=production

# Optional feature flags
REACT_APP_ENABLE_NOTIFICATIONS=true
```

**Build**: `npm run build`
**Deploy**: To production IIS server (`c:\inetpub\wwwroot\tenacyFMS\reactApp\`)

---

### 4. Dual Environment (Internal + External Access)

For servers accessible both internally and externally:

**File**: `fms.frontend/.env.production`

```bash
# Primary: Public URL (works from anywhere)
REACT_APP_FMS_API_URL=http://197.254.33.227/api
REACT_APP_PUBLIC_FMS_API_URL=http://197.254.33.227/api

# Fallback: Internal URL (faster for internal users)
REACT_APP_PRIVATE_FMS_API_URL=http://10.0.10.153:7009/api

# SignalR: Public URL
REACT_APP_SIGNALR_URL=http://197.254.33.227

NODE_ENV=production
```

The application will try internal URL first (if accessible), then fall back to public URL.

---

## ?? How to Check Current Configuration

### Method 1: Browser Console (After Deployment)

Open browser developer tools:

```javascript
// Check API URL from meta tag
const apiUrl = document.querySelector('meta[name="x-api-url"]')?.content;
console.log("API URL:", apiUrl);

// Expected for production: http://197.254.33.227/api
// NOT: http://10.0.10.153:7009/api
// NOT: http://localhost:7009/api
```

### Method 2: index.html (After Build)

```bash
# Check build output
grep "x-api-url" fms.frontend/build/index.html

# Expected output:
# <meta name="x-api-url" content="http://197.254.33.227/api"/>
```

### Method 3: Deployed File

```powershell
# On production server
Select-String -Path "c:\inetpub\wwwroot\tenacyFMS\reactApp\index.html" -Pattern "x-api-url"

# Should show: content="http://197.254.33.227/api"
```

### Method 4: Network Tab

1. Open browser DevTools ? Network tab
2. Look for API requests
3. Check the request URL:
   - ? `http://197.254.33.227/api/...` (correct)
   - ? `http://10.0.10.153:7009/api/...` (internal IP)
   - ? `http://localhost:7009/api/...` (local)

---

## ?? Common Issues & Solutions

### Issue 1: Wrong API URL After Build

**Symptom**: `index.html` shows internal/local IP after building for production

```html
<!-- Wrong -->
<meta name="x-api-url" content="http://10.0.10.153:7009/api" />

<!-- Correct for production -->
<meta name="x-api-url" content="http://197.254.33.227/api" />
```

**Root Causes**:

1. `.env.production` doesn't exist or has wrong content
2. Used wrong build command
3. Spaces around `=` in .env file
4. Wrong variable name

**Solution**:

```bash
# Step 1: Verify file exists
ls -la fms.frontend/.env.production

# Step 2: Check content (must match exactly)
cat fms.frontend/.env.production
# Should have: REACT_APP_FMS_API_URL=http://197.254.33.227/api

# Step 3: Clean build
cd fms.frontend
rm -rf build/
npm run build

# Step 4: Verify
grep "x-api-url" build/index.html
```

---

### Issue 2: Environment Variables Not Applied

**Symptom**: Changes to `.env.production` don't appear after rebuild

**Common Mistakes**:

```bash
# ? WRONG - Space around equals
REACT_APP_FMS_API_URL = http://197.254.33.227/api

# ? WRONG - Quotes (not needed for URLs)
REACT_APP_FMS_API_URL="http://197.254.33.227/api"

# ? WRONG - Wrong file name
.env.prod (should be .env.production)

# ? WRONG - Wrong location
fms.frontend/src/.env.production (should be in fms.frontend/)

# ? CORRECT
REACT_APP_FMS_API_URL=http://197.254.33.227/api
```

**Solution**:

1. **Check file location**: Must be `fms.frontend/.env.production`
2. **Check syntax**: No spaces, no quotes for URLs
3. **Check prefix**: Must start with `REACT_APP_`
4. **Clear cache**: Delete `build/` and `node_modules/.cache/`
5. **Rebuild**: `npm run build`

---

### Issue 3: SignalR Still Uses Internal IP

**Symptom**: API calls work, but SignalR tries to connect to `10.0.10.153`

**Root Cause**: Backend SignalR negotiate endpoint returns internal server URL

**Solutions**:

**A. Override with REACT_APP_SIGNALR_URL**:

```bash
# In .env.production
REACT_APP_SIGNALR_URL=http://197.254.33.227
```

**B. Check SignalR Service Logic**:
Looking at `ptsSignalRService.js` line 138-168, it uses this priority:

1. `REACT_APP_SIGNALR_URL` (highest priority)
2. Resolved API base URL
3. `REACT_APP_PUBLIC_FMS_API_URL`
4. `REACT_APP_API_URL`
5. Fallback to `http://localhost:7009/api`

Make sure `REACT_APP_SIGNALR_URL` is set in `.env.production`:

```bash
REACT_APP_SIGNALR_URL=http://197.254.33.227
```

**C. Configure Backend** (see `SIGNALR_EXTERNAL_CONNECTION_FIX.md`)

---

### Issue 4: Works Internally but Not Externally

**Symptom**:

- Internal network (10.0.10.x): ? Works
- External network: ? Fails

**Root Cause**: Application built with internal IP

**Solution**: Build separate versions OR use public URL for both:

**Option A: Single Build (Public URL)**

```bash
# .env.production
REACT_APP_FMS_API_URL=http://197.254.33.227/api
REACT_APP_PUBLIC_FMS_API_URL=http://197.254.33.227/api
REACT_APP_PRIVATE_FMS_API_URL=http://10.0.10.153:7009/api

# Rebuild
npm run build
```

Internal users will connect via public URL (slight overhead) but it works everywhere.

**Option B: Two Builds** (Not Recommended)

- Build 1: Internal URL ? Deploy to internal IIS
- Build 2: Public URL ? Deploy to external IIS

This is complex and error-prone.

---

### Issue 5: .env Not Git Committed

**Symptom**: `.env.production` missing after git clone

**Reason**: `.gitignore` excludes `.env*` files for security

**Solution**:

**A. Use .env.production.example** (Recommended):

```bash
# Commit template
cp .env.production .env.production.example

# Add to git
git add .env.production.example
git commit -m "Add production environment template"

# On new machine
cp .env.production.example .env.production
# Edit with actual values
```

**B. Document Required Variables**:
Create `fms.frontend/.env.README.md`:

```markdown
# Required Environment Variables

Copy this to `.env.production` and update values:
```

REACT_APP_FMS_API_URL=http://YOUR_SERVER_IP/api
REACT_APP_PUBLIC_FMS_API_URL=http://YOUR_SERVER_IP/api
REACT_APP_SIGNALR_URL=http://YOUR_SERVER_IP
NODE_ENV=production

```

```

---

## ? Verification Checklist

Before deploying production build:

### Pre-Build

- [ ] `.env.production` exists in `fms.frontend/` directory
- [ ] `REACT_APP_FMS_API_URL=http://197.254.33.227/api` (no spaces)
- [ ] `REACT_APP_SIGNALR_URL=http://197.254.33.227` (no port)
- [ ] `NODE_ENV=production`
- [ ] No syntax errors (no spaces around `=`)

### Post-Build

- [ ] `build/` directory created successfully
- [ ] `build/index.html` exists
- [ ] `grep "x-api-url" build/index.html` shows public URL
- [ ] No `localhost` or `10.0.10.153` in index.html
- [ ] `build/static/js/main.*.js` exists (bundled code)

### Post-Deploy

- [ ] Files copied to IIS directory
- [ ] `web.config` present in deploy directory
- [ ] IIS application pool started
- [ ] Browser shows application
- [ ] Browser console: no CORS errors
- [ ] Network tab: API calls go to public URL
- [ ] SignalR connects successfully

---

## ?? Complete Fix for Current Issue

Your current issue: SignalR fails externally because app uses internal IP

### Step-by-Step Fix:

#### 1. Update .env.production

```bash
cd C:\dev\Tenacity.FMS\fms.frontend
notepad .env.production
```

Content:

```bash
REACT_APP_FMS_API_URL=http://197.254.33.227/api
REACT_APP_PUBLIC_FMS_API_URL=http://197.254.33.227/api
REACT_APP_SIGNALR_URL=http://197.254.33.227
NODE_ENV=production
```

#### 2. Clean and Rebuild

```bash
cd fms.frontend

# Clean
Remove-Item -Recurse -Force build\
Remove-Item -Recurse -Force node_modules\.cache\

# Rebuild
npm run build
```

#### 3. Verify Build

```bash
# Check API URL
Select-String -Path "build\index.html" -Pattern "x-api-url"

# Expected: content="http://197.254.33.227/api"
# NOT: content="http://10.0.10.153:7009/api"
```

#### 4. Deploy to IIS

```powershell
# Backup current
Copy-Item -Path "c:\inetpub\wwwroot\tenacyFMS\reactApp" -Destination "c:\inetpub\wwwroot\tenacyFMS\reactApp_backup_$(Get-Date -Format 'yyyyMMddHHmmss')" -Recurse

# Deploy new build
Copy-Item -Path "build\*" -Destination "c:\inetpub\wwwroot\tenacyFMS\reactApp\" -Recurse -Force

# Restart IIS
iisreset /noforce
```

#### 5. Test Externally

From different network:

1. Open `http://197.254.33.227`
2. Open browser DevTools ? Console
3. Look for SignalR connection logs
4. Check Network tab for WebSocket connection
5. Verify no 404 errors

---

## ?? Quick Reference Commands

```bash
# Check current .env.production
cat fms.frontend/.env.production

# Verify build output
grep "x-api-url" fms.frontend/build/index.html

# Check deployed version
Select-String -Path "c:\inetpub\wwwroot\tenacyFMS\reactApp\index.html" -Pattern "x-api-url"

# Clean build
cd fms.frontend && rm -rf build/ && npm run build

# Quick verify in browser console
document.querySelector('meta[name="x-api-url"]')?.content
```

---

## ?? Key Takeaways

1. **Build-Time Only**: Environment variables are baked in at build time
2. **Prefix Required**: Variables must start with `REACT_APP_`
3. **No Runtime Changes**: Cannot change without rebuilding
4. **File Location**: `.env.production` must be in `fms.frontend/` root
5. **No Spaces**: `VAR=value` not `VAR = value`
6. **Public URL**: Production must use public IP/domain for external access
7. **SignalR Override**: Use `REACT_APP_SIGNALR_URL` to force SignalR URL
8. **Verify Always**: Check `index.html` after every build

---

**Last Updated**: 2025-10-31
**Related Docs**:

- `BUILD_COMMANDS.md` - Build process details
- `SIGNALR_EXTERNAL_CONNECTION_FIX.md` - SignalR connection fixes
