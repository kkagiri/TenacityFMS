# GitHub Actions Workflow - Visual Guide

## The Complete Picture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         YOUR DEVELOPMENT PROCESS                            │
└────────────────────────────────────────────────────────────────────────────┘

Step 1: DEVELOP
═══════════════
📍 Location: C:\dev\Hyoung.FMS (or your local PC)
┌─────────────────────────────────┐
│  Your Development Workspace     │
│  ─────────────────────────────  │
│  • Edit code in VS Code         │
│  • Test locally                 │
│  • Debug issues                 │
│  • Make commits                 │
└─────────────────────────────────┘
                │
                │ git add .
                │ git commit -m "Changes"
                ↓
Step 2: PUSH TO GITHUB
═══════════════════════
                │
                │ git push origin productionv1
                ↓
        ┌───────────────┐
        │    GitHub     │ ← Your code is stored here
        │  (Cloud repo) │
        └───────────────┘
                │
                │ Webhook triggers workflow
                ↓
Step 3: GITHUB ACTIONS RUNS AUTOMATICALLY
═══════════════════════════════════════════
📍 Location: Self-hosted runner on HY-FMS server

┌────────────────────────────────────────────────────────────┐
│  GitHub Actions Workspace                                  │
│  C:\actions-runner\_work\Hyoung.FMS\Hyoung.FMS            │
│  ────────────────────────────────────────────────────────  │
│                                                             │
│  🤖 Checkout Action:                                       │
│     git clone → Fresh copy from GitHub                     │
│                                                             │
│  🔨 Build Backend:                                         │
│     dotnet publish → Compiled DLLs                         │
│                                                             │
│  📦 Build Frontend:                                        │
│     npm ci && npm run build → Static files                │
│                                                             │
│  🚀 Run Deployment Script:                                │
│     deploy-alternative.ps1 → Deploy to IIS                │
│                                                             │
└────────────────────────────────────────────────────────────┘
                │
                │ Copy built files
                ↓
Step 4: DEPLOYED TO IIS
═══════════════════════
📍 Location: C:\inetpub\wwwroot\hyoungFMS\

┌────────────────────────────────────────┐
│  Production Deployment (IIS)           │
│  ────────────────────────────────────  │
│                                         │
│  webAPI/                               │
│  ├── Backend DLLs                      │
│  └── Port 7009                         │
│                                         │
│  reactApp/                             │
│  ├── React build files                 │
│  └── Port 80                           │
│                                         │
└────────────────────────────────────────┘
                │
                │ IIS serves
                ↓
        ┌─────────────┐
        │   USERS     │
        │  Access App │
        └─────────────┘


═══════════════════════════════════════════════════════════════════════════
                              KEY DIFFERENCES
═══════════════════════════════════════════════════════════════════════════

┌────────────────────────────┬────────────────────────────┬──────────────────┐
│  C:\dev\Hyoung.FMS         │  C:\actions-runner\_work\  │  C:\inetpub\     │
│  (Development)             │  (Build/Deploy)            │  (Production)    │
├────────────────────────────┼────────────────────────────┼──────────────────┤
│                            │                            │                  │
│  • Your working copy       │  • Temporary workspace     │  • Running app   │
│  • Can have local changes  │  • Fresh clone from GitHub │  • Served by IIS │
│  • Experiments OK          │  • Cleaned between runs    │  • Public facing │
│  • Source code             │  • Build artifacts         │  • Optimized     │
│  • You control it          │  • GitHub Actions controls │  • IIS controls  │
│                            │                            │                  │
└────────────────────────────┴────────────────────────────┴──────────────────┘


═══════════════════════════════════════════════════════════════════════════
                          WHY THIS SEPARATION?
═══════════════════════════════════════════════════════════════════════════

1. ISOLATION
   ─────────
   Dev:     "I'm experimenting with this code..."
   Actions: "I only build what's in GitHub"
   IIS:     "I only run what was deployed"

2. CONSISTENCY
   ───────────
   Dev:     Can have different versions, branches, local changes
   Actions: Always builds from GitHub source of truth
   IIS:     Always runs tested, approved code

3. CLEAN BUILDS
   ────────────
   Dev:     node_modules, temp files, logs, etc.
   Actions: Fresh checkout every time = reproducible builds
   IIS:     Only production-ready files

4. SAFETY
   ───────
   Dev:     Uncommitted code stays local
   Actions: Can't accidentally deploy uncommitted changes
   IIS:     Only serves verified deployments


═══════════════════════════════════════════════════════════════════════════
                        WHAT HAPPENS WHEN YOU PUSH
═══════════════════════════════════════════════════════════════════════════

You:           git push origin productionv1
               │
GitHub:        Receives code, stores it, triggers webhook
               │
Runner:        "New code pushed! Starting workflow..."
               │
               ├─ 🧹 Cleanup old workspace
               ├─ 📥 Checkout fresh code from GitHub
               ├─ 🔧 Setup .NET
               ├─ 🔧 Setup Node.js
               ├─ 🔨 Build backend
               ├─ 🔨 Build frontend
               ├─ 🚀 Run deploy-alternative.ps1
               │   ├─ Stop IIS
               │   ├─ Copy files using folder swap
               │   └─ Start IIS
               └─ ✅ Verify deployment

Result:        Your app is live with new changes!


═══════════════════════════════════════════════════════════════════════════
                           DO YOU NEED BOTH?
═══════════════════════════════════════════════════════════════════════════

C:\dev\Hyoung.FMS
─────────────────
NEEDED IF:  You develop code on the server
OPTIONAL:   If you develop on your local PC only

C:\actions-runner\_work\Hyoung.FMS\Hyoung.FMS
──────────────────────────────────────────────
NEEDED IF:  Using GitHub Actions for deployment ✓ (You are)
AUTOMATIC:  GitHub Actions creates and manages this
CAN DELETE: Yes! It's recreated for each workflow run

C:\inetpub\wwwroot\hyoungFMS\
─────────────────────────────
REQUIRED:   This is your running application!
NEVER DELETE: Users are accessing this!


═══════════════════════════════════════════════════════════════════════════
                        YOUR TYPICAL DAY
═══════════════════════════════════════════════════════════════════════════

Morning:
  • Open C:\dev\Hyoung.FMS in VS Code
  • Make code changes
  • Test locally
  • Commit: git commit -m "Fixed login bug"

Afternoon:
  • Push: git push origin productionv1
  • ☕ Get coffee while GitHub Actions deploys
  • ✅ Get notification: "Deployment successful!"
  • Test on http://localhost

Done! No manual deployment needed.

C:\actions-runner\_work\... did all the work automatically!


═══════════════════════════════════════════════════════════════════════════
                          TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════

Problem: "Actions workspace has locked files"
Solution: .\scripts\reset-runner-workspace.ps1
Effect:   Cleans C:\actions-runner\_work\... (safe to delete)

Problem: "I want to test without pushing to GitHub"
Solution: cd C:\dev\Hyoung.FMS
          .\scripts\deploy-alternative.ps1
Effect:   Deploys from your dev workspace directly

Problem: "Deployment failed, need to rollback"
Solution: Re-run previous successful workflow from GitHub
Effect:   GitHub Actions deploys old version from GitHub


═══════════════════════════════════════════════════════════════════════════
