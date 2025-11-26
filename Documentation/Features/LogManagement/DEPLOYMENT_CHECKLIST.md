# Log Management System - Deployment Checklist

## Pre-Deployment Verification

### 1. Files Created ✓

**Backend Services:**
- [x] `FMS.Application/Services/Logging/ILogCleanupService.cs`
- [x] `FMS.Application/Services/Logging/LogCleanupService.cs`
- [x] `FMS.Application/Services/Logging/LogCleanupBackgroundService.cs`

**Backend API:**
- [x] `FMS.WebClient/Controllers/SystemManagement/LogManagementController.cs`

**Frontend:**
- [x] `fms.frontend/src/services/logManagementService.js`
- [x] `fms.frontend/src/pages/admin/logManagement/LogManagementPage.js`
- [x] `fms.frontend/src/pages/admin/logManagement/LogManagementPage.scss`

**Configuration:**
- [x] Service registration in `FmsServiceCollectionExtensions.cs`
- [x] Routing in `AdminMain.js`

**Documentation:**
- [x] `LOG_CLEANUP_MIGRATION.sql`
- [x] `LOG_MANAGEMENT_GUIDE.md`
- [x] `QUICK_START.md`
- [x] `IMPLEMENTATION_SUMMARY.md`
- [x] `README.md`
- [x] `DEPLOYMENT_CHECKLIST.md` (this file)

---

## Deployment Steps

### Phase 1: Database Setup

#### Step 1.1: Run Migration
```sql
-- Connect to your FMS database
USE YourFMSDatabase;
GO

-- Execute the migration script
-- File: Documentation/Features/LogManagement/LOG_CLEANUP_MIGRATION.sql
INSERT INTO SystemConfigurations (
    ConfigurationKey,
    ConfigurationValue,
    Description,
    DataType,
    IsActive,
    IsEditable,
    Category,
    CreatedAt,
    UpdatedAt,
    CreatedBy,
    UpdatedBy,
    ValidationPattern,
    MinValue,
    MaxValue,
    DefaultValue
)
VALUES (
    'Logging.RetentionDays',
    '30',
    'Number of days to retain log files before automatic cleanup',
    'Int',
    1,
    1,
    'Logging',
    GETUTCDATE(),
    GETUTCDATE(),
    'System',
    'System',
    NULL,
    1,
    365,
    '30'
);
```

#### Step 1.2: Verify Migration
```sql
-- Check the configuration was created
SELECT * FROM SystemConfigurations
WHERE ConfigurationKey = 'Logging.RetentionDays';

-- Expected result: 1 row with RetentionDays = 30
```

**Status:** [ ] Complete

---

### Phase 2: Backend Deployment

#### Step 2.1: Build Solution
```bash
cd "C:\Users\kkagiri\source\repos\Hyoung.Fms"
dotnet clean
dotnet restore
dotnet build --configuration Release
```

**Note:** Existing build errors in VehicleMaintenance module are unrelated to log management.

**Status:** [ ] Complete

#### Step 2.2: Deploy to Server
- [ ] Stop IIS Application Pool
- [ ] Copy built files to server
- [ ] Update web.config if needed
- [ ] Start IIS Application Pool

**Status:** [ ] Complete

#### Step 2.3: Verify Service Registration
Check application startup logs for:
```
[INFO] Log Cleanup Background Service started. Will run daily at 2:00
```

**Status:** [ ] Complete

---

### Phase 3: Frontend Deployment

#### Step 3.1: Build React App
```bash
cd "C:\Users\kkagiri\source\repos\Hyoung.Fms\fms.frontend"
npm install
npm run build
```

**Status:** [ ] Complete

#### Step 3.2: Deploy Build
- [ ] Copy `build` folder to web server
- [ ] Update IIS virtual directory if needed
- [ ] Clear browser cache

**Status:** [ ] Complete

---

### Phase 4: Verification & Testing

#### Step 4.1: Backend API Tests
- [ ] API accessible: `GET /api/v1/LogManagement/categories`
- [ ] Returns log categories correctly
- [ ] Authentication working (JWT required)
- [ ] Download endpoint works
- [ ] Manual cleanup endpoint responds

**Test with PowerShell:**
```powershell
# Get categories (replace with your token)
$token = "your-jwt-token"
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:7009/api/v1/LogManagement/categories" -Headers $headers
```

**Status:** [ ] Complete

#### Step 4.2: Frontend UI Tests
- [ ] Navigate to `/admin/logs`
- [ ] Dashboard displays correctly
- [ ] Statistics show proper data
- [ ] Can switch between categories
- [ ] File list populates
- [ ] Download button works
- [ ] Refresh button works
- [ ] Cleanup button works

**Status:** [ ] Complete

#### Step 4.3: Background Service Tests
- [ ] Service starts with application
- [ ] No errors in logs
- [ ] Next run scheduled correctly
- [ ] Wait for next 2:00 AM or trigger manually

**Manual trigger test:**
```powershell
# Use the cleanup API endpoint
Invoke-RestMethod -Uri "http://localhost:7009/api/v1/LogManagement/cleanup" `
    -Method POST -Headers $headers
```

**Status:** [ ] Complete

---

### Phase 5: Post-Deployment

#### Step 5.1: Monitor First Cleanup
Wait for first scheduled cleanup at 2:00 AM, then check:

- [ ] Cleanup ran successfully
- [ ] Logs show deleted file count
- [ ] No errors in application logs
- [ ] Old files were deleted
- [ ] Recent files remain

**Expected log entries:**
```
[2025-XX-XX 02:00:00] Starting scheduled log cleanup
[2025-XX-XX 02:00:00] Starting log cleanup. Retention period: 30 days, Cutoff date: 2025-XX-XX
[2025-XX-XX 02:00:01] Deleted X log files from C:\Logs\FMS.Webclient\app
[2025-XX-XX 02:00:02] Deleted Y log files from C:\Logs\FMS.Webclient\errors
[2025-XX-XX 02:00:03] Log cleanup completed. Total files deleted: Z
```

**Status:** [ ] Complete

#### Step 5.2: User Training
- [ ] Inform administrators about new feature
- [ ] Share documentation links
- [ ] Demonstrate UI features
- [ ] Explain retention configuration

**Status:** [ ] Complete

#### Step 5.3: Documentation
- [ ] Update system documentation
- [ ] Add to admin manual
- [ ] Create quick reference card
- [ ] Document any customizations

**Status:** [ ] Complete

---

## Configuration Checklist

### Log Directories (Verify Exist)
- [ ] `C:\Logs\FMS.Webclient\app`
- [ ] `C:\Logs\FMS.Webclient\errors`
- [ ] `C:\Logs\FMS.Webclient\audit`
- [ ] `C:\Logs\FMS.Webclient\slow`
- [ ] `C:\Logs\FMS.Webclient\startup`

### Permissions (Verify)
```powershell
# Check permissions
icacls "C:\Logs\FMS.Webclient"

# Should show IIS_IUSRS or application pool identity has modify permissions
# If not, grant permissions:
icacls "C:\Logs\FMS.Webclient" /grant "IIS_IUSRS:(OI)(CI)M"
```

**Status:** [ ] Complete

### System Configuration
- [ ] Retention days set appropriately (default: 30)
- [ ] Configuration is active (`IsActive = 1`)
- [ ] Configuration is editable (`IsEditable = 1`)

**Status:** [ ] Complete

---

## Rollback Plan (If Needed)

### Database Rollback
```sql
-- Remove the configuration
DELETE FROM SystemConfigurations
WHERE ConfigurationKey = 'Logging.RetentionDays';
```

### Code Rollback
1. Remove service registrations from `FmsServiceCollectionExtensions.cs`:
```csharp
// Remove these lines:
services.AddScoped<ILogCleanupService, LogCleanupService>();
services.AddHostedService<LogCleanupBackgroundService>();
```

2. Remove route from `AdminMain.js`:
```javascript
// Remove these lines:
<Route path="logs" element={<LogManagementPage />} />
<Route path="logs/*" element={<LogManagementPage />} />
```

3. Delete new files:
- `FMS.Application/Services/Logging/*`
- `FMS.WebClient/Controllers/SystemManagement/LogManagementController.cs`
- `fms.frontend/src/services/logManagementService.js`
- `fms.frontend/src/pages/admin/logManagement/*`

4. Rebuild and redeploy

---

## Support Contacts

| Role | Contact | Purpose |
|------|---------|---------|
| Database Admin | ____________ | Migration issues |
| DevOps | ____________ | Deployment issues |
| System Admin | ____________ | Server/IIS issues |
| Developer | ____________ | Code/bug issues |

---

## Success Criteria

The deployment is successful when:

- [x] All files are created and in correct locations
- [ ] Database migration executed successfully
- [ ] Application builds without errors related to log management
- [ ] Backend API endpoints respond correctly
- [ ] Frontend UI loads and functions properly
- [ ] Background service starts automatically
- [ ] Manual cleanup works
- [ ] First scheduled cleanup completes successfully
- [ ] No errors in application logs related to log management
- [ ] Users can access and use the admin interface

---

## Notes

### Known Issues
- Pre-existing build errors in VehicleMaintenance module (unrelated to log management)
- These errors do not affect log management functionality

### Customization Points
1. **Cleanup Schedule**: Modify `CLEANUP_HOUR` in `LogCleanupBackgroundService.cs`
2. **Log Directories**: Update arrays in `LogCleanupService.cs` and `LogManagementController.cs`
3. **Retention Range**: Modify `MinValue` and `MaxValue` in database
4. **Default Retention**: Update `DefaultValue` in database

### Performance Considerations
- First cleanup may take longer if many old files exist
- Large log directories (>1000 files) may impact UI load time
- ZIP downloads of large categories may use significant memory

---

## Completion Sign-Off

| Phase | Completed By | Date | Notes |
|-------|--------------|------|-------|
| Database Setup | ____________ | __/__/____ | ____________ |
| Backend Deploy | ____________ | __/__/____ | ____________ |
| Frontend Deploy | ____________ | __/__/____ | ____________ |
| Verification | ____________ | __/__/____ | ____________ |
| Post-Deploy | ____________ | __/__/____ | ____________ |

**Final Approval:** ____________ **Date:** __/__/____
