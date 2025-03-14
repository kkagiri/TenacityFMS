# Deployment Functions for Frontend and Backend

# Deploy Frontend Application
function Deploy-Frontend {
    param (
        [string]$LogFile = "./deployment_log.txt"
    )

    Write-Log -Message "Deploying React application..." -LogFile $LogFile

    # Handle React deployment directory
    if (Test-Path -Path "$env:REACT_DEPLOYMENT_PATH\web.config") {
        $reactWebConfig = Get-Content "$env:REACT_DEPLOYMENT_PATH\web.config"
        Get-ChildItem -Path $env:REACT_DEPLOYMENT_PATH -Recurse |
            Where-Object { $_.FullName -ne "$env:REACT_DEPLOYMENT_PATH\web.config" } |
            Remove-Item -Recurse -Force
        Write-Log -Message "React directory cleaned (preserved web.config)." -LogFile $LogFile
    } else {
        Get-ChildItem -Path $env:REACT_DEPLOYMENT_PATH -Recurse | Remove-Item -Recurse -Force
        Write-Log -Message "React directory cleaned (no web.config found)." -LogFile $LogFile
    }

    # Copy React build files
    try {
        Write-Log -Message "Copying React build files..." -LogFile $LogFile

        # Check path again and provide more debugging info if not found
        if (-not (Test-Path -Path $env:REACT_BUILD_PATH)) {
            Write-Log -Message "ERROR: React build path still not found at deployment time" -Level "ERROR" -LogFile $LogFile

            # Check for case variations of the directory name
            $parentDir = Split-Path $env:REACT_BUILD_PATH -Parent
            $buildDirName = Split-Path $env:REACT_BUILD_PATH -Leaf

            if (Test-Path -Path $parentDir) {
                Write-Log -Message "Parent directory exists. Checking for case variations..." -Level "INFO" -LogFile $LogFile
                Get-ChildItem -Path $parentDir | ForEach-Object {
                    Write-Log -Message "Found directory: $($_.Name)" -Level "INFO" -LogFile $LogFile
                    if ($_.Name -like $buildDirName) {
                        Write-Log -Message "Possible case mismatch. Found similar directory: $($_.FullName)" -Level "INFO" -LogFile $LogFile
                    }
                }
            }

            return $false
        }

        Copy-Item -Path "$env:REACT_BUILD_PATH\*" -Destination $env:REACT_DEPLOYMENT_PATH -Recurse -Force
        $fileCount = (Get-ChildItem -Path $env:REACT_DEPLOYMENT_PATH -Recurse).Count
        Write-Log -Message "React files copied. Count: $fileCount files" -LogFile $LogFile

        # Restore web.config if we saved it
        if ($reactWebConfig) {
            Set-Content -Path "$env:REACT_DEPLOYMENT_PATH\web.config" -Value $reactWebConfig
            Write-Log -Message "React web.config restored." -LogFile $LogFile
        }

        return $true
    } catch {
        Write-Log -Message "Error copying React files: $_" -Level "ERROR" -LogFile $LogFile
        return $false
    }
}

# Deploy Backend Application (Modified version to exclude logs directory)
function Deploy-Backend {
    param (
        [string]$LogFile = "./deployment_log.txt"
    )

    Write-Log -Message "Deploying WebAPI application..." -LogFile $LogFile

    # Preserve web.config and exclude the logs directory from removal
    if (Test-Path -Path "$env:WEBAPI_DEPLOYMENT_PATH\web.config") {
        $webApiWebConfig = Get-Content "$env:WEBAPI_DEPLOYMENT_PATH\web.config"
        Get-ChildItem -Path $env:WEBAPI_DEPLOYMENT_PATH -Recurse |
            Where-Object {
                $_.FullName -ne "$env:WEBAPI_DEPLOYMENT_PATH\web.config" -and
                $_.FullName -notlike "$env:WEBAPI_DEPLOYMENT_PATH\logs*"
            } |
            Remove-Item -Recurse -Force
        Write-Log -Message "WebAPI directory cleaned (preserved web.config and logs)." -LogFile $LogFile
    } else {
        Get-ChildItem -Path $env:WEBAPI_DEPLOYMENT_PATH -Recurse |
            Where-Object { $_.FullName -notlike "$env:WEBAPI_DEPLOYMENT_PATH\logs*" } |
            Remove-Item -Recurse -Force
        Write-Log -Message "WebAPI directory cleaned (no web.config found, preserved logs)." -LogFile $LogFile
    }

    try {
        Write-Log -Message "Copying Web API files..." -LogFile $LogFile

        # Check for the existence of the build path and provide debugging information if not found
        if (-not (Test-Path -Path $env:WEBAPI_BUILD_PATH)) {
            Write-Log -Message "ERROR: WebAPI build path still not found at deployment time" -Level "ERROR" -LogFile $LogFile
            # (Additional debug logic could be added here if needed)
            return $false
        }

        Copy-Item -Path "$env:WEBAPI_BUILD_PATH\*" -Destination $env:WEBAPI_DEPLOYMENT_PATH -Recurse -Force
        $fileCount = (Get-ChildItem -Path $env:WEBAPI_DEPLOYMENT_PATH -Recurse -Exclude "logs").Count
        Write-Log -Message "WebAPI files copied. Count: $fileCount files" -LogFile $LogFile

        # Restore web.config if it was backed up
        if ($webApiWebConfig) {
            Set-Content -Path "$env:WEBAPI_DEPLOYMENT_PATH\web.config" -Value $webApiWebConfig
            Write-Log -Message "WebAPI web.config restored." -LogFile $LogFile
        }

        # (Your existing code to verify essential configuration files would follow here)

        return $true
    } catch {
        Write-Log -Message "Error copying WebAPI files: $_" -Level "ERROR" -LogFile $LogFile
        return $false
    }
}
