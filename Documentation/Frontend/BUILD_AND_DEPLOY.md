# Frontend Build & Deploy Process

## Overview

This document explains how the `web.config` is automatically included in your frontend builds and deployed to IIS.

## How It Works

### 1. Source Configuration

The `web.config` is stored in the source code at:

```
c:\dev\Hyoung.FMS\fms.frontend\public\web.config
```

### 2. Build Process

When you run `npm run build`, Create React App automatically:

1. Reads all files from the `public/` folder
2. Copies them to the `build/` folder
3. This includes `web.config`, `favicon.ico`, `index.html`, etc.

### 3. Result

After build, your `build/` folder contains:

```
build/
├── index.html
├── web.config          ← Automatically copied from public/
├── static/
│   ├── css/
│   └── js/
└── ...
```

## Deployment Options

### Option 1: Automated Deployment (Recommended)

Use the deployment script:

```powershell
# Full build and deploy
.\scripts\deploy-frontend.ps1

# Preview changes without deploying
.\scripts\deploy-frontend.ps1 -WhatIf

# Skip backup (faster)
.\scripts\deploy-frontend.ps1 -SkipBackup

# Deploy existing build without rebuilding
.\scripts\deploy-frontend.ps1 -SkipBuild
```

### Option 2: Manual Deployment

```powershell
# 1. Build
cd c:\dev\Hyoung.FMS\fms.frontend
npm run build

# 2. Deploy
Copy-Item -Path "build\*" -Destination "c:\inetpub\wwwroot\hyoungFMS\reactApp\" -Recurse -Force
```

## web.config Features

### Current Configuration

The `web.config` includes:

1. **API Proxy** - Routes `/api/*` to backend on port 7009
2. **SignalR Hub Proxies** - Routes hub endpoints for HTTP negotiate
   - `/dashboardHub`
   - `/ptsHub`
   - `/frontendHub`
3. **React SPA Routing** - Catches all other routes for client-side routing
4. **Cache Control** - No-cache for HTML, 1-year cache for static assets

### Important Notes

⚠️ **WebSocket Limitation**

- The URL rewrite rules work for HTTP requests only
- WebSocket connections (`ws://`) cannot be proxied through IIS
- SignalR WebSockets must connect directly to port 7009
- This is why we set `REACT_APP_SIGNALR_URL=http://10.0.10.153:7009` in `.env`

✅ **What Works**

- HTTP API calls: `http://10.0.10.153/api/*` → proxied to `http://localhost:7009/api/*`
- SignalR negotiate: `http://10.0.10.153/dashboardHub/negotiate` → proxied to port 7009
- Static files: Served directly from IIS
- React routing: All SPA routes work

❌ **What Doesn't Work**

- WebSocket via IIS: `ws://10.0.10.153/dashboardHub` → 404 error
- Must use: `ws://10.0.10.153:7009/dashboardHub` (direct to Kestrel)

## Updating web.config

### To change the configuration:

1. **Edit source file**:

   ```powershell
   notepad c:\dev\Hyoung.FMS\fms.frontend\public\web.config
   ```

2. **Rebuild**:

   ```powershell
   cd c:\dev\Hyoung.FMS\fms.frontend
   npm run build
   ```

3. **Deploy**:
   ```powershell
   .\scripts\deploy-frontend.ps1 -SkipBackup
   ```

## Verification Checklist

After deployment, verify:

- [ ] File exists: `c:\inetpub\wwwroot\hyoungFMS\reactApp\web.config`
- [ ] API calls work: `http://10.0.10.153/api/Auth/user`
- [ ] SignalR connects: Check browser console for port 7009
- [ ] React routing works: Navigate to different pages
- [ ] Static assets load: Check network tab for CSS/JS

## Troubleshooting

### Build doesn't include web.config

**Cause**: File missing from `public/` folder
**Solution**: Ensure `c:\dev\Hyoung.FMS\fms.frontend\public\web.config` exists

### web.config changes not reflected

**Cause**: Forgot to rebuild after editing
**Solution**: Run `npm run build` after editing `public/web.config`

### SignalR still connects to port 80

**Cause**: Old build deployed, environment variable not in bundle
**Solution**:

1. Verify `.env` has `REACT_APP_SIGNALR_URL=http://10.0.10.153:7009`
2. Run `npm run build` (environment vars are baked in at build time)
3. Deploy new build

### 404 on WebSocket connections

**Cause**: Trying to use WebSocket through IIS
**Solution**: This is expected - WebSocket must use port 7009 directly

- Check browser console shows: `ws://10.0.10.153:7009/dashboardHub`
- If showing `ws://10.0.10.153/dashboardHub`, rebuild and redeploy

## Related Files

- **Source**: `c:\dev\Hyoung.FMS\fms.frontend\public\web.config`
- **Build**: `c:\dev\Hyoung.FMS\fms.frontend\build\web.config`
- **Deployed**: `c:\inetpub\wwwroot\hyoungFMS\reactApp\web.config`
- **Environment**: `c:\dev\Hyoung.FMS\fms.frontend\.env`
- **Deploy Script**: `c:\dev\Hyoung.FMS\scripts\deploy-frontend.ps1`

## Quick Commands

```powershell
# Build only
cd c:\dev\Hyoung.FMS\fms.frontend && npm run build

# Deploy only (use existing build)
.\scripts\deploy-frontend.ps1 -SkipBuild

# Full rebuild and deploy
.\scripts\deploy-frontend.ps1

# Preview deployment
.\scripts\deploy-frontend.ps1 -WhatIf
```
