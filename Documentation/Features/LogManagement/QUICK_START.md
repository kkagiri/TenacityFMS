# Log Management System - Quick Start Guide

## Installation Steps

### 1. Run Database Migration
```sql
-- Execute the SQL script to add log retention configuration
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

### 2. Verify Services are Registered
The services are already registered in `FmsServiceCollectionExtensions.cs`:
- `ILogCleanupService` (Scoped)
- `LogCleanupBackgroundService` (Hosted Service)

### 3. Access the Admin Interface
1. Navigate to: **Admin > Logs** or `/admin/logs`
2. View log statistics and categories
3. Download or manage log files

---

## Common Tasks

### Change Log Retention Period

**Option 1: System Configuration UI**
1. Go to **Admin > System Configuration**
2. Filter by Category: `Logging`
3. Edit `Logging.RetentionDays`
4. Set value (1-365 days)
5. Save

**Option 2: Database**
```sql
UPDATE SystemConfigurations
SET ConfigurationValue = '60'  -- 60 days
WHERE ConfigurationKey = 'Logging.RetentionDays';
```

### Download Logs

**Single File:**
1. Navigate to **Admin > Logs**
2. Select category tab
3. Click **Download** next to file

**All Files (ZIP):**
1. Select category tab
2. Click **Download All as ZIP**

### Manual Cleanup

1. Click **Run Cleanup** button
2. Confirm action
3. View results

### Check Cleanup Status

View application logs for entries like:
```
[INFO] Log Cleanup Background Service started. Will run daily at 2:00
[INFO] Starting log cleanup. Retention period: 30 days
[INFO] Log cleanup completed. Total files deleted: 25
```

---

## File Locations

### Log Directories
- **App Logs**: `C:\Logs\FMS.Webclient\app`
- **Error Logs**: `C:\Logs\FMS.Webclient\errors`
- **Audit Logs**: `C:\Logs\FMS.Webclient\audit`
- **Slow Query Logs**: `C:\Logs\FMS.Webclient\slow`
- **Startup Logs**: `C:\Logs\FMS.Webclient\startup`

### Code Files

**Backend:**
```
FMS.Application/Services/Logging/
├── ILogCleanupService.cs
├── LogCleanupService.cs
└── LogCleanupBackgroundService.cs

FMS.WebClient/Controllers/SystemManagement/
└── LogManagementController.cs
```

**Frontend:**
```
fms.frontend/src/
├── services/logManagementService.js
└── pages/admin/logManagement/
    ├── LogManagementPage.js
    └── LogManagementPage.scss
```

---

## API Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/LogManagement/categories` | GET | List all log categories |
| `/api/v1/LogManagement/files/{category}` | GET | List files in category |
| `/api/v1/LogManagement/download/{category}/{fileName}` | GET | Download single file |
| `/api/v1/LogManagement/download-all/{category}` | GET | Download category as ZIP |
| `/api/v1/LogManagement/retention` | GET | Get retention config |
| `/api/v1/LogManagement/cleanup` | POST | Trigger manual cleanup |
| `/api/v1/LogManagement/statistics` | GET | Get log statistics |

---

## Background Service

- **Schedule**: Daily at 2:00 AM
- **Function**: Deletes files older than retention period
- **Automatic**: Runs without manual intervention
- **Logging**: All operations logged to app logs

---

## Troubleshooting Quick Tips

### Logs Not Deleting?
```powershell
# Check file permissions
icacls "C:\Logs\FMS.Webclient\app"

# Grant permissions if needed
icacls "C:\Logs\FMS.Webclient\app" /grant "IIS_IUSRS:(OI)(CI)F"
```

### Service Not Running?
Check logs for:
```
[INFO] Log Cleanup Background Service started
```

### Can't Download Files?
1. Verify file exists in correct directory
2. Check file isn't locked
3. Try smaller files first

---

## Default Configuration

| Setting | Default Value | Range |
|---------|---------------|-------|
| Retention Days | 30 | 1-365 |
| Cleanup Time | 2:00 AM | Fixed |
| App Logs Retention | 30 days | Configurable |
| Error Logs Retention | 60 days | Via appsettings |
| Audit Logs Retention | 90 days | Via appsettings |

---

## Next Steps

1. Run the database migration
2. Access the admin interface at `/admin/logs`
3. Review current log statistics
4. Adjust retention period if needed
5. Monitor first automated cleanup (next 2:00 AM)
6. Review cleanup logs the next day

For detailed information, see [LOG_MANAGEMENT_GUIDE.md](./LOG_MANAGEMENT_GUIDE.md)
