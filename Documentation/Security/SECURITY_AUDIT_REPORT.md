# Security Vulnerability Audit Report
## Hyoung.FMS Repository

**Audit Date**: 2025-11-05
**Auditor**: Claude Code
**Severity Level**: 🔴 **CRITICAL**

---

## Executive Summary

This security audit has identified **CRITICAL** vulnerabilities in the Hyoung.FMS repository that expose sensitive credentials, database passwords, API keys, and infrastructure details. Multiple secrets are committed to version control and are publicly accessible through the git history.

### Risk Assessment
- **Severity**: CRITICAL
- **Exposure**: Full database credentials, email passwords, API keys
- **Impact**: Complete system compromise possible
- **Remediation**: IMMEDIATE ACTION REQUIRED

---

## Critical Findings

### 🔴 1. Hardcoded Database Credentials in Committed Scripts

**Location**: `scripts/environment/setup-environment.ps1`
**Severity**: CRITICAL
**Status**: Currently committed and in git history

**Exposed Credentials**:
```powershell
# MySQL Database Credentials
server=10.0.10.150;port=3306;database=gpsdata;user=root;password=Niwewenamimi1000

# ATG Database Credentials
server=10.0.11.239;port=3306;database=azs;user=kkagiri;password=Hyoung2030

# GPSGate User Credentials
Username: kkagiri
Password: Niwewe1000
```

**Impact**:
- Root database access exposed
- Full read/write access to production database
- Credentials visible in git history to anyone with repository access
- Internal IP addresses exposed

**Recommendation**:
- **IMMEDIATE**: Change all exposed database passwords
- Remove this file from git history using `git filter-branch` or BFG Repo-Cleaner
- Use environment variables or Azure Key Vault for secrets

---

### 🔴 2. Email Credentials in Multiple Configuration Files

**Locations**:
- `FMS.WebClient/appsettings.json` (lines 116-120)
- `FMS.WebClient/appsettings.Development.json` (lines 34-43)
- `FMS.Deployment/appsettings.json` (lines 23-29)

**Exposed Credentials**:
```json
"EmailSettings": {
  "SmtpServer": "mail.hyoung.co.ke",
  "SmtpPort": 25,
  "Username": "hy.gps@hyoung.co.ke",
  "Password": "Hyoung2030"
}
```

**Impact**:
- Email account compromise
- Ability to send emails from official company domain
- Potential for phishing attacks using legitimate email credentials
- SMTP relay abuse

**Recommendation**:
- **IMMEDIATE**: Change email password
- Move to environment variables
- Use OAuth2 or app-specific passwords
- Enable 2FA on email account

---

### 🔴 3. Production API Keys Exposed

**Location**: `FMS.WebClient/appsettings.json` (lines 168-170)

**Exposed Credentials**:
```json
"GPSGate": {
  "BaseUrl": "https://10.0.10.150/comGpsGate/api/v.1",
  "ApiKey": "hk%2bXL3thlikm31JLAon0FjBxyyOtnrUOMCHIP%2bFfrhEXQPffqSrPDVGperVhCXPA",
  "ApplicationId": "12"
}
```

**Impact**:
- Unauthorized access to GPSGate API
- Ability to query, modify, or delete GPS tracking data
- Potential for vehicle tracking abuse
- API quota exhaustion attacks

**Recommendation**:
- **IMMEDIATE**: Rotate GPSGate API key
- Move to environment variables
- Implement API key rotation policy

---

### 🔴 4. Database Credentials in Test Configuration

**Location**: `FMS.Testing/appsettings.Testing.json` (line 9)

**Exposed Credentials**:
```json
"FMSConnection": "server=10.0.10.150;port=3306;database=gpsdata;user=root;password=Niwewenamimi1000"
```

**Impact**:
- Same root password exposed (again)
- Testing against production database (dangerous)
- Confirms production database location and credentials

**Recommendation**:
- **IMMEDIATE**: Use separate test database
- Never use root credentials for testing
- Move to environment variables

---

### 🟡 5. Frontend Environment File Committed

**Location**: `fms.frontend/.env`

**Exposed Information**:
```env
REACT_APP_PRIVATE_FMS_API_URL=http://10.0.10.153/api
REACT_APP_PUBLIC_FMS_API_URL=http://197.254.33.227/api
```

**Impact**:
- Internal network topology exposed
- Public IP address exposed
- API endpoints discoverable
- Network reconnaissance made easier

**Note**: While `.gitignore` has `*.env` pattern, this specific `.env` file is tracked and committed.

**Recommendation**:
- Remove from git tracking: `git rm --cached fms.frontend/.env`
- Add explicit entry to .gitignore
- Use example file instead: `.env.example`

---

### 🟡 6. Infrastructure and Network Details Exposed

**Locations**: Multiple configuration files

**Exposed Information**:
- Internal IP addresses: 10.0.10.150, 10.0.10.153, 10.0.11.90, 10.0.11.239
- Public IP: 197.254.33.227
- Network architecture and service locations
- IIS deployment paths: `C:\inetpub\wwwroot\hyoungFMS\`
- CI/CD runner paths: `C:\actions-runner\_work\Hyoung.FMS\`
- Log file locations: `C:\Logs\FMS.Webclient\`

**Impact**:
- Network mapping for potential attackers
- Infrastructure reconnaissance
- Attack surface expansion

---

### 🟡 7. CI/CD Pipeline Security Issues

**Location**: `.github/workflows/deploy-to-iis.yml`

**Issues Identified**:

1. **Self-Hosted Runner Without Secrets Management**
   - No use of GitHub Secrets for sensitive values
   - Deployment paths hardcoded
   - No environment variable validation

2. **No Security Scanning**
   - No secret scanning in pipeline
   - No dependency vulnerability scanning
   - No SAST/DAST tools

3. **Broad Deployment Triggers**
   - Deploys on push to multiple branches (productionv1, main, master)
   - No approval gates for production

**Recommendation**:
- Implement GitHub Secrets for all sensitive values
- Add secret scanning step
- Add dependency scanning (Dependabot, Snyk)
- Implement manual approval for production deployments
- Add security scanning gates

---

### 🟡 8. .gitignore Not Effective

**Issue**: Despite having patterns in `.gitignore`, many sensitive files are tracked:

**Patterns in .gitignore** (but files still committed):
```gitignore
*.env                    # But fms.frontend/.env is tracked
*.env.development        # Multiple appsettings files tracked
*.env.production
scripts/                 # Entire scripts/ directory is tracked
*.ps1                    # Multiple .ps1 files tracked
*.bat                    # Multiple .bat files tracked
```

**Root Cause**: Files were committed before being added to .gitignore

**Recommendation**:
```bash
# Remove from git tracking while keeping local files
git rm --cached fms.frontend/.env
git rm --cached -r scripts/
git rm --cached FMS.Testing/appsettings.Testing.json
git rm --cached FMS.Deployment/appsettings.json
git rm --cached FMS.Deployment/appsettings.development.json
git rm --cached FMS.WebClient/appsettings.json
git rm --cached FMS.WebClient/appsettings.Development.json
git rm --cached FMS.PTS.WindowsService/appsettings.json
```

---

## Remediation Priority Matrix

| Priority | Action | Timeline | Complexity |
|----------|--------|----------|------------|
| **P0** | Change all exposed passwords immediately | Within 24 hours | Low |
| **P0** | Rotate all API keys | Within 24 hours | Low |
| **P1** | Remove secrets from git history | Within 1 week | High |
| **P1** | Implement proper secrets management | Within 1 week | Medium |
| **P2** | Update .gitignore and remove tracked sensitive files | Within 2 weeks | Low |
| **P2** | Implement CI/CD security scanning | Within 2 weeks | Medium |
| **P3** | Security training for development team | Within 1 month | Low |

---

## Immediate Action Items (Next 24 Hours)

### 1. Change All Exposed Passwords

**Database Passwords**:
```sql
-- MySQL: Change root password
ALTER USER 'root'@'%' IDENTIFIED BY 'NEW_STRONG_PASSWORD';
FLUSH PRIVILEGES;

-- Create dedicated application user (don't use root)
CREATE USER 'fms_app'@'%' IDENTIFIED BY 'STRONG_APP_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE ON gpsdata.* TO 'fms_app'@'%';
FLUSH PRIVILEGES;
```

**Email Password**:
- Log into mail.hyoung.co.ke
- Change password for hy.gps@hyoung.co.ke
- Enable 2FA if available

**GPSGate API Key**:
- Log into GPSGate admin panel
- Regenerate API key for ApplicationId 12
- Update environment variables only (not code)

### 2. Set Up Environment Variables

**On Production Server**:
```powershell
# Database Connections
[Environment]::SetEnvironmentVariable('ConnectionStrings__FMSConnection', 'NEW_CONNECTION_STRING', 'Machine')

# Email Settings
[Environment]::SetEnvironmentVariable('EmailSettings__Password', 'NEW_EMAIL_PASSWORD', 'Machine')

# API Keys
[Environment]::SetEnvironmentVariable('GPSGate__ApiKey', 'NEW_API_KEY', 'Machine')
```

### 3. Update Configuration Files

Replace hardcoded values with environment variable references:
```json
{
  "ConnectionStrings": {
    "FMSConnection": "${ConnectionStrings__FMSConnection}"
  },
  "EmailSettings": {
    "Password": "${EmailSettings__Password}"
  }
}
```

---

## Long-Term Security Recommendations

### 1. Implement Proper Secrets Management

**Option A: Azure Key Vault** (Recommended)
- Store all secrets in Azure Key Vault
- Use managed identities for access
- Implement automatic rotation

**Option B: HashiCorp Vault**
- Self-hosted secrets management
- Dynamic secrets generation
- Audit logging

**Option C: GitHub Secrets** (For CI/CD)
- Store deployment secrets in GitHub
- Reference in workflows: `${{ secrets.DB_PASSWORD }}`

### 2. Clean Git History

**Using BFG Repo-Cleaner** (Recommended):
```bash
# Backup repository first
git clone --mirror https://github.com/Hyoung-EA/Hyoung.FMS.git

# Install BFG
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Remove sensitive files
java -jar bfg.jar --delete-files "*.env" Hyoung.FMS.git
java -jar bfg.jar --delete-folders "scripts" Hyoung.FMS.git
java -jar bfg.jar --delete-files "appsettings.json" Hyoung.FMS.git

# Cleanup
cd Hyoung.FMS.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (requires coordination)
git push --force
```

⚠️ **WARNING**: Force pushing rewrites history. Coordinate with all team members.

### 3. Implement Pre-Commit Hooks

**Install git-secrets**:
```bash
# Install git-secrets
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets
make install

# Configure for repository
cd /home/user/Hyoung.FMS
git secrets --install
git secrets --register-aws

# Add custom patterns
git secrets --add 'password\s*=\s*["\']?[^"\'\s]+'
git secrets --add 'apikey\s*=\s*["\']?[^"\'\s]+'
git secrets --add 'connectionstring\s*=\s*["\']?[^"\'\s]+'
```

### 4. Enhanced .gitignore

Create comprehensive `.gitignore`:
```gitignore
# Environment files
*.env
*.env.*
!*.env.example

# Configuration files with secrets
**/appsettings.json
**/appsettings.*.json
!**/appsettings.example.json

# Scripts with credentials
**/scripts/**/*.ps1
**/scripts/**/*.bat
**/setup-*.ps1
**/setup-*.bat

# Deployment configurations
**/deployment-config.json
**/deploy-settings.json

# Backup files
*.bak
*.backup

# Log files with potential sensitive data
logs/
*.log
```

### 5. CI/CD Security Enhancements

**Updated workflow** (`.github/workflows/deploy-to-iis.yml`):
```yaml
name: Deploy Hyoung FMS to IIS

on:
  push:
    branches: [productionv1]
  workflow_dispatch:

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Run Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'Hyoung.FMS'
          path: '.'
          format: 'HTML'

  deploy:
    needs: security-scan
    runs-on: self-hosted
    environment: production  # Requires manual approval

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      # Use secrets from GitHub Secrets
      - name: Deploy
        env:
          DB_CONNECTION: ${{ secrets.DB_CONNECTION }}
          EMAIL_PASSWORD: ${{ secrets.EMAIL_PASSWORD }}
          API_KEY: ${{ secrets.GPSGATE_API_KEY }}
        run: |
          # Deployment commands using environment variables
```

### 6. Security Policies

**Create `SECURITY.md`**:
```markdown
# Security Policy

## Reporting Security Vulnerabilities

Please report security vulnerabilities to: security@hyoung.co.ke

## Security Requirements

1. **Never commit secrets** to version control
2. **Use environment variables** for all sensitive configuration
3. **Enable pre-commit hooks** before committing
4. **Regular security audits** quarterly
5. **Dependency updates** monthly

## Development Guidelines

- Use `.env.example` files as templates
- Store secrets in Azure Key Vault (production)
- Use GitHub Secrets (CI/CD)
- Regular password rotation (90 days)
```

### 7. Developer Training

**Required Training Topics**:
1. Secure coding practices
2. Secrets management
3. Git security best practices
4. OWASP Top 10
5. Incident response procedures

---

## Compliance and Audit Trail

### Actions Taken
- [ ] All passwords changed (Within 24 hours)
- [ ] API keys rotated (Within 24 hours)
- [ ] Environment variables configured (Within 48 hours)
- [ ] Sensitive files removed from tracking (Within 1 week)
- [ ] Git history cleaned (Within 2 weeks)
- [ ] Pre-commit hooks installed (Within 2 weeks)
- [ ] CI/CD security scanning enabled (Within 2 weeks)
- [ ] Team security training completed (Within 1 month)

### Audit Log
| Date | Action | Performed By | Status |
|------|--------|--------------|--------|
| 2025-11-05 | Security audit completed | Claude Code | ✅ Complete |
| | | | |

---

## Additional Security Recommendations

### Network Security
1. **Implement IP Whitelisting**: Restrict database access to specific IP ranges
2. **Use VPN**: Require VPN for administrative access
3. **Enable Firewall Rules**: Restrict ports 3306 (MySQL) and others
4. **Use Private Network**: Keep databases on private network only

### Application Security
1. **Implement Rate Limiting**: Protect API endpoints
2. **Enable CORS Properly**: Restrict to known origins
3. **Use HTTPS**: Enforce TLS for all communications
4. **Implement WAF**: Web Application Firewall for production

### Monitoring and Alerting
1. **Enable Security Logging**: Log all authentication attempts
2. **Set Up Alerts**: Failed login attempts, unusual access patterns
3. **Implement SIEM**: Security Information and Event Management
4. **Regular Penetration Testing**: Annual third-party testing

---

## Conclusion

The current state of the repository presents **CRITICAL security risks** that require **immediate remediation**. The exposure of database credentials, email passwords, and API keys in version control creates significant vulnerabilities that could lead to:

- Complete database compromise
- Data breaches
- Unauthorized system access
- Financial and reputational damage

**Immediate action within 24 hours is required** to change all exposed credentials. Long-term remediation should be completed within 2 weeks to ensure ongoing security.

---

## Contact and Support

For questions regarding this audit:
- **Security Team**: security@hyoung.co.ke
- **Development Lead**: kevin.kagiri@hyoung.co.ke

For immediate security incidents:
- **Emergency Hotline**: [To be configured]
- **Incident Response**: [To be configured]

---

**Report Generated**: 2025-11-05
**Next Audit Scheduled**: 2025-12-05 (Post-remediation verification)
