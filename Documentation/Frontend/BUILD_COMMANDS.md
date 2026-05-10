# FMS Frontend Build Commands

## ?? Quick Reference

### Development Build

```bash
cd fms.frontend
npm run build
```

### Production Build (External Network Access)

```bash
cd fms.frontend
# Ensure .env.production has correct settings
npm run build
```

---

## ?? Build Process Overview

The React build process:

1. Reads environment variables from `.env.production`
2. Replaces `%REACT_APP_*%` placeholders in `public/index.html`
3. Bundles JavaScript with environment variables baked in
4. Optimizes and minifies assets
5. Outputs to `build/` directory

**IMPORTANT**: Environment variables are **baked into the JavaScript bundle** at build time. They cannot be changed without rebuilding.

---

## ?? Environment-Specific Builds

### Local Development (Dev Machine)

```bash
# .env or .env.development
REACT_APP_FMS_API_URL=http://localhost:7009/api
REACT_APP_IS_LOCAL_DEV=true

# Build
npm run build
```

### Internal Network (10.0.10.x)

```bash
# .env.production
REACT_APP_FMS_API_URL=http://10.0.10.153:7009/api
REACT_APP_PUBLIC_FMS_API_URL=http://10.0.10.153:7009/api

# Build
npm run build
```

### External/Public Network (197.254.33.227)

```bash
# .env.production
REACT_APP_FMS_API_URL=http://197.254.33.227/api
REACT_APP_PUBLIC_FMS_API_URL=http://197.254.33.227/api
REACT_APP_SIGNALR_URL=http://197.254.33.227

# Build
npm run build
```

---

## ?? Complete Production Build Steps

### Step 1: Update Environment Variables

Edit `fms.frontend/.env.production`:

```bash
# === CRITICAL: Set to public IP or domain ===
REACT_APP_FMS_API_URL=http://197.254.33.227/api
REACT_APP_PUBLIC_FMS_API_URL=http://197.254.33.227/api

# SignalR explicit URL (optional but recommended)
REACT_APP_SIGNALR_URL=http://197.254.33.227

# Production mode
NODE_ENV=production

# Optional: GPSGate integration
REACT_APP_GPSGATE_APP_LOGIN_URL=http://197.254.33.227:12175
REACT_APP_GPSGATE_APP_TRACK_URL=http://197.254.33.227:12175

# Feature flags (optional)
REACT_APP_ENABLE_NOTIFICATIONS=true
```

### Step 2: Clean Previous Build

```bash
cd fms.frontend
rm -rf build/
# Or on Windows:
# rmdir /s /q build
```

### Step 3: Build

```bash
npm run build
```

**Expected Output**:

```
Creating an optimized production build...
Compiled successfully!

File sizes after gzip:

  500 KB    build/static/js/main.478fa066.js
  150 KB    build/static/css/main.ae1cbe3f.css

The build folder is ready to be deployed.
```

### Step 4: Verify Build

```bash
# Check index.html has correct API URL
cat build/index.html | grep "x-api-url"
# Should show: content="http://197.254.33.227/api"

# NOT: content="http://10.0.10.153:7009/api"
# NOT: content="http://localhost:7009/api"
```

**If it shows internal/local IP**, your `.env.production` wasn't read. Check:

- File exists: `fms.frontend/.env.production`
- No typos in variable names
- No spaces around `=` sign
- Run `npm run build` (not `npm start`)

### Step 5: Deploy to IIS

**Option A: Manual Copy**

```powershell
# Stop IIS site first (optional but recommended)
Stop-IISCommittedConfig

# Copy files
Copy-Item -Path "fms.frontend\build\*" -Destination "c:\inetpub\wwwroot\tenacyFMS\reactApp\" -Recurse -Force

# Ensure web.config is in place
Copy-Item -Path "fms.frontend\public\web.config" -Destination "c:\inetpub\wwwroot\tenacyFMS\reactApp\web.config" -Force

# Start IIS site
Start-IISCommittedConfig
```

**Option B: Automated Deployment Script**

```powershell
# Save as deploy-production.ps1
$buildPath = "fms.frontend\build"
$deployPath = "c:\inetpub\wwwroot\tenacyFMS\reactApp"

Write-Host "Building application..." -ForegroundColor Yellow
Set-Location fms.frontend
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful. Deploying..." -ForegroundColor Green

    # Backup current deployment
    $backupPath = "c:\inetpub\wwwroot\tenacyFMS\reactApp_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item -Path $deployPath -Destination $backupPath -Recurse
    Write-Host "Backup created at: $backupPath" -ForegroundColor Cyan

    # Deploy new build
    Remove-Item -Path "$deployPath\*" -Recurse -Force -Exclude "web.config"
    Copy-Item -Path "$buildPath\*" -Destination $deployPath -Recurse -Force

    Write-Host "Deployment complete!" -ForegroundColor Green
    Write-Host "Verify at: http://197.254.33.227" -ForegroundColor Cyan
} else {
    Write-Host "Build failed. Deployment aborted." -ForegroundColor Red
}
```

---

## ?? Post-Build Verification

### 1. Verify Environment Variables in Build

```bash
# Check index.html
grep "x-api-url" fms.frontend/build/index.html

# Expected: content="http://197.254.33.227/api"
```

### 2. Test Build Locally (Optional)

```bash
cd fms.frontend/build
npx serve -s . -p 3000

# Open: http://localhost:3000
# Check browser console for API URL
```

### 3. Test After IIS Deployment

```powershell
# Test from production server
curl http://localhost/api/ -v

# Test SignalR negotiate
curl http://localhost/ptsHub/negotiate?negotiateVersion=1 -Method POST -ContentType "application/json"
```

### 4. Test from External Network

```bash
# From different machine/network
curl http://197.254.33.227/api/ -v

# Test in browser
# Open: http://197.254.33.227
# Check browser console:
# - Network tab for API calls
# - Console for SignalR connection logs
```

---

## ?? Common Build Issues

### Issue 1: Build Shows Wrong API URL

**Problem**: `index.html` contains internal IP after build

```html
<meta name="x-api-url" content="http://10.0.10.153:7009/api" />
```

**Solution**:

1. Check `.env.production` exists in `fms.frontend/` directory
2. Verify content: `REACT_APP_FMS_API_URL=http://197.254.33.227/api`
3. Delete `build/` folder completely
4. Run `npm run build` again
5. Verify: `grep "x-api-url" build/index.html`

### Issue 2: Environment Variables Not Applied

**Causes**:

- Using `.env` instead of `.env.production` for production builds
- Spaces around `=` sign: `REACT_APP_FMS_API_URL = http://...` ?
- Wrong variable name: `REACT_APP_API_URL` vs `REACT_APP_FMS_API_URL`
- `.env.production` not in `fms.frontend/` directory

**Solution**:

```bash
# Verify file exists
ls -la fms.frontend/.env.production

# Check content (no spaces around =)
cat fms.frontend/.env.production

# Correct format:
REACT_APP_FMS_API_URL=http://197.254.33.227/api
```

### Issue 3: Old Build Cached

**Symptoms**:

- Changes not appearing after rebuild
- Old API URL still showing

**Solution**:

```bash
# Complete clean build
cd fms.frontend
rm -rf build/
rm -rf node_modules/.cache/
npm run build
```

### Issue 4: SignalR Still Uses Internal IP

**Problem**: After correct build, SignalR still connects to 10.0.10.153

**Root Cause**: Backend SignalR negotiate endpoint returns internal IP

**Solution**:

- Configure backend to use public URL in SignalR configuration
- OR use `REACT_APP_SIGNALR_URL` to override
- See `SIGNALR_EXTERNAL_CONNECTION_FIX.md` for details

---

## ?? Build Output Structure

```
build/
+-- index.html                 # Entry point (contains API URL meta tag)
+-- favicon.ico
+-- manifest.json
+-- robots.txt
+-- asset-manifest.json        # Asset mapping
+-- static/
¦   +-- css/
¦   ¦   +-- main.[hash].css   # Minified styles
¦   +-- js/
¦   ¦   +-- main.[hash].js    # Bundled app code (env vars baked in)
¦   ¦   +-- *.chunk.js        # Code-split chunks
¦   +-- media/
¦       +-- *                  # Images, fonts, etc.
+-- web.config                 # IIS configuration (if exists in public/)
```

**Important Files**:

- `index.html`: Check for correct API URL meta tag
- `main.[hash].js`: Contains all environment variables (cannot be changed without rebuild)
- `web.config`: IIS rewrite rules for SPA routing and API proxy

---

## ?? Production Deployment Checklist

Before deploying to production:

- [ ] Updated `.env.production` with public IP/domain
- [ ] Removed `build/` directory
- [ ] Run `npm run build` successfully
- [ ] Verified `index.html` contains public URL
- [ ] Tested build locally (optional)
- [ ] Backed up current IIS deployment
- [ ] Copied build to IIS directory
- [ ] Verified `web.config` is in place
- [ ] Restarted IIS application pool
- [ ] Tested from internal network
- [ ] Tested from external network
- [ ] Verified SignalR connection works
- [ ] Checked browser console for errors

---

## ?? Quick Rebuild & Deploy Command

Save this as `build-and-deploy.ps1`:

```powershell
#!/usr/bin/env pwsh
# Quick rebuild and deploy script

param(
    [string]$Environment = "production",
    [switch]$SkipBackup
)

$ErrorActionPreference = "Stop"

Write-Host "=== FMS Frontend Deployment ===" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host ""

# Step 1: Build
Write-Host "[1/5] Building frontend..." -ForegroundColor Yellow
Set-Location fms.frontend
Remove-Item -Path "build" -Recurse -Force -ErrorAction SilentlyContinue
$env:NODE_ENV = $Environment
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Verify
Write-Host "[2/5] Verifying build..." -ForegroundColor Yellow
$indexContent = Get-Content "build/index.html" -Raw
if ($indexContent -match 'x-api-url.*content="([^"]+)"') {
    $apiUrl = $matches[1]
    Write-Host "   API URL: $apiUrl" -ForegroundColor Cyan

    if ($apiUrl -like "*localhost*" -or $apiUrl -like "*10.0.10.153*") {
        Write-Host "   WARNING: Using internal/local URL for production!" -ForegroundColor Red
        $continue = Read-Host "Continue anyway? (y/N)"
        if ($continue -ne "y") {
            exit 1
        }
    }
} else {
    Write-Host "   ERROR: Could not find API URL in build" -ForegroundColor Red
    exit 1
}

# Step 3: Backup
$deployPath = "c:\inetpub\wwwroot\tenacyFMS\reactApp"
if (-not $SkipBackup) {
    Write-Host "[3/5] Creating backup..." -ForegroundColor Yellow
    $backupPath = "${deployPath}_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item -Path $deployPath -Destination $backupPath -Recurse -ErrorAction SilentlyContinue
    Write-Host "   Backup: $backupPath" -ForegroundColor Gray
} else {
    Write-Host "[3/5] Skipping backup..." -ForegroundColor Gray
}

# Step 4: Deploy
Write-Host "[4/5] Deploying to IIS..." -ForegroundColor Yellow
$webConfigBackup = "$deployPath\web.config"
Copy-Item -Path $webConfigBackup -Destination ".\web.config.backup" -ErrorAction SilentlyContinue

Remove-Item -Path "$deployPath\*" -Recurse -Force -Exclude "web.config"
Copy-Item -Path "build\*" -Destination $deployPath -Recurse -Force

# Restore web.config if it was removed
if (-not (Test-Path "$deployPath\web.config")) {
    Copy-Item -Path ".\web.config.backup" -Destination "$deployPath\web.config" -Force -ErrorAction SilentlyContinue
}

# Step 5: Restart IIS
Write-Host "[5/5] Restarting IIS..." -ForegroundColor Yellow
iisreset /noforce

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host "URL: http://197.254.33.227" -ForegroundColor Cyan
Write-Host "Verify SignalR connection in browser console" -ForegroundColor Yellow
```

**Usage**:

```powershell
# Standard production deployment
.\build-and-deploy.ps1

# Skip backup (faster)
.\build-and-deploy.ps1 -SkipBackup
```

---

## ?? Troubleshooting

### Build succeeds but wrong URL

1. Check `.env.production` location: should be in `fms.frontend/` root
2. Check file encoding: should be UTF-8
3. Check for spaces: `REACT_APP_FMS_API_URL=value` (no spaces)
4. Clean build: `rm -rf build/ && npm run build`

### Deploy succeeds but app shows errors

1. Check browser console for specific errors
2. Verify backend is running on port 7009
3. Test API: `curl http://197.254.33.227/api/`
4. Check IIS logs: `c:\inetpub\logs\LogFiles\`

### SignalR not connecting

1. Run `SIGNALR_DIAGNOSTICS.ps1`
2. Check `SIGNALR_EXTERNAL_CONNECTION_FIX.md`
3. Verify ARR is installed and WebSocket enabled
4. Test negotiate: `curl http://197.254.33.227/ptsHub/negotiate -X POST`

---

**Last Updated**: 2025-10-31
**For**: Tenacity FMS Production Deployment
