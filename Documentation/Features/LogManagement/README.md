# Log Management System

Complete log management solution for FMS with automated cleanup, configurable retention, and admin interface.

## Quick Links

- **[Quick Start Guide](./QUICK_START.md)** - Get started in 5 minutes
- **[User Guide](./LOG_MANAGEMENT_GUIDE.md)** - Comprehensive documentation
- **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** - Technical details
- **[Database Migration](./LOG_CLEANUP_MIGRATION.sql)** - Setup script

---

## Features at a Glance

- Automated daily cleanup at 2:00 AM
- Configurable retention period (1-365 days)
- Download logs individually or as ZIP files
- Real-time statistics and monitoring
- Secure, authenticated access
- Support for 5 log categories
- Manual cleanup on-demand

---

## Getting Started

### 1. Run Database Migration
```sql
-- Execute LOG_CLEANUP_MIGRATION.sql
INSERT INTO SystemConfigurations ...
```

### 2. Access Admin Interface
Navigate to: **Admin > Logs** (`/admin/logs`)

### 3. Configure Retention (Optional)
Default is 30 days. Adjust via **Admin > System Configuration**

---

## Log Categories

| Category | Purpose | Path |
|----------|---------|------|
| **app** | General application logs | `C:\Logs\FMS.Webclient\app` |
| **errors** | Error-level logs | `C:\Logs\FMS.Webclient\errors` |
| **audit** | Audit trail logs | `C:\Logs\FMS.Webclient\audit` |
| **slow** | Slow query logs | `C:\Logs\FMS.Webclient\slow` |
| **startup** | Startup logs | `C:\Logs\FMS.Webclient\startup` |

---

## Common Tasks

### Download Logs
1. Go to **Admin > Logs**
2. Select category tab
3. Click **Download** or **Download All as ZIP**

### Trigger Cleanup
1. Click **Run Cleanup** button
2. Confirm action
3. View results

### Change Retention Period
1. Go to **Admin > System Configuration**
2. Edit `Logging.RetentionDays` (Category: Logging)
3. Save changes

---

## API Endpoints

```
GET  /api/v1/LogManagement/categories
GET  /api/v1/LogManagement/files/{category}
GET  /api/v1/LogManagement/download/{category}/{fileName}
GET  /api/v1/LogManagement/download-all/{category}
GET  /api/v1/LogManagement/retention
POST /api/v1/LogManagement/cleanup
GET  /api/v1/LogManagement/statistics
```

---

## Architecture

### Backend
- **Service**: `LogCleanupService` - Handles cleanup logic
- **Background Job**: `LogCleanupBackgroundService` - Runs at 2:00 AM daily
- **API**: `LogManagementController` - REST endpoints

### Frontend
- **Service**: `logManagementService.js` - API integration
- **UI**: `LogManagementPage` - Admin interface
- **Route**: `/admin/logs`

---

## Documentation

| Document | Description |
|----------|-------------|
| [QUICK_START.md](./QUICK_START.md) | Installation and common tasks |
| [LOG_MANAGEMENT_GUIDE.md](./LOG_MANAGEMENT_GUIDE.md) | Complete user guide with API reference |
| [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | Technical implementation details |
| [LOG_CLEANUP_MIGRATION.sql](./LOG_CLEANUP_MIGRATION.sql) | Database setup script |

---

## Support

**Issues?**
1. Check [Troubleshooting Guide](./LOG_MANAGEMENT_GUIDE.md#troubleshooting)
2. Review application logs
3. Contact system administrator

---

## Version

**Current Version**: 1.0
**Release Date**: November 20, 2025
**Status**: Production Ready
