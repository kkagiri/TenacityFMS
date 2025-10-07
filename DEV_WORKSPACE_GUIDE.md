# Development Workspace Setup Guide

## 🎯 Overview
This guide helps you set up a proper development workspace outside the GitHub Actions runner directory, preventing `.git` folder deletion issues.

## 📁 Directory Structure

### Production/Deployment (Don't develop here!)
```
c:\actions-runner\_work\Hyoung.FMS\Hyoung.FMS\
```
- Used by GitHub Actions runner
- Gets cleaned automatically
- `.git` folder may be deleted

### Development Workspace (Develop here!)
```
C:\dev\Hyoung.FMS\
```
- Your main development area
- Safe from runner cleanup
- Full git history preserved

---

## 🚀 Quick Start

### 1. Run Setup Script
Already completed! Your dev workspace is at: `C:\dev\Hyoung.FMS`

### 2. Open in VS Code
```powershell
code C:\dev\Hyoung.FMS
```

Or open the workspace file:
```powershell
code C:\dev\Hyoung.FMS\Hyoung.FMS.code-workspace
```

---

## 📝 Daily Workflow

### Making Changes

1. **Work in Dev Workspace**
   ```powershell
   cd C:\dev\Hyoung.FMS
   code .
   ```

2. **Make Your Changes**
   - Edit files normally
   - Test locally
   - No fear of `.git` deletion!

3. **Quick Commit & Push**
   ```powershell
   cd C:\dev\Hyoung.FMS
   .\quick-commit.ps1 "Your commit message here"
   ```
   
   Or manually:
   ```powershell
   git add .
   git commit -m "Your message"
   git push origin productionv1
   ```

4. **Deploy**
   
   **Option A: Automatic (Recommended)**
   - Push to GitHub → Actions runner deploys automatically
   
   **Option B: Manual/Immediate**
   ```powershell
   cd C:\dev\Hyoung.FMS
   .\sync-to-deployment.ps1
   ```

---

## 🛠️ Helper Scripts

### quick-commit.ps1
Quick commit and push to GitHub
```powershell
.\quick-commit.ps1 "Fixed tank delivery form validation"
```

### sync-to-deployment.ps1
Immediately sync changes to deployment server (bypasses CI/CD)
```powershell
.\sync-to-deployment.ps1
```
⚠️ **Warning**: This directly modifies production. Use for emergencies only!

### start-frontend-dev.ps1
Start frontend development server
```powershell
.\start-frontend-dev.ps1
```
Opens at: http://localhost:3000

---

## 🔄 Typical Development Scenarios

### Scenario 1: Normal Feature Development
```powershell
# 1. Work in dev workspace
cd C:\dev\Hyoung.FMS\fms.frontend\src
code .

# 2. Make changes, test locally
npm start  # Test at http://localhost:3000

# 3. Commit and push
cd C:\dev\Hyoung.FMS
.\quick-commit.ps1 "Added new tank transfer feature"

# 4. Let GitHub Actions deploy automatically
```

### Scenario 2: Emergency Hotfix
```powershell
# 1. Make quick fix in dev workspace
cd C:\dev\Hyoung.FMS
code .

# 2. Test the fix
npm start

# 3. Commit
.\quick-commit.ps1 "HOTFIX: Fixed critical tank calculation bug"

# 4. Deploy immediately
.\sync-to-deployment.ps1

# 5. Restart services if needed
```

### Scenario 3: Pull Latest Changes
```powershell
cd C:\dev\Hyoung.FMS
git pull origin productionv1
```

---

## 📦 Environment Setup

### Frontend (React)
```powershell
cd C:\dev\Hyoung.FMS\fms.frontend
npm install
npm start  # Dev server at http://localhost:3000
```

### Mobile (React Native)
```powershell
cd C:\dev\Hyoung.FMS\fms.mobile
npm install
npm run android  # Or npm run ios
```

### Backend (.NET)
```powershell
cd C:\dev\Hyoung.FMS
dotnet restore
dotnet build
```

---

## 🔍 Troubleshooting

### "Git folder deleted" in runner directory
✅ **This is normal!** Don't develop there. Use `C:\dev\Hyoung.FMS` instead.

### Need to restore git in runner directory
```powershell
cd c:\actions-runner\_work\Hyoung.FMS\Hyoung.FMS
.\restore-git.ps1
```

### Changes not appearing in deployment
1. Check if you committed and pushed:
   ```powershell
   git status
   ```
2. Check GitHub Actions status
3. Or sync manually:
   ```powershell
   .\sync-to-deployment.ps1
   ```

### Merge conflicts
```powershell
cd C:\dev\Hyoung.FMS
git status
git pull origin productionv1
# Resolve conflicts in VS Code
git add .
git commit -m "Resolved merge conflicts"
git push origin productionv1
```

---

## ⚡ Pro Tips

1. **Always work in `C:\dev\Hyoung.FMS`**
   - Never make changes directly in `c:\actions-runner\_work\...`

2. **Commit frequently**
   - Small, focused commits are better
   - Use descriptive commit messages

3. **Test locally before pushing**
   ```powershell
   cd C:\dev\Hyoung.FMS\fms.frontend
   npm start
   ```

4. **Use branches for big features**
   ```powershell
   git checkout -b feature/new-dashboard
   # Make changes
   git push origin feature/new-dashboard
   # Create PR on GitHub
   ```

5. **Keep your dev workspace updated**
   ```powershell
   git pull origin productionv1
   ```

---

## 🔐 Best Practices

### ✅ DO
- Develop in `C:\dev\Hyoung.FMS`
- Commit and push regularly
- Test before deploying
- Use descriptive commit messages
- Create branches for features

### ❌ DON'T
- Don't develop in `c:\actions-runner\_work\...`
- Don't commit directly to production without testing
- Don't use `sync-to-deployment.ps1` for regular changes
- Don't force push to productionv1
- Don't ignore merge conflicts

---

## 📞 Quick Reference

| Task | Command |
|------|---------|
| Open dev workspace | `code C:\dev\Hyoung.FMS` |
| Quick commit | `.\quick-commit.ps1 "message"` |
| Emergency deploy | `.\sync-to-deployment.ps1` |
| Start frontend | `.\start-frontend-dev.ps1` |
| Pull latest | `git pull origin productionv1` |
| Check status | `git status` |
| View changes | `git diff` |

---

## 🎓 Understanding the Setup

### Why Two Locations?

1. **Runner Directory** (`c:\actions-runner\_work\...`)
   - GitHub Actions workspace
   - Cleaned automatically
   - For CI/CD automation only
   - ❌ Not for development

2. **Dev Directory** (`C:\dev\Hyoung.FMS`)
   - Your development workspace
   - Never cleaned
   - Full git history
   - ✅ Perfect for development

### The Workflow

```
[You Make Changes]
       ↓
[C:\dev\Hyoung.FMS]
       ↓
[Commit & Push to GitHub]
       ↓
[GitHub Repository]
       ↓
[GitHub Actions Runner]
       ↓
[Deploys to c:\actions-runner\_work\...]
       ↓
[Production Running]
```

---

## 🆘 Need Help?

If you encounter issues:
1. Check this guide
2. Check git status: `git status`
3. Check deployment logs in GitHub Actions
4. Check runner logs: `c:\actions-runner\_diag\`

Happy coding! 🚀
