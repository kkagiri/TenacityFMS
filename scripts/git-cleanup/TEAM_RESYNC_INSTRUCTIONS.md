# Team Re-Sync Instructions
## After Git History Cleanup

**Date**: [INSERT DATE]
**Completed By**: [INSERT NAME]
**Deadline to Complete**: [INSERT DEADLINE]

---

## ?? URGENT: Action Required

The Tenacity.FMS git repository history has been cleaned to remove exposed security credentials. **You MUST re-clone the repository**. Do NOT try to pull or rebase - it will not work!

---

## ?? Estimated Time

- **Experienced developers**: 15-20 minutes
- **New developers**: 30-45 minutes

---

## ?? Step-by-Step Instructions

### Step 1: Save Your Current Work (5 minutes)

**Check for uncommitted changes:**

```bash
cd Tenacity.FMS
git status
```

**If you have changes, save them:**

**Option A: Stash (recommended for small changes)**
```bash
git stash save "Before repo cleanup - $(date +%Y%m%d)"

# List your stashes to verify
git stash list
```

**Option B: Commit to temporary branch (for larger changes)**
```bash
git checkout -b temp-backup-$(date +%Y%m%d)
git add .
git commit -m "Temp: Save work before repo cleanup"
```

**Option C: Copy files manually (safest)**
```bash
# Copy changed files to a safe location
mkdir ~/tenacy-backup-$(date +%Y%m%d)
cp -r . ~/tenacy-backup-$(date +%Y%m%d)/
```

? **Verify**: Your work is saved securely

---

### Step 2: Delete Your Local Repository (2 minutes)

**Navigate to parent directory:**

```bash
cd ..
pwd  # Should show directory ABOVE Tenacity.FMS
```

**Option A: Delete completely (if you saved work)**
```bash
rm -rf Tenacity.FMS
```

**Option B: Archive (safer - recommended)**
```bash
mv Tenacity.FMS Tenacity.FMS.OLD-$(date +%Y%m%d)
```

? **Verify**: `ls` should NOT show Tenacity.FMS directory

---

### Step 3: Clone Fresh Repository (3 minutes)

```bash
git clone https://github.com/your-org/Tenacity.FMS.git
cd Tenacity.FMS
```

**Verify the cleanup worked:**

```bash
# This should show NO results
git log --all -S "Niwewenamimi1000"

# This should show NO results
git log --all -S "Tenacy2030"

# This should show ONLY new commits
git log --all --full-history -- '**/setup-environment.ps1'
```

? **Verify**: Old passwords do not appear in history

---

### Step 4: Restore Configuration Files (10 minutes)

**You need to recreate your local configuration files from examples:**

#### Frontend Configuration

```bash
# Create .env from example
cd fms.frontend
cp .env.example .env

# Edit with your settings
nano .env  # or use your preferred editor
```

**What to configure:**
```env
# Development settings
REACT_APP_PRIVATE_FMS_API_URL=http://localhost:7009/api
REACT_APP_IS_LOCAL_DEV=true
```

#### Backend Configuration

**FMS.WebClient:**
```bash
cd ../FMS.WebClient
cp appsettings.example.json appsettings.json
cp appsettings.example.json appsettings.Development.json

# Edit with your settings
nano appsettings.Development.json
```

**Key settings to configure:**
- `ConnectionStrings__FMSConnection`: Your local database
- `EmailSettings__Password`: Test email password (or leave as REPLACED_BY_ENV_VAR)
- `JwtSettings__SecretKey`: Use environment variable or set local value

**FMS.PTS.WindowsService (if you run it locally):**
```bash
cd ../FMS.PTS.WindowsService
cp appsettings.example.json appsettings.json
cp appsettings.example.json appsettings.Development.json

# Edit with your settings
nano appsettings.Development.json
```

**FMS.Testing (if you run tests):**
```bash
cd ../FMS.Testing
cat > appsettings.Testing.json << 'EOF'
{
  "Testing": {
    "UseRealInfrastructure": false,
    "TestDeviceId": "TEST-DEVICE",
    "TestPumpId": 1,
    "TestNozzleId": 2
  },
  "ConnectionStrings": {
    "FMSConnection": "server=localhost;port=3306;database=gpsdata_test;user=test_user;password=test_password;",
    "RedisConnection": "localhost:6379"
  }
}
EOF
```

**?? IMPORTANT**: Use TEST database, not production!

? **Verify**: All config files exist and have valid settings

---

### Step 5: Install Git Hooks (2 minutes)

**Install pre-commit security hooks:**

**Linux/Mac/Git Bash:**
```bash
cd /path/to/Tenacity.FMS
./scripts/setup-git-hooks.sh
```

**Windows PowerShell:**
```powershell
cd C:\path\to\Tenacity.FMS
.\scripts\setup-git-hooks.ps1
```

? **Verify**: Hook installed successfully message appears

---

### Step 6: Restore Your Work (5-10 minutes)

#### If you used `git stash`:

```bash
# List your stashes
git stash list

# Apply the most recent stash
git stash pop

# Or apply specific stash
git stash apply stash@{0}
```

#### If you used temporary branch:

```bash
# If old repo still exists
cd ../Tenacity.FMS.OLD-$(date +%Y%m%d)
git show temp-backup-YYYYMMDD > ../my-changes.patch

cd ../Tenacity.FMS
git apply ../my-changes.patch

# Or manually copy files you need
```

#### If you copied files manually:

```bash
# Copy back the files you changed
cp ~/tenacy-backup-*/path/to/changed/file .
```

? **Verify**: Your changes are back

---

### Step 7: Test Everything (5 minutes)

#### Test Backend

```bash
# Restore packages
dotnet restore

# Run tests (optional)
dotnet test

# Build
dotnet build

# Run application
dotnet run --project FMS.WebClient
```

**Check**: Application starts without errors

#### Test Frontend

```bash
cd fms.frontend

# Install dependencies
npm install

# Build
npm run build

# Run dev server
npm start
```

**Check**: Frontend builds and runs

#### Test Application

1. Open: http://localhost:3000 (or configured port)
2. Try logging in
3. Navigate to a few pages
4. Verify data loads

? **Verify**: Everything works as before

---

### Step 8: Confirm Completion (1 minute)

**Send confirmation email to**: [INSERT CONTACT EMAIL]

**Subject**: Git Re-Sync Complete - [YOUR NAME]

**Body**:
```
I have successfully completed the git repository re-sync:

? Repository re-cloned
? Configuration files restored
? Git hooks installed
? Application tested and working

Name: [YOUR NAME]
Date Completed: [DATE]
Any Issues: [NONE or describe]
```

? **Done!**

---

## ?? Troubleshooting

### Issue: "Can't find old repo to restore stash"

**If you deleted instead of archived:**
- Stashes are in the old `.git` directory which was deleted
- Use manual file backups if available
- Re-implement changes from memory (sorry!)

**Prevention**: Always archive, don't delete!

### Issue: "Application won't start - missing connection string"

**Check your appsettings.json:**

```bash
cat FMS.WebClient/appsettings.Development.json | grep ConnectionStrings
```

**Should show**:
```json
"ConnectionStrings": {
  "FMSConnection": "server=localhost;port=3306;database=gpsdata;..."
}
```

**If shows** `REPLACED_BY_ENV_VAR`:
- Either set environment variables
- OR replace with actual connection string
- See: SECURITY_SETUP_GUIDE.md

### Issue: "Git pre-commit hook not working"

```bash
# Re-install hooks
./scripts/setup-git-hooks.sh

# Or manually
cp .githooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Test
.git/hooks/pre-commit
```

### Issue: "npm install fails"

```bash
# Clear cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: "Database connection fails"

**Check MySQL is running:**
```bash
# Linux
sudo service mysql status

# Mac
brew services list | grep mysql

# Windows
services.msc  # Look for MySQL
```

**Check credentials:**
```bash
mysql -h localhost -u YOUR_USER -p
```

**Check firewall:**
```bash
# Allow port 3306
sudo ufw allow 3306  # Linux
```

### Issue: "Still seeing old passwords in git log"

**You may have cloned before cleanup was pushed.**

**Solution**:
```bash
cd ..
rm -rf Tenacity.FMS
git clone https://github.com/your-org/Tenacity.FMS.git
```

**Verify cleanup**:
```bash
cd Tenacity.FMS
git log --all -S "Niwewenamimi1000"
# Should show NO results
```

---

## ?? Need Help?

### Quick Questions
- **Slack**: #engineering (if available)
- **Email**: [INSERT CONTACT EMAIL]

### Urgent Issues
- **Phone**: [INSERT PHONE]
- **Emergency**: [INSERT EMERGENCY CONTACT]

### Documentation
- **Setup Guide**: `SECURITY_SETUP_GUIDE.md`
- **Git Cleanup**: `Documentation/Security/GIT_HISTORY_CLEANUP_GUIDE.md`
- **Security Audit**: `Documentation/Security/SECURITY_AUDIT_REPORT.md`

---

## ? Completion Checklist

Print this and check off as you go:

- [ ] Step 1: Saved current work (stash/commit/copy)
- [ ] Step 2: Deleted/archived local repository
- [ ] Step 3: Cloned fresh repository
- [ ] Step 4: Restored configuration files
  - [ ] fms.frontend/.env
  - [ ] FMS.WebClient/appsettings.json
  - [ ] FMS.WebClient/appsettings.Development.json
  - [ ] FMS.PTS.WindowsService/appsettings.json (if needed)
  - [ ] FMS.Testing/appsettings.Testing.json (if needed)
- [ ] Step 5: Installed git hooks
- [ ] Step 6: Restored my work
- [ ] Step 7: Tested application
  - [ ] Backend builds
  - [ ] Frontend builds
  - [ ] Application runs
  - [ ] Can log in
  - [ ] Data loads correctly
- [ ] Step 8: Sent confirmation email

**Completed By**: __________________ **Date**: __________

---

## ?? Security Reminder

**Now that history is clean:**
- ? Old passwords are removed from git history
- ? Configuration files are no longer tracked
- ? Pre-commit hooks prevent future exposure

**Your responsibility:**
- ?? NEVER commit real config files (use .example)
- ?? NEVER hardcode passwords in code
- ?? ALWAYS use environment variables for secrets
- ?? ALWAYS let pre-commit hooks run (don't bypass)

---

**Thank you for your cooperation in improving our security! ???**
