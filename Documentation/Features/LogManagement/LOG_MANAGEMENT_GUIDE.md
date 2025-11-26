# Log Management System - User Guide

## Overview

The Log Management System provides comprehensive tools for managing, downloading, and cleaning up system log files. It includes automated cleanup based on configurable retention periods and a user-friendly admin interface.

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Configuration](#configuration)
4. [Using the Admin Interface](#using-the-admin-interface)
5. [API Reference](#api-reference)
6. [Automated Cleanup](#automated-cleanup)
7. [Troubleshooting](#troubleshooting)

---

## Features

### Core Features
- **Automated Log Cleanup**: Runs daily at 2:00 AM to remove old log files
- **Configurable Retention**: Set the number of days to retain logs (default: 30 days)
- **Category-based Organization**: Logs organized by type (app, errors, audit, slow, startup)
- **Download Capabilities**: Download individual files or entire categories as ZIP
- **Real-time Statistics**: View storage usage and file counts by category
- **Manual Cleanup**: Trigger cleanup operations on-demand
- **Secure Access**: All operations require authentication

### Log Categories

| Category | Description | Default Retention | Path |
|----------|-------------|-------------------|------|
| **app** | General application logs | 30 days | `C:\Logs\FMS.Webclient\app` |
| **errors** | Error-level logs only | 60 days | `C:\Logs\FMS.Webclient\errors` |
| **audit** | Audit trail logs | 90 days | `C:\Logs\FMS.Webclient\audit` |
| **slow** | Slow query logs | 14 days | `C:\Logs\FMS.Webclient\slow` |
| **startup** | Application startup logs | 5 days | `C:\Logs\FMS.Webclient\startup` |

---

## Architecture

### Backend Components

```
FMS.Application/Services/Logging/
├── ILogCleanupService.cs           # Service interface
├── LogCleanupService.cs            # Cleanup implementation
└── LogCleanupBackgroundService.cs  # Background job

FMS.WebClient/Controllers/SystemManagement/
└── LogManagementController.cs      # API endpoints
```

### Frontend Components

```
fms.frontend/src/
├── services/logManagementService.js           # API service
└── pages/admin/logManagement/
    ├── LogManagementPage.js                   # Main UI component
    └── LogManagementPage.scss                 # Styling
```

### Background Service

The `LogCleanupBackgroundService` runs as a hosted service:
- **Schedule**: Daily at 2:00 AM
- **Check Interval**: Every hour to determine next run time
- **Automatic Recovery**: Resumes on application restart

---

## Configuration

### 1. Database Configuration

Run the migration script to add log retention configuration:

```sql
-- File: LOG_CLEANUP_MIGRATION.sql
INSERT INTO SystemConfigurations (
    ConfigurationKey,
    ConfigurationValue,
    Description,
    DataType,
    Category,
    MinValue,
    MaxValue,
    DefaultValue,
    IsActive,
    IsEditable
)
VALUES (
    'Logging.RetentionDays',
    '30',
    'Number of days to retain log files before automatic cleanup',
    'Int',
    'Logging',
    1,
    365,
    '30',
    1,
    1
);
```

### 2. Update Retention Period

You can update the retention period through:

#### Option A: System Configuration UI
1. Navigate to **Admin > System Configuration**
2. Filter by Category: `Logging`
3. Edit the `Logging.RetentionDays` configuration
4. Set a value between 1-365 days
5. Save changes

#### Option B: Direct Database Update
```sql
UPDATE SystemConfigurations
SET ConfigurationValue = '60',  -- Set to 60 days
    UpdatedAt = GETUTCDATE(),
    UpdatedBy = 'YourUsername'
WHERE ConfigurationKey = 'Logging.RetentionDays';
```

### 3. Service Registration

The services are automatically registered in `FmsServiceCollectionExtensions.cs`:

```csharp
// Log Management Services
services.AddScoped<ILogCleanupService, LogCleanupService>();
services.AddHostedService<LogCleanupBackgroundService>();
```

---

## Using the Admin Interface

### Access the Log Management Page

1. Navigate to the admin section
2. Click on **System Management > Logs** (or navigate to `/admin/logs`)

### Dashboard Overview

The dashboard shows:
- **Total Files**: Number of log files across all categories
- **Total Size**: Combined size of all log files
- **Retention Period**: Current configured retention in days
- **Categories**: Number of log categories

### Statistics Panel

View storage usage by category:
- Visual progress bars showing relative size
- File counts per category
- Size in MB for each category
- Color-coded badges for easy identification

### Viewing Log Files

1. Select a category tab (app, errors, audit, slow, startup)
2. View the list of log files with:
   - File name
   - File size
   - Last modified date
3. Files are sorted by most recent first

### Downloading Logs

#### Download Individual File
1. Click the **Download** button next to any log file
2. File will download to your browser's download folder

#### Download All Logs (ZIP)
1. Select a category tab
2. Click **Download All as ZIP** in the header
3. All logs for that category will be packaged as a ZIP file

### Manual Cleanup

To manually trigger log cleanup:

1. Click the **Run Cleanup** button (red button in top-right)
2. Confirm the action in the dialog
3. System will delete all files older than the retention period
4. A success message shows how many files were deleted
5. Statistics and file lists automatically refresh

### Refresh Data

Click the **Refresh** button to reload:
- Log categories
- File lists
- Statistics
- Retention configuration

---

## API Reference

### Base URL
```
/api/v1/LogManagement
```

### Endpoints

#### 1. Get Log Categories
```http
GET /api/v1/LogManagement/categories
```

**Response:**
```json
[
  {
    "name": "app",
    "path": "C:\\Logs\\FMS.Webclient\\app",
    "exists": true,
    "fileCount": 15
  }
]
```

#### 2. Get Log Files
```http
GET /api/v1/LogManagement/files/{category}
```

**Parameters:**
- `category` (string): Log category name

**Response:**
```json
[
  {
    "fileName": "app-log-20251120.log",
    "fullPath": "C:\\Logs\\FMS.Webclient\\app\\app-log-20251120.log",
    "sizeBytes": 1048576,
    "sizeMB": 1.0,
    "createdDate": "2025-11-20T00:00:00",
    "modifiedDate": "2025-11-20T14:30:00",
    "category": "app"
  }
]
```

#### 3. Download Log File
```http
GET /api/v1/LogManagement/download/{category}/{fileName}
```

**Parameters:**
- `category` (string): Log category
- `fileName` (string): Name of the file to download

**Response:** File download (text/plain)

#### 4. Download All Logs (ZIP)
```http
GET /api/v1/LogManagement/download-all/{category}
```

**Parameters:**
- `category` (string): Log category

**Response:** ZIP file download (application/zip)

#### 5. Get Retention Configuration
```http
GET /api/v1/LogManagement/retention
```

**Response:**
```json
{
  "retentionDays": 30,
  "cutoffDate": "2025-10-21T14:30:00"
}
```

#### 6. Trigger Manual Cleanup
```http
POST /api/v1/LogManagement/cleanup
```

**Response:**
```json
{
  "success": true,
  "deletedFiles": 25,
  "retentionDays": 30,
  "cleanupDate": "2025-11-20T14:30:00",
  "message": "Successfully deleted 25 log files older than 30 days"
}
```

#### 7. Get Log Statistics
```http
GET /api/v1/LogManagement/statistics
```

**Response:**
```json
{
  "totalFiles": 150,
  "totalSizeBytes": 157286400,
  "totalSizeMB": 150.0,
  "categories": [
    {
      "category": "app",
      "fileCount": 30,
      "totalSizeBytes": 52428800,
      "totalSizeMB": 50.0,
      "oldestFile": "2025-10-20T00:00:00",
      "newestFile": "2025-11-20T00:00:00"
    }
  ]
}
```

---

## Automated Cleanup

### How It Works

1. **Background Service**: `LogCleanupBackgroundService` runs as a hosted service
2. **Schedule**: Executes daily at 2:00 AM
3. **Process**:
   - Reads retention days from SystemConfiguration
   - Calculates cutoff date (current date - retention days)
   - Scans all log directories
   - Deletes files with LastWriteTime before cutoff date
   - Logs all operations

### Cleanup Logic

```csharp
// Cutoff date calculation
var retentionDays = await GetLogRetentionDaysAsync();
var cutoffDate = DateTime.Now.AddDays(-retentionDays);

// File deletion criteria
foreach (var file in logFiles)
{
    if (File.GetLastWriteTime(file) < cutoffDate)
    {
        File.Delete(file);
    }
}
```

### Monitoring Cleanup

Check the application logs for cleanup operations:

```
[2025-11-20 02:00:00] Starting log cleanup. Retention period: 30 days, Cutoff date: 2025-10-21
[2025-11-20 02:00:01] Deleted 10 log files from C:\Logs\FMS.Webclient\app
[2025-11-20 02:00:02] Deleted 5 log files from C:\Logs\FMS.Webclient\errors
[2025-11-20 02:00:03] Log cleanup completed. Total files deleted: 15
```

### Manual Intervention

If automated cleanup fails:
1. Check the logs for error messages
2. Verify file permissions on log directories
3. Ensure no files are locked by other processes
4. Use the manual cleanup button in the UI
5. Contact system administrator if issues persist

---

## Troubleshooting

### Common Issues

#### 1. Log Files Not Deleting

**Symptoms:** Files remain after cleanup
**Possible Causes:**
- Files are locked by another process
- Insufficient permissions
- Log files still being written to

**Solutions:**
```powershell
# Check file locks (PowerShell)
Get-Process | Where-Object {$_.Modules | Where-Object {$_.FileName -like "*FMS.Webclient*"}}

# Verify permissions
icacls "C:\Logs\FMS.Webclient\app"

# Grant permissions if needed
icacls "C:\Logs\FMS.Webclient\app" /grant "IIS_IUSRS:(OI)(CI)F"
```

#### 2. Background Service Not Running

**Symptoms:** No cleanup happening at scheduled time
**Solutions:**
1. Check application logs for service startup
2. Verify service registration in `FmsServiceCollectionExtensions.cs`
3. Restart the application

**Verify Service:**
```csharp
// Look for this log entry
[INFO] Log Cleanup Background Service started. Will run daily at 2:00
```

#### 3. Download Fails

**Symptoms:** Unable to download log files
**Possible Causes:**
- File path traversal security check
- File not found
- Insufficient memory

**Solutions:**
1. Verify file exists in the correct directory
2. Check file name doesn't contain invalid characters
3. Try downloading smaller files first
4. Check server memory and disk space

#### 4. Configuration Not Applied

**Symptoms:** Retention period not updating
**Solutions:**
1. Verify database update:
```sql
SELECT * FROM SystemConfigurations
WHERE ConfigurationKey = 'Logging.RetentionDays';
```
2. Ensure `IsActive = 1`
3. Restart application to reload configuration

---

## Best Practices

### Retention Periods

Recommended retention periods by category:

| Category | Recommended | Reasoning |
|----------|-------------|-----------|
| app | 30 days | General debugging and monitoring |
| errors | 60-90 days | Error pattern analysis |
| audit | 90-365 days | Compliance and security |
| slow | 14-30 days | Performance optimization |
| startup | 5-7 days | Recent startup issues only |

### Storage Management

1. **Monitor Disk Space**: Set up alerts when log directory exceeds 80% capacity
2. **Adjust Retention**: Reduce retention if disk space is limited
3. **Archive Old Logs**: Download and archive important logs before cleanup
4. **Regular Reviews**: Review log statistics monthly

### Security

1. **Access Control**: Only grant log access to administrators
2. **Audit Downloads**: Monitor who downloads logs and when
3. **Secure Storage**: Ensure log directory has appropriate permissions
4. **Data Sensitivity**: Remember logs may contain sensitive information

### Performance

1. **Off-Peak Cleanup**: 2:00 AM is optimal for minimal user impact
2. **Batch Downloads**: Use ZIP download for multiple files
3. **Selective Downloads**: Download only needed categories/dates
4. **Regular Cleanup**: Don't let logs accumulate excessively

---

## Support

For issues or questions:
1. Check application logs in `C:\Logs\FMS.Webclient\errors`
2. Review this documentation
3. Contact system administrator
4. File a bug report with:
   - Error messages
   - Steps to reproduce
   - Log files
   - Configuration settings

---

## Change Log

### Version 1.0 (2025-11-20)
- Initial release
- Automated cleanup service
- Admin UI for log management
- Download capabilities
- Configurable retention periods
- Support for 5 log categories
