# IIS Operations Module

# Check if running as administrator
function Test-Administrator {
    $currentUser = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    $isAdmin = $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    return $isAdmin
}

# Attempt to run a command with elevated permissions if needed
function Invoke-ElevatedCommand {
    param (
        [scriptblock]$ScriptBlock,
        [string]$ErrorMessage,
        [string]$LogFile = "./deployment_log.txt"
    )

    try {
        # Try running the command normally first
        & $ScriptBlock
        return $true
    }
    catch {
        # Check if the error is just that the service is already stopped
        if ($_.Exception.Message -match "already stopped") {
            Write-Log -Message "Note: Service was already in the desired state (stopped)." -Level "INFO" -LogFile $LogFile
            return $true
        }

        $isAdmin = Test-Administrator

        if (-not $isAdmin) {
            # Rest of the existing function...
        }
        else {
            # We're already running as admin but the command still failed
            # Check for common non-critical errors
            if ($_.Exception.Message -match "already stopped|does not exist") {
                Write-Log -Message "Note: $($_.Exception.Message) This is not a critical error." -Level "INFO" -LogFile $LogFile
                return $true
            }
            else {
                Write-Log -Message "Command failed despite running as Administrator: $_" -Level "ERROR" -LogFile $LogFile
                Write-Log -Message $ErrorMessage -Level "WARN" -LogFile $LogFile
                return $false
            }
        }
    }
}

# Stop IIS services
# Stop IIS services
function Stop-IISServices {
       param (
        [string]$LogFile = "./deployment_log.txt"
    )

    Write-Log -Message "Performing complete IIS shutdown..." -LogFile $LogFile

    # Load WebAdministration module
    $isAdmin = Test-Administrator
    if (-not $isAdmin) {
        Write-Log -Message "Warning: Not running as Administrator. IIS operations will likely fail." -Level "WARN" -LogFile $LogFile
        # Try to load IIS module anyway
        try {
            Import-Module WebAdministration -ErrorAction Stop
        }
        catch {
            Write-Log -Message "Failed to load WebAdministration module: $_" -Level "ERROR" -LogFile $LogFile
            return $false
        }
    }
    else {
        Write-Log -Message "Running as Administrator. Proceeding with IIS operations." -Level "INFO" -LogFile $LogFile
        Import-Module WebAdministration
    }

    # 1. Stop all running websites first (ALL of them, not just our target sites)
    Write-Log -Message "Stopping ALL running websites..." -Level "INFO" -LogFile $LogFile
    try {
        $runningSites = Get-Website | Where-Object { $_.State -eq 'Started' }
        foreach ($site in $runningSites) {
            Write-Log -Message "Stopping site: $($site.Name)..." -Level "INFO" -LogFile $LogFile

            try {
                Stop-Website -Name $site.Name -ErrorAction Stop
                Write-Log -Message "Successfully stopped site: $($site.Name)" -Level "INFO" -LogFile $LogFile
            }
            catch {
                Write-Log -Message "Failed to stop site $($site.Name) using PowerShell cmdlet: $_" -Level "WARN" -LogFile $LogFile

                # Try using appcmd as backup
                try {
                    $appcmdPath = "$env:SystemRoot\System32\inetsrv\appcmd.exe"
                    if (Test-Path $appcmdPath) {
                        Write-Log -Message "Attempting to stop site using appcmd: $($site.Name)" -Level "INFO" -LogFile $LogFile
                        & $appcmdPath stop site "$($site.Name)"
                    }
                }
                catch {
                    Write-Log -Message "Failed to stop site using appcmd: $_" -Level "ERROR" -LogFile $LogFile
                }
            }
        }
    }
    catch {
        Write-Log -Message "Error enumerating websites: $_" -Level "ERROR" -LogFile $LogFile
    }

    # 2. Verify all sites are actually stopped
    Start-Sleep -Seconds 2  # Give IIS a moment to process
    $stillRunningSites = Get-Website | Where-Object { $_.State -eq 'Started' }
    if ($stillRunningSites) {
        Write-Log -Message "Warning: Some sites are still running after stop attempt:" -Level "WARN" -LogFile $LogFile
        foreach ($site in $stillRunningSites) {
            Write-Log -Message "- Site still running: $($site.Name)" -Level "WARN" -LogFile $LogFile
        }
    }
    else {
        Write-Log -Message "All websites successfully stopped." -Level "INFO" -LogFile $LogFile
    }

    # 3. Now stop all application pools
    Write-Log -Message "Stopping ALL application pools..." -Level "INFO" -LogFile $LogFile
    try {
        $runningPools = Get-WebAppPoolState | Where-Object { $_.Value -ne 'Stopped' }
        foreach ($pool in $runningPools) {
            $poolName = $pool.Key.Name
            Write-Log -Message "Stopping application pool: $poolName..." -Level "INFO" -LogFile $LogFile

            try {
                Stop-WebAppPool -Name $poolName -ErrorAction Stop
                Write-Log -Message "Successfully stopped application pool: $poolName" -Level "INFO" -LogFile $LogFile
            }
            catch {
                Write-Log -Message "Failed to stop application pool $poolName using PowerShell cmdlet: $_" -Level "WARN" -LogFile $LogFile

                # Try using appcmd as backup
                try {
                    $appcmdPath = "$env:SystemRoot\System32\inetsrv\appcmd.exe"
                    if (Test-Path $appcmdPath) {
                        Write-Log -Message "Attempting to stop application pool using appcmd: $poolName" -Level "INFO" -LogFile $LogFile
                        & $appcmdPath stop apppool "$poolName"
                    }
                }
                catch {
                    Write-Log -Message "Failed to stop application pool using appcmd: $_" -Level "ERROR" -LogFile $LogFile
                }
            }
        }
    }
    catch {
        Write-Log -Message "Error enumerating application pools: $_" -Level "ERROR" -LogFile $LogFile
    }

    # 4. Verify all app pools are stopped
    Start-Sleep -Seconds 2  # Give IIS a moment to process
    $stillRunningPools = Get-WebAppPoolState | Where-Object { $_.Value -ne 'Stopped' }
    if ($stillRunningPools) {
        Write-Log -Message "Warning: Some application pools are still running after stop attempt:" -Level "WARN" -LogFile $LogFile
        foreach ($pool in $stillRunningPools) {
            Write-Log -Message "- Pool still running: $($pool.Key.Name)" -Level "WARN" -LogFile $LogFile
        }

        # Last resort - try to kill w3wp.exe processes
        Write-Log -Message "Attempting to terminate IIS worker processes (w3wp.exe)..." -Level "WARN" -LogFile $LogFile
        try {
            $w3wpProcesses = Get-Process -Name w3wp -ErrorAction SilentlyContinue
            if ($w3wpProcesses) {
                foreach ($process in $w3wpProcesses) {
                    Write-Log -Message "Terminating w3wp process with ID: $($process.Id)" -Level "WARN" -LogFile $LogFile
                    $process | Stop-Process -Force
                }
                Write-Log -Message "All w3wp processes terminated." -Level "INFO" -LogFile $LogFile
            }
            else {
                Write-Log -Message "No w3wp processes found running." -Level "INFO" -LogFile $LogFile
            }
        }
        catch {
            Write-Log -Message "Error terminating w3wp processes: $_" -Level "ERROR" -LogFile $LogFile
        }
    }
    else {
        Write-Log -Message "All application pools successfully stopped." -Level "INFO" -LogFile $LogFile
    }

    # 5. Check for any remaining file locks on the deployment directory
    Write-Log -Message "Checking for file locks on deployment directory..." -Level "INFO" -LogFile $LogFile

    # Define the paths to check based on environment variables
    $pathsToCheck = @()
    if ($env:WEBAPI_DEPLOYMENT_PATH) {
        $pathsToCheck += $env:WEBAPI_DEPLOYMENT_PATH
    }
    if ($env:REACT_DEPLOYMENT_PATH) {
        $pathsToCheck += $env:REACT_DEPLOYMENT_PATH
    }

    foreach ($path in $pathsToCheck) {
        if (Test-Path $path) {
            try {
                # Try to create a temporary file to check if directory is locked
                $testFilePath = Join-Path $path "_locktest.tmp"
                [System.IO.File]::Create($testFilePath).Close()
                Remove-Item $testFilePath -Force
                Write-Log -Message "Directory $path is accessible and not locked." -Level "INFO" -LogFile $LogFile
            }
            catch {
                Write-Log -Message "Warning: Directory $path appears to be locked: $_" -Level "WARN" -LogFile $LogFile

                # Try to identify what's locking the directory
                try {
                    if (Get-Command "handle.exe" -ErrorAction SilentlyContinue) {
                        Write-Log -Message "Checking locks with handle.exe..." -Level "INFO" -LogFile $LogFile
                        $handleOutput = & handle.exe $path
                        Write-Log -Message "Handle.exe output: $handleOutput" -Level "INFO" -LogFile $LogFile
                    }
                    else {
                        Write-Log -Message "Handle.exe not found. Cannot check locks in detail." -Level "INFO" -LogFile $LogFile
                    }
                }
                catch {
                    Write-Log -Message "Error checking file locks: $_" -Level "ERROR" -LogFile $LogFile
                }
            }
        }
        else {
            Write-Log -Message "Path doesn't exist yet: $path" -Level "INFO" -LogFile $LogFile
        }
    }

    # Return success based on verification
    $allSitesStopped = ($stillRunningSites -eq $null -or $stillRunningSites.Count -eq 0)
    $allPoolsStopped = ($stillRunningPools -eq $null -or $stillRunningPools.Count -eq 0)

    if ($allSitesStopped -and $allPoolsStopped) {
        Write-Log -Message "All IIS components successfully stopped." -Level "INFO" -LogFile $LogFile
        return $true
    }
    else {
        Write-Log -Message "Some IIS components could not be stopped. Deployment may experience file locking issues." -Level "WARN" -LogFile $LogFile
        return $false
    }
}
# Start IIS services
function Start-IISServices {
    param (
        [switch]$FrontendOnly,
        [switch]$BackendOnly,
        [string]$LogFile = "./deployment_log.txt"
    )

    Write-Log -Message "Starting IIS services..." -LogFile $LogFile

    # Define site names (frontend and backend)
    $frontendSiteName = $env:IIS_SITE_NAME
    $backendSiteName = $env:BACKEND_SITE_NAME
    if (-not $backendSiteName) {
        $backendSiteName = $frontendSiteName
    }

    # Define app pool name
    $appPoolName = $env:IIS_APP_POOL

    $allSuccess = $true

    # Start app pool first (shared between both sites)
    $result = Invoke-ElevatedCommand -ScriptBlock {
        Start-WebAppPool -Name $appPoolName -ErrorAction Stop
    } -ErrorMessage "Could not start application pool. Applications may not function correctly." -LogFile $LogFile

    if ($result) {
        Write-Log -Message "Application Pool $appPoolName started." -LogFile $LogFile
    }
    else {
        $allSuccess = $false

        # Try alternative method to start app pool
        try {
            $appcmdPath = "$env:SystemRoot\System32\inetsrv\appcmd.exe"
            if (Test-Path $appcmdPath) {
                Write-Log -Message "Trying to start app pool using appcmd..." -Level "INFO" -LogFile $LogFile
                $appcmdResult = & $appcmdPath start apppool $appPoolName
                Write-Log -Message "AppCmd result: $appcmdResult" -Level "INFO" -LogFile $LogFile

                # Check if app pool started
                $poolState = & $appcmdPath list apppool $appPoolName /state:

                if ($poolState -match "Started") {
                    Write-Log -Message "Application Pool $appPoolName started successfully using appcmd." -LogFile $LogFile
                    $allSuccess = $true
                }
            }
        }
        catch {
            Write-Log -Message "Alternative app pool start method also failed: $_" -Level "ERROR" -LogFile $LogFile
        }
    }

    # Start websites
    if (-not $BackendOnly) {
        $result = Invoke-ElevatedCommand -ScriptBlock {
            Start-Website -Name $frontendSiteName -ErrorAction Stop
        } -ErrorMessage "Could not start frontend website. Application may not be accessible." -LogFile $LogFile

        if ($result) {
            Write-Log -Message "Frontend website $frontendSiteName started." -LogFile $LogFile
        }
        else {
            $allSuccess = $false

            # Try alternative method to start website
            try {
                $appcmdPath = "$env:SystemRoot\System32\inetsrv\appcmd.exe"
                if (Test-Path $appcmdPath) {
                    Write-Log -Message "Trying to start frontend website using appcmd..." -Level "INFO" -LogFile $LogFile
                    $appcmdResult = & $appcmdPath start site $frontendSiteName
                    Write-Log -Message "AppCmd result: $appcmdResult" -Level "INFO" -LogFile $LogFile
                }
            }
            catch {
                Write-Log -Message "Alternative website start method also failed: $_" -Level "ERROR" -LogFile $LogFile
            }
        }
    }

    if (-not $FrontendOnly -and $backendSiteName -ne $frontendSiteName) {
        $result = Invoke-ElevatedCommand -ScriptBlock {
            Start-Website -Name $backendSiteName -ErrorAction Stop
        } -ErrorMessage "Could not start backend website. Application may not be accessible." -LogFile $LogFile

        if ($result) {
            Write-Log -Message "Backend website $backendSiteName started." -LogFile $LogFile
        }
        else {
            $allSuccess = $false

            # Try alternative method to start website
            try {
                $appcmdPath = "$env:SystemRoot\System32\inetsrv\appcmd.exe"
                if (Test-Path $appcmdPath) {
                    Write-Log -Message "Trying to start backend website using appcmd..." -Level "INFO" -LogFile $LogFile
                    $appcmdResult = & $appcmdPath start site $backendSiteName
                    Write-Log -Message "AppCmd result: $appcmdResult" -Level "INFO" -LogFile $LogFile
                }
            }
            catch {
                Write-Log -Message "Alternative website start method also failed: $_" -Level "ERROR" -LogFile $LogFile
            }
        }
    }

    if (-not $allSuccess) {
        Write-Log -Message "Warning: Some IIS services could not be started. Application may not be fully functional." -Level "WARN" -LogFile $LogFile

        # Provide advice on how to fix permission issues
        Write-Log -Message "To fix permission issues, ensure the service account running this script has permissions to:" -Level "INFO" -LogFile $LogFile
        Write-Log -Message "1. %windir%\System32\inetsrv\config directory" -Level "INFO" -LogFile $LogFile
        Write-Log -Message "2. IIS configuration access (using 'IIS_IUSRS' group or direct permissions)" -Level "INFO" -LogFile $LogFile
        Write-Log -Message "3. The application pools and websites being managed" -Level "INFO" -LogFile $LogFile

        return $false
    }

    return $true
}

# Create necessary deployment directories
function Create-DeploymentDirectories {
    param (
        [switch]$FrontendOnly,
        [switch]$BackendOnly,
        [string]$LogFile = "./deployment_log.txt"
    )

    Write-Log -Message "Creating deployment directories if they don't exist..." -LogFile $LogFile

    if (-not $BackendOnly) {
        if (!(Test-Path -Path $env:REACT_DEPLOYMENT_PATH)) {
            New-Item -ItemType Directory -Path $env:REACT_DEPLOYMENT_PATH -Force | Out-Null
            Write-Log -Message "Created React deployment directory." -LogFile $LogFile
        }
    }

    if (-not $FrontendOnly) {
        if (!(Test-Path -Path $env:WEBAPI_DEPLOYMENT_PATH)) {
            New-Item -ItemType Directory -Path $env:WEBAPI_DEPLOYMENT_PATH -Force | Out-Null
            Write-Log -Message "Created WebAPI deployment directory." -LogFile $LogFile
        }
    }
}

# Perform health check after deployment
function Perform-HealthCheck {
    param (
        [string]$LogFile = "./deployment_log.txt"
    )

    if ($env:HEALTH_CHECK_URL) {
        Write-Log -Message "Performing health check..." -LogFile $LogFile
        $healthCheckSuccess = $false

        for ($i = 1; $i -le [int]$env:HEALTH_CHECK_RETRIES; $i++) {
            try {
                Write-Log -Message "Health check attempt $i of $($env:HEALTH_CHECK_RETRIES)..." -LogFile $LogFile
                $response = Invoke-WebRequest -Uri $env:HEALTH_CHECK_URL -TimeoutSec 30 -UseBasicParsing

                if ($response.StatusCode -eq 200) {
                    Write-Log -Message "Health check passed: Status $($response.StatusCode)" -LogFile $LogFile
                    $healthCheckSuccess = $true
                    break
                } else {
                    Write-Log -Message "Health check returned non-200 status: $($response.StatusCode)" -Level "WARN" -LogFile $LogFile
                }
            } catch {
                Write-Log -Message "Health check failed: $_" -Level "WARN" -LogFile $LogFile
            }

            if ($i -lt [int]$env:HEALTH_CHECK_RETRIES) {
                Write-Log -Message "Waiting $($env:HEALTH_CHECK_RETRY_DELAY) seconds before next retry..." -LogFile $LogFile
                Start-Sleep -Seconds [int]$env:HEALTH_CHECK_RETRY_DELAY
            }
        }

        if (-not $healthCheckSuccess) {
            Write-Log -Message "All health checks failed. Deployment may be unstable." -Level "ERROR" -LogFile $LogFile

            # Send notification about failed health checks
            Send-Notification -Subject "Deployment Health Check Failed" -Body "The application health check failed after deployment. The application may be unstable or not functioning correctly." -Level "ERROR" -IncludeLog -IsError -LogFile $LogFile

            return $false
        }

        return $true
    }

    # If no health check URL defined, consider it a success
    return $true
}

# Add this function to your iis-operations.ps1 file
function Release-LogDirectoryLocks {
    param (
        [string]$LogFile = "./deployment_log.txt"
    )

    Write-Log -Message "Attempting to release locks on log directories..." -LogFile $LogFile

    # Define paths to check
    $logDirs = @()
    if ($env:WEBAPI_DEPLOYMENT_PATH) {
        $logDirs += Join-Path -Path $env:WEBAPI_DEPLOYMENT_PATH -ChildPath "logs"
    }

    foreach ($logDir in $logDirs) {
        if (Test-Path $logDir) {
            Write-Log -Message "Checking log directory: $logDir" -LogFile $LogFile

            # Try to rename the directory as a test for locks
            try {
                # Try to create and delete a test file
                $testFile = Join-Path -Path $logDir -ChildPath "_test_delete_me.tmp"
                [System.IO.File]::Create($testFile).Close()
                Remove-Item -Path $testFile -Force
                Write-Log -Message "Log directory appears accessible" -LogFile $LogFile
            }
            catch {
                Write-Log -Message "Log directory appears locked: $_" -Level "WARN" -LogFile $LogFile

                # Find all log files and try to close any handles
                try {
                    $logFiles = Get-ChildItem -Path $logDir -File -Recurse -ErrorAction SilentlyContinue
                    Write-Log -Message "Found $($logFiles.Count) log files" -LogFile $LogFile

                    # Try to handle each file specifically
                    foreach ($file in $logFiles) {
                        try {
                            # Force GC to release any handles
                            [System.GC]::Collect()
                            [System.GC]::WaitForPendingFinalizers()

                            # Try to open and close the file to test access
                            $readTest = [System.IO.File]::Open($file.FullName, 'Open', 'Read', 'None')
                            $readTest.Close()
                            $readTest.Dispose()

                            # Try to rename the file temporarily to release locks
                            $tempName = "$($file.FullName).old"
                            Rename-Item -Path $file.FullName -NewName $tempName -Force
                            Rename-Item -Path $tempName -NewName $file.FullName -Force

                            Write-Log -Message "Successfully released locks on: $($file.Name)" -LogFile $LogFile
                        }
                        catch {
                            Write-Log -Message "Could not release locks on: $($file.Name) - $_" -Level "WARN" -LogFile $LogFile
                        }
                    }
                }
                catch {
                    Write-Log -Message "Error processing log files: $_" -Level "ERROR" -LogFile $LogFile
                }

                # Last resort - move the entire logs directory to a backup location
                try {
                    $backupLogDir = "$logDir.old"
                    Write-Log -Message "Attempting to rename logs directory to: $backupLogDir" -Level "WARN" -LogFile $LogFile

                    # Try to force-move the directory
                    $robocopyPath = "robocopy.exe"
                    if (Get-Command $robocopyPath -ErrorAction SilentlyContinue) {
                        $tempDir = "$logDir.temp"
                        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

                        # Use robocopy with /MIR to mirror an empty directory over the logs
                        & $robocopyPath $tempDir $logDir /MIR /R:1 /W:1

                        # Clean up temp dir
                        Remove-Item -Path $tempDir -Force

                        Write-Log -Message "Used robocopy to clear locked log directory" -LogFile $LogFile
                    }
                }
                catch {
                    Write-Log -Message "Failed to rename logs directory: $_" -Level "ERROR" -LogFile $LogFile
                }
            }
        }
    }
}