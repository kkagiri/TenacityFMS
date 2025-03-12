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

# Deploy Backend Application
function Deploy-Backend {
    param (
        [string]$LogFile = "./deployment_log.txt"
    )

    Write-Log -Message "Deploying WebAPI application..." -LogFile $LogFile

    # Handle WebAPI deployment directory
    if (Test-Path -Path "$env:WEBAPI_DEPLOYMENT_PATH\web.config") {
        $webApiWebConfig = Get-Content "$env:WEBAPI_DEPLOYMENT_PATH\web.config"
        Get-ChildItem -Path $env:WEBAPI_DEPLOYMENT_PATH -Recurse |
            Where-Object { $_.FullName -ne "$env:WEBAPI_DEPLOYMENT_PATH\web.config" } |
            Remove-Item -Recurse -Force
        Write-Log -Message "WebAPI directory cleaned (preserved web.config)." -LogFile $LogFile
    } else {
        Get-ChildItem -Path $env:WEBAPI_DEPLOYMENT_PATH -Recurse | Remove-Item -Recurse -Force
        Write-Log -Message "WebAPI directory cleaned (no web.config found)." -LogFile $LogFile
    }

    # Copy Web API files
    try {
        Write-Log -Message "Copying Web API files..." -LogFile $LogFile

        # Check path again and provide more debugging info if not found
        if (-not (Test-Path -Path $env:WEBAPI_BUILD_PATH)) {
            Write-Log -Message "ERROR: WebAPI build path still not found at deployment time" -Level "ERROR" -LogFile $LogFile

            # Check for case variations of the directory name
            $parentDir = Split-Path $env:WEBAPI_BUILD_PATH -Parent
            $buildDirName = Split-Path $env:WEBAPI_BUILD_PATH -Leaf

            if (Test-Path -Path $parentDir) {
                Write-Log -Message "Parent directory exists. Checking for case variations..." -Level "INFO" -LogFile $LogFile
                Get-ChildItem -Path $parentDir | ForEach-Object {
                    Write-Log -Message "Found directory: $($_.Name)" -Level "INFO" -LogFile $LogFile
                    if ($_.Name -like $buildDirName) {
                        Write-Log -Message "Possible case mismatch. Found similar directory: $($_.FullName)" -Level "INFO" -LogFile $LogFile
                    }
                }
            }

            # Check if files are in use
            if (Test-Path -Path $env:WEBAPI_DEPLOYMENT_PATH) {
                Write-Log -Message "Checking if files are in use in deployment directory..." -Level "INFO" -LogFile $LogFile
                try {
                    $lockedFiles = Get-ChildItem -Path $env:WEBAPI_DEPLOYMENT_PATH -Recurse -File |
                        Where-Object {
                            try {
                                $fileStream = [System.IO.File]::Open($_.FullName, 'Open', 'Read', 'None')
                                $fileStream.Close()
                                $fileStream.Dispose()
                                $false
                            } catch {
                                $true
                            }
                        } | Select-Object -ExpandProperty FullName

                    if ($lockedFiles) {
                        Write-Log -Message "Found locked files that may be preventing deployment:" -Level "WARN" -LogFile $LogFile
                        $lockedFiles | ForEach-Object { Write-Log -Message "  $_" -Level "WARN" -LogFile $LogFile }
                    }
                } catch {
                    Write-Log -Message "Error checking locked files: $_" -Level "WARN" -LogFile $LogFile
                }
            }

            return $false
        }

        Copy-Item -Path "$env:WEBAPI_BUILD_PATH\*" -Destination $env:WEBAPI_DEPLOYMENT_PATH -Recurse -Force
        $fileCount = (Get-ChildItem -Path $env:WEBAPI_DEPLOYMENT_PATH -Recurse).Count
        Write-Log -Message "WebAPI files copied. Count: $fileCount files" -LogFile $LogFile

        # Restore web.config if we saved it
        if ($webApiWebConfig) {
            Set-Content -Path "$env:WEBAPI_DEPLOYMENT_PATH\web.config" -Value $webApiWebConfig
            Write-Log -Message "WebAPI web.config restored." -LogFile $LogFile
        }

        # Verify configuration files
        Write-Log -Message "Verifying configuration files..." -LogFile $LogFile

        # Check for essential configuration files
        $requiredConfigFiles = @(
            "appsettings.json",
            "nlog.config",
            "app.config"
        )

        $missingFiles = @()
        foreach ($file in $requiredConfigFiles) {
            $filePath = Join-Path -Path $env:WEBAPI_DEPLOYMENT_PATH -ChildPath $file
            if (-not (Test-Path -Path $filePath)) {
                $missingFiles += $file
                Write-Log -Message "MISSING CONFIG FILE: $file" -Level "ERROR" -LogFile $LogFile
            }
        }

        # If any files are missing, try to recover them
        if ($missingFiles.Count -gt 0) {
            Write-Log -Message "Attempting to recover missing configuration files..." -Level "WARN" -LogFile $LogFile

            # Try to find configuration files in the build directory
            foreach ($file in $missingFiles) {
                $buildFilePath = Join-Path -Path $env:WEBAPI_BUILD_PATH -ChildPath $file
                $deployFilePath = Join-Path -Path $env:WEBAPI_DEPLOYMENT_PATH -ChildPath $file

                if (Test-Path -Path $buildFilePath) {
                    Write-Log -Message "Copying $file from build directory..." -Level "INFO" -LogFile $LogFile
                    Copy-Item -Path $buildFilePath -Destination $deployFilePath -Force
                } else {
                    # Check for config backup location if defined
                    if ($env:CONFIG_BACKUP_PATH -and (Test-Path -Path $env:CONFIG_BACKUP_PATH)) {
                        $backupFilePath = Join-Path -Path $env:CONFIG_BACKUP_PATH -ChildPath $file

                        if (Test-Path -Path $backupFilePath) {
                            Write-Log -Message "Copying $file from backup directory..." -Level "INFO" -LogFile $LogFile
                            Copy-Item -Path $backupFilePath -Destination $deployFilePath -Force
                        }
                    }
                }
            }

            # Double-check if we recovered all files
            $stillMissing = @()
            foreach ($file in $missingFiles) {
                $filePath = Join-Path -Path $env:WEBAPI_DEPLOYMENT_PATH -ChildPath $file
                if (-not (Test-Path -Path $filePath)) {
                    $stillMissing += $file
                }
            }

            if ($stillMissing.Count -gt 0) {
                Write-Log -Message "Still missing essential configuration files: $($stillMissing -join ', ')" -Level "ERROR" -LogFile $LogFile
                Write-Log -Message "Application may fail to start due to missing configuration!" -Level "ERROR" -LogFile $LogFile

                # Send notification about missing config files
                Send-Notification -Subject "Deployment Warning: Missing Configuration Files" -Body "The following configuration files are missing: $($stillMissing -join ', '). Application may fail to start." -Level "WARN" -IncludeLog -IsError -LogFile $LogFile
            } else {
                Write-Log -Message "All configuration files recovered successfully" -Level "INFO" -LogFile $LogFile
            }
        }

        return $true
    } catch {
        Write-Log -Message "Error copying WebAPI files: $_" -Level "ERROR" -LogFile $LogFile
        return $false
    }
}