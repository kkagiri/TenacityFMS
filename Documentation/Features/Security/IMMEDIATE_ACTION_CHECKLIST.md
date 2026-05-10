# ?? IMMEDIATE ACTION CHECKLIST
## Critical Security Issues - ACT NOW!

**Date**: 2025-11-05
**Status**: ?? URGENT - Action Required Within 24 Hours

---

## ? Priority 0: Change Passwords NOW (Next 2 Hours)

### 1. Database Root Password
```bash
# Current EXPOSED password: Niwewenamimi1000
# Server: 10.0.10.150:3306
```

**Action**:
```sql
-- Connect to MySQL as root
mysql -h 10.0.10.150 -u root -p

-- Change root password
ALTER USER 'root'@'%' IDENTIFIED BY 'NEW_SECURE_PASSWORD_HERE';
FLUSH PRIVILEGES;

-- Create dedicated app user (don't use root in apps!)
CREATE USER 'fms_app'@'%' IDENTIFIED BY 'ANOTHER_SECURE_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE ON gpsdata.* TO 'fms_app'@'%';
FLUSH PRIVILEGES;
```
- [ ] Root password changed
- [ ] New app user created
- [ ] Connection strings updated on servers

---

### 2. ATG Database Password
```bash
# Current EXPOSED password: Tenacy2030
# Server: 10.0.11.239:3306
# User: kkagiri
```

**Action**:
```sql
-- Connect to ATG MySQL
mysql -h 10.0.11.239 -u kkagiri -p

-- Change password
ALTER USER 'kkagiri'@'%' IDENTIFIED BY 'NEW_SECURE_PASSWORD_HERE';
FLUSH PRIVILEGES;
```
- [ ] ATG password changed
- [ ] Connection strings updated

---

### 3. Email Account Password
```bash
# Current EXPOSED password: Tenacy2030
# Account: hy.gps@example.com
# Server: mail.example.com
```

**Action**:
1. Log into webmail or email admin panel
2. Change password for hy.gps@example.com
3. Enable 2FA if available
4. Review recent login activity for suspicious access

- [ ] Email password changed
- [ ] 2FA enabled
- [ ] Updated in all application configs

---

### 4. GPSGate API Key
```bash
# Current EXPOSED key: hk%2bXL3thlikm31JLAon0FjBxyyOtnrUOMCHIP%2bFfrhEXQPffqSrPDVGperVhCXPA
# URL: https://10.0.10.150/comGpsGate/api/v.1
```

**Action**:
1. Log into GPSGate admin panel at https://10.0.10.150/comGpsGate
2. Navigate to API settings
3. Regenerate API key for Application ID 12
4. Update environment variables (not code!)

- [ ] API key rotated
- [ ] Updated in environment variables
- [ ] Old key revoked

---

### 5. GPSGate User Password
```bash
# Current EXPOSED credentials:
# Username: kkagiri
# Password: Niwewe1000
```

**Action**:
1. Log into GPSGate
2. Change password for user kkagiri
3. Review access logs

- [ ] GPSGate user password changed
- [ ] Access logs reviewed

---

## ? Priority 1: Update Server Environment Variables (Next 4 Hours)

### Production Server (10.0.10.153)

Run as Administrator:

```powershell
# Database Connections
[Environment]::SetEnvironmentVariable('ConnectionStrings__FMSConnection', 'server=10.0.10.150;port=3306;database=gpsdata;user=fms_app;password=YOUR_NEW_APP_PASSWORD;connection timeout=2000;command timeout=2000;AllowZeroDateTime=True;', 'Machine')

[Environment]::SetEnvironmentVariable('ConnectionStrings__ATGConnection', 'server=10.0.11.239;port=3306;database=azs;user=kkagiri;password=YOUR_NEW_ATG_PASSWORD;connection timeout=10000;command timeout=10000', 'Machine')

[Environment]::SetEnvironmentVariable('ConnectionStrings__RedisConnection', '10.0.10.154:6379', 'Machine')

# Email Settings
[Environment]::SetEnvironmentVariable('EmailSettings__SmtpServer', 'mail.example.com', 'Machine')
[Environment]::SetEnvironmentVariable('EmailSettings__SmtpPort', '25', 'Machine')
[Environment]::SetEnvironmentVariable('EmailSettings__Username', 'hy.gps@example.com', 'Machine')
[Environment]::SetEnvironmentVariable('EmailSettings__Password', 'YOUR_NEW_EMAIL_PASSWORD', 'Machine')

# API Keys
[Environment]::SetEnvironmentVariable('GPSGate__ApiKey', 'YOUR_NEW_GPSGATE_API_KEY', 'Machine')
[Environment]::SetEnvironmentVariable('GPSGate__BaseUrl', 'https://10.0.10.150/comGpsGate/api/v.1', 'Machine')

# GPSGate User Credentials
[Environment]::SetEnvironmentVariable('GPSGateUser__Username', 'kkagiri', 'Machine')
[Environment]::SetEnvironmentVariable('GPSGateUser__Password', 'YOUR_NEW_GPSGATE_USER_PASSWORD', 'Machine')

# JWT Settings
[Environment]::SetEnvironmentVariable('JwtSettings__SecretKey', 'GENERATE_NEW_JWT_SECRET_AT_LEAST_32_CHARS', 'Machine')
[Environment]::SetEnvironmentVariable('JwtSettings__Issuer', 'Tenacity FMS', 'Machine')
[Environment]::SetEnvironmentVariable('JwtSettings__Audience', 'FMSUsers', 'Machine')

Write-Host "Environment variables set successfully!" -ForegroundColor Green
Write-Host "IMPORTANT: Restart IIS and all FMS services!" -ForegroundColor Yellow
```

**After setting environment variables**:
```powershell
# Restart IIS
iisreset

# Restart FMS PTS Windows Service
Restart-Service "FMS.PTS.WindowsService"

# Verify services are running
Get-Service | Where-Object {$_.Name -like "*FMS*"}
```

- [ ] Environment variables set on production server
- [ ] IIS restarted
- [ ] PTS Windows Service restarted
- [ ] Services verified running

---

## ? Priority 2: Remove Secrets from Git (Today)

### Step 1: Remove from Current Tracking

```bash
cd /home/user/Tenacity.FMS

# Remove sensitive files from git tracking (keeps local files)
git rm --cached fms.frontend/.env
git rm --cached -r scripts/environment/
git rm --cached FMS.Testing/appsettings.Testing.json
git rm --cached FMS.Deployment/appsettings.json
git rm --cached FMS.Deployment/appsettings.development.json
git rm --cached FMS.WebClient/appsettings.json
git rm --cached FMS.WebClient/appsettings.Development.json
git rm --cached FMS.PTS.WindowsService/appsettings.json
git rm --cached FMS.PTS.WindowsService/appsettings.Development.json
git rm --cached FMS.PTS.WindowsService/appsettings.production.json

# Commit the removal
git commit -m "security: Remove sensitive configuration files from git tracking"

# Push to your branch
git push -u origin claude/security-vulnerability-audit-011CUpENAgPpbZFdvudPaWeb
```

- [ ] Files removed from git tracking
- [ ] Changes committed
- [ ] Changes pushed

---

### Step 2: Create Example Configuration Files

```bash
# Create example files without secrets
cp FMS.WebClient/appsettings.json FMS.WebClient/appsettings.example.json
cp fms.frontend/.env fms.frontend/.env.example
```

Then edit the `.example` files to replace all secrets with placeholders:
```json
"Password": "YOUR_PASSWORD_HERE"
"ApiKey": "YOUR_API_KEY_HERE"
```

- [ ] Example files created
- [ ] Secrets replaced with placeholders
- [ ] Example files committed to git

---

### Step 3: Update .gitignore

Add to `.gitignore`:
```gitignore
# Sensitive configuration files
FMS.WebClient/appsettings.json
FMS.WebClient/appsettings.Development.json
FMS.WebClient/appsettings.Production.json
FMS.Deployment/appsettings.json
FMS.Deployment/appsettings.*.json
FMS.PTS.WindowsService/appsettings.json
FMS.PTS.WindowsService/appsettings.*.json
FMS.Testing/appsettings.Testing.json

# Environment files
fms.frontend/.env
fms.frontend/.env.local
fms.frontend/.env.*.local

# Environment setup scripts
scripts/environment/*.ps1
scripts/environment/*.bat

# Keep only example files
!**/*.example.json
!**/.env.example
```

- [ ] .gitignore updated
- [ ] Changes committed

---

## ? Priority 3: Update Application Configuration (Today)

### Update appsettings.json Files

For each `appsettings.json` file, replace hardcoded secrets with environment variable references:

**FMS.WebClient/appsettings.json**:
```json
{
  "ConnectionStrings": {
    "FMSConnection": "REPLACED_BY_ENV_VAR",
    "ATGConnection": "REPLACED_BY_ENV_VAR",
    "RedisConnection": "REPLACED_BY_ENV_VAR"
  },
  "EmailSettings": {
    "SmtpServer": "mail.example.com",
    "SmtpPort": 25,
    "UseSsl": false,
    "Username": "hy.gps@example.com",
    "Password": "REPLACED_BY_ENV_VAR",
    "FromAddress": "hy.gps@example.com",
    "FromDisplayName": "FMS Notifications"
  },
  "GPSGate": {
    "BaseUrl": "https://10.0.10.150/comGpsGate/api/v.1",
    "ApiKey": "REPLACED_BY_ENV_VAR",
    "ApplicationId": "12"
  },
  "GPSGateUser": {
    "Username": "kkagiri",
    "Password": "REPLACED_BY_ENV_VAR"
  },
  "JwtSettings": {
    "SecretKey": "REPLACED_BY_ENV_VAR",
    "Issuer": "Tenacity FMS",
    "Audience": "FMSUsers",
    "ExpireDays": 7
  }
}
```

**Note**: Ensure your application reads from environment variables. If not already implemented, you may need to update the configuration loading code in `Program.cs` or `Startup.cs`.

- [ ] All appsettings.json files updated
- [ ] No hardcoded secrets remain
- [ ] Application tested with new configuration

---

## ?? Verification Checklist

### Passwords Changed
- [ ] MySQL root password (10.0.10.150)
- [ ] MySQL ATG password (10.0.11.239)
- [ ] Email password (hy.gps@example.com)
- [ ] GPSGate API key
- [ ] GPSGate user password (kkagiri)
- [ ] JWT secret key (generate new one)

### Environment Variables Set
- [ ] Production server (10.0.10.153)
- [ ] Development server (if applicable)
- [ ] All FMS services restarted
- [ ] Application tested and working

### Git Repository Cleaned
- [ ] Sensitive files removed from tracking
- [ ] Example files created
- [ ] .gitignore updated
- [ ] Changes pushed to repository

### Application Updated
- [ ] All appsettings.json files updated
- [ ] Environment variable reading verified
- [ ] Application tested in all environments
- [ ] No hardcoded secrets remain in code

---

## ?? Testing After Changes

### 1. Test Database Connectivity
```bash
# Test FMS connection
mysql -h 10.0.10.150 -u fms_app -p -e "SELECT 1;"

# Test ATG connection
mysql -h 10.0.11.239 -u kkagiri -p -e "SELECT 1;"
```

### 2. Test Email Sending
- Log into FMS application
- Trigger a notification
- Verify email is sent successfully

### 3. Test GPSGate Integration
- Access GPS tracking features
- Verify data is loading
- Check for API errors in logs

### 4. Test Application Login
- Clear browser cache
- Log in with existing credentials
- Verify JWT authentication works

---

## ?? If Something Breaks

### Rollback Plan

If the application breaks after changes:

1. **Check IIS Application Pools**:
```powershell
Get-IISAppPool | Where-Object {$_.Name -like "*fms*"}
```

2. **Check Windows Event Logs**:
```powershell
Get-EventLog -LogName Application -Source "FMS*" -Newest 50
```

3. **Verify Environment Variables**:
```powershell
[Environment]::GetEnvironmentVariable('ConnectionStrings__FMSConnection', 'Machine')
```

4. **Check Application Logs**:
- `C:\Logs\FMS.Webclient\errors\`
- `C:\Logs\FMS.PTS\`

5. **Temporarily Use Old Connection String** (only if emergency):
   - Edit appsettings.json with new passwords
   - Restart services
   - DO NOT commit to git!

---

## ?? Emergency Contacts

**If you need help**:
- Development Lead: kevin.kagiri@example.com
- Database Administrator: [Add contact]
- System Administrator: [Add contact]

**For critical production issues**:
- Restore from backup if needed
- Contact your team immediately
- Document all actions taken

---

## ?? Progress Tracking

**Started**: ________________ (Date/Time)
**Completed**: ________________ (Date/Time)
**Verified By**: ________________
**Sign-off**: ________________

---

## Next Steps (After Immediate Actions)

Once immediate actions are complete:

1. **Schedule Git History Cleanup** (Week 2)
   - Use BFG Repo-Cleaner to remove secrets from git history
   - Coordinate with all developers
   - Force push cleaned repository

2. **Implement Pre-Commit Hooks** (Week 2)
   - Install git-secrets
   - Configure secret patterns
   - Train team on usage

3. **Add CI/CD Security Scanning** (Week 2)
   - Add Gitleaks to GitHub Actions
   - Add dependency scanning
   - Add manual approval for production

4. **Security Training** (Month 1)
   - Conduct team security training
   - Review secure coding practices
   - Establish security policies

---

**Remember**: Speed is critical, but accuracy is important. Double-check each password change before proceeding to the next step.

**Good luck! ???**
