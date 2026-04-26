# Git History Cleanup - Quick Reference Card

**Print this and keep it handy during cleanup!**

---

## 🎯 Prerequisites Checklist

Before starting cleanup:

- [ ] **All passwords changed** (MySQL, email, GPSGate, JWT)
- [ ] **Environment variables configured** on production servers
- [ ] **All developers notified** (3 days advance notice)
- [ ] **Maintenance window scheduled** (30-60 minutes, no commits)
- [ ] **Repository backup created**
- [ ] **Team re-sync instructions prepared**

**⚠️ DO NOT proceed if any item is unchecked!**

---

## 🚀 Cleanup Process (Administrator)

### 1. Create Backup (5 min)
```bash
mkdir -p ~/git-cleanup-backups
cd ~/git-cleanup-backups
git clone --mirror https://github.com/your-org/Tenacy.FMS.git
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz Tenacy.FMS.git
```

### 2. Install BFG (one-time, 2 min)
```bash
mkdir -p ~/tools
cd ~/tools
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
mv bfg-1.14.0.jar bfg.jar
java -jar bfg.jar --version  # Test
```

### 3. Clone Mirror (5 min)
```bash
mkdir -p ~/git-cleanup
cd ~/git-cleanup
git clone --mirror https://github.com/your-org/Tenacy.FMS.git
```

### 4. Run BFG (10 min)
```bash
cd ~/git-cleanup
java -jar ~/tools/bfg.jar \
  --delete-files '{appsettings.json,appsettings.*.json,.env,setup-*.ps1,setup-*.bat}' \
  Tenacy.FMS.git

java -jar ~/tools/bfg.jar \
  --replace-text passwords-to-remove.txt \
  Tenacy.FMS.git
```

### 5. Clean Refs (5 min)
```bash
cd ~/git-cleanup/Tenacy.FMS.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### 6. Verify (5 min)
```bash
git log --all -S "Niwewenamimi1000"  # Should show nothing
git log --all -S "Tenacy2030"        # Should show nothing
git log --all --full-history -- '**/setup-environment.ps1'  # Should show nothing
```

### 7. Force Push (5 min)
```bash
git push --force --all
git push --force --tags
```

### 8. Notify Team
Send team re-sync instructions immediately!

**Total Time**: ~40 minutes

---

## 👥 Re-Sync Process (Each Developer)

### Quick Steps (15 min)
```bash
# 1. Save work
cd Tenacy.FMS
git stash save "Before cleanup"

# 2. Delete local repo
cd ..
mv Tenacy.FMS Tenacy.FMS.OLD-$(date +%Y%m%d)

# 3. Clone fresh
git clone https://github.com/your-org/Tenacy.FMS.git
cd Tenacy.FMS

# 4. Restore config
cp fms.frontend/.env.example fms.frontend/.env
cp FMS.WebClient/appsettings.example.json FMS.WebClient/appsettings.json
# Edit files with your settings

# 5. Install hooks
./scripts/setup-git-hooks.sh

# 6. Restore work
git stash pop

# 7. Test
dotnet run --project FMS.WebClient
```

---

## 🆘 Emergency Contacts

**Project Lead**: [NAME] - [EMAIL] - [PHONE]
**DevOps**: [NAME] - [EMAIL] - [PHONE]
**Security**: [NAME] - [EMAIL] - [PHONE]

---

## 📋 Passwords to Remove

Create `passwords-to-remove.txt`:
```
Niwewenamimi1000==>***REMOVED***
Tenacy2030==>***REMOVED***
Niwewe1000==>***REMOVED***
hk%2bXL3thlikm31JLAon0FjBxyyOtnrUOMCHIP%2bFfrhEXQPffqSrPDVGperVhCXPA==>***REMOVED***
```

---

## 🔍 Verification Commands

### Check cleanup worked:
```bash
# No passwords in history
git log --all -S "PASSWORD_HERE" --source

# No sensitive files in history
git log --all --full-history -- '**/FILE_NAME'

# Example files still exist
git ls-tree -r HEAD | grep example
```

### Check repository size:
```bash
du -sh .git
# Should be significantly smaller
```

### Check GitHub:
1. Go to: https://github.com/your-org/Tenacy.FMS
2. Search: `"Niwewenamimi1000"`
3. Should show: **No results**

---

## 🔄 Rollback Procedure

If something goes wrong:

```bash
# Extract backup
cd ~/git-cleanup-backups
tar -xzf backup-YYYYMMDD-HHMMSS.tar.gz
cd Tenacy.FMS.git

# Force push backup
git push --force --all
git push --force --tags

# Notify team to re-clone again
```

---

## 📊 Timeline

| Time | Action | Who |
|------|--------|-----|
| T-72h | Send advance notice | Admin |
| T-24h | Confirm window | Admin |
| T-1h | Final warning | Admin |
| T-0 | Start cleanup | Admin |
| T+40m | Cleanup complete | Admin |
| T+40m | Notify team | Admin |
| T+24h | Verify all devs | Lead |
| T+48h | Final check | Security |

---

## ⚠️ Common Mistakes

1. **❌ Forgetting to change passwords first**
   - History cleanup is pointless if passwords aren't changed!

2. **❌ Not notifying team**
   - Developers will be confused and stuck

3. **❌ Not creating backup**
   - Can't recover if something goes wrong

4. **❌ Force pushing without verification**
   - May need to re-run cleanup

5. **❌ Developers trying to pull instead of re-clone**
   - Won't work - must re-clone!

---

## ✅ Success Criteria

- [ ] No passwords found in git history
- [ ] Repository size decreased
- [ ] Example files still present
- [ ] All developers re-synced
- [ ] All applications working
- [ ] CI/CD pipelines functional

---

## 📚 Full Documentation

- **Complete Guide**: `Documentation/Security/GIT_HISTORY_CLEANUP_GUIDE.md`
- **Team Instructions**: `scripts/git-cleanup/TEAM_RESYNC_INSTRUCTIONS.md`
- **Automated Script**: `scripts/git-cleanup/cleanup-history.sh`

---

**Remember**: This is a one-time operation. With pre-commit hooks, we shouldn't need to do this again!
