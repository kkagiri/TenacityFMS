# Build Command Differences - FMS Frontend

## Build Commands Comparison

### **1. `npm run build`** (Your Standard Build) ⭐

**Uses**: `.env` file

**When to use**:

- Production deployments (your current workflow)
- Building for server deployment
- Creating optimized production bundle

**Environment Variables Loaded**:

```bash
# From .env
NODE_ENV=production
REACT_APP_PRIVATE_FMS_API_URL=http://10.0.10.153:7009
REACT_APP_PUBLIC_FMS_API_URL=http://197.254.33.227:7009
REACT_APP_SIGNALR_URL=  # Auto-derive
```

**Behavior**:

- Sets `NODE_ENV=production`
- Enables production optimizations (minification, tree-shaking)
- Uses auto-detection for both intranet and public IP
- Creates optimized build in `build/` folder

---

### **2. `npm run build:prod`** (Explicit Production)

**Uses**: `.env.production` file

**When to use**:

- When you want to explicitly use production environment file
- Same as `npm run build` but more explicit
- Useful when you have different `.env` configurations

**Environment Variables Loaded**:

```bash
# From .env.production
NODE_ENV=production
REACT_APP_PRIVATE_FMS_API_URL=http://10.0.10.153:7009
REACT_APP_PUBLIC_FMS_API_URL=http://197.254.33.227:7009
REACT_APP_SIGNALR_URL=  # Auto-derive
```

**Behavior**:

- Identical to `npm run build`
- Just uses different file name

---

### **3. `npm run build:dev`**

**Uses**: `.env.development` file

**When to use**:

- Creating a build that points to development server
- Testing build process with dev configuration
- Creating test builds

**Environment Variables Loaded**:

```bash
# From .env.development
NODE_ENV=development
REACT_APP_PRIVATE_FMS_API_URL=http://10.0.10.153:7009
REACT_APP_IS_LOCAL_DEV=false  # or true for localhost
```

**Behavior**:

- Points to development or production server (your choice)
- Useful for debugging production builds

---

### **4. `npm start`** (Development Server)

**Uses**: `.env.development` file

**When to use**:

- Local development
- Hot reload and debugging
- Testing features before building

**Behavior**:

- Runs Webpack dev server on port 3000
- Hot module replacement
- Source maps for debugging
- No optimization

---

## Updated Configuration Summary

All three build configurations now use the **same public IP**:

| File               | Intranet           | Public IP             | SignalR     |
| ------------------ | ------------------ | --------------------- | ----------- |
| `.env`             | `10.0.10.153:7009` | `197.254.33.227:7009` | Auto-derive |
| `.env.production`  | `10.0.10.153:7009` | `197.254.33.227:7009` | Auto-derive |
| `.env.development` | `10.0.10.153:7009` | `197.254.33.227:7009` | Auto-derive |

## Network Detection Flow

When the app starts, regardless of which build command was used:

```
1. User loads the app
   ↓
2. apiConfig.js resolves API URL:
   ├─ Try: http://10.0.10.153:7009/api/v1/Health (intranet)
   │  ├─ Success → Use intranet (fast for local users)
   │  └─ Timeout (4s) → Try public IP
   ├─ Try: http://197.254.33.227:7009/api/v1/Health (public)
   │  ├─ Success → Use public IP (external users)
   │  └─ Failure → Use fallback
   └─ Cache result for 5 minutes
```

## Recommendation for Your Workflow

Since you use `npm run build`, the `.env` file is most important.

**Current setup is perfect**:

- ✅ `.env` configured with both intranet and public IP
- ✅ Auto-detection enabled (`REACT_APP_SIGNALR_URL=`)
- ✅ Works for both internal and external users

**Your normal build command**:

```powershell
cd c:\dev\Hyoung.FMS\fms.frontend
npm run build
```

**This will**:

1. Use `.env` file
2. Set `NODE_ENV=production`
3. Enable auto-detection for intranet (10.0.10.153) vs public (197.254.33.227)
4. Create optimized bundle in `build/` folder

## Testing Network Detection

After building, you can test from browser console:

```javascript
// Check what URL was detected
window.__FMS_API_CONFIG__.getConfigStatus();

// Expected output for intranet user:
{
  cachedApiUrl: "http://10.0.10.153:7009/api",
  cachedSignalRUrl: "http://10.0.10.153:7009",
  apiCandidates: {
    intranet: ["http://10.0.10.153:7009"],
    public: ["http://197.254.33.227:7009"]
  }
}

// Expected output for external user:
{
  cachedApiUrl: "http://197.254.33.227:7009/api",
  cachedSignalRUrl: "http://197.254.33.227:7009",
  // ... same candidates but public IP was used
}
```

## Key Difference from Before

**Before** (Old Configuration):

```bash
# Hardcoded to one IP, no auto-detection
REACT_APP_SIGNALR_URL=http://197.254.33.227:7009
```

- ❌ External users worked
- ❌ Internal users forced through public IP (slower)

**Now** (New Configuration):

```bash
# Auto-detection enabled
REACT_APP_SIGNALR_URL=
REACT_APP_PRIVATE_FMS_API_URL=http://10.0.10.153:7009
REACT_APP_PUBLIC_FMS_API_URL=http://197.254.33.227:7009
```

- ✅ Internal users use intranet (fast)
- ✅ External users use public IP
- ✅ Automatic fallback

---

Last Updated: 2025-10-30
