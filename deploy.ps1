# HyoungFMS Deployment Wrapper Script
# This script ensures the deployment tool runs with administrator privileges
# and handles command-line arguments for GitHub Actions integration

param (
    [switch]$frontendOnly,
    [switch]$backendOnly,
    [string]$environment = "production",
    [switch]$verbose,
    [switch]$noBackup,
    [switch]$skipHealthCheck,
    [switch]$rollbackOnFailure,
    [string]$logFile
)

# Function to check if running as administrator
function Test-Administrator {
    $currentUser = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Function to run a command with elevated privileges
function Invoke-ElevatedCommand {
    param (
        [string]$Command
    )

    $deploymentToolPath = "C:\HyoungFMS\Deployment\deployment.cmd"

    # Check if the deployment tool exists at the expected path
    if (-not (Test-Path $deploymentToolPath)) {
        Write-Warning "Deployment tool not found at $deploymentToolPath"
        Write-Host "Checking if we need to install the tool..."

        # Check if we have the installation script
        $installScriptPath = Join-Path $PSScriptRoot "FMS.Deployment\install.ps1"
        if (Test-Path $installScriptPath) {
            Write-Host "Found installation script at $installScriptPath"

            # Run the installation script with elevated privileges
            Write-Host "Installing deployment tool..."
            Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$installScriptPath`" -Force" -Verb RunAs -Wait

            # Check if installation was successful
            if (-not (Test-Path $deploymentToolPath)) {
                Write-Error "Failed to install deployment tool"
                exit 1
            }

            Write-Host "Deployment tool installed successfully"
        } else {
            Write-Error "Deployment tool not found and installation script not available"
            exit 1
        }
    }

    # Build the command arguments
    $cmdArgs = ""
    if ($frontendOnly) { $cmdArgs += " -f" }
    if ($backendOnly) { $cmdArgs += " -b" }
    if ($environment) { $cmdArgs += " -e $environment" }
    if ($verbose) { $cmdArgs += " -v" }
    if ($noBackup) { $cmdArgs += " -n" }
    if ($skipHealthCheck) { $cmdArgs += " -s" }
    if ($rollbackOnFailure) { $cmdArgs += " -r" }
    if ($logFile) { $cmdArgs += " -l `"$logFile`"" }

    # Create a log directory in the current location if it doesn't exist
    $logDir = Join-Path $PSScriptRoot "logs"
    if (-not (Test-Path $logDir)) {
        New-Item -Path $logDir -ItemType Directory -Force | Out-Null
    }

    # Execute the command with elevated privileges
    Write-Host "Running deployment command: $deploymentToolPath$cmdArgs"

    if (Test-Administrator) {
        # Already running as admin, execute directly
        $process = Start-Process -FilePath $deploymentToolPath -ArgumentList $cmdArgs -NoNewWindow -PassThru -Wait
    } else {
        # Need to elevate
        $process = Start-Process -FilePath $deploymentToolPath -ArgumentList $cmdArgs -Verb RunAs -PassThru -Wait
    }

    return $process.ExitCode
}

# Main script execution
try {
    # Check if running in GitHub Actions
    $inGitHubActions = $env:GITHUB_ACTIONS -eq "true"

    if ($inGitHubActions) {
        Write-Host "Running in GitHub Actions environment"

        # In GitHub Actions, the runner should already have the necessary permissions
        # We'll use the deployment tool directly
        $exitCode = Invoke-ElevatedCommand

        if ($exitCode -ne 0) {
            Write-Error "Deployment failed with exit code $exitCode"
            exit $exitCode
        }

        Write-Host "Deployment completed successfully"
    } else {
        Write-Host "Running in local environment"

        # Check if running as administrator
        if (-not (Test-Administrator)) {
            Write-Warning "Not running as administrator. Attempting to elevate privileges..."

            # Relaunch the script with elevated privileges
            $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""

            # Add the original parameters
            if ($frontendOnly) { $arguments += " -frontendOnly" }
            if ($backendOnly) { $arguments += " -backendOnly" }
            if ($environment -ne "production") { $arguments += " -environment `"$environment`"" }
            if ($verbose) { $arguments += " -verbose" }
            if ($noBackup) { $arguments += " -noBackup" }
            if ($skipHealthCheck) { $arguments += " -skipHealthCheck" }
            if ($rollbackOnFailure) { $arguments += " -rollbackOnFailure" }
            if ($logFile) { $arguments += " -logFile `"$logFile`"" }

            $process = Start-Process powershell.exe -ArgumentList $arguments -Verb RunAs -PassThru -Wait
            exit $process.ExitCode
        } else {
            # Already running as administrator
            Write-Host "Running with administrator privileges"

            $exitCode = Invoke-ElevatedCommand

            if ($exitCode -ne 0) {
                Write-Error "Deployment failed with exit code $exitCode"
                exit $exitCode
            }

            Write-Host "Deployment completed successfully"
        }
    }
} catch {
    Write-Error "An error occurred: $_"
    exit 1
}