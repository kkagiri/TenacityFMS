# Production Environment Setup Scripts

This directory contains scripts for securely setting up environment variables on the production server.

## ðŸš€ Quick Start

### Step 1: Generate Strong Passwords

```powershell
# Run as Administrator
cd scripts/production
.\generate-passwords.ps1
```

This will generate cryptographically secure passwords for:
- MySQL FMS database (fms_app user)
- MySQL ATG database (kkagiri user)
- Email account (hy.gps@example.com)
- GPSGate API key
- GPSGate user password
- JWT secret key

**IMPORTANT**: Save these passwords to a secure password manager immediately!

---

### Step 2: Apply Passwords to Systems

Before setting environment variables, you must change the actual passwords on the systems:

#### MySQL FMS Database

```sql
-- Connect to MySQL
mysql -h 10.0.10.150 -u root -p

-- Create dedicated app user (if doesn't exist)
CREATE USER 'fms_app'@'%' IDENTIFIED BY 'NEW_PASSWORD_FROM_STEP1';
GRANT SELECT, INSERT, UPDATE, DELETE ON gpsdata.* TO 'fms_app'@'%';
FLUSH PRIVILEGES;

-- Or change existing user password
ALTER USER 'fms_app'@'%' IDENTIFIED BY 'NEW_PASSWORD_FROM_STEP1';
FLUSH PRIVILEGES;
```

#### MySQL ATG Database

```sql
mysql -h 10.0.11.239 -u kkagiri -p
ALTER USER 'kkagiri'@'%' IDENTIFIED BY 'NEW_PASSWORD_FROM_STEP1';
FLUSH PRIVILEGES;
```

#### Email Account

1. Log into webmail or email admin: `mail.example.com`
2. Change password for `hy.gps@example.com`
3. Enable 2FA if available

#### GPSGate

1. Log into admin panel: `https://10.0.10.150/comGpsGate`
2. **API Key**: Navigate to API settings â†’ Regenerate key
3. **User Password**: Change password for user `kkagiri`

---

### Step 3: Configure Environment Variables

```powershell
# Edit the script with your NEW passwords
notepad .\setup-production-env.ps1

# Replace all REPLACE_WITH_NEW_ placeholders with actual values
# Use the passwords generated in Step 1

# Test configuration (dry run - doesn't change anything)
.\setup-production-env.ps1 -DryRun

# Actually set the environment variables
.\setup-production-env.ps1
```

The script will:
- âœ“ Validate configuration (no placeholders left)
- âœ“ Set all environment variables at Machine level
- âœ“ Offer to restart IIS and services
- âœ“ Show next steps

---

### Step 4: Verify Configuration

```powershell
# Verify all environment variables are set correctly
.\verify-env.ps1
```

This will check:
- âœ“ All required environment variables are set
- âœ“ Values have correct format
- âœ“ No placeholder values remain
- âœ“ Services are running
- âœ“ Network connectivity to databases

---

### Step 5: Test Application

1. **Open application**: http://10.0.10.153
2. **Test login**: Try logging in with existing user
3. **Check logs**: `C:\Logs\FMS.Webclient\`
4. **Test features**:
   - Database operations
   - Email notifications
   - GPS tracking
   - Report generation

---

## ðŸ“„ Script Reference

### generate-passwords.ps1

**Purpose**: Generate cryptographically secure passwords

**Usage**:
```powershell
.\generate-passwords.ps1
```

**Features**:
- Generates strong random passwords (32+ characters)
- Uses cryptographically secure random number generator
- Optionally saves to encrypted file
- Provides implementation checklist

**Output**:
- MySQL FMS password (32 chars, alphanumeric)
- MySQL ATG password (32 chars, alphanumeric)
- Email password (24 chars, alphanumeric)
- GPSGate API key (64 chars hex)
- GPSGate user password (24 chars, alphanumeric)
- JWT secret key (64 chars hex)

---

### setup-production-env.ps1

**Purpose**: Set machine-level environment variables on production server

**Usage**:
```powershell
# Dry run (test without changing)
.\setup-production-env.ps1 -DryRun

# Actually set variables
.\setup-production-env.ps1
```

**Parameters**:
- `-DryRun`: Test configuration without making changes
- `-Verify`: Verify after setting (runs verify-env.ps1)

**Requirements**:
- Must run as Administrator
- Must replace all REPLACE_WITH_NEW_ placeholders
- Passwords must be changed on actual systems first

**Sets**:
- Database connection strings (FMS, ATG, Redis)
- Email settings (SMTP, credentials)
- GPSGate configuration (URL, API key, user)
- JWT settings (secret key, issuer, audience)
- Application settings

---

### verify-env.ps1

**Purpose**: Verify environment variables are configured correctly

**Usage**:
```powershell
.\verify-env.ps1
```

**Checks**:
- âœ“ All required variables are set
- âœ“ Variables have correct format
- âœ“ No placeholder values
- âœ“ Password strength (length)
- âœ“ Connection string format
- âœ“ Services are running
- âœ“ Network connectivity

**Exit Codes**:
- `0`: All checks passed
- `>0`: Number of issues found

---

## ðŸ”’ Security Best Practices

### DO:
- âœ“ Run scripts as Administrator
- âœ“ Generate strong passwords (use generate-passwords.ps1)
- âœ“ Save passwords in password manager (1Password, LastPass, etc.)
- âœ“ Use dedicated database users (not root!)
- âœ“ Enable 2FA on email accounts
- âœ“ Rotate passwords quarterly
- âœ“ Test thoroughly after changes
- âœ“ Document changes made
- âœ“ Delete password files after setup

### DON'T:
- âœ— Use weak passwords
- âœ— Use root for application database access
- âœ— Commit passwords to git
- âœ— Share passwords via email/chat
- âœ— Leave password files on servers
- âœ— Use same password for multiple systems
- âœ— Skip testing after changes

---

## ðŸ†˜ Troubleshooting

### Issue: "Not running as Administrator"

**Solution**:
```powershell
# Right-click PowerShell â†’ Run as Administrator
# Or from elevated prompt:
Start-Process powershell -Verb runAs
```

---

### Issue: "Placeholder values found"

**Solution**:
Edit `setup-production-env.ps1` and replace all `REPLACE_WITH_NEW_` values with actual passwords.

---

### Issue: "Cannot connect to MySQL"

**Possible Causes**:
1. Database server is down
2. Firewall blocking port 3306
3. Wrong IP address or port

**Solution**:
```powershell
# Test connectivity
Test-NetConnection -ComputerName 10.0.10.150 -Port 3306

# Check firewall
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*MySQL*"}

# Test from MySQL client
mysql -h 10.0.10.150 -u fms_app -p
```

---

### Issue: "Application not working after changes"

**Rollback Steps**:
1. Check IIS Application Pools:
   ```powershell
   Get-IISAppPool | Where-Object {$_.Name -like "*fms*"}
   ```

2. Check Windows Event Logs:
   ```powershell
   Get-EventLog -LogName Application -Source "FMS*" -Newest 50
   ```

3. Check Application Logs:
   - `C:\Logs\FMS.Webclient\errors\`
   - `C:\Logs\FMS.PTS\`

4. Verify environment variables:
   ```powershell
   .\verify-env.ps1
   ```

5. Restart services:
   ```powershell
   iisreset
   Restart-Service "FMS.PTS.WindowsService"
   ```

---

### Issue: "Email not sending"

**Checks**:
1. Verify email password is correct:
   ```powershell
   [Environment]::GetEnvironmentVariable('EmailSettings__Password', 'Machine')
   ```

2. Test SMTP connectivity:
   ```powershell
   Test-NetConnection -ComputerName mail.example.com -Port 25
   ```

3. Check application logs for SMTP errors

4. Verify email account is not locked

---

## ðŸ“ž Support

### Documentation
- **Setup Guide**: `/SECURITY_SETUP_GUIDE.md` (repository root)
- **Audit Report**: `/Documentation/Security/SECURITY_AUDIT_REPORT.md`
- **Action Checklist**: `/Documentation/Security/IMMEDIATE_ACTION_CHECKLIST.md`

### Contacts
- **Security Issues**: security@example.com
- **Development Lead**: kevin.kagiri@example.com
- **System Administrator**: [Add contact]

---

## âœ… Checklist

Use this checklist to track progress:

### Setup Phase
- [ ] Generated strong passwords (generate-passwords.ps1)
- [ ] Saved passwords to password manager
- [ ] Changed MySQL FMS database password
- [ ] Changed MySQL ATG database password
- [ ] Changed email password
- [ ] Regenerated GPSGate API key
- [ ] Changed GPSGate user password
- [ ] Generated new JWT secret key

### Configuration Phase
- [ ] Edited setup-production-env.ps1 with new values
- [ ] Ran dry run test (setup-production-env.ps1 -DryRun)
- [ ] Actually set environment variables (setup-production-env.ps1)
- [ ] Verified environment variables (verify-env.ps1)
- [ ] Restarted IIS (iisreset)
- [ ] Restarted FMS PTS Windows Service

### Testing Phase
- [ ] Application loads successfully
- [ ] User login works
- [ ] Database operations work
- [ ] Email notifications work
- [ ] GPS tracking works
- [ ] No errors in application logs

### Cleanup Phase
- [ ] Stored passwords in password manager
- [ ] Deleted password files from server
- [ ] Documented changes made
- [ ] Notified team of changes
- [ ] Updated runbooks/documentation

---

## ðŸ”„ Maintenance

### Quarterly Tasks
- [ ] Rotate all passwords
- [ ] Regenerate API keys
- [ ] Review access logs
- [ ] Update documentation

### Annual Tasks
- [ ] Security audit
- [ ] Penetration testing
- [ ] Review and update security policies
- [ ] Team security training

---

**Last Updated**: 2025-11-05
**Version**: 1.0
