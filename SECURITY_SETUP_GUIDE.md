# Security Setup Guide for Tenacity.FMS

## ?? Overview

This guide explains how to properly configure your local development environment and production servers without committing sensitive credentials to version control.

## ?? Important Security Rules

**NEVER commit the following to git:**
- Passwords (database, email, user accounts)
- API keys or tokens
- Connection strings with credentials
- Private keys or certificates
- Environment-specific configuration files

**ALWAYS use:**
- Environment variables for sensitive data
- `.example` files as templates
- `.gitignore` to prevent accidental commits

---

## ?? Initial Setup for New Developers

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/Tenacity.FMS.git
cd Tenacity.FMS
```

### 2. Set Up Backend Configuration

#### FMS.WebClient

```bash
# Copy example file
cp FMS.WebClient/appsettings.example.json FMS.WebClient/appsettings.json

# Edit with your credentials (never commit this file!)
# Replace all REPLACED_BY_ENV_VAR placeholders
```

**Required values:**
- `ConnectionStrings__FMSConnection`: MySQL database connection
- `ConnectionStrings__RedisConnection`: Redis connection
- `EmailSettings__Password`: Email account password
- `GPSGate__ApiKey`: GPSGate API key
- `JwtSettings__SecretKey`: JWT signing key (32+ characters)

#### FMS.PTS.WindowsService

```bash
# Copy example file
cp FMS.PTS.WindowsService/appsettings.example.json FMS.PTS.WindowsService/appsettings.json

# Edit with your credentials
```

#### FMS.Testing

```bash
# Create test configuration
cat > FMS.Testing/appsettings.Testing.json << 'EOF'
{
  "Testing": {
    "UseRealInfrastructure": false,
    "TestDeviceId": "TEST-DEVICE",
    "TestPumpId": 1,
    "TestNozzleId": 2
  },
  "ConnectionStrings": {
    "FMSConnection": "REPLACED_BY_ENV_VAR",
    "RedisConnection": "localhost:6379"
  }
}
EOF
```

?? **IMPORTANT**: Use a separate TEST database, never use production!

### 3. Set Up Frontend Configuration

```bash
# Copy example file
cp fms.frontend/.env.example fms.frontend/.env

# Edit with your API URLs
# Replace YOUR_PRIVATE_IP, YOUR_PUBLIC_IP, etc.
```

**For local development:**
```env
NODE_ENV=development
REACT_APP_FMS_ENVIRONMENT=development
REACT_APP_PRIVATE_FMS_API_URL=http://localhost:7009/api
REACT_APP_IS_LOCAL_DEV=true
```

**For production:**
```env
NODE_ENV=production
REACT_APP_FMS_ENVIRONMENT=production
REACT_APP_PRIVATE_FMS_API_URL=http://YOUR_PRIVATE_IP/api
REACT_APP_PUBLIC_FMS_API_URL=http://YOUR_PUBLIC_IP/api
REACT_APP_IS_LOCAL_DEV=false
```

---

## ??? Production Server Setup

### Option A: Using Environment Variables (Recommended)

Set machine-level environment variables on the production server:

```powershell
# Run as Administrator

# Database Connections
[Environment]::SetEnvironmentVariable('ConnectionStrings__FMSConnection',
  'server=YOUR_DB_HOST;port=3306;database=gpsdata;user=fms_app;password=YOUR_PASSWORD;connection timeout=2000;command timeout=2000;AllowZeroDateTime=True;',
  'Machine')

[Environment]::SetEnvironmentVariable('ConnectionStrings__ATGConnection',
  'server=YOUR_ATG_HOST;port=3306;database=azs;user=YOUR_USER;password=YOUR_PASSWORD;connection timeout=10000;command timeout=10000',
  'Machine')

[Environment]::SetEnvironmentVariable('ConnectionStrings__RedisConnection',
  'YOUR_REDIS_HOST:6379',
  'Machine')

# Email Settings
[Environment]::SetEnvironmentVariable('EmailSettings__SmtpServer', 'YOUR_SMTP_SERVER', 'Machine')
[Environment]::SetEnvironmentVariable('EmailSettings__SmtpPort', '25', 'Machine')
[Environment]::SetEnvironmentVariable('EmailSettings__Username', 'YOUR_EMAIL', 'Machine')
[Environment]::SetEnvironmentVariable('EmailSettings__Password', 'YOUR_EMAIL_PASSWORD', 'Machine')
[Environment]::SetEnvironmentVariable('EmailSettings__FromAddress', 'YOUR_EMAIL', 'Machine')

# API Keys
[Environment]::SetEnvironmentVariable('GPSGate__BaseUrl', 'https://YOUR_GPSGATE_HOST/comGpsGate/api/v.1', 'Machine')
[Environment]::SetEnvironmentVariable('GPSGate__ApiKey', 'YOUR_GPSGATE_API_KEY', 'Machine')

# GPSGate User
[Environment]::SetEnvironmentVariable('GPSGateUser__Username', 'YOUR_USERNAME', 'Machine')
[Environment]::SetEnvironmentVariable('GPSGateUser__Password', 'YOUR_PASSWORD', 'Machine')

# JWT Settings
[Environment]::SetEnvironmentVariable('JwtSettings__SecretKey', 'GENERATE_STRONG_32_CHAR_SECRET', 'Machine')
[Environment]::SetEnvironmentVariable('JwtSettings__Issuer', 'Tenacity FMS', 'Machine')
[Environment]::SetEnvironmentVariable('JwtSettings__Audience', 'FMSUsers', 'Machine')

Write-Host "Environment variables set successfully!" -ForegroundColor Green
Write-Host "Restart IIS for changes to take effect: iisreset" -ForegroundColor Yellow
```

After setting environment variables:

```powershell
# Restart IIS
iisreset

# Restart PTS Windows Service
Restart-Service "FMS.PTS.WindowsService"

# Verify
Get-Service | Where-Object {$_.Name -like "*FMS*"}
```

### Option B: Using Configuration Files (Less Secure)

If you must use configuration files in production:

1. Copy `.example.json` files to actual config files
2. Replace all placeholders with actual values
3. Set strict file permissions (read-only for service accounts)
4. Never commit these files to git
5. Consider encrypting sensitive sections

---

## ?? Security Best Practices

### 1. Strong Passwords

Generate strong passwords using:

```powershell
# PowerShell password generator
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

Or use a password manager like:
- 1Password
- LastPass
- Bitwarden

### 2. Database Security

**DO:**
- Create dedicated application users (not root!)
- Use least privilege principle
- Restrict by IP address
- Use different credentials for dev/prod
- Regular password rotation (90 days)

```sql
-- Create dedicated FMS application user
CREATE USER 'fms_app'@'%' IDENTIFIED BY 'STRONG_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE ON gpsdata.* TO 'fms_app'@'%';
FLUSH PRIVILEGES;

-- Restrict to specific IP
CREATE USER 'fms_app'@'10.0.10.153' IDENTIFIED BY 'STRONG_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE ON gpsdata.* TO 'fms_app'@'10.0.10.153';
FLUSH PRIVILEGES;
```

**DON'T:**
- Use root in applications
- Share credentials between environments
- Store passwords in code or git
- Use weak passwords

### 3. API Key Management

- Rotate API keys quarterly
- Use different keys for dev/prod
- Monitor API usage for anomalies
- Revoke unused keys immediately
- Document key owners and purposes

### 4. Git Security

Install pre-commit hooks to prevent secret commits:

```bash
# Install git-secrets (one-time setup)
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets
sudo make install

# Configure for FMS repository
cd /path/to/Tenacity.FMS
git secrets --install
git secrets --register-aws

# Add custom patterns
git secrets --add 'password\s*=\s*["\']?[^"\'\s]+'
git secrets --add 'apikey\s*=\s*["\']?[^"\'\s]+'
git secrets --add 'connectionstring.*password[^;]*'
git secrets --add '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}'

# Test
git secrets --scan
```

### 5. Email Security

- Use app-specific passwords (not main password)
- Enable 2FA on email accounts
- Limit SMTP relay to specific IPs
- Monitor email logs for abuse
- Use SPF, DKIM, DMARC records

---

## ?? Testing Your Configuration

### Test Database Connection

```bash
# MySQL
mysql -h YOUR_HOST -u YOUR_USER -p -e "SELECT 1;"

# Test from application
dotnet run --project FMS.WebClient -- --test-db-connection
```

### Test Email Configuration

```csharp
// Use the test endpoint
POST /api/notifications/test-email
{
  "to": "your-email@example.com",
  "subject": "Test Email",
  "body": "Testing email configuration"
}
```

### Test GPSGate Integration

```bash
# Test API key
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://YOUR_HOST/comGpsGate/api/v.1/applications/12/status
```

---

## ?? Configuration File Reference

### appsettings.json Structure

```json
{
  "ConnectionStrings": {
    "FMSConnection": "FROM_ENV_VAR",
    "ATGConnection": "FROM_ENV_VAR",
    "RedisConnection": "FROM_ENV_VAR"
  },
  "JwtSettings": {
    "SecretKey": "FROM_ENV_VAR",
    "Issuer": "Your Company",
    "Audience": "FMSUsers",
    "ExpireDays": 7
  },
  "EmailSettings": {
    "SmtpServer": "FROM_ENV_VAR",
    "SmtpPort": 25,
    "Username": "FROM_ENV_VAR",
    "Password": "FROM_ENV_VAR",
    "FromAddress": "FROM_ENV_VAR"
  },
  "GPSGate": {
    "BaseUrl": "FROM_ENV_VAR",
    "ApiKey": "FROM_ENV_VAR",
    "ApplicationId": "12"
  }
}
```

### .env File Structure (Frontend)

```env
# Environment
NODE_ENV=production
REACT_APP_FMS_ENVIRONMENT=production

# API URLs
REACT_APP_PRIVATE_FMS_API_URL=http://INTERNAL_IP/api
REACT_APP_PUBLIC_FMS_API_URL=http://PUBLIC_IP/api

# Feature Flags
REACT_APP_IS_LOCAL_DEV=false
```

---

## ?? Incident Response

### If Credentials Are Compromised

1. **Immediately change the compromised credentials**
2. **Review access logs for unauthorized access**
3. **Notify security team and management**
4. **Update all applications with new credentials**
5. **Audit other systems for similar exposures**
6. **Document the incident and response**

### If Secrets Are Committed to Git

1. **Change the exposed secrets immediately**
2. **Remove from git history** (see SECURITY_AUDIT_REPORT.md)
3. **Force push cleaned repository**
4. **Notify all team members**
5. **Audit for unauthorized access**

---

## ?? Support and Questions

**Security Issues**: security@example.com
**Development Lead**: kevin.kagiri@example.com
**Documentation**: See Documentation/Security/

---

## ? Setup Checklist

Use this checklist when setting up a new environment:

### Developer Setup
- [ ] Repository cloned
- [ ] `.example` files copied to actual config files
- [ ] All placeholders replaced with actual values
- [ ] Configuration files added to .gitignore
- [ ] Git pre-commit hooks installed
- [ ] Database connection tested
- [ ] Email sending tested
- [ ] Application runs successfully
- [ ] **Confirmed no secrets in `git status`**

### Production Setup
- [ ] Environment variables set on server
- [ ] Strong passwords generated
- [ ] Dedicated database user created
- [ ] API keys generated
- [ ] IIS restarted
- [ ] Windows services restarted
- [ ] Health checks passing
- [ ] Email notifications working
- [ ] Backup procedures verified
- [ ] Security audit completed

### Security Verification
- [ ] No passwords in git (`git log --all -S "password"`)
- [ ] No API keys in git
- [ ] `.env` files not tracked
- [ ] `appsettings.json` files not tracked
- [ ] Pre-commit hooks active
- [ ] 2FA enabled on critical accounts
- [ ] Access logs reviewed
- [ ] Team trained on security practices

---

**Remember**: Security is everyone's responsibility. When in doubt, ask!
