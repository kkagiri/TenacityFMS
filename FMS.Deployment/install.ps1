# Installation script for HyoungFMS Deployment Tool
# This script installs the deployment tool and sets up necessary permissions

param (
    [string]$InstallDir = "C:\HyoungFMS\Deployment",
    [switch]$Force
)

# Ensure running as administrator
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "This script must be run as Administrator. Please restart PowerShell as Administrator and try again."
    exit 1
}

# Create installation directory if it doesn't exist
if (-not (Test-Path -Path $InstallDir)) {
    Write-Host "Creating installation directory: $InstallDir"
    New-Item -Path $InstallDir -ItemType Directory -Force | Out-Null
} elseif ((Get-ChildItem -Path $InstallDir | Measure-Object).Count -gt 0 -and -not $Force) {
    Write-Error "Installation directory is not empty. Use -Force to overwrite."
    exit 1
}

# Get the script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Build the deployment tool
Write-Host "Building deployment tool..."
Push-Location $ScriptDir
dotnet publish -c Release -o "$ScriptDir\publish"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to build deployment tool."
    Pop-Location
    exit 1
}
Pop-Location

# Copy files to installation directory
Write-Host "Copying files to installation directory..."
Copy-Item -Path "$ScriptDir\publish\*" -Destination $InstallDir -Recurse -Force
Copy-Item -Path "$ScriptDir\deployment.cmd" -Destination $InstallDir -Force
Copy-Item -Path "$ScriptDir\appsettings.json" -Destination $InstallDir -Force
Copy-Item -Path "$ScriptDir\appsettings.development.json" -Destination $InstallDir -Force
Copy-Item -Path "$ScriptDir\appsettings.production.json" -Destination $InstallDir -Force

# Create logs directory
$LogsDir = Join-Path -Path $InstallDir -ChildPath "logs"
if (-not (Test-Path -Path $LogsDir)) {
    Write-Host "Creating logs directory: $LogsDir"
    New-Item -Path $LogsDir -ItemType Directory -Force | Out-Null
}

# Set permissions
Write-Host "Setting permissions..."
$Acl = Get-Acl -Path $InstallDir
$Rule = New-Object System.Security.AccessControl.FileSystemAccessRule("IIS_IUSRS", "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow")
$Acl.AddAccessRule($Rule)
$Rule = New-Object System.Security.AccessControl.FileSystemAccessRule("NETWORK SERVICE", "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow")
$Acl.AddAccessRule($Rule)
Set-Acl -Path $InstallDir -AclObject $Acl

# Set permissions on logs directory
$LogsAcl = Get-Acl -Path $LogsDir
$Rule = New-Object System.Security.AccessControl.FileSystemAccessRule("IIS_IUSRS", "Modify", "ContainerInherit,ObjectInherit", "None", "Allow")
$LogsAcl.AddAccessRule($Rule)
$Rule = New-Object System.Security.AccessControl.FileSystemAccessRule("NETWORK SERVICE", "Modify", "ContainerInherit,ObjectInherit", "None", "Allow")
$LogsAcl.AddAccessRule($Rule)
Set-Acl -Path $LogsDir -AclObject $LogsAcl

# Create a shortcut on the desktop
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\HyoungFMS Deployment.lnk")
$Shortcut.TargetPath = "cmd.exe"
$Shortcut.Arguments = "/k `"cd /d $InstallDir && deployment.cmd`""
$Shortcut.WorkingDirectory = $InstallDir
$Shortcut.IconLocation = "$InstallDir\HyoungFMS.Deployment.exe,0"
$Shortcut.Save()

Write-Host "Installation completed successfully!" -ForegroundColor Green
Write-Host "The deployment tool is installed at: $InstallDir"
Write-Host "A shortcut has been created on your desktop."
Write-Host ""
Write-Host "You can run the deployment tool using the following command:"
Write-Host "  $InstallDir\deployment.cmd"
Write-Host ""
Write-Host "Or use the shortcut on your desktop."