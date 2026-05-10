# Git History Cleanup Guide
## Removing Exposed Secrets from Repository History

**Status**: ?? CRITICAL - Required to complete security remediation
**Timeline**: Week 2 (after passwords are changed)
**Complexity**: High - Requires team coordination
**Risk Level**: Medium - Rewrites git history (requires force push)

---

## ?? CRITICAL: Read This First

### Prerequisites (MUST be completed first!)

- ? **Step 1**: All exposed passwords MUST be changed first!
  - If passwords are not changed, this cleanup is pointless
  - See: `IMMEDIATE_ACTION_CHECKLIST.md`

- ? **Step 2**: Environment variables MUST be configured
  - Production server configured
  - Development environments configured
  - See: `SECURITY_SETUP_GUIDE.md`

- ? **Step 3**: Team MUST be notified
  - All developers must be aware
  - Schedule a time when no one is committing
  - See communication template below

**?? DO NOT proceed if any prerequisites are incomplete!**

---

## ?? Overview

### What This Does

This process **permanently removes** sensitive files and their contents from the entire git history, including:

- Database passwords
- Email passwords
- API keys
- Connection strings
- Environment setup scripts with credentials
- Any other sensitive data

### Why This Is Necessary

Even though we removed files from tracking, they're still in git history:

```bash
# Anyone with repo access can still see old passwords:
git log --all -S "Niwewenamimi1000"
git show <commit-hash>:scripts/environment/setup-environment.ps1
```

### How It Works

We'll use **BFG Repo-Cleaner** to:
1. Remove sensitive files from all commits
2. Remove sensitive content (passwords) from all commits
3. Rewrite git history to exclude this data
4. Force push the cleaned repository

---

## ??? Method 1: Using BFG Repo-Cleaner (Recommended)

BFG is faster and safer than `git filter-branch`. It's specifically designed for removing sensitive data.

### Step 1: Backup Everything

**On the server hosting the repository:**

```bash
# Create backup directory
mkdir -p /backups/git-cleanup-$(date +%Y%m%d)
cd /backups/git-cleanup-$(date +%Y%m%d)

# Backup the entire repository
git clone --mirror https://github.com/your-org/Tenacity.FMS.git

# Create archive
tar -czf Tenacity.FMS-backup-$(date +%Y%m%d-%H%M%S).tar.gz Tenacity.FMS.git

# Verify backup
ls -lh *.tar.gz
```

**Store backup securely** - you may need it if something goes wrong!

---

### Step 2: Install BFG Repo-Cleaner

**Option A: Download Pre-built JAR (Recommended)**

```bash
# Download BFG (requires Java 8 or above)
cd ~/tools
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
mv bfg-1.14.0.jar bfg.jar

# Verify Java is installed
java -version
# Should show Java 8 or higher

# Test BFG
java -jar bfg.jar --version
# Should show: bfg 1.14.0
```

**Option B: Install via Package Manager**

```bash
# On Mac with Homebrew
brew install bfg

# On Ubuntu/Debian
sudo apt-get install bfg

# On Windows with Chocolatey
choco install bfg-repo-cleaner
```

---

### Step 3: Clone a Fresh Mirror

```bash
# Create working directory
mkdir -p ~/git-cleanup
cd ~/git-cleanup

# Clone as mirror (includes all branches, tags, refs)
git clone --mirror https://github.com/your-org/Tenacity.FMS.git

# This creates: Tenacity.FMS.git/
cd Tenacity.FMS.git
```

---

### Step 4: Create Files List to Remove

Create a file listing all sensitive files to remove:

```bash
cat > ../files-to-delete.txt << 'EOF'
.env
appsettings.json
appsettings.Development.json
appsettings.Production.json
appsettings.development.json
appsettings.production.json
appsettings.Testing.json
setup-environment.ps1
setup-environment.bat
setup-pts-env.ps1
setup-pts-env.bat
EOF
```

---

### Step 5: Create Passwords List to Remove

Create a file with passwords/secrets to scrub from ALL files:

```bash
cat > ../passwords-to-remove.txt << 'EOF'
Niwewenamimi1000
Tenacy2030
Niwewe1000
hk%2bXL3thlikm31JLAon0FjBxyyOtnrUOMCHIP%2bFfrhEXQPffqSrPDVGperVhCXPA
hy.gps@example.com
10.0.10.150
10.0.10.153
10.0.11.90
10.0.11.239
197.254.33.227
EOF
```

**?? Important**: Add any other exposed passwords or sensitive data!

---

### Step 6: Run BFG to Clean History

```bash
cd ~/git-cleanup

# Remove sensitive files from history
java -jar ~/tools/bfg.jar \
  --delete-files '{appsettings.json,appsettings.*.json,.env,setup-environment.ps1,setup-*.ps1}' \
  Tenacity.FMS.git

# Alternative: Use the files list
java -jar ~/tools/bfg.jar \
  --delete-files files-to-delete.txt \
  Tenacity.FMS.git

# Replace passwords in ALL remaining files
java -jar ~/tools/bfg.jar \
  --replace-text passwords-to-remove.txt \
  Tenacity.FMS.git
```

**Expected output:**
```
Using repo : /path/to/Tenacity.FMS.git

Found 1234 commits
Cleaning commits:       100% (1234/1234)
Cleaning commits completed in 12 seconds.

Updating 8 Refs
        Ref                        Before     After
        -----------------------------------------
        refs/heads/main           | abc123 | def456
        refs/heads/productionv1   | xyz789 | uvw012
        ...

Updating references:    100% (8/8)
...Ref update completed in 2 seconds.

BFG run is complete! When ready, run: git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

---

### Step 7: Expire Reflogs and Garbage Collect

```bash
cd ~/git-cleanup/Tenacity.FMS.git

# Expire all old reflog entries
git reflog expire --expire=now --all

# Aggressively garbage collect
git gc --prune=now --aggressive

# This may take several minutes for large repos
```

**Expected output:**
```
Enumerating objects: 45678, done.
Counting objects: 100% (45678/45678), done.
Delta compression using up to 8 threads
Compressing objects: 100% (12345/12345), done.
Writing objects: 100% (45678/45678), done.
Total 45678 (delta 23456), reused 40000 (delta 20000)
```

---

### Step 8: Verify the Cleanup

```bash
cd ~/git-cleanup/Tenacity.FMS.git

# Check that sensitive files are gone from history
git log --all --full-history -- '**/setup-environment.ps1'
# Should show: (nothing)

# Search for exposed passwords
git log --all -S "Niwewenamimi1000"
# Should show: (nothing)

git log --all -S "Tenacy2030"
# Should show: (nothing)

# Check file list in a few commits
git ls-tree -r HEAD | grep -i 'appsettings.json'
# Should show: only appsettings.example.json

# Verify .example files are still there
git ls-tree -r HEAD | grep -i 'example'
# Should show: appsettings.example.json, .env.example, etc.
```

**? If all checks pass, secrets are removed from history!**

---

### Step 9: Force Push to Remote

**?? CRITICAL**: This rewrites history. Coordinate with your team!

```bash
cd ~/git-cleanup/Tenacity.FMS.git

# Force push all refs (branches, tags)
git push --force --all

# Force push all tags
git push --force --tags

# Push specific branches if needed
git push origin +main
git push origin +productionv1
git push origin +claude/security-vulnerability-audit-011CUpENAgPpbZFdvudPaWeb
```

**Expected output:**
```
Enumerating objects: 45678, done.
Counting objects: 100% (45678/45678), done.
Delta compression using up to 8 threads
Compressing objects: 100% (12345/12345), done.
Writing objects: 100% (45678/45678), done.
Total 45678 (delta 23456), reused 40000 (delta 20000)
remote: Resolving deltas: 100% (23456/23456), done.
To https://github.com/your-org/Tenacity.FMS.git
 + abc123...def456 main -> main (forced update)
 + xyz789...uvw012 productionv1 -> productionv1 (forced update)
```

---

### Step 10: Notify Team

**Send this message to all developers:**

```
URGENT: Git Repository History Cleaned - Action Required

The Tenacity.FMS repository history has been cleaned to remove exposed secrets.
All developers MUST follow these steps:

1. COMMIT OR STASH your current work:
   git stash save "Before repo cleanup"

2. DELETE your local repository:
   cd ..
   rm -rf Tenacity.FMS
   # (or move it: mv Tenacity.FMS Tenacity.FMS.old)

3. CLONE fresh copy:
   git clone https://github.com/your-org/Tenacity.FMS.git
   cd Tenacity.FMS

4. RESTORE your work (if stashed):
   git stash pop

5. VERIFY your environment:
   - Ensure .env file exists (copy from .env.example if needed)
   - Ensure appsettings.json files exist (copy from .example)
   - Run: ./scripts/setup-git-hooks.sh (or .ps1 on Windows)

DO NOT try to pull or rebase - you MUST re-clone!

Deadline: [Specify date/time]

Questions? Contact: [Your contact info]
```

---

## ??? Method 2: Using git-filter-repo (Alternative)

If you prefer `git-filter-repo` (more powerful, but more complex):

### Install git-filter-repo

```bash
# Python 3.5+ required
pip3 install git-filter-repo

# Or download directly
wget https://raw.githubusercontent.com/newren/git-filter-repo/main/git-filter-repo
chmod +x git-filter-repo
sudo mv git-filter-repo /usr/local/bin/
```

### Clean Repository

```bash
# Clone fresh copy (NOT mirror)
git clone https://github.com/your-org/Tenacity.FMS.git
cd Tenacity.FMS

# Remove sensitive files
git filter-repo --invert-paths \
  --path 'fms.frontend/.env' \
  --path '*/appsettings.json' \
  --path '*/appsettings.Development.json' \
  --path '*/appsettings.Production.json' \
  --path 'scripts/environment/setup-environment.ps1' \
  --force

# Remove sensitive content
git filter-repo --replace-text ../passwords-to-remove.txt --force

# Force push
git remote add origin https://github.com/your-org/Tenacity.FMS.git
git push --force --all
git push --force --tags
```

---

## ? Post-Cleanup Verification

After force pushing, verify the cleanup worked:

### On GitHub Website

1. Go to: https://github.com/your-org/Tenacity.FMS
2. Use GitHub search: `"Niwewenamimi1000"`
3. Should show: **No results**
4. Try other passwords: `"Tenacy2030"`, `"Niwewe1000"`
5. All should show: **No results**

### On Local Machine

```bash
# Clone fresh copy
git clone https://github.com/your-org/Tenacity.FMS.git tenacy-verify
cd tenacy-verify

# Search entire history for passwords
git log --all -S "Niwewenamimi1000" --source --all
git log --all -S "Tenacy2030" --source --all
git log --all -S "Niwewe1000" --source --all

# Should all show: (nothing)

# Check file history
git log --all --full-history -- '**/appsettings.json'

# Should only show commits AFTER cleanup, if any
# Old commits with these files should be gone

# Verify repository size decreased
du -sh .git
# Should be significantly smaller
```

---

## ?? Team Re-Sync Procedure

### For Each Developer

**Step 1: Save Current Work**

```bash
cd Tenacity.FMS

# Check for uncommitted changes
git status

# If changes exist, stash them
git stash save "Before repo history cleanup - $(date +%Y%m%d)"

# Or commit to a temporary branch
git checkout -b temp-before-cleanup
git add .
git commit -m "Temp: Save work before repo cleanup"
```

**Step 2: Delete Local Repository**

```bash
cd ..

# Option A: Delete completely
rm -rf Tenacity.FMS

# Option B: Archive for safety (recommended)
mv Tenacity.FMS Tenacity.FMS.OLD-$(date +%Y%m%d)
```

**Step 3: Clone Fresh Copy**

```bash
git clone https://github.com/your-org/Tenacity.FMS.git
cd Tenacity.FMS

# Verify cleaned history
git log --oneline | head -20
```

**Step 4: Restore Local Configuration**

```bash
# Copy environment files from .example
cp fms.frontend/.env.example fms.frontend/.env
cp FMS.WebClient/appsettings.example.json FMS.WebClient/appsettings.json
# ... etc

# Edit with your local settings (NEVER commit!)
# Fill in database connections, API keys, etc.

# Install git hooks
./scripts/setup-git-hooks.sh  # or .ps1 on Windows
```

**Step 5: Restore Your Work**

```bash
# If you used stash (and old repo still exists)
cd ../Tenacity.FMS.OLD-$(date +%Y%m%d)
git stash list
# Note the stash you want

# Apply to new repo
cd ../Tenacity.FMS
# Copy files manually or use git apply

# If you used temp branch
cd ../Tenacity.FMS.OLD-$(date +%Y%m%d)
git diff main temp-before-cleanup > ../my-changes.patch

cd ../Tenacity.FMS
git apply ../my-changes.patch
```

**Step 6: Verify Everything Works**

```bash
# Run tests
dotnet test

# Build frontend
cd fms.frontend
npm install
npm run build

# Verify application starts
dotnet run --project FMS.WebClient
```

---

## ?? Troubleshooting

### Issue: "rejected (non-fast-forward)"

```bash
# This is expected - you need to force push
git push --force origin main
```

### Issue: Developer can't pull after cleanup

```
error: Your local changes to the following files would be overwritten by merge
```

**Solution**: They must re-clone, not pull.

```bash
# DON'T do this:
git pull  # ? Won't work

# DO this:
cd ..
rm -rf Tenacity.FMS
git clone https://github.com/your-org/Tenacity.FMS.git
```

### Issue: "Still seeing passwords in history"

```bash
# Make sure you cleaned the mirror clone
cd ~/git-cleanup/Tenacity.FMS.git
git log --all -S "password123"

# If still there, you may need to:
# 1. Run BFG again with correct patterns
# 2. Check the passwords-to-remove.txt file
# 3. Ensure you force pushed: git push --force --all
```

### Issue: "Repository size didn't decrease"

```bash
# GitHub needs time to clean up
# Size will decrease after GitHub runs GC (24-48 hours)

# You can contact GitHub support to request immediate GC:
# https://support.github.com/
```

### Issue: "Broke something - need to restore"

```bash
# Use your backup from Step 1
cd /backups/git-cleanup-YYYYMMDD
tar -xzf Tenacity.FMS-backup-*.tar.gz

# Force push the backup
cd Tenacity.FMS.git
git remote add origin https://github.com/your-org/Tenacity.FMS.git
git push --force --all
git push --force --tags
```

---

## ?? Success Criteria

### ? Cleanup is successful when:

- [ ] All sensitive files removed from history
- [ ] All passwords removed from all files in history
- [ ] Repository size decreased significantly
- [ ] GitHub search shows no results for old passwords
- [ ] All developers successfully re-cloned
- [ ] All developers have working environments
- [ ] CI/CD pipelines still work
- [ ] No errors in production after deployment

---

## ?? Timeline and Checklist

### Pre-Cleanup (Week 1)
- [ ] All passwords changed on actual systems
- [ ] Environment variables configured
- [ ] Team notified of upcoming cleanup
- [ ] Backup created
- [ ] Scheduled maintenance window (no one commits during cleanup)

### Cleanup Day (Week 2)
- [ ] **T-60min**: Final team notification (stop committing!)
- [ ] **T-0**: Start cleanup process
- [ ] **T+15min**: BFG cleanup complete
- [ ] **T+20min**: Verification complete
- [ ] **T+25min**: Force push complete
- [ ] **T+30min**: GitHub verification complete
- [ ] **T+30min**: Team notified to re-clone

### Post-Cleanup (Week 2)
- [ ] All developers re-cloned successfully
- [ ] All developers environments working
- [ ] CI/CD pipelines verified
- [ ] Production deployment successful
- [ ] No issues reported
- [ ] Old backups archived securely

---

## ?? Communication Template

### Pre-Cleanup Notification (3 days before)

**Subject**: [ACTION REQUIRED] Git Repository Cleanup - [DATE]

**Body**:
```
Team,

As part of our security improvements, we will be cleaning the git
repository history to remove exposed secrets on [DATE] at [TIME].

WHAT THIS MEANS FOR YOU:
- You will need to re-clone the repository
- Any uncommitted work should be saved before [DATE]
- Process will take approximately 30 minutes
- No commits should be made during this window

WHEN: [DATE] at [TIME] (approx 30 minutes)

WHAT TO DO:
1. Before [DATE]: Commit or stash all work
2. During cleanup: Do not commit or push
3. After notification: Follow re-sync instructions

Detailed instructions will be sent after cleanup is complete.

Questions? Reply to this email or contact [CONTACT].

Thanks,
[YOUR NAME]
```

### Post-Cleanup Notification (immediately after)

**Subject**: [URGENT] Git Repository Cleaned - Re-Clone Required

**Body**:
```
Team,

The git repository history cleanup is COMPLETE. You MUST re-clone the
repository. Do NOT try to pull - it won't work.

INSTRUCTIONS:
See attached document: Team_Resync_Instructions.md

Or follow these steps:
1. Stash your work: git stash
2. Delete local repo: cd .. && rm -rf Tenacity.FMS
3. Clone fresh: git clone https://github.com/your-org/Tenacity.FMS.git
4. Restore config: Copy .env.example to .env, etc.
5. Restore work: git stash pop (if applicable)

DEADLINE: Please complete by [DATE/TIME]

VERIFY: After re-cloning, search for old password "Niwewenamimi1000"
in history - should show NO results.

Questions? Contact [CONTACT] immediately.

Thanks,
[YOUR NAME]
```

---

## ?? Security Notes

1. **Old clones are compromised**: Anyone who has an old clone still has the passwords
2. **Backups may contain secrets**: Archive backups securely, delete after 90 days
3. **GitHub API might cache**: Allow 24-48 hours for full propagation
4. **Forks are independent**: If repository was forked, those forks still have secrets
5. **Change passwords first**: History cleanup is useless if passwords aren't changed

---

## ?? Additional Resources

- **BFG Repo-Cleaner**: https://rtyley.github.io/bfg-repo-cleaner/
- **git-filter-repo**: https://github.com/newren/git-filter-repo
- **GitHub: Removing sensitive data**: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
- **Git Book - Filter Branch**: https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History

---

**Document Version**: 1.0
**Last Updated**: 2025-11-05
**Next Review**: After cleanup completion
