# 🚀 Tenacy FMS - Quick Reference Card

## 📍 Locations
```
Development:  C:\dev\Tenacy.FMS           ← Work here!
Backend IIS:  C:\inetpub\wwwroot\tenacyFMS\webAPI
Frontend IIS: C:\inetpub\wwwroot\tenacyFMS\reactApp
```

## 🌐 URLs
```
Backend:  http://localhost:5000
Frontend: http://localhost:3000
```

## ⚡ Essential Commands

### First Time Setup (Administrator)
```powershell
.\setup-iis-tenacyfms.ps1
```

### Daily Work
```powershell
code C:\dev\Tenacy.FMS        # Open workspace
git add . && git commit -m "msg" && git push    # Deploy
```

### IIS Control
```powershell
.\control-iis.ps1 -Status     # Check status
.\control-iis.ps1 -Restart    # Restart
.\control-iis.ps1 -Stop       # Stop
.\control-iis.ps1 -Start      # Start
```

### Manual Deploy
```powershell
.\deploy-manual.ps1                    # Deploy all
.\deploy-manual.ps1 -BackendOnly       # Backend only
.\deploy-manual.ps1 -FrontendOnly      # Frontend only
.\deploy-manual.ps1 -SkipBuild         # Skip rebuild
```

### View Logs
```powershell
Get-Content "C:\inetpub\wwwroot\tenacyFMS\webAPI\logs\stdout*.log" -Tail 50
```

## 🔧 Troubleshooting

### Site Won't Start
```powershell
.\control-iis.ps1 -Restart
```

### Files Won't Deploy
```powershell
.\control-iis.ps1 -Stop
Start-Sleep -Seconds 5
.\deploy-manual.ps1
```

### Check Backend Errors
```powershell
Get-Content "C:\inetpub\wwwroot\tenacyFMS\webAPI\logs\stdout*.log" -Tail 100
```

### Full Reset
```powershell
iisreset
.\deploy-manual.ps1
```

## ✅ Development Workflow

1. **Work in dev**: `cd C:\dev\Tenacy.FMS`
2. **Make changes**: Edit in VS Code
3. **Commit & push**: Auto-deploys via CI/CD
4. **Monitor**: https://github.com/kagz100/Tenacy.FMS/actions

## 🎯 Remember

- ✅ Always work in `C:\dev\Tenacy.FMS`
- ❌ Never edit `C:\inetpub\wwwroot` directly
- ✅ Push to GitHub = Auto deploy
- ✅ Manual deploy for emergencies only
- ✅ web.config is preserved automatically

## 📚 Full Guide
See `DEPLOYMENT_GUIDE.md` for complete documentation
