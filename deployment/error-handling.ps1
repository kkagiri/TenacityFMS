# Error handling functions

# Handle error and send notifications
function Handle-Error {
    param (
        [string]$Operation,
        [System.Management.Automation.ErrorRecord]$ErrorRecord,
        [switch]$DoNotExit,
        [string]$LogFile = "./deployment_log.txt"
    )

    Write-Log -Message "ERROR during '$Operation': $($ErrorRecord.Exception.Message)" -Level "ERROR" -LogFile $LogFile
    Write-Log -Message "Stack Trace: $($ErrorRecord.ScriptStackTrace)" -Level "ERROR" -LogFile $LogFile

    # Send error notification
    Send-Notification -Subject "Deployment Error: $Operation" -Body $ErrorRecord.Exception.Message -Level "ERROR" -IncludeLog -IsError -LogFile $LogFile

    # Return false to indicate failure
    return $false
}

# Validate deployment paths and create if needed
function Validate-DeploymentPaths {
    param (
        [switch]$FrontendOnly,
        [switch]$BackendOnly,
        [string]$LogFile = "./deployment_log.txt"
    )

    $pathsValid = $true

    # Validate paths or create them if they don't exist
    if (-not $BackendOnly) {
        if (-not (Test-Path -Path $env:REACT_BUILD_PATH)) {
            Write-Log -Message "React build path does not exist: $env:REACT_BUILD_PATH - Creating it..." -Level "WARN" -LogFile $LogFile

            # Create the directory
            try {
                New-Item -ItemType Directory -Path $env:REACT_BUILD_PATH -Force | Out-Null
                Write-Log -Message "Created empty React build directory." -Level "INFO" -LogFile $LogFile

                # If we're in the GitHub Actions workflow, we should also build the React app
                # Check if we're in the repo root and the frontend directory exists
                $frontendDir = Split-Path $env:REACT_BUILD_PATH -Parent

                if (Test-Path -Path $frontendDir) {
                    Write-Log -Message "Frontend source directory exists. Attempting to build React app..." -Level "INFO" -LogFile $LogFile

                    $currentLocation = Get-Location
                    Set-Location -Path $frontendDir

                    # Check if package.json exists, indicating a valid React app
                    if (Test-Path -Path "package.json") {
                        try {
                            # Install dependencies if node_modules doesn't exist
                            if (-not (Test-Path -Path "node_modules")) {
                                Write-Log -Message "Installing npm dependencies..." -Level "INFO" -LogFile $LogFile
                                $npmInstallOutput = (npm ci) 2>&1
                                Write-Log -Message "NPM install completed: $npmInstallOutput" -Level "INFO" -LogFile $LogFile
                            }
            } catch {
                Write-Log -Message "Error creating WebAPI publish directory: $_" -Level "ERROR" -LogFile $LogFile
                $pathsValid = $false
            }
        } else {
            $fileCount = (Get-ChildItem -Path $env:WEBAPI_BUILD_PATH -Recurse | Measure-Object).Count
            Write-Log -Message "WebAPI build path exists with $fileCount files" -Level "INFO" -LogFile $LogFile
        }
    }

    return $pathsValid
}

                            # Run the build command
                            Write-Log -Message "Building React app..." -Level "INFO" -LogFile $LogFile
                            $buildOutput = (npm run build) 2>&1
                            Write-Log -Message "Build output: $buildOutput" -Level "INFO" -LogFile $LogFile

                            # Verify the build directory now has content
                            if (Test-Path -Path "build" -PathType Container) {
                                $fileCount = (Get-ChildItem -Path "build" -Recurse | Measure-Object).Count
                                Write-Log -Message "Build completed successfully. Generated $fileCount files." -Level "INFO" -LogFile $LogFile
                            } else {
                                Write-Log -Message "Build directory still not found after build attempt." -Level "WARN" -LogFile $LogFile
                            }
                        } catch {
                            Write-Log -Message "Error building React app: $_" -Level "ERROR" -LogFile $LogFile
                        }
                    } else {
                        Write-Log -Message "No package.json found in $frontendDir - cannot build React app" -Level "WARN" -LogFile $LogFile
                    }

                    # Return to the original location
                    Set-Location -Path $currentLocation
                }
            } catch {
                Write-Log -Message "Error creating React build directory: $_" -Level "ERROR" -LogFile $LogFile
                $pathsValid = $false
            }
        } else {
           $fileCount = (Get-ChildItem -Path $env:REACT_BUILD_PATH -Recurse | Measure-Object).Count
                Write-Log -Message "React build path exists with $fileCount files" -Level "INFO" -LogFile $LogFile
        }
    }

    if (-not $FrontendOnly) {
        if (-not (Test-Path -Path $env:WEBAPI_BUILD_PATH)) {
            Write-Log -Message "WebAPI build path does not exist: $env:WEBAPI_BUILD_PATH - Creating it..." -Level "WARN" -LogFile $LogFile

            # Create the directory
            try {
                New-Item -ItemType Directory -Path $env:WEBAPI_BUILD_PATH -Force | Out-Null
                Write-Log -Message "Created empty WebAPI publish directory." -Level "INFO" -LogFile $LogFile

                # If we're in the GitHub Actions workflow, we should also build the .NET app
                # Check if we're in the repo root and the WebAPI project directory exists
                $webApiProjectDir = Split-Path $env:WEBAPI_BUILD_PATH -Parent

                if (Test-Path -Path $webApiProjectDir) {
                    Write-Log -Message "WebAPI project directory exists. Attempting to build .NET app..." -Level "INFO" -LogFile $LogFile

                    $currentLocation = Get-Location
                    Set-Location -Path $webApiProjectDir

                    # Check if any .csproj file exists, indicating a valid .NET project
                    $csprojFiles = Get-ChildItem -Path "*.csproj" -ErrorAction SilentlyContinue

                    if ($csprojFiles -and $csprojFiles.Count -gt 0) {
                        try {
                            # Run the dotnet publish command
                            Write-Log -Message "Publishing .NET WebAPI..." -Level "INFO" -LogFile $LogFile
                            $publishOutput = (dotnet publish -c Release -o publish) 2>&1
                            Write-Log -Message "Publish output: $publishOutput" -Level "INFO" -LogFile $LogFile

                            # Verify the publish directory now has content
                            if (Test-Path -Path "publish" -PathType Container) {
                                $fileCount = (Get-ChildItem -Path "publish" -Recurse | Measure-Object).Count
                                Write-Log -Message "Publish completed successfully. Generated $fileCount files." -Level "INFO" -LogFile $LogFile
                            } else {
                                Write-Log -Message "Publish directory still not found after publish attempt." -Level "WARN" -LogFile $LogFile
                            }
                        } catch {
                            Write-Log -Message "Error publishing .NET WebAPI: $_" -Level "ERROR" -LogFile $LogFile
                        }
                    } else {
                        Write-Log -Message "No .csproj files found in $webApiProjectDir - cannot build WebAPI" -Level "WARN" -LogFile $LogFile
                    }

                    # Return to the original location
                    Set-Location -Path $currentLocation
                }