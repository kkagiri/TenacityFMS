# ✅ CI/CD Implementation Checklist

## 📦 Phase 1: Setup Complete ✓

### IIS Configuration ✓
- [x] Backend site created (HyoungFMS.WebAPI)
- [x] Frontend site created (HyoungFMS.ReactApp)
- [x] Backend running on port 7009
- [x] Frontend running on port 80
- [x] App pools configured with No Managed Code
- [x] Permissions set for IIS_IUSRS

### Scripts Created ✓
- [x] `setup-iis-hyoungfms.ps1` - One-time IIS configuration
- [x] `control-iis.ps1` - IIS management tool
- [x] `deploy-manual.ps1` - Direct deployment method
- [x] `deploy-alternative.ps1` - Folder swap deployment (recommended)
- [x] `copy-to-dev.ps1` - Helper to copy files to dev workspace

### Documentation Created ✓
- [x] `START_HERE.md` - Getting started guide
- [x] `CI_CD_SETUP_GUIDE.md` - Complete CI/CD setup process
- [x] `DEPLOYMENT_GUIDE.md` - Detailed deployment information
- [x] `PORT_CONFIGURATION_GUIDE.md` - Port configuration explained
- [x] `WEB_CONFIG_PROTECTION.md` - web.config preservation details
- [x] `QUICK_REFERENCE.md` - Command reference
- [x] `CHECKLIST.md` - This file

### GitHub Actions Workflow ✓
- [x] `.github/workflows/deploy-to-iis.yml` - CI/CD automation
- [x] Folder swap deployment method implemented
- [x] web.config preservation included
- [x] Triggers on push to productionv1/main/master
- [x] Manual trigger available (workflow_dispatch)

## 🎯 Phase 2: Initial Testing (Your Next Steps)

### Test 1: Manual Deployment
- [ ] Run `.\deploy-alternative.ps1` from runner workspace
- [ ] Verify backend builds successfully
- [ ] Verify frontend builds successfully
- [ ] Check both sites start correctly
- [ ] Test backend: http://localhost:7009
- [ ] Test frontend: http://localhost:80
- [ ] Verify web.config files preserved

### Test 2: IIS Control
- [ ] Run `.\control-iis.ps1 -Status`
- [ ] Run `.\control-iis.ps1 -Stop`
- [ ] Run `.\control-iis.ps1 -Start`
- [ ] Run `.\control-iis.ps1 -Restart`
- [ ] Verify all commands work as expected

## 🚀 Phase 3: Development Workspace Setup

### Create Dev Workspace
- [ ] Create directory: `mkdir C:\dev`
- [ ] Clone repository: `git clone https://github.com/kagz100/Hyoung.FMS.git`
- [ ] Navigate to repo: `cd C:\dev\Hyoung.FMS`
- [ ] Checkout branch: `git checkout productionv1`
- [ ] Verify .git folder exists

### Copy Files to Dev Workspace
- [ ] Run `.\copy-to-dev.ps1` from runner workspace
- [ ] Verify all scripts copied
- [ ] Verify all documentation copied
- [ ] Verify workflow file copied
- [ ] Check git status shows new files

## 📝 Phase 4: Enable CI/CD

### Test in Dev Workspace
- [ ] Navigate to: `cd C:\dev\Hyoung.FMS`
- [ ] Test deployment: `.\deploy-alternative.ps1`
- [ ] Verify deployment succeeds
- [ ] Confirm applications work

### Commit and Push
- [ ] Review changes: `git status`
- [ ] Stage files: `git add .github/workflows/deploy-to-iis.yml *.ps1 *.md`
- [ ] Commit: `git commit -m "Add CI/CD deployment automation"`
- [ ] Push: `git push origin productionv1`

### Monitor First Deployment
- [ ] Open GitHub repository in browser
- [ ] Navigate to Actions tab
- [ ] Watch "Deploy Hyoung FMS to IIS" workflow
- [ ] Verify workflow completes successfully
- [ ] Check IIS status after deployment
- [ ] Test both applications

## ✨ Phase 5: Verification

### Application Access
- [ ] Backend responds: http://localhost:7009
- [ ] Frontend loads: http://localhost:80
- [ ] Backend API returns data correctly
- [ ] Frontend connects to backend
- [ ] No console errors in frontend

### Configuration Check
- [ ] web.config exists in backend deployment
- [ ] web.config exists in frontend deployment
- [ ] web.config files contain correct settings
- [ ] Connection strings preserved
- [ ] App pools are Started

### Workspace Validation
- [ ] Dev workspace has all files
- [ ] .git folder intact in dev workspace
- [ ] Can push from dev workspace
- [ ] Push triggers deployment automatically
- [ ] Runner workspace is temporary only

## 🔄 Phase 6: Regular Workflow Test

### Make a Test Change
- [ ] Edit a file in dev workspace
- [ ] Commit the change
- [ ] Push to productionv1
- [ ] Verify automatic deployment triggers
- [ ] Check deployment succeeds
- [ ] Verify change appears in application

### Performance Check
- [ ] Deployment completes in < 5 minutes
- [ ] No file locking errors
- [ ] Both sites restart successfully
- [ ] Minimal downtime observed

## 📊 Success Metrics

### All Green When:
- ✓ IIS sites running on correct ports
- ✓ Manual deployment works reliably
- ✓ Automatic deployment triggers on push
- ✓ web.config files never overwritten
- ✓ No file locking issues during deployment
- ✓ Applications accessible after deployment
- ✓ Dev workspace .git folder safe
- ✓ Complete documentation available

## 🎯 Current Status

Update this section as you progress:

```
Phase 1: Setup Complete         ✅ DONE
Phase 2: Initial Testing        ⏳ IN PROGRESS
Phase 3: Dev Workspace Setup    ⏸️ PENDING
Phase 4: Enable CI/CD           ⏸️ PENDING
Phase 5: Verification           ⏸️ PENDING
Phase 6: Regular Workflow       ⏸️ PENDING
```

## 📞 Quick Commands Reference

### Check Status
```powershell
.\control-iis.ps1 -Status
```

### Deploy Manually
```powershell
.\deploy-alternative.ps1
```

### Copy to Dev Workspace
```powershell
.\copy-to-dev.ps1
```

### Enable CI/CD
```powershell
cd C:\dev\Hyoung.FMS
git add .
git commit -m "Enable CI/CD"
git push origin productionv1
```

### View Applications
```powershell
start http://localhost:7009  # Backend
start http://localhost:80    # Frontend
```

## 🆘 Troubleshooting

If something doesn't work:

1. **Check IIS Status**: `.\control-iis.ps1 -Status`
2. **Restart IIS**: `.\control-iis.ps1 -Restart`
3. **Try Alternative Deployment**: `.\deploy-alternative.ps1`
4. **Check Logs**: View application logs in deployment folders
5. **Reset IIS**: `iisreset` (as Administrator)

## 📚 Documentation

For detailed information, see:

- **START_HERE.md** - Overview and quick start
- **CI_CD_SETUP_GUIDE.md** - Complete setup process
- **DEPLOYMENT_GUIDE.md** - Deployment details
- **PORT_CONFIGURATION_GUIDE.md** - Port explanations
- **WEB_CONFIG_PROTECTION.md** - Configuration protection
- **QUICK_REFERENCE.md** - Command reference

## 🎉 Next Action

**Your immediate next step:**

```powershell
.\deploy-alternative.ps1
```

Then check off items in Phase 2 of this checklist! ✓

---

*Last Updated: October 7, 2025*
*Implementation Status: Phase 1 Complete, Phase 2 Ready*
