# Understanding GitHub Actions Workspace vs Dev Workspace

## **Two Different Directories - Two Different Purposes**

### **1. C:\dev\Tenacity.FMS** (Your Development Workspace)
**Purpose:** Where YOU work and develop code

```
C:\dev\Tenacity.FMS
+-- This is YOUR personal development workspace
+-- You edit code here
+-- You test here
+-- You commit changes from here
+-- You push to GitHub from here
```

**What you do here:**
- Edit code in VS Code
- Run local tests
- Commit changes: `git commit`
- Push to GitHub: `git push origin productionv1`

---

### **2. C:\actions-runner\_work\Tenacity.FMS\Tenacity.FMS** (GitHub Actions Workspace)
**Purpose:** Where GITHUB ACTIONS temporarily clones your repo to build and deploy

```
C:\actions-runner\_work\Tenacity.FMS\Tenacity.FMS
+-- GitHub Actions creates this automatically
+-- It's a CLEAN COPY of your repo from GitHub
+-- GitHub Actions builds your app here
+-- Then deploys from here to IIS
+-- Gets cleaned up between runs
```

**What GitHub Actions does here:**
1. `actions/checkout@v4` - Clones your repo from GitHub into this folder
2. Builds backend: `dotnet publish` 
3. Builds frontend: `npm ci && npm run build`
4. Runs deployment script: `deploy-alternative.ps1`
5. Deploys to IIS

---

## **The Workflow Process**

```mermaid
+-------------------------------------------------------------+
¦                    YOUR WORKFLOW                             ¦
+-------------------------------------------------------------+

1. YOU DEVELOP CODE
   ?? C:\dev\Tenacity.FMS
   +-- Edit files in VS Code
   +-- Test locally
   +-- Ready to deploy? ?

2. YOU COMMIT & PUSH
   ?? git add .
   ?? git commit -m "Your changes"
   ?? git push origin productionv1
   +-- Pushes to GitHub ? Triggers workflow ?

3. GITHUB ACTIONS RUNS (Automatic)
   ?? On runner machine (HY-FMS)
   +-- Clones repo to: C:\actions-runner\_work\Tenacity.FMS\Tenacity.FMS
   +-- Builds backend
   +-- Builds frontend
   +-- Runs deployment script
   +-- Deploys to IIS ?

4. YOUR APP RUNS
   ?? IIS Serves your app
   +-- Backend: C:\inetpub\wwwroot\tenacyFMS\webAPI
   +-- Frontend: C:\inetpub\wwwroot\tenacyFMS\reactApp
   +-- Users access: http://localhost:80
```

---

## **Why Two Separate Directories?**

### **Isolation & Cleanliness**
- **Dev workspace** can have uncommitted changes, experiments, temp files
- **Actions workspace** is always a CLEAN copy from GitHub
- This ensures you deploy exactly what's in GitHub, not your local experiments

### **Consistency**
- GitHub Actions always starts with a fresh clone
- No leftover files from previous runs
- No "works on my machine" problems

### **Security**
- Dev workspace: Your personal files
- Actions workspace: Only code from GitHub repo
- Actions can't access your personal dev files

---

## **What's the Purpose of GitHub Actions at This Point?**

Great question! Here's what GitHub Actions provides:

### **Without GitHub Actions (Manual Deployment):**
```powershell
# You have to manually:
1. Open PowerShell on server
2. cd C:\dev\Tenacity.FMS
3. git pull origin productionv1
4. Run .\scripts\deploy-alternative.ps1
5. Hope nothing goes wrong
6. Debug if it fails
```

### **With GitHub Actions (Automated Deployment):**
```
You: git push origin productionv1
GitHub Actions: (automatically)
  ? Clones fresh code
  ? Builds backend
  ? Builds frontend  
  ? Deploys to IIS
  ? Reports success/failure
  ? Logs everything
```

---

## **Benefits of Using GitHub Actions**

### **1. Automation** ??
- Push code ? Automatic deployment
- No manual steps required
- Consistent every time

### **2. Clean Builds** ??
- Always builds from fresh clone
- No leftover files
- Reproducible builds

### **3. Audit Trail** ??
- Every deployment is logged
- See what was deployed when
- Track who made changes

### **4. Consistency** ?
- Same build process every time
- No "forgot a step" errors
- Works the same for all team members

### **5. Rollback** ??
- Easy to re-run previous successful deployment
- Just re-run an old workflow

### **6. CI/CD Best Practices** ??
- Industry standard approach
- Separates dev from deployment
- Professional workflow

---

## **Your Current Setup**

```
+-------------------------------------------------------------+
¦  HY-FMS Server (Self-Hosted Runner)                         ¦
+-------------------------------------------------------------¦
¦                                                              ¦
¦  C:\dev\Tenacity.FMS                                          ¦
¦  +-- Your development workspace                             ¦
¦      +-- Edit code here                                     ¦
¦      +-- Commit here                                        ¦
¦      +-- Push to GitHub                                     ¦
¦                                                              ¦
¦  C:\actions-runner\_work\Tenacity.FMS\Tenacity.FMS             ¦
¦  +-- GitHub Actions temporary workspace                     ¦
¦      +-- Auto-created by GitHub Actions                     ¦
¦      +-- Fresh clone for each workflow                      ¦
¦      +-- Builds happen here                                 ¦
¦      +-- Gets cleaned between runs                          ¦
¦                                                              ¦
¦  C:\inetpub\wwwroot\tenacyFMS\                             ¦
¦  +-- Production deployment (IIS)                            ¦
¦      +-- webAPI (Backend)                                   ¦
¦      +-- reactApp (Frontend)                                ¦
¦                                                              ¦
+-------------------------------------------------------------+
```

---

## **Common Questions**

### **Q: Why not just deploy from C:\dev\Tenacity.FMS?**
**A:** Because:
- Might have uncommitted changes
- Might have temp files
- Might have experiments you don't want deployed
- Not a clean state

### **Q: Can I delete C:\actions-runner\_work\Tenacity.FMS\Tenacity.FMS?**
**A:** Yes! GitHub Actions recreates it every time. That's why our cleanup scripts remove it.

### **Q: Do I need both directories?**
**A:** 
- **C:\dev\Tenacity.FMS** - Only if you develop on the server (optional)
- **C:\actions-runner\_work\...** - Required for GitHub Actions (automatic)

### **Q: What if I only want manual deployment?**
**A:** Then you could:
1. Keep only C:\dev\Tenacity.FMS
2. Run `deploy-alternative.ps1` manually
3. Skip GitHub Actions entirely

But you lose automation, consistency, and audit trail.

---

## **Recommendation**

### **Keep Both - They Serve Different Purposes:**

```
C:\dev\Tenacity.FMS
+-- Use for: Development, testing, debugging

C:\actions-runner\_work\Tenacity.FMS\Tenacity.FMS
+-- Use for: Automated builds and deployments (via GitHub Actions)

C:\inetpub\wwwroot\tenacyFMS\
+-- Use for: Running production app (IIS)
```

### **Typical Workflow:**
1. **Develop locally** (your PC or C:\dev\Tenacity.FMS on server)
2. **Commit & push** to GitHub
3. **GitHub Actions automatically** builds and deploys from its own workspace
4. **App runs** from IIS directories

---

## **Alternative: Simplify If You Want**

If you prefer **manual control** and find GitHub Actions overkill:

### **Option A: Manual Deployment Only**
```powershell
# On server
cd C:\dev\Tenacity.FMS
git pull origin productionv1
.\scripts\deploy-alternative.ps1
```
- Simpler
- More control
- Manual process

### **Option B: Keep GitHub Actions (Current)**
```
git push ? Auto deployment
```
- Automated
- Consistent
- Industry standard
- Best for teams

---

## **Summary**

| Directory | Purpose | Managed By | Can Delete? |
|-----------|---------|------------|-------------|
| **C:\dev\Tenacity.FMS** | Development | You | Yes (if not developing on server) |
| **C:\actions-runner\_work\...** | CI/CD Builds | GitHub Actions | Yes (recreated automatically) |
| **C:\inetpub\wwwroot\tenacyFMS\** | Production | IIS | No (your running app!) |

**Bottom line:** The Actions workspace is GitHub Actions' "scratch space" for building your app. It's separate from your dev workspace by design, ensuring clean, reproducible builds.

