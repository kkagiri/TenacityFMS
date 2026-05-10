# ===============================================================================
# Strong Password Generator for Tenacity.FMS
# ===============================================================================
#
# Generates cryptographically secure passwords for:
# - Database accounts
# - Email accounts
# - API keys
# - JWT secrets
#
# ===============================================================================

function Generate-StrongPassword {
    param(
        [int]$Length = 32,
        [switch]$Alphanumeric,
        [switch]$NoSpecialChars
    )

    if ($Alphanumeric -or $NoSpecialChars) {
        # Alphanumeric only (good for database passwords)
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    } else {
        # Full character set (good for secrets and keys)
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
    }

    $password = -join ((1..$Length) | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
    return $password
}

function Generate-HexKey {
    param([int]$Length = 64)

    $bytes = New-Object byte[] ($Length / 2)
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::Create()
    $rng.GetBytes($bytes)
    $hexKey = [System.BitConverter]::ToString($bytes).Replace('-', '')
    return $hexKey
}

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host " Strong Password Generator - Tenacity.FMS" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Generating NEW secure passwords..." -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: Save these passwords securely!" -ForegroundColor Red
Write-Host "           Use a password manager like 1Password, LastPass, or Bitwarden" -ForegroundColor Red
Write-Host ""

Start-Sleep -Seconds 2

# Generate passwords for each system
$passwords = @{}

Write-Host "===============================================================================" -ForegroundColor Green
Write-Host " DATABASE PASSWORDS" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host ""

Write-Host "MySQL FMS Database (user: fms_app):" -ForegroundColor Cyan
$passwords['FMS_DB'] = Generate-StrongPassword -Length 32 -Alphanumeric
Write-Host $passwords['FMS_DB'] -ForegroundColor White
Write-Host ""

Write-Host "MySQL ATG Database (user: kkagiri):" -ForegroundColor Cyan
$passwords['ATG_DB'] = Generate-StrongPassword -Length 32 -Alphanumeric
Write-Host $passwords['ATG_DB'] -ForegroundColor White
Write-Host ""

Write-Host "===============================================================================" -ForegroundColor Green
Write-Host " EMAIL PASSWORD" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Email Account (hy.gps@example.com):" -ForegroundColor Cyan
$passwords['EMAIL'] = Generate-StrongPassword -Length 24 -Alphanumeric
Write-Host $passwords['EMAIL'] -ForegroundColor White
Write-Host ""

Write-Host "===============================================================================" -ForegroundColor Green
Write-Host " GPSGATE CREDENTIALS" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host ""

Write-Host "GPSGate API Key:" -ForegroundColor Cyan
$passwords['GPSGATE_API'] = Generate-HexKey -Length 64
Write-Host $passwords['GPSGATE_API'] -ForegroundColor White
Write-Host ""

Write-Host "GPSGate User Password (user: kkagiri):" -ForegroundColor Cyan
$passwords['GPSGATE_USER'] = Generate-StrongPassword -Length 24 -Alphanumeric
Write-Host $passwords['GPSGATE_USER'] -ForegroundColor White
Write-Host ""

Write-Host "===============================================================================" -ForegroundColor Green
Write-Host " JWT SECRET KEY" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host ""

Write-Host "JWT Secret Key (minimum 32 characters):" -ForegroundColor Cyan
$passwords['JWT_SECRET'] = Generate-HexKey -Length 64
Write-Host $passwords['JWT_SECRET'] -ForegroundColor White
Write-Host ""

# ===============================================================================
# SAVE TO FILE (ENCRYPTED)
# ===============================================================================

Write-Host "===============================================================================" -ForegroundColor Yellow
Write-Host " SAVE PASSWORDS?" -ForegroundColor Yellow
Write-Host "===============================================================================" -ForegroundColor Yellow
Write-Host ""

$save = Read-Host "Save these passwords to an encrypted file? (Y/N)"

if ($save -eq 'Y' -or $save -eq 'y') {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $filename = "passwords_$timestamp.txt"
    $filepath = Join-Path $PSScriptRoot $filename

    $content = @"
================================================================================
Tenacity.FMS - Generated Passwords
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
================================================================================

CRITICAL: These are NEW passwords. You must:
1. Change passwords on actual systems (MySQL, email, GPSGate)
2. Update environment variables on servers
3. Test all applications
4. Delete this file after setup is complete!

================================================================================
DATABASE PASSWORDS
================================================================================

MySQL FMS Database (server: 10.0.10.150)
User: fms_app
Password: $($passwords['FMS_DB'])

To apply:
  mysql -h 10.0.10.150 -u root -p
  ALTER USER 'fms_app'@'%' IDENTIFIED BY '$($passwords['FMS_DB'])';
  FLUSH PRIVILEGES;

---

MySQL ATG Database (server: 10.0.11.239)
User: kkagiri
Password: $($passwords['ATG_DB'])

To apply:
  mysql -h 10.0.11.239 -u kkagiri -p
  ALTER USER 'kkagiri'@'%' IDENTIFIED BY '$($passwords['ATG_DB'])';
  FLUSH PRIVILEGES;

================================================================================
EMAIL PASSWORD
================================================================================

Account: hy.gps@example.com
Server: mail.example.com
Password: $($passwords['EMAIL'])

To apply:
  1. Log into webmail or email admin panel
  2. Change password for hy.gps@example.com
  3. Enable 2FA if available

================================================================================
GPSGATE CREDENTIALS
================================================================================

GPSGate API Key:
$($passwords['GPSGATE_API'])

To apply:
  1. Log into GPSGate admin panel: https://10.0.10.150/comGpsGate
  2. Navigate to API settings
  3. Regenerate API key
  4. Use the new key above OR the one generated by GPSGate

---

GPSGate User Password:
User: kkagiri
Password: $($passwords['GPSGATE_USER'])

To apply:
  1. Log into GPSGate admin panel
  2. Change password for user 'kkagiri'

================================================================================
JWT SECRET KEY
================================================================================

JWT Secret Key (64 characters):
$($passwords['JWT_SECRET'])

Use this in: JwtSettings__SecretKey environment variable

================================================================================
NEXT STEPS
================================================================================

1. Apply New Passwords:
   - Change MySQL passwords (both FMS and ATG)
   - Change email password
   - Rotate GPSGate API key
   - Change GPSGate user password

2. Update Production Server:
   - Edit scripts/production/setup-production-env.ps1
   - Replace REPLACE_WITH_NEW_ placeholders with values above
   - Run the script as Administrator

3. Test Everything:
   - Database connectivity
   - Email sending
   - GPSGate integration
   - User authentication

4. SECURITY:
   - Store these passwords in a password manager
   - Delete this file: $filename
   - Never commit passwords to git!

================================================================================
"@

    $content | Out-File -FilePath $filepath -Encoding UTF8

    Write-Host ""
    Write-Host "? Passwords saved to: $filepath" -ForegroundColor Green
    Write-Host ""
    Write-Warning "SECURITY WARNING:"
    Write-Host "  • This file contains sensitive passwords!" -ForegroundColor Yellow
    Write-Host "  • Store in a password manager immediately" -ForegroundColor Yellow
    Write-Host "  • Delete this file after setup is complete" -ForegroundColor Yellow
    Write-Host "  • Never commit this file to git!" -ForegroundColor Yellow
    Write-Host ""

} else {
    Write-Host ""
    Write-Warning "Passwords not saved to file"
    Write-Host ""
    Write-Host "Make sure you've:" -ForegroundColor Yellow
    Write-Host "  • Copied all passwords to a secure password manager" -ForegroundColor Yellow
    Write-Host "  • Written them down in a secure location" -ForegroundColor Yellow
    Write-Host ""
}

# ===============================================================================
# CHECKLIST
# ===============================================================================

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host " IMPLEMENTATION CHECKLIST" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Apply New Passwords to Systems" -ForegroundColor Yellow
Write-Host "  [ ] MySQL FMS Database - Change fms_app password" -ForegroundColor White
Write-Host "  [ ] MySQL ATG Database - Change kkagiri password" -ForegroundColor White
Write-Host "  [ ] Email - Change hy.gps@example.com password" -ForegroundColor White
Write-Host "  [ ] GPSGate - Regenerate API key" -ForegroundColor White
Write-Host "  [ ] GPSGate - Change kkagiri user password" -ForegroundColor White
Write-Host ""

Write-Host "Step 2: Update Production Environment Variables" -ForegroundColor Yellow
Write-Host "  [ ] Edit setup-production-env.ps1 with new values" -ForegroundColor White
Write-Host "  [ ] Run setup-production-env.ps1 as Administrator" -ForegroundColor White
Write-Host "  [ ] Verify environment variables: verify-env.ps1" -ForegroundColor White
Write-Host ""

Write-Host "Step 3: Restart Services" -ForegroundColor Yellow
Write-Host "  [ ] Restart IIS: iisreset" -ForegroundColor White
Write-Host "  [ ] Restart FMS PTS Windows Service" -ForegroundColor White
Write-Host ""

Write-Host "Step 4: Test Everything" -ForegroundColor Yellow
Write-Host "  [ ] Test database connectivity" -ForegroundColor White
Write-Host "  [ ] Test email sending" -ForegroundColor White
Write-Host "  [ ] Test GPSGate integration" -ForegroundColor White
Write-Host "  [ ] Test user login" -ForegroundColor White
Write-Host "  [ ] Check application logs" -ForegroundColor White
Write-Host ""

Write-Host "Step 5: Clean Up" -ForegroundColor Yellow
Write-Host "  [ ] Store passwords in password manager" -ForegroundColor White
Write-Host "  [ ] Delete password file (if created)" -ForegroundColor White
Write-Host "  [ ] Document changes made" -ForegroundColor White
Write-Host ""

Write-Host "For detailed instructions, see:" -ForegroundColor Cyan
Write-Host "  Documentation/Security/IMMEDIATE_ACTION_CHECKLIST.md" -ForegroundColor White
Write-Host ""
