# Service installation script with robust path handling
param(
    [Parameter(Mandatory=$false)]
    [string]$InstallPath = $null,
    [int]$Port = 54098,
    [string]$ServiceUser = "NT SERVICE\FMS.PTS.Service",
    [string]$BasePath = "ptswebsocket"
)

$ErrorActionPreference = "Stop"

# Robust script location handling
function Get-ScriptLocation {
    if ($PSScriptRoot) {
        return $PSScriptRoot
    }
    
    if ($MyInvocation.MyCommand.Path) {
        return Split-Path -Parent $MyInvocation.MyCommand.Path
    }
    
    # Fallback to current directory if running interactively
    $currentLocation = Get-Location
    Write-Warning "Using current directory: $currentLocation"
    return $currentLocation
}

# Service configuration
$serviceName = "FMS.PTS.Service"
$serviceDisplayName = "FMS PTS Service"
$serviceDescription = "Manages PTS device communications and monitoring"

# Determine installation path
if (-not $InstallPath) {
    $InstallPath = Get-ScriptLocation
}

Write-Host "Using installation path: $InstallPath"
$serviceExecutable = Join-Path -Path $InstallPath -ChildPath "FMS.PTS.WindowsService.exe"

# Verify executable exists
if (-not (Test-Path $serviceExecutable)) {
    throw "Service executable not found at: $serviceExecutable`nPlease ensure the executable exists or specify the correct path using -InstallPath parameter."
}

function Test-AdminPrivileges {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Rest of the installation functions remain the same...

# Main installation logic
try {
    if (-not (Test-AdminPrivileges)) {
        throw "This script requires administrative privileges. Please run as administrator."
    }
    
    Write-Host "Starting FMS PTS Service installation..."
    Write-Host "Service executable: $serviceExecutable"
    
    # Installation steps continue as before...
    
} catch {
    Write-Error "Installation failed: $_"
    Write-Host "`nTroubleshooting information:"
    Write-Host "Current location: $(Get-Location)"
    Write-Host "Script location: $(Get-ScriptLocation)"
    Write-Host "Executable path: $serviceExecutable"
    Write-Host "Path exists: $(Test-Path $serviceExecutable)"
    exit 1
}