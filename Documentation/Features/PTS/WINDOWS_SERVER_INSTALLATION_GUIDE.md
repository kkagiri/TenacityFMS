# FMS PTS Windows Service - Installation Guide for Windows Server

## 📋 Overview

This guide provides step-by-step instructions for installing and configuring the FMS PTS (Pump Transaction System) Windows Service on a Windows Server environment. The PTS service manages communication with fuel dispensers and handles real-time transaction processing.

## 🎯 Prerequisites

### Server Requirements
- **Operating System**: Windows Server 2016 or later (2019/2022 recommended)
- **RAM**: Minimum 4GB, recommended 8GB+
- **Storage**: 10GB free space minimum
- **Network**: Stable network connection with access to:
  - MySQL database server
  - Redis server (if using distributed caching)
  - PTS device network

### Software Dependencies
- **.NET 8.0 Runtime** (or higher)
- **MySQL Client** connectivity
- **Redis Server** (optional but recommended)
- **PowerShell 5.1+** for installation scripts

### Network Configuration
- **Port 54098**: Default WebSocket listener port (configurable)
- **MySQL Port**: Usually 3306 (database connection)
- **Redis Port**: Usually 6379 (if using Redis)
- **Firewall**: Configure Windows Firewall to allow required ports

## 📦 Installation Steps

### Step 1: Download and Prepare Installation Files

1. **Copy Service Files** to the target server:
   ```
   C:\FMS\PTS\
   ├── FMS.PTS.WindowsService.exe
   ├── FMS.PTS.WindowsService.dll
   ├── appsettings.json
   ├── appsettings.production.json
   ├── Scripts\
   │   ├── Install-Service.ps1
   │   └── Uninstall-Service.ps1
   └── Dependencies\
       └── (All required DLLs)
   ```

2. **Create Log Directory**:
   ```powershell
   New-Item -Path "C:\Logs\FMS.PTS" -ItemType Directory -Force
   ```

### Step 2: Install .NET 8.0 Runtime

1. **Download .NET 8.0 Runtime** from Microsoft:
   ```
   https://dotnet.microsoft.com/download/dotnet/8.0
   ```

2. **Install the Runtime**:
   - Choose "ASP.NET Core Runtime" for server environments
   - Select "Windows x64" architecture
   - Run the installer as Administrator

3. **Verify Installation**:
   ```powershell
   dotnet --version
   ```

### Step 3: Configure Environment Variables

Run the following PowerShell script as **Administrator**:

```powershell
# Database Configuration
[Environment]::SetEnvironmentVariable("FMS_DATABASE_CONNECTION", "server=YOUR_MYSQL_SERVER;database=YOUR_DATABASE;uid=YOUR_USERNAME;pwd=YOUR_PASSWORD;ConvertZeroDateTime=true", "Machine")

# Redis Configuration (if using Redis)
[Environment]::SetEnvironmentVariable("FMS_REDIS_CONNECTION", "YOUR_REDIS_SERVER:6379", "Machine")

# JWT Configuration
[Environment]::SetEnvironmentVariable("FMS_JWT_KEY", "YOUR_JWT_SECRET_KEY_HERE_MINIMUM_32_CHARACTERS", "Machine")
[Environment]::SetEnvironmentVariable("FMS_JWT_ISSUER", "FMS.PTS.Service", "Machine")
[Environment]::SetEnvironmentVariable("FMS_JWT_AUDIENCE", "FMS.PTS.Client", "Machine")

# Environment Setting
[Environment]::SetEnvironmentVariable("DOTNET_ENVIRONMENT", "Production", "Machine")

Write-Host "Environment variables configured successfully!"
Write-Host "Please restart PowerShell or reboot the server for changes to take effect."
```

### Step 4: Configure Application Settings

1. **Edit `appsettings.production.json`**:
   ```json
   {
     "PTSService": {
       "WebSocket": {
         "ListenPort": 54098,
         "Host": "0.0.0.0",
         "MaxConcurrentConnections": 100,
         "BasePath": "/ptsWebSocket"
       },
       "ConnectionStrings": {
         "FMSConnection": "REPLACED_BY_ENV_VAR",
         "RedisConnection": "REPLACED_BY_ENV_VAR"
       },
       "Logging": {
         "FilePath": "C:\\Logs\\FMS.PTS\\pts-service-prod.log",
         "MinimumLevel": "Information",
         "RetainedFileCount": 10,
         "MaxFileSizeInMB": 50
       },
       "Device": {
         "AllowedDevices": [],
         "AutoReconnect": true,
         "ReconnectIntervalSeconds": 30,
         "HealthCheckIntervalSeconds": 60
       },
       "Security": {
         "RequireAuthentication": true,
         "AllowedIPs": []
       }
     },
     "Jwt": {
       "Key": "REPLACED_BY_ENV_VAR",
       "Issuer": "REPLACED_BY_ENV_VAR",
       "Audience": "REPLACED_BY_ENV_VAR",
       "ExpiryInMinutes": 10080
     }
   }
   ```

### Step 5: Configure Windows Firewall

Run as **Administrator**:

```powershell
# Allow PTS WebSocket port
New-NetFirewallRule -DisplayName "FMS PTS WebSocket" -Direction Inbound -Protocol TCP -LocalPort 54098 -Action Allow

# Allow outbound MySQL connection (if needed)
New-NetFirewallRule -DisplayName "FMS PTS MySQL Out" -Direction Outbound -Protocol TCP -RemotePort 3306 -Action Allow

# Allow outbound Redis connection (if using Redis)
New-NetFirewallRule -DisplayName "FMS PTS Redis Out" -Direction Outbound -Protocol TCP -RemotePort 6379 -Action Allow

Write-Host "Firewall rules configured successfully!"
```

### Step 6: Install the Windows Service

1. **Navigate to Installation Directory**:
   ```powershell
   cd C:\FMS\PTS\Scripts
   ```

2. **Run Installation Script** as **Administrator**:
   ```powershell
   .\Install-Service.ps1 -InstallPath "C:\FMS\PTS" -Port 54098
   ```

3. **Alternative Manual Installation**:
   ```powershell
   # Create the service
   New-Service -Name "FMS.PTS.Service" `
               -BinaryPathName "C:\FMS\PTS\FMS.PTS.WindowsService.exe" `
               -DisplayName "FMS PTS Service" `
               -Description "Manages PTS device communications and monitoring" `
               -StartupType Automatic

   # Set service to restart on failure
   sc.exe failure "FMS.PTS.Service" reset= 86400 actions= restart/5000/restart/5000/restart/5000
   ```

### Step 7: Configure Service Account (Recommended)

1. **Create Service Account**:
   ```powershell
   # Create local service account
   New-LocalUser -Name "FMS_PTSService" -Description "FMS PTS Service Account" -Password (ConvertTo-SecureString "STRONG_PASSWORD_HERE" -AsPlainText -Force) -PasswordNeverExpires
   ```

2. **Grant Necessary Permissions**:
   ```powershell
   # Grant Log on as Service right
   # This needs to be done via Local Security Policy or Group Policy
   # Navigate to: Local Security Policy > User Rights Assignment > Log on as a service

   # Grant permissions to log directory
   icacls "C:\Logs\FMS.PTS" /grant "FMS_PTSService:(OI)(CI)F" /T

   # Grant permissions to service directory
   icacls "C:\FMS\PTS" /grant "FMS_PTSService:(OI)(CI)RX" /T
   ```

3. **Update Service to Use Account**:
   ```powershell
   # Set service to run under the service account
   $service = Get-WmiObject -Class Win32_Service -Filter "Name='FMS.PTS.Service'"
   $service.Change($null, $null, $null, $null, $null, $null, ".\FMS_PTSService", "STRONG_PASSWORD_HERE")
   ```

### Step 8: Start and Verify Service

1. **Start the Service**:
   ```powershell
   Start-Service -Name "FMS.PTS.Service"
   ```

2. **Check Service Status**:
   ```powershell
   Get-Service -Name "FMS.PTS.Service"
   ```

3. **View Service Logs**:
   ```powershell
   Get-Content "C:\Logs\FMS.PTS\pts-service-*.log" -Tail 50
   ```

4. **Check Event Logs**:
   ```powershell
   Get-EventLog -LogName Application -Source "FMS.PTS.Service" -Newest 10
   ```

## 🔧 Configuration Details

### Database Connection String Format
```
server=YOUR_MYSQL_SERVER;port=3306;database=YOUR_DATABASE;uid=YOUR_USERNAME;pwd=YOUR_PASSWORD;ConvertZeroDateTime=true;AllowPublicKeyRetrieval=true;
```

### Redis Connection String Format
```
YOUR_REDIS_SERVER:6379,password=YOUR_REDIS_PASSWORD,abortConnect=false
```

### WebSocket Configuration
- **Host**: Set to `0.0.0.0` to listen on all interfaces
- **Port**: Default 54098, ensure it's available
- **BasePath**: URL path for WebSocket endpoint

## 🛠️ Post-Installation Tasks

### 1. Test Database Connectivity
```powershell
# Test MySQL connection (requires MySQL client tools)
mysql -h YOUR_MYSQL_SERVER -u YOUR_USERNAME -p YOUR_DATABASE -e "SELECT 1;"
```

### 2. Test Redis Connectivity (if using Redis)
```powershell
# Test Redis connection (requires Redis CLI tools)
redis-cli -h YOUR_REDIS_SERVER ping
```

### 3. Test WebSocket Endpoint
```powershell
# Test if WebSocket port is listening
netstat -an | findstr :54098
```

### 4. Monitor Service Health
```powershell
# Create a monitoring script
$script = @"
while(`$true) {
    `$service = Get-Service -Name "FMS.PTS.Service"
    `$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "`$timestamp - Service Status: `$(`$service.Status)"

    if (`$service.Status -ne "Running") {
        Write-Warning "Service is not running! Attempting to start..."
        Start-Service -Name "FMS.PTS.Service"
    }

    Start-Sleep -Seconds 60
}
"@

$script | Out-File -FilePath "C:\FMS\PTS\monitor-service.ps1"
```

## 📊 Monitoring and Maintenance

### Log Files Locations
- **Service Logs**: `C:\Logs\FMS.PTS\pts-service-*.log`
- **Startup Logs**: `C:\Logs\FMS.PTS\pts-startup.log`
- **Windows Event Log**: Application Log under "FMS.PTS.Service"

### Performance Counters
Monitor these system metrics:
- CPU usage of the service process
- Memory consumption
- Network connections on port 54098
- Disk I/O for log files

### Automated Health Checks
```powershell
# Health check script
function Test-PTSServiceHealth {
    $service = Get-Service -Name "FMS.PTS.Service" -ErrorAction SilentlyContinue

    if (-not $service) {
        return "Service not found"
    }

    if ($service.Status -ne "Running") {
        return "Service not running"
    }

    # Test WebSocket port
    $connection = Test-NetConnection -ComputerName localhost -Port 54098 -WarningAction SilentlyContinue
    if (-not $connection.TcpTestSucceeded) {
        return "WebSocket port not accessible"
    }

    return "Healthy"
}

# Run health check
Test-PTSServiceHealth
```

## 🚨 Troubleshooting

### Common Issues and Solutions

#### Service Won't Start
1. **Check Event Logs**:
   ```powershell
   Get-EventLog -LogName Application -Source "FMS.PTS.Service" -Newest 5
   ```

2. **Verify Dependencies**:
   ```powershell
   # Check .NET runtime
   dotnet --version

   # Check service executable
   Test-Path "C:\FMS\PTS\FMS.PTS.WindowsService.exe"
   ```

3. **Test Configuration**:
   ```powershell
   # Verify environment variables
   [Environment]::GetEnvironmentVariable("FMS_DATABASE_CONNECTION", "Machine")
   [Environment]::GetEnvironmentVariable("DOTNET_ENVIRONMENT", "Machine")
   ```

#### Database Connection Issues
1. **Test Network Connectivity**:
   ```powershell
   Test-NetConnection -ComputerName YOUR_MYSQL_SERVER -Port 3306
   ```

2. **Verify Credentials**:
   ```powershell
   # Test with MySQL client
   mysql -h YOUR_MYSQL_SERVER -u YOUR_USERNAME -p
   ```

#### WebSocket Connection Issues
1. **Check Port Availability**:
   ```powershell
   netstat -an | findstr :54098
   ```

2. **Test Firewall**:
   ```powershell
   Test-NetConnection -ComputerName localhost -Port 54098
   ```

#### Performance Issues
1. **Monitor Resource Usage**:
   ```powershell
   Get-Process -Name "FMS.PTS.WindowsService" | Select-Object CPU, WorkingSet, PagedMemorySize
   ```

2. **Check Log File Size**:
   ```powershell
   Get-ChildItem "C:\Logs\FMS.PTS\*.log" | Measure-Object Length -Sum
   ```

### Log Analysis
```powershell
# Search for errors in logs
Select-String -Path "C:\Logs\FMS.PTS\*.log" -Pattern "ERROR|FATAL|Exception" | Select-Object -Last 10

# Monitor real-time logs
Get-Content "C:\Logs\FMS.PTS\pts-service-*.log" -Wait -Tail 10
```

## 🔄 Maintenance Tasks

### Daily Tasks
- Monitor service status
- Check log files for errors
- Verify WebSocket connectivity

### Weekly Tasks
- Review performance metrics
- Clean old log files
- Test database connectivity

### Monthly Tasks
- Update service if new version available
- Review and optimize configuration
- Backup configuration files

### Log Rotation Script
```powershell
# Automated log cleanup
$logPath = "C:\Logs\FMS.PTS"
$retentionDays = 30

Get-ChildItem -Path $logPath -Filter "*.log" |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$retentionDays) } |
    Remove-Item -Force

Write-Host "Log cleanup completed"
```

## 📝 Uninstallation

### Remove Service
```powershell
# Stop the service
Stop-Service -Name "FMS.PTS.Service" -Force

# Remove the service
Remove-Service -Name "FMS.PTS.Service"

# Clean up firewall rules
Remove-NetFirewallRule -DisplayName "FMS PTS WebSocket"
Remove-NetFirewallRule -DisplayName "FMS PTS MySQL Out"
Remove-NetFirewallRule -DisplayName "FMS PTS Redis Out"

# Remove environment variables
[Environment]::SetEnvironmentVariable("FMS_DATABASE_CONNECTION", $null, "Machine")
[Environment]::SetEnvironmentVariable("FMS_REDIS_CONNECTION", $null, "Machine")
[Environment]::SetEnvironmentVariable("FMS_JWT_KEY", $null, "Machine")
[Environment]::SetEnvironmentVariable("FMS_JWT_ISSUER", $null, "Machine")
[Environment]::SetEnvironmentVariable("FMS_JWT_AUDIENCE", $null, "Machine")

# Optionally remove files and logs
Remove-Item -Path "C:\FMS\PTS" -Recurse -Force
Remove-Item -Path "C:\Logs\FMS.PTS" -Recurse -Force
```

## 📞 Support

### Documentation References
- **Main Documentation**: `Documentation/Features/PTS/`
- **Configuration Guide**: `Documentation/Features/SystemConfiguration/`
- **Troubleshooting**: `Documentation/fixes/PTS/`

### Log Analysis Tools
- Windows Event Viewer
- PowerShell log parsing scripts
- Third-party log analysis tools (optional)

### Contact Information
For technical support, refer to the main FMS documentation or contact your system administrator.

---

**Last Updated**: December 2024
**Version**: 1.0
**Applicable to**: FMS PTS Windows Service v2.0+