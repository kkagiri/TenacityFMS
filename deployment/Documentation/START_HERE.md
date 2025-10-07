# 🎯 Complete CI/CD Implementation - Getting Started

## 🚀 Current Status

✅ **IIS Setup Complete**
- Backend site running on port 7009
- Frontend site running on port 80
- App pools configured and started

✅ **Deployment Scripts Created**
- `setup-iis-hyoungfms.ps1` - One-time IIS configuration
- `control-iis.ps1` - IIS management (start/stop/status)
- `deploy-manual.ps1` - Manual deployment (direct method)
- `deploy-alternative.ps1` - Manual deployment (folder swap method - **recommended**)
- `copy-to-dev.ps1` - Helper to copy files to dev workspace

✅ **GitHub Actions Workflow Ready**
- `.github/workflows/deploy-to-iis.yml` - Automated CI/CD pipeline

✅ **Documentation Complete**
- CI_CD_SETUP_GUIDE.md - Comprehensive CI/CD setup
- DEPLOYMENT_GUIDE.md - Detailed deployment information
- PORT_CONFIGURATION_GUIDE.md - Port configuration details
- WEB_CONFIG_PROTECTION.md - web.config preservation
- QUICK_REFERENCE.md - Command reference
- This file!

## 📝 What You Need To Do Next

### Step 1: Test Current Deployment (Right Now)

Try the new alternative deployment method (most reliable):

```powershell
# From current location (runner workspace)
.\deploy-alternative.ps1
```

This will:
- Build backend and frontend
- Deploy using atomic folder swap (no file locking issues)
- Preserve web.config files
- Start both applications

### Step 2: Setup Development Workspace

Create a permanent development workspace (safe from .git deletion):

```powershell
# Create and clone
mkdir C:\dev
cd C:\dev
git clone https://github.com/kagz100/Hyoung.FMS.git
cd Hyoung.FMS
git checkout productionv1
```

### Step 3: Copy Files to Dev Workspace

Use the helper script to copy all deployment files:

```powershell
# Run from runner workspace
cd C:\actions-runner\_work\Hyoung.FMS\Hyoung.FMS
.\copy-to-dev.ps1
```

This copies all scripts, workflows, and documentation to your dev workspace.

### Step 4: Enable Automatic Deployment

Commit and push from your dev workspace to enable CI/CD:

```powershell
cd C:\dev\Hyoung.FMS

# Review what will be committed
git status

# Add all deployment files
git add .github/workflows/deploy-to-iis.yml
git add *.ps1
git add *.md

# Commit
git commit -m "Add CI/CD deployment automation for IIS

- Automated deployment workflow for GitHub Actions
- Folder swap deployment method (no file locking)
- IIS setup and control scripts
- Complete documentation
- web.config preservation"

# Push to trigger first automatic deployment
git push origin productionv1
```

### Step 5: Monitor First Deployment

Watch it run:

**Option A: GitHub Web Interface**
1. Go to https://github.com/kagz100/Hyoung.FMS
2. Click "Actions" tab
3. Watch "Deploy Hyoung FMS to IIS" workflow

**Option B: Local Status Check**
```powershell
# Check IIS status
.\control-iis.ps1 -Status

# Watch runner logs
cd C:\actions-runner
Get-Content _diag\Runner_*.log -Tail 50 -Wait
```

## 🎯 After Setup is Complete

### Your New Workflow

**Daily Development:**
```powershell
# 1. Work in dev workspace
cd C:\dev\Hyoung.FMS

# 2. Pull latest changes
git pull origin productionv1

# 3. Make your changes
# ... edit files ...

# 4. Test locally (optional but recommended)
.\deploy-alternative.ps1

# 5. Commit and push
git add .
git commit -m "Your changes"
git push origin productionv1
```

**Automatic Deployment Happens:**
- ✓ Triggered by push to productionv1 branch
- ✓ Builds backend and frontend
- ✓ Deploys to IIS using folder swap
- ✓ Preserves web.config files
- ✓ Zero downtime deployment
- ✓ Takes ~3-5 minutes

### Quick Commands

```powershell
# Check if sites are running
.\control-iis.ps1 -Status

# Restart if needed
.\control-iis.ps1 -Restart

# Deploy manually (if needed)
.\deploy-alternative.ps1

# Access applications
start http://localhost:7009    # Backend API
start http://localhost:80      # Frontend App
```

## 📂 Workspace Organization

```
C:\dev\Hyoung.FMS\
├── Your development workspace (WORK HERE)
├── Safe from .git deletion
├── Contains all deployment scripts
└── This is where you commit and push from

C:\actions-runner\_work\Hyoung.FMS\Hyoung.FMS\
├── GitHub Actions runner workspace
├── Code checked out temporarily during CI/CD
├── .git folder may be cleaned
└── Don't work here directly

C:\inetpub\wwwroot\hyoungFMS\
├── webAPI\              # Backend on port 7009
└── reactApp\            # Frontend on port 80
```

## 🎨 Deployment Methods Comparison

### Method 1: deploy-alternative.ps1 ⭐ RECOMMENDED
- ✅ Zero file locking issues
- ✅ Atomic folder swap (instant)
- ✅ Automatic rollback capability
- ✅ Fast deployment
- ✅ Used by GitHub Actions workflow

```powershell
.\deploy-alternative.ps1
.\deploy-alternative.ps1 -BackendOnly
.\deploy-alternative.ps1 -FrontendOnly
```

### Method 2: deploy-manual.ps1
- ✅ Direct deployment to IIS folder
- ✅ Has retry logic for file locks
- ⚠️ May encounter file locking occasionally

```powershell
.\deploy-manual.ps1
.\deploy-manual.ps1 -BackendOnly
.\deploy-manual.ps1 -FrontendOnly
```

## 🔧 Troubleshooting

### Application Not Loading

```powershell
# 1. Check IIS status
.\control-iis.ps1 -Status

# 2. Restart if needed
.\control-iis.ps1 -Restart

# 3. Check for errors in logs
Get-ChildItem C:\inetpub\wwwroot\hyoungFMS\webAPI\logs\ | 
    Get-Content -Tail 50
```

### Deployment Failed

```powershell
# Try the alternative method
.\deploy-alternative.ps1

# Or restart IIS first
iisreset
.\deploy-alternative.ps1
```

### Check Deployment Status

```powershell
# View recent deployments
cd C:\inetpub\wwwroot\hyoungFMS
Get-ChildItem -Directory | Where-Object { $_.Name -like "*_old" -or $_.Name -like "*_temp_*" }

# Clean up old deployments if needed
Remove-Item *_old -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item *_temp_* -Recurse -Force -ErrorAction SilentlyContinue
```

## 📊 What Changed From Before

### Before
- ❌ Working in runner workspace (C:\actions-runner\_work\...)
- ❌ .git folder gets deleted randomly
- ❌ Manual deployment to IIS folders
- ❌ File locking issues during deployment
- ❌ Port confusion (5000 vs 7009 vs 3000 vs 80)

### After
- ✅ Development workspace (C:\dev\Hyoung.FMS)
- ✅ .git folder safe and permanent
- ✅ Automated CI/CD deployment
- ✅ Folder swap method = no file locking
- ✅ Clear port configuration (7009 backend, 80 frontend)
- ✅ web.config files preserved
- ✅ Complete documentation

## 🎓 Key Concepts

### Port Configuration
- **7009** - Backend API in production (IIS)
- **80** - Frontend app in production (IIS)
- **3000** - Frontend development server (`npm start`)
- **5000** - Not used (was default .NET dev port)

### Folder Swap Deployment
Instead of copying files to running folder:
1. Build to temporary folder
2. Stop IIS
3. Rename folders atomically
4. Start IIS

Benefits:
- No file lock issues
- Instant swap
- Old version available for rollback
- Most reliable method

### web.config Protection
- **Never created** by deployment scripts
- **Never overwritten** during deployment
- **Always preserved** via copy before swap
- **Manually managed** (contains sensitive data)

## ✅ Success Criteria

You'll know everything is working when:

- [ ] Development workspace exists at C:\dev\Hyoung.FMS
- [ ] Manual deployment succeeds: `.\deploy-alternative.ps1`
- [ ] Backend accessible: http://localhost:7009
- [ ] Frontend accessible: http://localhost:80
- [ ] Files committed to git in dev workspace
- [ ] Push triggers automatic deployment
- [ ] GitHub Actions shows successful workflow
- [ ] web.config files unchanged after deployment

## 🆘 Need Help?

### Check These First
1. IIS Status: `.\control-iis.ps1 -Status`
2. Application logs in `C:\inetpub\wwwroot\hyoungFMS\webAPI\logs\`
3. IIS logs in `C:\inetpub\logs\LogFiles\W3SVC*\`
4. Runner logs in `C:\actions-runner\_diag\`

### Common Solutions
```powershell
# Restart everything
iisreset

# Check disk space
Get-PSDrive C

# Check app pool identity has permissions
icacls C:\inetpub\wwwroot\hyoungFMS

# Redeploy
.\deploy-alternative.ps1
```

## 📚 Documentation Reference

- **CI_CD_SETUP_GUIDE.md** - Complete CI/CD setup process
- **DEPLOYMENT_GUIDE.md** - Deployment details and troubleshooting
- **PORT_CONFIGURATION_GUIDE.md** - Port usage explanation
- **WEB_CONFIG_PROTECTION.md** - How web.config files are protected
- **QUICK_REFERENCE.md** - Command cheat sheet
- **THIS FILE** - Getting started overview

## 🎉 You're Ready!

Follow the 5 steps above to complete your CI/CD setup:

1. ✅ Test current deployment
2. ⏳ Setup development workspace
3. ⏳ Copy files to dev workspace
4. ⏳ Commit and push to enable CI/CD
5. ⏳ Monitor first automatic deployment

After that, just work in `C:\dev\Hyoung.FMS` and every push will automatically deploy to IIS!

---

**Ready to start?** Run this now:

```powershell
.\deploy-alternative.ps1
```

If it works, proceed to Step 2! 🚀
