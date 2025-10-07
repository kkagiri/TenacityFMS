# ⚠️ IMPORTANT: web.config File Handling

## 🔒 **Current Policy: DO NOT TOUCH EXISTING web.config Files**

All deployment scripts have been configured to **PRESERVE** your existing web.config files.

---

## 📁 **web.config Locations**

### Backend web.config
```
C:\inetpub\wwwroot\hyoungFMS\webAPI\web.config
```

### Frontend web.config
```
C:\inetpub\wwwroot\hyoungFMS\reactApp\web.config
```

---

## 🛡️ **Protection Mechanisms**

### 1. Setup Script (setup-iis-hyoungfms.ps1)

**Behavior:**
- ✅ **Checks** if web.config exists
- ✅ **Reports** status (exists or missing)
- ❌ **Never creates** new web.config files
- ❌ **Never modifies** existing web.config files

**Output:**
```
Checking web.config files...
Backend web.config EXISTS - keeping existing file (NOT modified)
Frontend web.config EXISTS - keeping existing file (NOT modified)
```

### 2. Manual Deployment Script (deploy-manual.ps1)

**Behavior:**
1. ✅ **Backs up** existing web.config before deployment
2. ✅ Deploys your application
3. ✅ **Removes** any auto-generated web.config from build
4. ✅ **Restores** your original web.config from backup
5. ✅ If deployment fails, restores backup

**Process Flow:**
```
web.config → web.config.backup (backup)
     ↓
  Deploy files
     ↓
  Remove auto-generated web.config
     ↓
web.config.backup → web.config (restore)
```

### 3. CI/CD Workflow (deploy-to-iis.yml)

**Behavior:**
- Same as manual deployment
- Backs up before deployment
- Restores after deployment
- Never overwrites your configuration

---

## 📝 **Your Existing web.config Files**

The scripts assume you already have properly configured web.config files in:

1. **Backend**: Contains ASP.NET Core module configuration
2. **Frontend**: Contains URL rewrite rules for React Router

---

## ✅ **Verified Protection Points**

### In setup-iis-hyoungfms.ps1:
```powershell
# Lines 104-117
# Only CHECKS existence, never creates or modifies
if (Test-Path $backendWebConfigPath) {
    Write-Host "Backend web.config EXISTS - keeping existing file (NOT modified)"
}
```

### In deploy-manual.ps1:
```powershell
# Backend web.config protection (Lines 38-46)
$webConfig = Join-Path $backendPath "web.config"
$backup = Join-Path $backendPath "web.config.backup"
if (Test-Path $webConfig) {
    Copy-Item $webConfig $backup -Force  # Backup
}
# ... deployment ...
if (Test-Path $backup) {
    Remove-Item $webConfig -Force        # Remove auto-gen
    Move-Item $backup $webConfig -Force   # Restore original
}

# Frontend web.config protection (Lines 112-120)
# Same logic for frontend
```

### In .github/workflows/deploy-to-iis.yml:
```yaml
# Lines 57-68 (Backend)
- name: 💾 Backup Backend web.config
- name: 🔄 Restore Backend web.config

# Lines 130-141 (Frontend)
- name: 💾 Backup Frontend web.config
- name: 🔄 Restore Frontend web.config
```

---

## 🔍 **How to Verify Protection**

### Before Running Setup:
```powershell
# Check your existing web.config files
Test-Path "C:\inetpub\wwwroot\hyoungFMS\webAPI\web.config"
Test-Path "C:\inetpub\wwwroot\hyoungFMS\reactApp\web.config"

# View content (to compare later)
Get-Content "C:\inetpub\wwwroot\hyoungFMS\webAPI\web.config"
```

### After Running Setup:
```powershell
# Files should be identical
Get-FileHash "C:\inetpub\wwwroot\hyoungFMS\webAPI\web.config"
# Hash should match original
```

### During Deployment:
```powershell
# Check for backup files (temporary during deployment)
Get-ChildItem "C:\inetpub\wwwroot\hyoungFMS\webAPI" -Filter "*.backup"
# Should see web.config.backup during deployment
```

---

## 📋 **Deployment Process with web.config**

### Step-by-Step:

1. **Start Deployment**
   ```
   .\deploy-manual.ps1
   ```

2. **Backup Phase**
   ```
   web.config → web.config.backup
   ```

3. **Build & Deploy Phase**
   ```
   - Stop IIS
   - Clear old files (except .backup)
   - Build application
   - Publish to IIS folder
   - Auto-generated web.config may appear
   ```

4. **Restore Phase**
   ```
   - Remove any auto-generated web.config
   - web.config.backup → web.config
   - Delete backup file
   ```

5. **IIS Restart**
   ```
   - Start IIS with YOUR web.config
   ```

---

## 🚨 **What If web.config Gets Modified?**

### If Accidentally Modified:

1. **Stop immediately**
   ```powershell
   .\control-iis.ps1 -Stop
   ```

2. **Check for backup**
   ```powershell
   Get-ChildItem "C:\inetpub\wwwroot\hyoungFMS\webAPI" -Filter "*.backup"
   ```

3. **Restore from backup** (if exists)
   ```powershell
   Copy-Item "C:\inetpub\wwwroot\hyoungFMS\webAPI\web.config.backup" `
             "C:\inetpub\wwwroot\hyoungFMS\webAPI\web.config" -Force
   ```

4. **Or restore from git** (recommended)
   ```powershell
   # If you have it in source control
   git checkout -- path/to/web.config
   ```

---

## 💡 **Best Practices**

### 1. Keep web.config in Source Control
```powershell
# Add to git (if not already)
cd C:\dev\Hyoung.FMS
git add FMS.WebClient/web.config
git add fms.frontend/public/web.config
git commit -m "Add web.config files"
```

### 2. Document Your Configuration
Create a `web.config.notes.md` file documenting:
- Custom settings
- Connection strings
- Environment-specific values
- Why certain settings exist

### 3. Test Deployments in Non-Production First
```powershell
# Deploy to dev/test environment first
.\deploy-manual.ps1 -BackendOnly
# Verify web.config is preserved
# Then deploy to production
```

### 4. Regular Backups
```powershell
# Manual backup before major changes
Copy-Item "C:\inetpub\wwwroot\hyoungFMS\webAPI\web.config" `
          "C:\backups\web.config.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
```

---

## 📞 **Quick Verification Commands**

```powershell
# Check if web.config exists
Test-Path "C:\inetpub\wwwroot\hyoungFMS\webAPI\web.config"
Test-Path "C:\inetpub\wwwroot\hyoungFMS\reactApp\web.config"

# View last modification time
Get-Item "C:\inetpub\wwwroot\hyoungFMS\webAPI\web.config" | Select-Object LastWriteTime

# Compare with backup (during deployment)
$original = Get-Content "C:\inetpub\wwwroot\hyoungFMS\webAPI\web.config"
$backup = Get-Content "C:\inetpub\wwwroot\hyoungFMS\webAPI\web.config.backup"
Compare-Object $original $backup

# Calculate hash (to detect changes)
Get-FileHash "C:\inetpub\wwwroot\hyoungFMS\webAPI\web.config" -Algorithm SHA256
```

---

## ✅ **Summary**

| Script | web.config Behavior |
|--------|-------------------|
| **setup-iis-hyoungfms.ps1** | ✅ Checks only, never creates/modifies |
| **deploy-manual.ps1** | ✅ Backs up, then restores original |
| **deploy-to-iis.yml** | ✅ Backs up, then restores original |
| **control-iis.ps1** | ✅ Doesn't touch web.config at all |

---

## 🎯 **Your web.config Files Are Safe!**

All scripts have been designed to:
- ✅ **Preserve** your existing configuration
- ✅ **Backup** before any changes
- ✅ **Restore** after deployment
- ✅ **Report** status clearly
- ❌ **Never overwrite** without backup
- ❌ **Never create** new files

**You can run any script safely - your web.config files will NOT be touched!** 🛡️
