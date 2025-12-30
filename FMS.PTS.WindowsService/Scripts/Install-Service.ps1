# FMS PTS Windows Service Installation Script
# This script installs the FMS PTS Windows Service with proper configuration

param(
    [Parameter(Mandatory=$false)]
    [string]$InstallPath = $null,
    [int]$Port = 54098,
    [string]$ServiceUser = "NT SERVICE\FMS.PTS.Service",
    [string]$BasePath = "ptswebsocket",
    [switch]$SkipFirewall = $false,
    [switch]$SkipStartService = $false
)

$ErrorActionPreference = "Stop"

# Script configuration
$serviceName = "FMS.PTS.Service"
$serviceDisplayName = "FMS PTS Service"
$serviceDescription = "Fleet Management System - PTS Device Communication Service"
$logDirectory = "C:\Logs\FMS.PTS"

Write-Host "============================================" -ForegroundColor Green
Write-Host "FMS PTS Windows Service Installation Script" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

# Robust script location handling
function Get-ScriptLocation {
    if ($PSScriptRoot) {
        return Split-Path -Parent $PSScriptRoot
    }

    if ($MyInvocation.MyCommand.Path) {
        return Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
    }

    # Fallback to current directory if running interactively
    $currentLocation = Get-Location
    Write-Warning "Using current directory: $currentLocation"
    return $currentLocation
}

function Test-AdminPrivileges {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Test-Prerequisites {
    Write-Host "Checking prerequisites..." -ForegroundColor Yellow

    # Check .NET 8.0 Runtime
    try {
        $dotnetVersion = & dotnet --version 2>$null
        if ($LASTEXITCODE -eq 0 -and $dotnetVersion -ge "8.0") {
            Write-Host "✓ .NET Runtime found: $dotnetVersion" -ForegroundColor Green
        } else {
            throw ".NET 8.0 Runtime is required"
        }
    } catch {
        Write-Error ".NET 8.0 Runtime not found. Please install .NET 8.0 Runtime from https://dotnet.microsoft.com/download/dotnet/8.0"
        return $false
    }

    # Check if port is available
    try {
        $portInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($portInUse) {
            Write-Warning "Port $Port is currently in use. The service may not start properly."
        } else {
            Write-Host "✓ Port $Port is available" -ForegroundColor Green
        }
    } catch {
        Write-Host "✓ Port $Port appears to be available" -ForegroundColor Green
    }

    return $true
}

function Create-LogDirectory {
    Write-Host "Creating log directory..." -ForegroundColor Yellow

    if (-not (Test-Path $logDirectory)) {
        New-Item -Path $logDirectory -ItemType Directory -Force | Out-Null
        Write-Host "✓ Created log directory: $logDirectory" -ForegroundColor Green
    } else {
        Write-Host "✓ Log directory already exists: $logDirectory" -ForegroundColor Green
    }

    # Set permissions for service account
    try {
        icacls $logDirectory /grant "NT SERVICE\${serviceName}:(OI)(CI)F" /T | Out-Null
        Write-Host "✓ Set log directory permissions" -ForegroundColor Green
    } catch {
        Write-Warning "Could not set log directory permissions. The service may have issues writing logs."
    }
}

function Install-WindowsService {
    param([string]$ExecutablePath)

    Write-Host "Installing Windows Service..." -ForegroundColor Yellow

    # Check if service already exists
    $existingService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    if ($existingService) {
        Write-Host "Service already exists. Stopping and removing..." -ForegroundColor Yellow

        if ($existingService.Status -eq "Running") {
            Stop-Service -Name $serviceName -Force
            Start-Sleep -Seconds 3
        }

        # Remove existing service
        & sc.exe delete $serviceName | Out-Null
        Start-Sleep -Seconds 2
        Write-Host "✓ Removed existing service" -ForegroundColor Green
    }

    # Create new service
    Write-Host "Creating new service..." -ForegroundColor Yellow
    New-Service -Name $serviceName `
                -BinaryPathName $ExecutablePath `
                -DisplayName $serviceDisplayName `
                -Description $serviceDescription `
                -StartupType Automatic | Out-Null

    # Configure service recovery options
    & sc.exe failure $serviceName reset= 86400 actions= restart/5000/restart/5000/restart/5000 | Out-Null

    Write-Host "✓ Service installed successfully" -ForegroundColor Green
}

function Configure-FirewallRules {
    if ($SkipFirewall) {
        Write-Host "Skipping firewall configuration..." -ForegroundColor Yellow
        return
    }

    Write-Host "Configuring Windows Firewall..." -ForegroundColor Yellow

    try {
        # Remove existing rules if they exist
        Remove-NetFirewallRule -DisplayName "FMS PTS WebSocket" -ErrorAction SilentlyContinue

        # Create new firewall rule
        New-NetFirewallRule -DisplayName "FMS PTS WebSocket" `
                           -Direction Inbound `
                           -Protocol TCP `
                           -LocalPort $Port `
                           -Action Allow `
                           -Description "FMS PTS WebSocket communication port" | Out-Null

        Write-Host "✓ Firewall rule created for port $Port" -ForegroundColor Green
    } catch {
        Write-Warning "Could not configure firewall rules. You may need to configure them manually."
    }
}

function Test-ServiceInstallation {
    Write-Host "Verifying service installation..." -ForegroundColor Yellow

    $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    if (-not $service) {
        throw "Service was not installed correctly"
    }

    Write-Host "✓ Service is installed: $($service.DisplayName)" -ForegroundColor Green
    Write-Host "  Status: $($service.Status)" -ForegroundColor Cyan
    Write-Host "  Start Type: $($service.StartType)" -ForegroundColor Cyan
}

function Start-PTSService {
    if ($SkipStartService) {
        Write-Host "Skipping service start..." -ForegroundColor Yellow
        return
    }

    Write-Host "Starting FMS PTS Service..." -ForegroundColor Yellow

    try {
        Start-Service -Name $serviceName
        Start-Sleep -Seconds 5

        $service = Get-Service -Name $serviceName
        if ($service.Status -eq "Running") {
            Write-Host "✓ Service started successfully" -ForegroundColor Green
        } else {
            Write-Warning "Service was started but status is: $($service.Status)"
        }
    } catch {
        Write-Error "Failed to start service: $_"
        Write-Host "Check the Windows Event Log for details" -ForegroundColor Yellow
    }
}

function Show-PostInstallationInfo {
    Write-Host "`n============================================" -ForegroundColor Green
    Write-Host "Installation Complete!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green

    Write-Host "`nService Information:" -ForegroundColor Cyan
    Write-Host "  Name: $serviceName"
    Write-Host "  Display Name: $serviceDisplayName"
    Write-Host "  WebSocket Port: $Port"
    Write-Host "  Log Directory: $logDirectory"

    Write-Host "`nUseful Commands:" -ForegroundColor Cyan
    Write-Host "  Check Status: Get-Service -Name '$serviceName'"
    Write-Host "  Start Service: Start-Service -Name '$serviceName'"
    Write-Host "  Stop Service: Stop-Service -Name '$serviceName'"
    Write-Host "  View Logs: Get-Content '$logDirectory\pts-service-*.log' -Tail 50"
    Write-Host "  Event Logs: Get-EventLog -LogName Application -Source '$serviceName' -Newest 10"

    Write-Host "`nNext Steps:" -ForegroundColor Yellow
    Write-Host "1. Configure environment variables for database and Redis connections"
    Write-Host "2. Update appsettings.production.json with your specific configuration"
    Write-Host "3. Test WebSocket connectivity on port $Port"
    Write-Host "4. Monitor service logs for any startup issues"

    Write-Host "`nFor troubleshooting, check:" -ForegroundColor Yellow
    Write-Host "- Service logs in: $logDirectory"
    Write-Host "- Windows Event Log: Application -> $serviceName"
    Write-Host "- Network connectivity: Test-NetConnection localhost -Port $Port"
}

# Main installation logic
try {
    if (-not (Test-AdminPrivileges)) {
        throw "This script requires administrative privileges. Please run as administrator."
    }

    # Determine installation path
    if (-not $InstallPath) {
        $InstallPath = Get-ScriptLocation
    }

    Write-Host "Using installation path: $InstallPath" -ForegroundColor Cyan
    $serviceExecutable = Join-Path -Path $InstallPath -ChildPath "FMS.PTS.WindowsService.exe"

    # Verify executable exists
    if (-not (Test-Path $serviceExecutable)) {
        throw "Service executable not found at: $serviceExecutable`nPlease ensure the executable exists or specify the correct path using -InstallPath parameter."
    }

    Write-Host "Service executable: $serviceExecutable" -ForegroundColor Cyan

    # Run installation steps
    Test-Prerequisites
    Create-LogDirectory
    Install-WindowsService -ExecutablePath $serviceExecutable
    Configure-FirewallRules
    Test-ServiceInstallation
    Start-PTSService
    Show-PostInstallationInfo

    Write-Host "`n✓ Installation completed successfully!" -ForegroundColor Green

} catch {
    Write-Host "`n❌ Installation failed: $_" -ForegroundColor Red

    Write-Host "`nTroubleshooting information:" -ForegroundColor Yellow
    Write-Host "Current location: $(Get-Location)"
    Write-Host "Script location: $(Get-ScriptLocation)"
    Write-Host "Executable path: $serviceExecutable"
    Write-Host "Path exists: $(Test-Path $serviceExecutable -ErrorAction SilentlyContinue)"
    Write-Host "Admin privileges: $(Test-AdminPrivileges)"

    Write-Host "`nCommon solutions:" -ForegroundColor Yellow
    Write-Host "1. Ensure you're running PowerShell as Administrator"
    Write-Host "2. Check that the service executable exists in the installation path"
    Write-Host "3. Verify .NET 8.0 Runtime is installed"
    Write-Host "4. Check Windows Event Log for additional error details"

    exit 1
}