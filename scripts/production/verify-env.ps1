# ===============================================================================
# Environment Variables Verification Script
# Hyoung.FMS - Production
# ===============================================================================
#
# This script verifies that all required environment variables are set
# and validates their format
#
# ===============================================================================

function Write-Success { param($Message) Write-Host "✓ $Message" -ForegroundColor Green }
function Write-Error { param($Message) Write-Host "✗ $Message" -ForegroundColor Red }
function Write-Warning { param($Message) Write-Host "⚠ $Message" -ForegroundColor Yellow }
function Write-Info { param($Message) Write-Host "ℹ $Message" -ForegroundColor Cyan }

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host " Environment Variables Verification" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

$issuesFound = 0

# ===============================================================================
# CHECK ENVIRONMENT VARIABLES
# ===============================================================================

Write-Info "Checking Machine-level environment variables..."
Write-Host ""

# Required environment variables
$requiredVars = @(
    @{Name='ConnectionStrings__FMSConnection'; Type='ConnectionString'; Pattern='server=.*password=.*'},
    @{Name='ConnectionStrings__ATGConnection'; Type='ConnectionString'; Pattern='server=.*password=.*'},
    @{Name='ConnectionStrings__RedisConnection'; Type='Simple'; Pattern='.+:\d+'},
    @{Name='EmailSettings__SmtpServer'; Type='Simple'; Pattern='.+'},
    @{Name='EmailSettings__SmtpPort'; Type='Number'; Pattern='^\d+$'},
    @{Name='EmailSettings__Username'; Type='Email'; Pattern='.+@.+'},
    @{Name='EmailSettings__Password'; Type='Secret'; Pattern='.{3,}'},
    @{Name='EmailSettings__FromAddress'; Type='Email'; Pattern='.+@.+'},
    @{Name='GPSGate__BaseUrl'; Type='URL'; Pattern='https?://.+'},
    @{Name='GPSGate__ApiKey'; Type='Secret'; Pattern='.{10,}'},
    @{Name='GPSGateUser__Username'; Type='Simple'; Pattern='.+'},
    @{Name='GPSGateUser__Password'; Type='Secret'; Pattern='.{3,}'},
    @{Name='JwtSettings__SecretKey'; Type='Secret'; Pattern='.{32,}'},
    @{Name='JwtSettings__Issuer'; Type='Simple'; Pattern='.+'},
    @{Name='JwtSettings__Audience'; Type='Simple'; Pattern='.+'}
)

Write-Host "Database Connections:" -ForegroundColor Yellow
Write-Host ""

# FMS Connection
$fmsConn = [Environment]::GetEnvironmentVariable('ConnectionStrings__FMSConnection', 'Machine')
if ($fmsConn) {
    if ($fmsConn -match 'server=.+;.*database=.+;.*user=.+;.*password=.+') {
        Write-Success "ConnectionStrings__FMSConnection is set"
        if ($fmsConn -match 'password=([^;]+)') {
            $passLength = $matches[1].Length
            Write-Info "  Password length: $passLength characters"
            if ($passLength -lt 12) {
                Write-Warning "  Password is short (< 12 characters) - consider using a stronger password"
                $issuesFound++
            }
        }
        if ($fmsConn -match 'user=root') {
            Write-Warning "  Using 'root' user - consider using a dedicated application user"
            $issuesFound++
        }
    } else {
        Write-Error "ConnectionStrings__FMSConnection has invalid format"
        $issuesFound++
    }
} else {
    Write-Error "ConnectionStrings__FMSConnection is NOT set"
    $issuesFound++
}

# ATG Connection
$atgConn = [Environment]::GetEnvironmentVariable('ConnectionStrings__ATGConnection', 'Machine')
if ($atgConn) {
    if ($atgConn -match 'server=.+;.*database=.+;.*user=.+;.*password=.+') {
        Write-Success "ConnectionStrings__ATGConnection is set"
    } else {
        Write-Error "ConnectionStrings__ATGConnection has invalid format"
        $issuesFound++
    }
} else {
    Write-Error "ConnectionStrings__ATGConnection is NOT set"
    $issuesFound++
}

# Redis Connection
$redisConn = [Environment]::GetEnvironmentVariable('ConnectionStrings__RedisConnection', 'Machine')
if ($redisConn) {
    if ($redisConn -match '.+:\d+') {
        Write-Success "ConnectionStrings__RedisConnection is set ($redisConn)"
    } else {
        Write-Error "ConnectionStrings__RedisConnection has invalid format (expected: host:port)"
        $issuesFound++
    }
} else {
    Write-Error "ConnectionStrings__RedisConnection is NOT set"
    $issuesFound++
}

Write-Host ""
Write-Host "Email Configuration:" -ForegroundColor Yellow
Write-Host ""

# Email Settings
$emailServer = [Environment]::GetEnvironmentVariable('EmailSettings__SmtpServer', 'Machine')
$emailPort = [Environment]::GetEnvironmentVariable('EmailSettings__SmtpPort', 'Machine')
$emailUser = [Environment]::GetEnvironmentVariable('EmailSettings__Username', 'Machine')
$emailPass = [Environment]::GetEnvironmentVariable('EmailSettings__Password', 'Machine')
$emailFrom = [Environment]::GetEnvironmentVariable('EmailSettings__FromAddress', 'Machine')

if ($emailServer) { Write-Success "EmailSettings__SmtpServer: $emailServer" } else { Write-Error "EmailSettings__SmtpServer is NOT set"; $issuesFound++ }
if ($emailPort) { Write-Success "EmailSettings__SmtpPort: $emailPort" } else { Write-Error "EmailSettings__SmtpPort is NOT set"; $issuesFound++ }
if ($emailUser) { Write-Success "EmailSettings__Username: $emailUser" } else { Write-Error "EmailSettings__Username is NOT set"; $issuesFound++ }
if ($emailPass) {
    Write-Success "EmailSettings__Password is set (length: $($emailPass.Length) chars)"
    if ($emailPass.Length -lt 8) {
        Write-Warning "  Email password is short - consider using a stronger password"
        $issuesFound++
    }
} else {
    Write-Error "EmailSettings__Password is NOT set"
    $issuesFound++
}
if ($emailFrom) { Write-Success "EmailSettings__FromAddress: $emailFrom" } else { Write-Error "EmailSettings__FromAddress is NOT set"; $issuesFound++ }

Write-Host ""
Write-Host "GPSGate Configuration:" -ForegroundColor Yellow
Write-Host ""

# GPSGate Settings
$gpsUrl = [Environment]::GetEnvironmentVariable('GPSGate__BaseUrl', 'Machine')
$gpsKey = [Environment]::GetEnvironmentVariable('GPSGate__ApiKey', 'Machine')
$gpsUser = [Environment]::GetEnvironmentVariable('GPSGateUser__Username', 'Machine')
$gpsPass = [Environment]::GetEnvironmentVariable('GPSGateUser__Password', 'Machine')

if ($gpsUrl) { Write-Success "GPSGate__BaseUrl: $gpsUrl" } else { Write-Error "GPSGate__BaseUrl is NOT set"; $issuesFound++ }
if ($gpsKey) {
    Write-Success "GPSGate__ApiKey is set (length: $($gpsKey.Length) chars)"
    if ($gpsKey.Length -lt 20) {
        Write-Warning "  API key seems short - verify it's correct"
    }
} else {
    Write-Error "GPSGate__ApiKey is NOT set"
    $issuesFound++
}
if ($gpsUser) { Write-Success "GPSGateUser__Username: $gpsUser" } else { Write-Error "GPSGateUser__Username is NOT set"; $issuesFound++ }
if ($gpsPass) {
    Write-Success "GPSGateUser__Password is set (length: $($gpsPass.Length) chars)"
} else {
    Write-Error "GPSGateUser__Password is NOT set"
    $issuesFound++
}

Write-Host ""
Write-Host "JWT Configuration:" -ForegroundColor Yellow
Write-Host ""

# JWT Settings
$jwtKey = [Environment]::GetEnvironmentVariable('JwtSettings__SecretKey', 'Machine')
$jwtIssuer = [Environment]::GetEnvironmentVariable('JwtSettings__Issuer', 'Machine')
$jwtAudience = [Environment]::GetEnvironmentVariable('JwtSettings__Audience', 'Machine')

if ($jwtKey) {
    if ($jwtKey.Length -ge 32) {
        Write-Success "JwtSettings__SecretKey is set (length: $($jwtKey.Length) chars)"
    } else {
        Write-Error "JwtSettings__SecretKey is too short (minimum 32 characters required)"
        Write-Info "  Current length: $($jwtKey.Length) characters"
        $issuesFound++
    }
} else {
    Write-Error "JwtSettings__SecretKey is NOT set"
    $issuesFound++
}
if ($jwtIssuer) { Write-Success "JwtSettings__Issuer: $jwtIssuer" } else { Write-Error "JwtSettings__Issuer is NOT set"; $issuesFound++ }
if ($jwtAudience) { Write-Success "JwtSettings__Audience: $jwtAudience" } else { Write-Error "JwtSettings__Audience is NOT set"; $issuesFound++ }

# ===============================================================================
# CHECK FOR PLACEHOLDER VALUES
# ===============================================================================

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Yellow
Write-Host " Checking for Placeholder Values" -ForegroundColor Yellow
Write-Host "===============================================================================" -ForegroundColor Yellow
Write-Host ""

$placeholders = @(
    'REPLACE_WITH_NEW_',
    'REPLACED_BY_ENV_VAR',
    'YOUR_PASSWORD',
    'YOUR_API_KEY',
    'CHANGE_ME'
)

$allVars = Get-ChildItem Env: | Where-Object {
    $_.Name -like 'ConnectionStrings__*' -or
    $_.Name -like 'EmailSettings__*' -or
    $_.Name -like 'GPSGate__*' -or
    $_.Name -like 'GPSGateUser__*' -or
    $_.Name -like 'JwtSettings__*'
}

$foundPlaceholders = $false

foreach ($var in $allVars) {
    foreach ($placeholder in $placeholders) {
        if ($var.Value -like "*$placeholder*") {
            Write-Error "$($var.Name) contains placeholder: $placeholder"
            $foundPlaceholders = $true
            $issuesFound++
        }
    }
}

if (-not $foundPlaceholders) {
    Write-Success "No placeholder values found"
}

# ===============================================================================
# CHECK SERVICES
# ===============================================================================

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Yellow
Write-Host " Checking Services" -ForegroundColor Yellow
Write-Host "===============================================================================" -ForegroundColor Yellow
Write-Host ""

# Check IIS
$w3svc = Get-Service -Name "W3SVC" -ErrorAction SilentlyContinue
if ($w3svc) {
    if ($w3svc.Status -eq 'Running') {
        Write-Success "IIS (W3SVC) is running"
    } else {
        Write-Warning "IIS (W3SVC) is not running: $($w3svc.Status)"
    }
} else {
    Write-Warning "IIS (W3SVC) service not found"
}

# Check FMS PTS Windows Service
$fmsService = Get-Service -Name "FMS.PTS.WindowsService" -ErrorAction SilentlyContinue
if ($fmsService) {
    if ($fmsService.Status -eq 'Running') {
        Write-Success "FMS PTS Windows Service is running"
    } else {
        Write-Warning "FMS PTS Windows Service is not running: $($fmsService.Status)"
    }
} else {
    Write-Warning "FMS.PTS.WindowsService not found"
}

# ===============================================================================
# CONNECTIVITY TESTS
# ===============================================================================

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Yellow
Write-Host " Connectivity Tests" -ForegroundColor Yellow
Write-Host "===============================================================================" -ForegroundColor Yellow
Write-Host ""

Write-Info "Testing network connectivity..."
Write-Host ""

# Test MySQL FMS
if ($fmsConn -match 'server=([^;]+)') {
    $mysqlHost = $matches[1]
    if ($fmsConn -match 'port=(\d+)') {
        $mysqlPort = $matches[1]
    } else {
        $mysqlPort = 3306
    }

    try {
        $tcpTest = Test-NetConnection -ComputerName $mysqlHost -Port $mysqlPort -WarningAction SilentlyContinue
        if ($tcpTest.TcpTestSucceeded) {
            Write-Success "MySQL FMS ($mysqlHost:$mysqlPort) is reachable"
        } else {
            Write-Error "Cannot connect to MySQL FMS ($mysqlHost:$mysqlPort)"
            $issuesFound++
        }
    } catch {
        Write-Warning "Could not test MySQL FMS connectivity: $_"
    }
}

# Test Redis
if ($redisConn -match '([^:]+):(\d+)') {
    $redisHost = $matches[1]
    $redisPort = $matches[2]

    try {
        $tcpTest = Test-NetConnection -ComputerName $redisHost -Port $redisPort -WarningAction SilentlyContinue
        if ($tcpTest.TcpTestSucceeded) {
            Write-Success "Redis ($redisHost:$redisPort) is reachable"
        } else {
            Write-Warning "Cannot connect to Redis ($redisHost:$redisPort) - Redis might be optional"
        }
    } catch {
        Write-Warning "Could not test Redis connectivity: $_"
    }
}

# ===============================================================================
# SUMMARY
# ===============================================================================

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host " Verification Summary" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

if ($issuesFound -eq 0) {
    Write-Host "✓ ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Environment variables are configured correctly." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Test the application: http://10.0.10.153" -ForegroundColor Cyan
    Write-Host "  2. Check application logs: C:\Logs\FMS.Webclient\" -ForegroundColor Cyan
    Write-Host "  3. Test key features (login, database access, email, GPS)" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "✗ ISSUES FOUND: $issuesFound" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please fix the issues above before proceeding." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "  • Run: .\scripts\production\setup-production-env.ps1" -ForegroundColor Cyan
    Write-Host "  • Ensure all placeholder values are replaced" -ForegroundColor Cyan
    Write-Host "  • Restart services: iisreset" -ForegroundColor Cyan
    Write-Host "  • Check network connectivity to databases" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "For more information:" -ForegroundColor Cyan
Write-Host "  • SECURITY_SETUP_GUIDE.md" -ForegroundColor White
Write-Host "  • Documentation/Security/IMMEDIATE_ACTION_CHECKLIST.md" -ForegroundColor White
Write-Host ""

exit $issuesFound
