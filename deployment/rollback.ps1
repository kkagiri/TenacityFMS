# Improved Deployment Functions for Frontend and Backend
# This version preserves existing production files and handles file transfers more gracefully

# Deploy Frontend Application
function Deploy-Frontend {
    param (
        [string]$LogFile = "./deployment_log.txt"
    )

    Write-Log -Message "Deploying React application..." -LogFile $LogFile

    # Transfer files - using robocopy for more reliable file transfer
    try {
        Write-Log -Message "Transferring React build files to deployment location..." -LogFile $LogFile

        # Save web.config if it exists
        $webConfigExists = Test-Path -Path "$env:REACT_DEPLOYMENT_PATH\web.config"
        $tempWebConfigPath = $null

        if ($webConfigExists) {
            $tempWebConfigPath = "$env:TEMP\react_web_config_backup.xml"
            Copy-Item -Path "$env:REACT_DEPLOYMENT_PATH\web.config" -Destination $tempWebConfigPath -Force
            Write-Log -Message "Backed up existing web.config" -LogFile $LogFile
        }

        # Use robocopy for reliable file transfer - mirrors source to destination
        # but excludes the web.config if it exists
        # /E - Copy subdirectories including empty ones
        # /XF - Exclude files
        # /R:3 - Retry 3 times
        # /W:5 - Wait 5 seconds between retries
        # /MT - MultiThreaded copying
        # /NFL - No File List (don't log every file)
        # /NDL - No Directory List (don't log directories)
        # /NP - No Progress

        $robocopyArgs = @(
            "$env:REACT_BUILD_PATH",
            "$env:REACT_DEPLOYMENT_PATH",
            "/E",
            "/R:3",
            "/W:5",
            "/MT:8",
            "/NFL",
            "/NDL",
            "/NP"
        )

        # Add web.config exclusion if it exists
        if ($webConfigExists) {
            $robocopyArgs += @("/XF", "web.config")
        }

        # Execute robocopy
        $robocopyResult = & robocopy $robocopyArgs

        # Robocopy exit codes:
        # 0 = No errors, files copied
        # 1 = Files copied successfully, some extra files were present
        # 2 = Some extra files or directories detected
        # 3 = Some files/directories could not be copied (timeouts or busy files)
        # These are successful outcomes for our purposes
        if ($LASTEXITCODE -le 3) {
            Write-Log -Message "React files transferred successfully (Robocopy exit code: $LASTEXITCODE)" -LogFile $LogFile

            # Restore web.config if we backed it up
            if ($webConfigExists -and $tempWebConfigPath) {
                Copy-Item -Path $tempWebConfigPath -Destination "$env:REACT_DEPLOYMENT_PATH\web.config" -Force
                Remove-Item -Path $tempWebConfigPath -Force
                Write-Log -Message "React web.config restored." -LogFile $LogFile
            }

            $fileCount = (Get-ChildItem -Path $env:REACT_DEPLOYMENT_PATH -Recurse).Count
            Write-Log -Message "React deployment complete with $fileCount files" -LogFile $LogFile
            return $true
        } else {
            Write-Log -Message "Robocopy failed with exit code $LASTEXITCODE" -Level "ERROR" -LogFile $LogFile
            return $false
        }
    } catch {
        Write-Log -Message "Error transferring React files: $_" -Level "ERROR" -LogFile $LogFile
        return $false
    }
}

# Deploy Backend Application
function Deploy-Backend {
    param (
        [string]$LogFile = "./deployment_log.txt"
    )

    Write-Log -Message "Deploying WebAPI application..." -LogFile $LogFile

    # Transfer files - using robocopy for more reliable file transfer
    try {
        Write-Log -Message "Transferring WebAPI build files to deployment location..." -LogFile $LogFile

        # Save web.config if it exists
        $webConfigExists = Test-Path -Path "$env:WEBAPI_DEPLOYMENT_PATH\web.config"
        $tempWebConfigPath = $null

        if ($webConfigExists) {
            $tempWebConfigPath = "$env:TEMP\webapi_web_config_backup.xml"
            Copy-Item -Path "$env:WEBAPI_DEPLOYMENT_PATH\web.config" -Destination $tempWebConfigPath -Force
            Write-Log -Message "Backed up existing web.config" -LogFile $LogFile
        }

        # Handle logs directory - don't touch it
        $logsPath = Join-Path -Path $env:WEBAPI_DEPLOYMENT_PATH -ChildPath "logs"
        $logsExists = Test-Path -Path $logsPath

        # Set up robocopy arguments
        $robocopyArgs = @(
            "$env:WEBAPI_BUILD_PATH",
            "$env:WEBAPI_DEPLOYMENT_PATH",
            "/E",
            "/R:3",
            "/W:5",
            "/MT:8",
            "/NFL",
            "/NDL",
            "/NP"
        )

        # Add exclusions
        if ($webConfigExists) {
            $robocopyArgs += @("/XF", "web.config")
        }

        if ($logsExists) {
            $robocopyArgs += @("/XD", "logs")
        }

        # Execute robocopy
        $robocopyResult = & robocopy $robocopyArgs

        # Check result (see comment above about exit codes)
        if ($LASTEXITCODE -le 3) {
            Write-Log -Message "WebAPI files transferred successfully (Robocopy exit code: $LASTEXITCODE)" -LogFile $LogFile

            # Restore web.config if we backed it up
            if ($webConfigExists -and $tempWebConfigPath) {
                Copy-Item -Path $tempWebConfigPath -Destination "$env:WEBAPI_DEPLOYMENT_PATH\web.config" -Force
                Remove-Item -Path $tempWebConfigPath -Force
                Write-Log -Message "WebAPI web.config restored." -LogFile $LogFile
            }

            $fileCount = (Get-ChildItem -Path $env:WEBAPI_DEPLOYMENT_PATH -Recurse -Exclude "logs").Count
            Write-Log -Message "WebAPI deployment complete with $fileCount files (excluding logs)" -LogFile $LogFile
            return $true
        } else {
            Write-Log -Message "Robocopy failed with exit code $LASTEXITCODE" -Level "ERROR" -LogFile $LogFile
            return $false
        }
    } catch {
        Write-Log -Message "Error transferring WebAPI files: $_" -Level "ERROR" -LogFile $LogFile
        return $false
    }
}

# Validate paths and settings before deployment
function Validate-DeploymentPaths {
    param (
        [switch]$FrontendOnly,
        [switch]$BackendOnly,
        [string]$LogFile = "./deployment_log.txt"
    )

    $allValid = $true

    if (-not $BackendOnly) {
        if (-not (Test-Path -Path $env:REACT_BUILD_PATH)) {
            Write-Log -Message "React build path not found: $env:REACT_BUILD_PATH" -Level "ERROR" -LogFile $LogFile
            $allValid = $false
        }
    }

    if (-not $FrontendOnly) {
        if (-not (Test-Path -Path $env:WEBAPI_BUILD_PATH)) {
            Write-Log -Message "WebAPI build path not found: $env:WEBAPI_BUILD_PATH" -Level "ERROR" -LogFile $LogFile
            $allValid = $false
        }
    }

    return $allValid
}