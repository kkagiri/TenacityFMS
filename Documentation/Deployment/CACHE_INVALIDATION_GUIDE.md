# Browser Cache Invalidation Guide

## Problem

When you deploy a new version of the frontend with API changes (like the v1 URL update), users' browsers may still have the **old JavaScript cached**, causing errors like:

```
405 - HTTP verb used to access this page is not allowed
```

This happens because:
1. Browser cached old JS: `POST /api/user/login` ❌
2. New backend expects: `POST /api/v1/User/Login` ✅
3. Until user refreshes, they get 405 errors

---

## Solutions

### 1. **Immediate Fix for Current Users (Manual)**

Ask users to do a **hard refresh** to clear cache:

**Windows/Linux:**
- Chrome/Edge: `Ctrl + Shift + R` or `Ctrl + F5`
- Firefox: `Ctrl + Shift + R`

**Mac:**
- Chrome/Safari: `Cmd + Shift + R`

**OR Clear Browser Cache Manually:**
1. Open browser settings
2. Go to "Privacy and Security"
3. Click "Clear browsing data"
4. Select "Cached images and files"
5. Clear data

---

### 2. **Automatic Cache Busting (Production Deployment)**

React automatically adds hash to filenames during build:
```
main.abc123.js  ← Hash changes with each build
main.def456.js  ← New hash = forces browser to download new file
```

**To ensure this works:**

#### Step 1: Build with Production Config
```bash
cd fms.frontend
npm run build:prod
```

#### Step 2: Verify Build Output
Check that files have hashes:
```
build/static/js/
├── main.abc123.js    ← Should have hash
├── runtime.def456.js
└── 2.ghi789.chunk.js
```

#### Step 3: Deploy to Production
```bash
# Copy entire build folder to production server
# Example:
xcopy /E /I /Y build\\* \\\\10.0.10.153\\inetpub\\wwwroot\\fms\\
```

---

### 3. **App Version Meta Tag (Implemented)**

We've added a version meta tag to `index.html`:

```html
<meta name="app-version" content="2.0.1-v1-api" />
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
```

**Update this version number before each deployment:**

```html
<!-- Before deployment, change the version: -->
<meta name="app-version" content="2.0.2-bug-fixes" />
```

---

### 4. **Service Worker Clear (If Applicable)**

If using service workers, clear them:

```javascript
// In browser console:
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
  }
});
```

---

## Prevention Strategies

### 1. **Update Version Number Before Deploy**

**File:** `fms.frontend/public/index.html`

```html
<!-- Increment this before EVERY deployment -->
<meta name="app-version" content="2.0.X" />
```

**Naming convention:**
- Major API change: `2.0.0 → 3.0.0`
- New features: `2.0.0 → 2.1.0`
- Bug fixes: `2.0.1 → 2.0.2`

### 2. **Add Version Display in UI**

Add version to footer or about page:

```javascript
// In your React component:
const appVersion = document.querySelector('meta[name="app-version"]')?.content || 'Unknown';

<footer>
  <span>FMS v{appVersion}</span>
</footer>
```

### 3. **Backend API Versioning Check**

Frontend can check if it's compatible with backend:

```javascript
// Check API version compatibility
const checkApiVersion = async () => {
  const response = await fetch('/api/version');
  const { version } = await response.json();

  if (version !== EXPECTED_API_VERSION) {
    alert('Please refresh the page to get the latest version');
    window.location.reload(true);
  }
};
```

---

## Deployment Checklist

- [ ] **Update version** in `index.html`
- [ ] **Build production**: `npm run build:prod`
- [ ] **Verify hashes**: Check `build/static/js/` files have hashes
- [ ] **Deploy to server**: Copy entire build folder
- [ ] **Test in incognito**: Open production URL in incognito mode
- [ ] **Verify no 405 errors**: Check browser console
- [ ] **Clear CDN cache** (if using CDN)
- [ ] **Notify users**: If critical, ask users to refresh

---

## Troubleshooting

### Issue: Users still see old version after deployment

**Check:**
1. Did you update the version number in `index.html`?
2. Did you run `npm run build:prod` (not `build:dev`)?
3. Did you copy ALL files from `build/` folder?
4. Is server caching enabled? (check IIS/Apache config)
5. Is CDN caching the old files?

**Solution:**
```bash
# Rebuild with explicit cache bust
rm -rf build
npm run build:prod

# Verify build
ls -la build/static/js/main.*.js
```

### Issue: 405 error immediately after deploy

**This means:**
- User's browser cached the OLD JS code
- Need to do hard refresh: `Ctrl + Shift + R`

### Issue: Login works after refresh but not on first load

**This is the browser cache issue!**
- First load: Cached old JS with wrong URLs
- After refresh: New JS with correct URLs

**Prevention:**
- Always update version number before deploy
- Test in incognito mode
- Consider service worker updates

---

## Testing Cache Invalidation

### Test 1: Incognito Mode
```
1. Open production URL in incognito
2. Should load latest version (no cache)
3. Login should work immediately
```

### Test 2: Normal Browser (Cached)
```
1. Visit site normally (cached version)
2. Hard refresh: Ctrl + Shift + R
3. Login should work after refresh
```

### Test 3: Version Check
```
1. Open browser console
2. Type: document.querySelector('meta[name="app-version"]').content
3. Should show latest version number
```

---

## IIS Cache Configuration (Backend)

If hosting on IIS, add to `web.config`:

```xml
<system.webServer>
  <staticContent>
    <!-- HTML files - no cache -->
    <clientCache cacheControlMode="DisableCache" />
  </staticContent>

  <httpProtocol>
    <customHeaders>
      <!-- Force no cache for API responses -->
      <add name="Cache-Control" value="no-cache, no-store, must-revalidate" />
      <add name="Pragma" value="no-cache" />
      <add name="Expires" value="0" />
    </customHeaders>
  </httpProtocol>
</system.webServer>
```

---

## Apache Cache Configuration (Backend)

If hosting on Apache, add to `.htaccess`:

```apache
# Disable caching for HTML
<FilesMatch "\.(html)$">
  Header set Cache-Control "no-cache, no-store, must-revalidate"
  Header set Pragma "no-cache"
  Header set Expires 0
</FilesMatch>

# Enable caching for JS/CSS (they have hashes)
<FilesMatch "\.(js|css)$">
  Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>
```

---

## Summary

**Problem:** Browser caches old JavaScript
**Symptoms:** 405 errors until page refresh
**Solution:**
1. ✅ Update version number before deploy
2. ✅ Build with production config
3. ✅ Users do hard refresh once
4. ✅ Future deployments will auto-update

**Prevention:**
- Always increment version number
- Test in incognito mode
- Add version check in app
- Consider service worker updates

---

## Related Files
- `fms.frontend/public/index.html` - Version meta tag
- `fms.frontend/package.json` - Build scripts
- `Documentation/Deployment/` - Deployment guides

---

## Version History
- **2025-10-13**: Added cache control meta tags
- **2025-10-13**: Implemented version number system
- **2025-10-13**: Created deployment checklist
