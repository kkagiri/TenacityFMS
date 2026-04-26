# ===============================================================================
# Production Environment Variables Setup Script
# Tenacy.FMS - Secure Configuration
# ===============================================================================
#
# IMPORTANT: This script sets machine-level environment variables
# Run as Administrator on the production server
#
# BEFORE RUNNING:
# 1. Change all exposed passwords (see IMMEDIATE_ACTION_CHECKLIST.md)
# 2. Generate new strong passwords (use generate-passwords.ps1)
# 3. Fill in the NEW values below (search for "REPLACE_WITH_NEW_")
# 4. Never commit this file with actual values to git!
#
# ===============================================================================

param(
    [switch]$DryRun = $false,
    [switch]$Verify = $false
)

# Colors for output
function Write-Success { param($Message) Write-Host "✓ $Message" -ForegroundColor Green }
function Write-Error { param($Message) Write-Host "✗ $Message" -ForegroundColor Red }
function Write-Warning { param($Message) Write-Host "⚠ $Message" -ForegroundColor Yellow }
function Write-Info { param($Message) Write-Host "ℹ $Message" -ForegroundColor Cyan }

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host " Tenacy.FMS - Production Environment Setup" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Error "This script must be run as Administrator!"
    Write-Host ""
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Success "Running as Administrator"
Write-Host ""

# ===============================================================================
# CONFIGURATION VALUES - REPLACE WITH YOUR NEW PASSWORDS
# ===============================================================================

Write-Info "Loading configuration..."

# Database Connection Strings
$Config = @{
    # MySQL FMS Database (REPLACE WITH NEW PASSWORD!)
    FMSConnection = "server=10.0.10.150;port=3306;database=gpsdata;user=fms_app;password=REPLACE_WITH_NEW_FMS_DB_PASSWORD;connection timeout=2000;command timeout=2000;AllowZeroDateTime=True;"

    # MySQL ATG Database (REPLACE WITH NEW PASSWORD!)
    ATGConnection = "server=10.0.11.239;port=3306;database=azs;user=kkagiri;password=REPLACE_WITH_NEW_ATG_DB_PASSWORD;connection timeout=10000;command timeout=10000"

    # Redis Connection
    RedisConnection = "10.0.10.154:6379"

    # Email Settings (REPLACE WITH NEW PASSWORD!)
    EmailSmtpServer = "mail.example.com"
    EmailSmtpPort = "25"
    EmailUseSsl = "false"
    EmailUsername = "hy.gps@example.com"
    EmailPassword = "REPLACE_WITH_NEW_EMAIL_PASSWORD"
    EmailFromAddress = "hy.gps@example.com"
    EmailFromDisplayName = "FMS Notifications"

    # GPSGate Settings (REPLACE WITH NEW API KEY!)
    GPSGateBaseUrl = "https://10.0.10.150/comGpsGate/api/v.1"
    GPSGateApiKey = "REPLACE_WITH_NEW_GPSGATE_API_KEY"
    GPSGateApplicationId = "12"

    # GPSGate User Credentials (REPLACE WITH NEW PASSWORD!)
    GPSGateUsername = "kkagiri"
    GPSGatePassword = "REPLACE_WITH_NEW_GPSGATE_USER_PASSWORD"

    # JWT Settings (GENERATE NEW SECRET KEY - 32+ CHARACTERS!)
    JwtSecretKey = "REPLACE_WITH_NEW_JWT_SECRET_32_CHARS_MIN"
    JwtIssuer = "Tenacy FMS"
    JwtAudience = "FMSUsers"
    JwtExpireDays = "7"

    # Application Settings
    SecretKey = "Tenacy2030"
    ApplicationId = "12"
    UploadStatusResponseDelay = "5000"
    FuelConsumptionReportID = "208"
    EndOfShiftTime = "18:59:59"
    StartOfShiftTime = "06:00:00"
}

Write-Success "Configuration loaded"
Write-Host ""

# ===============================================================================
# VALIDATION - Check for placeholder values
# ===============================================================================

Write-Info "Validating configuration..."

$hasPlaceholders = $false
$placeholderPattern = "REPLACE_WITH_NEW_"

foreach ($key in $Config.Keys) {
    if ($Config[$key] -like "*$placeholderPattern*") {
        Write-Error "Placeholder found in $key : $($Config[$key])"
        $hasPlaceholders = $true
    }
}

if ($hasPlaceholders) {
    Write-Host ""
    Write-Error "Configuration contains placeholder values!"
    Write-Host ""
    Write-Host "You must replace all REPLACE_WITH_NEW_ values with actual credentials." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Steps:" -ForegroundColor Yellow
    Write-Host "1. Change all passwords on the actual systems first" -ForegroundColor Yellow
    Write-Host "2. Edit this script and replace REPLACE_WITH_NEW_ with actual values" -ForegroundColor Yellow
    Write-Host "3. Run this script again" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To generate strong passwords, run:" -ForegroundColor Cyan
    Write-Host "  .\scripts\production\generate-passwords.ps1" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Success "No placeholder values found"
Write-Host ""

# ===============================================================================
# DRY RUN MODE - Show what would be set without actually setting
# ===============================================================================

if ($DryRun) {
    Write-Warning "DRY RUN MODE - No changes will be made"
    Write-Host ""
    Write-Host "The following environment variables would be set:" -ForegroundColor Yellow
    Write-Host ""

    Write-Host "Database Connections:" -ForegroundColor Cyan
    Write-Host "  ConnectionStrings__FMSConnection = [HIDDEN - contains password]"
    Write-Host "  ConnectionStrings__ATGConnection = [HIDDEN - contains password]"
    Write-Host "  ConnectionStrings__RedisConnection = $($Config.RedisConnection)"
    Write-Host ""

    Write-Host "Email Settings:" -ForegroundColor Cyan
    Write-Host "  EmailSettings__SmtpServer = $($Config.EmailSmtpServer)"
    Write-Host "  EmailSettings__SmtpPort = $($Config.EmailSmtpPort)"
    Write-Host "  EmailSettings__UseSsl = $($Config.EmailUseSsl)"
    Write-Host "  EmailSettings__Username = $($Config.EmailUsername)"
    Write-Host "  EmailSettings__Password = [HIDDEN]"
    Write-Host "  EmailSettings__FromAddress = $($Config.EmailFromAddress)"
    Write-Host "  EmailSettings__FromDisplayName = $($Config.EmailFromDisplayName)"
    Write-Host ""

    Write-Host "GPSGate Settings:" -ForegroundColor Cyan
    Write-Host "  GPSGate__BaseUrl = $($Config.GPSGateBaseUrl)"
    Write-Host "  GPSGate__ApiKey = [HIDDEN]"
    Write-Host "  GPSGate__ApplicationId = $($Config.GPSGateApplicationId)"
    Write-Host ""

    Write-Host "GPSGate User:" -ForegroundColor Cyan
    Write-Host "  GPSGateUser__Username = $($Config.GPSGateUsername)"
    Write-Host "  GPSGateUser__Password = [HIDDEN]"
    Write-Host ""

    Write-Host "JWT Settings:" -ForegroundColor Cyan
    Write-Host "  JwtSettings__SecretKey = [HIDDEN - length: $($Config.JwtSecretKey.Length) chars]"
    Write-Host "  JwtSettings__Issuer = $($Config.JwtIssuer)"
    Write-Host "  JwtSettings__Audience = $($Config.JwtAudience)"
    Write-Host "  JwtSettings__ExpireDays = $($Config.JwtExpireDays)"
    Write-Host ""

    Write-Host "Application Settings:" -ForegroundColor Cyan
    Write-Host "  SecretKey = [HIDDEN]"
    Write-Host "  ApplicationId = $($Config.ApplicationId)"
    Write-Host "  EndOfShiftTime = $($Config.EndOfShiftTime)"
    Write-Host "  StartOfShiftTime = $($Config.StartOfShiftTime)"
    Write-Host ""

    Write-Info "To actually set these values, run without -DryRun:"
    Write-Host "  .\scripts\production\setup-production-env.ps1" -ForegroundColor Cyan
    Write-Host ""
    exit 0
}

# ===============================================================================
# SET ENVIRONMENT VARIABLES
# ===============================================================================

Write-Info "Setting environment variables at Machine level..."
Write-Host ""

try {
    # Database Connection Strings
    Write-Host "Setting Database Connections..." -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable('ConnectionStrings__FMSConnection', $Config.FMSConnection, 'Machine')
    Write-Success "  ConnectionStrings__FMSConnection"

    [Environment]::SetEnvironmentVariable('ConnectionStrings__ATGConnection', $Config.ATGConnection, 'Machine')
    Write-Success "  ConnectionStrings__ATGConnection"

    [Environment]::SetEnvironmentVariable('ConnectionStrings__RedisConnection', $Config.RedisConnection, 'Machine')
    Write-Success "  ConnectionStrings__RedisConnection"

    # Email Settings
    Write-Host ""
    Write-Host "Setting Email Configuration..." -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable('EmailSettings__SmtpServer', $Config.EmailSmtpServer, 'Machine')
    Write-Success "  EmailSettings__SmtpServer"

    [Environment]::SetEnvironmentVariable('EmailSettings__SmtpPort', $Config.EmailSmtpPort, 'Machine')
    Write-Success "  EmailSettings__SmtpPort"

    [Environment]::SetEnvironmentVariable('EmailSettings__UseSsl', $Config.EmailUseSsl, 'Machine')
    Write-Success "  EmailSettings__UseSsl"

    [Environment]::SetEnvironmentVariable('EmailSettings__Username', $Config.EmailUsername, 'Machine')
    Write-Success "  EmailSettings__Username"

    [Environment]::SetEnvironmentVariable('EmailSettings__Password', $Config.EmailPassword, 'Machine')
    Write-Success "  EmailSettings__Password"

    [Environment]::SetEnvironmentVariable('EmailSettings__FromAddress', $Config.EmailFromAddress, 'Machine')
    Write-Success "  EmailSettings__FromAddress"

    [Environment]::SetEnvironmentVariable('EmailSettings__FromDisplayName', $Config.EmailFromDisplayName, 'Machine')
    Write-Success "  EmailSettings__FromDisplayName"

    # GPSGate Settings
    Write-Host ""
    Write-Host "Setting GPSGate Configuration..." -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable('GPSGate__BaseUrl', $Config.GPSGateBaseUrl, 'Machine')
    Write-Success "  GPSGate__BaseUrl"

    [Environment]::SetEnvironmentVariable('GPSGate__ApiKey', $Config.GPSGateApiKey, 'Machine')
    Write-Success "  GPSGate__ApiKey"

    [Environment]::SetEnvironmentVariable('GPSGate__ApplicationId', $Config.GPSGateApplicationId, 'Machine')
    Write-Success "  GPSGate__ApplicationId"

    # GPSGate User
    Write-Host ""
    Write-Host "Setting GPSGate User Credentials..." -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable('GPSGateUser__Username', $Config.GPSGateUsername, 'Machine')
    Write-Success "  GPSGateUser__Username"

    [Environment]::SetEnvironmentVariable('GPSGateUser__Password', $Config.GPSGatePassword, 'Machine')
    Write-Success "  GPSGateUser__Password"

    # JWT Settings
    Write-Host ""
    Write-Host "Setting JWT Configuration..." -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable('JwtSettings__SecretKey', $Config.JwtSecretKey, 'Machine')
    Write-Success "  JwtSettings__SecretKey"

    [Environment]::SetEnvironmentVariable('JwtSettings__Issuer', $Config.JwtIssuer, 'Machine')
    Write-Success "  JwtSettings__Issuer"

    [Environment]::SetEnvironmentVariable('JwtSettings__Audience', $Config.JwtAudience, 'Machine')
    Write-Success "  JwtSettings__Audience"

    [Environment]::SetEnvironmentVariable('JwtSettings__ExpireDays', $Config.JwtExpireDays, 'Machine')
    Write-Success "  JwtSettings__ExpireDays"

    # Application Settings
    Write-Host ""
    Write-Host "Setting Application Configuration..." -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable('SecretKey', $Config.SecretKey, 'Machine')
    Write-Success "  SecretKey"

    [Environment]::SetEnvironmentVariable('ApplicationId', $Config.ApplicationId, 'Machine')
    Write-Success "  ApplicationId"

    [Environment]::SetEnvironmentVariable('UploadStatusResponseDelay', $Config.UploadStatusResponseDelay, 'Machine')
    Write-Success "  UploadStatusResponseDelay"

    [Environment]::SetEnvironmentVariable('FuelConsumptionReportID', $Config.FuelConsumptionReportID, 'Machine')
    Write-Success "  FuelConsumptionReportID"

    [Environment]::SetEnvironmentVariable('EndOfShiftTime', $Config.EndOfShiftTime, 'Machine')
    Write-Success "  EndOfShiftTime"

    [Environment]::SetEnvironmentVariable('StartOfShiftTime', $Config.StartOfShiftTime, 'Machine')
    Write-Success "  StartOfShiftTime"

    Write-Host ""
    Write-Success "All environment variables set successfully!"

} catch {
    Write-Host ""
    Write-Error "Error setting environment variables: $_"
    Write-Host ""
    Write-Host "Check that you are running as Administrator" -ForegroundColor Yellow
    exit 1
}

# ===============================================================================
# RESTART SERVICES
# ===============================================================================

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host " Restarting Services" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Warning "Services need to be restarted for changes to take effect!"
Write-Host ""

$restart = Read-Host "Restart IIS and FMS services now? (Y/N)"

if ($restart -eq 'Y' -or $restart -eq 'y') {
    Write-Host ""
    Write-Info "Restarting IIS..."

    try {
        iisreset
        Write-Success "IIS restarted successfully"
    } catch {
        Write-Error "Failed to restart IIS: $_"
    }

    Write-Host ""
    Write-Info "Restarting FMS PTS Windows Service..."

    try {
        $service = Get-Service -Name "FMS.PTS.WindowsService" -ErrorAction SilentlyContinue

        if ($service) {
            Restart-Service "FMS.PTS.WindowsService" -Force
            Write-Success "FMS PTS Windows Service restarted"
        } else {
            Write-Warning "FMS.PTS.WindowsService not found - may need manual restart"
        }
    } catch {
        Write-Error "Failed to restart FMS service: $_"
    }

    Write-Host ""
    Write-Info "Checking service status..."
    Get-Service | Where-Object {$_.Name -like "*FMS*" -or $_.Name -like "*W3SVC*"} | Format-Table -Property Name, Status, DisplayName

} else {
    Write-Warning "Services not restarted - you MUST restart them manually!"
    Write-Host ""
    Write-Host "To restart manually:" -ForegroundColor Yellow
    Write-Host "  IIS: iisreset" -ForegroundColor Cyan
    Write-Host "  FMS Service: Restart-Service 'FMS.PTS.WindowsService'" -ForegroundColor Cyan
    Write-Host ""
}

# ===============================================================================
# COMPLETION
# ===============================================================================

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host " Environment Setup Complete!" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Verify environment variables:" -ForegroundColor Yellow
Write-Host "   .\scripts\production\verify-env.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Test database connectivity:" -ForegroundColor Yellow
Write-Host "   mysql -h 10.0.10.150 -u fms_app -p" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Test the application:" -ForegroundColor Yellow
Write-Host "   - Open: http://10.0.10.153" -ForegroundColor Cyan
Write-Host "   - Try logging in" -ForegroundColor Cyan
Write-Host "   - Check logs: C:\Logs\FMS.Webclient\" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Test email sending:" -ForegroundColor Yellow
Write-Host "   - Trigger a notification in the app" -ForegroundColor Cyan
Write-Host "   - Check email delivery" -ForegroundColor Cyan
Write-Host ""

Write-Warning "SECURITY REMINDER:"
Write-Host "  • Never commit this file with actual passwords to git!" -ForegroundColor Yellow
Write-Host "  • Keep this file secure and backed up safely" -ForegroundColor Yellow
Write-Host "  • Document any changes made" -ForegroundColor Yellow
Write-Host ""
