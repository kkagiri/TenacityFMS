param (
    [switch]$frontendOnly,
    [switch]$backendOnly,
    [string]$logFile = "./deployment_log.txt"
)
$pathsValid = $true
# Start logging
function Write-Log {
    param (
        [string]$Message,
        [string]$Level = "INFO"
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"

    # Output to console
    Write-Host $logMessage

    # Append to log file
    Add-Content -Path $logFile -Value $logMessage
}

# Function to handle errors
function Handle-Error {
    param (
        [string]$Operation,
        [System.Management.Automation.ErrorRecord]$ErrorRecord
    )

    Write-Log "ERROR during '$Operation': $($ErrorRecord.Exception.Message)" -Level "ERROR"
    Write-Log "Stack Trace: $($ErrorRecord.ScriptStackTrace)" -Level "ERROR"

    # You could also send notifications here (email, Teams, etc.)

    # Return false to indicate failure
    return $false
}

# Initialize log file
if (Test-Path $logFile) {
    Add-Content -Path $logFile -Value "`n------ New Deployment Started $(Get-Date) ------`n"
} else {
    New-Item -Path $logFile -ItemType File -Force | Out-Null
    Add-Content -Path $logFile -Value "------ Deployment Log Created $(Get-Date) ------`n"
}

# Record deployment parameters
Write-Log "Deployment started with parameters: frontendOnly=$frontendOnly, backendOnly=$backendOnly"

# Load configuration
try {
    . ./config-loader.ps1
    Write-Log "Configuration loaded successfully"
} catch {
    Handle-Error -Operation "configuration loading" -ErrorRecord $_
    exit 1
}

# Print debug information
Write-Log "CONFIGURATION VALUES:"
Write-Log "REACT_BUILD_PATH: $env:REACT_BUILD_PATH"
Write-Log "WEBAPI_BUILD_PATH: $env:WEBAPI_BUILD_PATH"
Write-Log "REACT_DEPLOYMENT_PATH: $env:REACT_DEPLOYMENT_PATH"
Write-Log "WEBAPI_DEPLOYMENT_PATH: $env:WEBAPI_DEPLOYMENT_PATH"
Write-Log "IIS_SITE_NAME (Frontend): $env:IIS_SITE_NAME"
Write-Log "IIS_APP_POOL (Shared): $env:IIS_APP_POOL"
Write-Log "BACKEND_SITE_NAME: $env:BACKEND_SITE_NAME"
Write-Log "ENVIRONMENT: $env:ENVIRONMENT"

# Set default values for backend site if not explicitly defined
if (-not $env:BACKEND_SITE_NAME) {
    $env:BACKEND_SITE_NAME = $env:IIS_SITE_NAME
    Write-Log "Using frontend site name for backend: $env:BACKEND_SITE_NAME"
}

# Validate paths or create them if they don't exist
if (-not $backendOnly) {
    if (-not (Test-Path -Path $env:REACT_BUILD_PATH)) {
        Write-Log "React build path does not exist: $env:REACT_BUILD_PATH - Creating it..." -Level "WARN"

        # Create the directory
        try {
            New-Item -ItemType Directory -Path $env:REACT_BUILD_PATH -Force | Out-Null
            Write-Log "Created empty React build directory." -Level "INFO"

            # If we're in the GitHub Actions workflow, we should also build the React app
            # Check if we're in the repo root and the frontend directory exists
            $frontendDir = Split-Path $env:REACT_BUILD_PATH -Parent

            if (Test-Path -Path $frontendDir) {
                Write-Log "Frontend source directory exists. Attempting to build React app..." -Level "INFO"

                $currentLocation = Get-Location
                Set-Location -Path $frontendDir

                # Check if package.json exists, indicating a valid React app
                if (Test-Path -Path "package.json") {
                    try {
                        # Install dependencies if node_modules doesn't exist
                        if (-not (Test-Path -Path "node_modules")) {
                            Write-Log "Installing npm dependencies..." -Level "INFO"
                            $npmInstallOutput = (npm ci) 2>&1
                            Write-Log "NPM install completed: $npmInstallOutput" -Level "INFO"
                        }

                        # Run the build command
                        Write-Log "Building React app..." -Level "INFO"
                        $buildOutput = (npm run build) 2>&1
                        Write-Log "Build output: $buildOutput" -Level "INFO"

                        # Verify the build directory now has content
                        if (Test-Path -Path "build" -PathType Container) {
                            $fileCount = (Get-ChildItem -Path "build" -Recurse | Measure-Object).Count
                            Write-Log "Build completed successfully. Generated $fileCount files." -Level "INFO"
                        } else {
                            Write-Log "Build directory still not found after build attempt." -Level "WARN"
                        }
                    } catch {
                        Write-Log "Error building React app: $_" -Level "ERROR"
                    }
                } else {
                    Write-Log "No package.json found in $frontendDir - cannot build React app" -Level "WARN"
                }

                # Return to the original location
                Set-Location -Path $currentLocation
            }
        } catch {
            Write-Log "Error creating React build directory: $_" -Level "ERROR"
            $pathsValid = $false
        }
    } else {
       $fileCount = (Get-ChildItem -Path $env:REACT_BUILD_PATH -Recurse | Measure-Object).Count
            Write-Log "React build path exists with $fileCount files" -Level "INFO"
    }
}

if (-not $frontendOnly) {
    if (-not (Test-Path -Path $env:WEBAPI_BUILD_PATH)) {
        Write-Log "WebAPI build path does not exist: $env:WEBAPI_BUILD_PATH - Creating it..." -Level "WARN"

        # Create the directory
        try {
            New-Item -ItemType Directory -Path $env:WEBAPI_BUILD_PATH -Force | Out-Null
            Write-Log "Created empty WebAPI publish directory." -Level "INFO"

            # If we're in the GitHub Actions workflow, we should also build the .NET app
            # Check if we're in the repo root and the WebAPI project directory exists
            $webApiProjectDir = Split-Path $env:WEBAPI_BUILD_PATH -Parent

            if (Test-Path -Path $webApiProjectDir) {
                Write-Log "WebAPI project directory exists. Attempting to build .NET app..." -Level "INFO"

                $currentLocation = Get-Location
                Set-Location -Path $webApiProjectDir

                # Check if any .csproj file exists, indicating a valid .NET project
                $csprojFiles = Get-ChildItem -Path "*.csproj" -ErrorAction SilentlyContinue

                if ($csprojFiles -and $csprojFiles.Count -gt 0) {
                    try {
                        # Run the dotnet publish command
                        Write-Log "Publishing .NET WebAPI..." -Level "INFO"
                        $publishOutput = (dotnet publish -c Release -o publish) 2>&1
                        Write-Log "Publish output: $publishOutput" -Level "INFO"

                        # Verify the publish directory now has content
                        if (Test-Path -Path "publish" -PathType Container) {
                            $fileCount = (Get-ChildItem -Path "publish" -Recurse | Measure-Object).Count
                            Write-Log "Publish completed successfully. Generated $fileCount files." -Level "INFO"
                        } else {
                            Write-Log "Publish directory still not found after publish attempt." -Level "WARN"
                        }
                    } catch {
                        Write-Log "Error publishing .NET WebAPI: $_" -Level "ERROR"
                    }
                } else {
                    Write-Log "No .csproj files found in $webApiProjectDir - cannot build WebAPI" -Level "WARN"
                }

                # Return to the original location
                Set-Location -Path $currentLocation
            }
        } catch {
            Write-Log "Error creating WebAPI publish directory: $_" -Level "ERROR"
            $pathsValid = $false
        }
    } else {
        Write-Log "WebAPI build path exists with $(Get-ChildItem -Path $env:WEBAPI_BUILD_PATH -Recurse | Measure-Object).Count files" -Level "INFO"
    }
}

if (-not $pathsValid) {
    Write-Log "Deployment aborted due to missing build paths" -Level "ERROR"
    exit 1
}

# Record git commit information if available
try {
    $gitCommit = git rev-parse HEAD 2>$null
    $gitBranch = git rev-parse --abbrev-ref HEAD 2>$null
    if ($gitCommit -and $gitBranch) {
        Write-Log "Deploying Git commit: $gitCommit on branch: $gitBranch"
    }
} catch {
    Write-Log "Unable to retrieve Git information" -Level "WARN"
}

# Stop the IIS sites and application pools
Write-Log "Stopping IIS services..."
Import-Module WebAdministration

# Define site names (frontend and backend)
$frontendSiteName = $env:IIS_SITE_NAME          # ReactApp
$backendSiteName = $env:BACKEND_SITE_NAME       # Use if configured, otherwise use same as frontend
if (-not $backendSiteName) {
    $backendSiteName = $frontendSiteName        # Default to same site if not specified
}

# Define app pool names (frontend and backend)
$appPoolName = $env:IIS_APP_POOL        # apihyoungfms (shared between frontend and backend)

Write-Log "Frontend Site: $frontendSiteName, App Pool: $appPoolName"
Write-Log "Backend Site: $backendSiteName, App Pool: $appPoolName"

try {
    # Stop sites first
    if (-not $backendOnly) {
        if (Get-Website -Name $frontendSiteName) {
            Stop-Website -Name $frontendSiteName -ErrorAction Stop
            Write-Log "Frontend website $frontendSiteName stopped."
        }
    }

    if (-not $frontendOnly -and $backendSiteName -ne $frontendSiteName) {
        if (Get-Website -Name $backendSiteName) {
            Stop-Website -Name $backendSiteName -ErrorAction Stop
            Write-Log "Backend website $backendSiteName stopped."
        }
    }

    # Then stop shared app pool (only once)
    if (Get-WebAppPoolState -Name $appPoolName) {
        Stop-WebAppPool -Name $appPoolName -ErrorAction Stop
        Write-Log "Application Pool $appPoolName stopped."
    }
} catch {
    Write-Log "Warning: Could not stop IIS services: $_" -Level "WARN"
    # Continue anyway, as we may just need to copy files
}

# Create deployment directories if they don't exist
Write-Log "Creating deployment directories if they don't exist..."
if (-not $backendOnly) {
    if (!(Test-Path -Path $env:REACT_DEPLOYMENT_PATH)) {
        New-Item -ItemType Directory -Path $env:REACT_DEPLOYMENT_PATH -Force | Out-Null
        Write-Log "Created React deployment directory."
    }
}
if (-not $frontendOnly) {
    if (!(Test-Path -Path $env:WEBAPI_DEPLOYMENT_PATH)) {
        New-Item -ItemType Directory -Path $env:WEBAPI_DEPLOYMENT_PATH -Force | Out-Null
        Write-Log "Created WebAPI deployment directory."
    }
}

# Backup current deployment (optional)
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupRoot = $env:BACKUP_DIR

if ($backupRoot -and (Test-Path $backupRoot)) {
    Write-Log "Creating backup of current deployment..."

    if (-not $backendOnly -and (Test-Path $env:REACT_DEPLOYMENT_PATH)) {
        $reactBackupPath = Join-Path $backupRoot "react_$timestamp"
        try {
            Copy-Item -Path $env:REACT_DEPLOYMENT_PATH -Destination $reactBackupPath -Recurse -Force
            Write-Log "React app backed up to $reactBackupPath"
        } catch {
            Write-Log "Failed to backup React app: $_" -Level "WARN"
        }
    }

    if (-not $frontendOnly -and (Test-Path $env:WEBAPI_DEPLOYMENT_PATH)) {
        $webApiBackupPath = Join-Path $backupRoot "webapi_$timestamp"
        try {
            Copy-Item -Path $env:WEBAPI_DEPLOYMENT_PATH -Destination $webApiBackupPath -Recurse -Force
            Write-Log "WebAPI backed up to $webApiBackupPath"
        } catch {
            Write-Log "Failed to backup WebAPI: $_" -Level "WARN"
        }
    }
}

# Clean and deploy React app
if (-not $backendOnly) {
    Write-Log "Deploying React application..."

    # Handle React deployment directory
    if (Test-Path -Path "$env:REACT_DEPLOYMENT_PATH\web.config") {
        $reactWebConfig = Get-Content "$env:REACT_DEPLOYMENT_PATH\web.config"
        Get-ChildItem -Path $env:REACT_DEPLOYMENT_PATH -Recurse |
            Where-Object { $_.FullName -ne "$env:REACT_DEPLOYMENT_PATH\web.config" } |
            Remove-Item -Recurse -Force
        Write-Log "React directory cleaned (preserved web.config)."
    } else {
        Get-ChildItem -Path $env:REACT_DEPLOYMENT_PATH -Recurse | Remove-Item -Recurse -Force
        Write-Log "React directory cleaned (no web.config found)."
    }

    # Copy React build files
    try {
        Write-Log "Copying React build files..."

        # Check path again and provide more debugging info if not found
        if (-not (Test-Path -Path $env:REACT_BUILD_PATH)) {
            Write-Log "ERROR: React build path still not found at deployment time" -Level "ERROR"

            # Check for case variations of the directory name
            $parentDir = Split-Path $env:REACT_BUILD_PATH -Parent
            $buildDirName = Split-Path $env:REACT_BUILD_PATH -Leaf

            if (Test-Path -Path $parentDir) {
                Write-Log "Parent directory exists. Checking for case variations..." -Level "INFO"
                Get-ChildItem -Path $parentDir | ForEach-Object {
                    Write-Log "Found directory: $($_.Name)" -Level "INFO"
                    if ($_.Name -like $buildDirName) {
                        Write-Log "Possible case mismatch. Found similar directory: $($_.FullName)" -Level "INFO"
                    }
                }
            }

            Handle-Error -Operation "React build path not found" -ErrorRecord (New-Object System.Management.Automation.ErrorRecord ([System.IO.DirectoryNotFoundException]::new("Directory not found: $env:REACT_BUILD_PATH"), "PathNotFound", "ObjectNotFound", $null))
            exit 1
        }

        Copy-Item -Path "$env:REACT_BUILD_PATH\*" -Destination $env:REACT_DEPLOYMENT_PATH -Recurse -Force
        $fileCount = (Get-ChildItem -Path $env:REACT_DEPLOYMENT_PATH -Recurse).Count
        Write-Log "React files copied. Count: $fileCount files"

        # Restore web.config if we saved it
        if ($reactWebConfig) {
            Set-Content -Path "$env:REACT_DEPLOYMENT_PATH\web.config" -Value $reactWebConfig
            Write-Log "React web.config restored."
        }
    } catch {
        Handle-Error -Operation "React files deployment" -ErrorRecord $_
        exit 1
    }
}

# Clean and deploy WebAPI
if (-not $frontendOnly) {
    Write-Log "Deploying WebAPI application..."

    # Handle WebAPI deployment directory
    if (Test-Path -Path "$env:WEBAPI_DEPLOYMENT_PATH\web.config") {
        $webApiWebConfig = Get-Content "$env:WEBAPI_DEPLOYMENT_PATH\web.config"
        Get-ChildItem -Path $env:WEBAPI_DEPLOYMENT_PATH -Recurse |
            Where-Object { $_.FullName -ne "$env:WEBAPI_DEPLOYMENT_PATH\web.config" } |
            Remove-Item -Recurse -Force
        Write-Log "WebAPI directory cleaned (preserved web.config)."
    } else {
        Get-ChildItem -Path $env:WEBAPI_DEPLOYMENT_PATH -Recurse | Remove-Item -Recurse -Force
        Write-Log "WebAPI directory cleaned (no web.config found)."
    }

    # Copy Web API files
    try {
        Write-Log "Copying Web API files..."

        # Check path again and provide more debugging info if not found
        if (-not (Test-Path -Path $env:WEBAPI_BUILD_PATH)) {
            Write-Log "ERROR: WebAPI build path still not found at deployment time" -Level "ERROR"

            # Check for case variations of the directory name
            $parentDir = Split-Path $env:WEBAPI_BUILD_PATH -Parent
            $buildDirName = Split-Path $env:WEBAPI_BUILD_PATH -Leaf

            if (Test-Path -Path $parentDir) {
                Write-Log "Parent directory exists. Checking for case variations..." -Level "INFO"
                Get-ChildItem -Path $parentDir | ForEach-Object {
                    Write-Log "Found directory: $($_.Name)" -Level "INFO"
                    if ($_.Name -like $buildDirName) {
                        Write-Log "Possible case mismatch. Found similar directory: $($_.FullName)" -Level "INFO"
                    }
                }
            }

            # Check if files are in use
            if (Test-Path -Path $env:WEBAPI_DEPLOYMENT_PATH) {
                Write-Log "Checking if files are in use in deployment directory..." -Level "INFO"
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
                        Write-Log "Found locked files that may be preventing deployment:" -Level "WARN"
                        $lockedFiles | ForEach-Object { Write-Log "  $_" -Level "WARN" }
                    }
                } catch {
                    Write-Log "Error checking locked files: $_" -Level "WARN"
                }
            }

            Handle-Error -Operation "WebAPI build path not found" -ErrorRecord (New-Object System.Management.Automation.ErrorRecord ([System.IO.DirectoryNotFoundException]::new("Directory not found: $env:WEBAPI_BUILD_PATH"), "PathNotFound", "ObjectNotFound", $null))
            exit 1
        }

        Copy-Item -Path "$env:WEBAPI_BUILD_PATH\*" -Destination $env:WEBAPI_DEPLOYMENT_PATH -Recurse -Force
        $fileCount = (Get-ChildItem -Path $env:WEBAPI_DEPLOYMENT_PATH -Recurse).Count
        Write-Log "WebAPI files copied. Count: $fileCount files"

        # Restore web.config if we saved it
        if ($webApiWebConfig) {
            Set-Content -Path "$env:WEBAPI_DEPLOYMENT_PATH\web.config" -Value $webApiWebConfig
            Write-Log "WebAPI web.config restored."
        }
    } catch {
        Handle-Error -Operation "WebAPI files deployment" -ErrorRecord $_
        exit 1
    }
}

# Start the IIS sites and app pool
Write-Log "Starting IIS services..."
try {
    # Start app pool first (shared between both sites)
    Start-WebAppPool -Name $appPoolName -ErrorAction Stop
    Write-Log "Application Pool $appPoolName started."

    # Then start websites
    if (-not $backendOnly) {
        Start-Website -Name $frontendSiteName -ErrorAction Stop
        Write-Log "Frontend website $frontendSiteName started."
    }

    if (-not $frontendOnly -and $backendSiteName -ne $frontendSiteName) {
        Start-Website -Name $backendSiteName -ErrorAction Stop
        Write-Log "Backend website $backendSiteName started."
    }
} catch {
    Write-Log "Warning: Could not start IIS services: $_" -Level "WARN"
    # This may happen if services were already running
}

# Perform health check if URL is configured
if ($env:HEALTH_CHECK_URL) {
    Write-Log "Performing health check..."
    $healthCheckSuccess = $false

    for ($i = 1; $i -le [int]$env:HEALTH_CHECK_RETRIES; $i++) {
        try {
            Write-Log "Health check attempt $i of $($env:HEALTH_CHECK_RETRIES)..."
            $response = Invoke-WebRequest -Uri $env:HEALTH_CHECK_URL -TimeoutSec 30 -UseBasicParsing

            if ($response.StatusCode -eq 200) {
                Write-Log "Health check passed: Status $($response.StatusCode)"
                $healthCheckSuccess = $true
                break
            } else {
                Write-Log "Health check returned non-200 status: $($response.StatusCode)" -Level "WARN"
            }
        } catch {
            Write-Log "Health check failed: $_" -Level "WARN"
        }

        if ($i -lt [int]$env:HEALTH_CHECK_RETRIES) {
            Write-Log "Waiting $($env:HEALTH_CHECK_RETRY_DELAY) seconds before next retry..."
            Start-Sleep -Seconds [int]$env:HEALTH_CHECK_RETRY_DELAY
        }
    }

    if (-not $healthCheckSuccess) {
        Write-Log "All health checks failed. Deployment may be unstable." -Level "ERROR"
        # You might want to trigger alerts here or rollback
    }
}

# Record deployment completion
$deploymentType = if ($frontendOnly) {
    "Frontend Only"
} elseif ($backendOnly) {
    "Backend Only"
} else {
    "Full (Frontend and Backend)"
}

Write-Log "$deploymentType deployment completed successfully!"
Write-Log "Deployment log saved to: $((Get-Item $logFile).FullName)"

# Return success exit code
exit 0