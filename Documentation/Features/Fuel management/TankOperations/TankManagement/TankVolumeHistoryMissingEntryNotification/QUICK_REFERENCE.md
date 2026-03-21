# Tank Volume Missing Entry Notification - Quick Reference

## 🎯 Feature Summary

**Automated daily notification system that alerts site administrators when tanks are missing volume entries between their last entry date and yesterday.**

---

## 📅 How It Works

### Daily Schedule

- **Runs at**: 10:00 AM daily (configurable)
- **Checks for**: Missing entries from last entry date up to yesterday
- **Notifies**: Site Administrators via email

### What Gets Checked

For **each tank**, system finds the last entry date and checks all dates from then until yesterday:

- **Dynamic Date Range**: Last entry date → Yesterday
  - If last entry was 3 days ago, checks 2 days
  - If last entry was 1 month ago, checks ~30 days
  - No fixed lookback window - catches ALL gaps

- **Entry Types Checked** (ANY of these counts as an entry):
  - ✅ Opening balance
  - ✅ Closing balance
  - ✅ Transfers (in/out)
  - ✅ Dispensed fuel (refills)

If **NONE** of these exist for a date → **That date is flagged as missing**

### Who Gets Notified

- **Recipient**: Site Administrator (from `Site.SiteAdministratorId`)
- **Delivery**: Email (using existing EmailService)
- **Category**: "Data Entry" notifications
- **Content**: All missing dates for each tank (not just yesterday)

---

## 🏗️ Architecture Quick View

```
Background Service (10:00 AM daily)
    ↓
Query: GetMissingTankVolumeEntriesQuery
    ↓
Command: ProcessMissingEntryNotificationsCommand
    ↓
NotificationService.CreateNotificationAsync
    ↓
EmailService.SendEmailAsync → Site Administrator
```

---

## 📁 Key Files to Create

### Backend
```
FMS.Application/Features/TankManagement/TankVolumeHistory/
├── Queries/GetMissingTankVolumeEntriesQuery.cs
├── Commands/ProcessMissingEntryNotificationsCommand.cs
└── DTOs/
    ├── MissingTankVolumeEntryDto.cs
    └── MissingEntriesBySiteDto.cs

FMS.BackgroundServices/TankStock/
└── TankVolumeEntryCheckService.cs
```

### Frontend
```
fms.frontend/src/pages/tankStock/analytics/components/reporting/
└── MissingEntryNotificationSettings.js
└── MissingEntryNotificationSettings.scss
```

### Database
```sql
-- 1. Notification category (ONE-TIME SETUP)
INSERT INTO notificationcategories (CategoryName, Description)
VALUES ('Data Entry', 'Notifications for missing data');

-- 2. Notification policy (ONE-TIME SETUP - reused by all notifications)
INSERT INTO notificationpolicies (...) VALUES (...);

-- 3. System configurations
INSERT INTO systemconfigurations
  ('TankVolumeEntryCheck_ScheduleTime', '10:00', 'TankStock', ...),
  ('TankVolumeEntryCheck_Enabled', 'true', 'TankStock', ...);
```

**Key Workflow**:
1. ✅ Policy created ONCE during database setup
2. ✅ Each daily check CREATES notifications that REFERENCE the policy (via `NotificationPolicyId`)
3. ✅ Policy defines email template, delivery channels, rate limits
4. ✅ Recipients resolved dynamically by `NotificationRecipientResolver`
```

---

## 🔧 API Endpoints

### Get Missing Entries (for testing/manual check)
```
GET /api/tankvolumehistory/missing-entries?checkDate=2025-11-02
```

### Trigger Notification Manually
```
POST /api/tankvolumehistory/notify-missing-entries?checkDate=2025-11-02
```

---

## 💡 Key Implementation Points

### Query Logic (GetMissingTankVolumeEntriesQuery)

```csharp
1. Get yesterday's date
2. Get all active tanks
3. For each tank:
   a. Find last entry date (MAX RecordedDate)
   b. Calculate date range: lastEntry + 1 day → yesterday
   c. For each date in range, check if ANY volume history exists
   d. Collect all missing dates
4. Group by Site with all missing dates per tank
5. Return with Site Administrator info
```

### Command Logic (ProcessMissingEntryNotificationsCommand)

```csharp
// ⚠️ IMPORTANT: Do NOT create new policy, lookup existing one
1. Lookup existing "Data Entry" notification policy:
   var policy = await _context.NotificationPolicies
       .FirstOrDefaultAsync(p => p.Name == "Tank Volume Missing Entry Daily Alert");

2. For each site with missing entries:
   - Get Site Administrator
   - Format notification message with all tanks/dates
   - Create notification request:
     * CategoryId: WellKnownCategories.DataEntry
     * NotificationPolicyId: policy.Id  ← Reference existing policy
     * TriggerSource: "TankVolumeEntryCheck"
     * SiteId: {siteId}
   - Call NotificationService.CreateNotificationAsync(request)
     → Service uses policy's email template
     → Recipients resolved by NotificationRecipientResolver

3. Return success/failure summary
```

### Background Service Logic
```csharp
1. Calculate next run time (10:00 AM)
2. Wait until scheduled time
3. Execute: Query → Command → Notifications
4. Schedule next run (tomorrow 10:00 AM)
```

---

## 📧 Email Template Variables

```handlebars
{{SiteName}}           - Name of the site
{{MissingDate}}        - Date with missing entries (formatted)
{{MissingTanks}}       - Array of tank objects
  {{TankName}}         - Name of each tank
  {{MissingDate}}      - Missing date for tank
  {{LastEntryDate}}    - Last entry date (if available)
```

---

## ⚙️ Configuration Options

### System Configurations

| Key | Default | Description |
|-----|---------|-------------|
| `TankVolumeEntryCheck_ScheduleTime` | `10:00` | Daily check time (HH:mm format) |
| `TankVolumeEntryCheck_Enabled` | `true` | Enable/disable automated checks |
| `TankVolumeEntryCheck_MaxLookbackDays` | `90` | Maximum days to look back (safety limit to prevent excessive queries) |

**Note**: The system dynamically checks from last entry date to yesterday. MaxLookbackDays is a safety limit only.

### Access via
- UI: `/admin/systemconfig` (filter by "TankStock" category)
- Database: `systemconfigurations` table

---

## 🧪 Testing Checklist

### Manual Testing Steps
1. ✅ Set schedule to current time + 2 minutes
2. ✅ Ensure some tanks have NO entries for yesterday
3. ✅ Wait for service to trigger
4. ✅ Verify email sent to site administrator
5. ✅ Check notification created in system
6. ✅ Verify only tanks with missing entries included

### Test Scenarios

- ✅ Tank with all entries for all dates → No notification
- ✅ Tank with NO entries since last entry → Notification with all missing dates
- ✅ Tank with only opening on some days → Still has entry (no notification for those days)
- ✅ Tank with gaps (e.g., entries for Mon, Wed, Fri but not Tue, Thu) → Notification for Tue & Thu only
- ✅ Tank last entry 1 month ago → Notification with ~30 missing dates
- ✅ Multiple sites → Separate emails per site
- ✅ No site administrator → Graceful handling
- ✅ Manual trigger via API → Works correctly

---

## 🚀 Quick Deployment

### 1. Database Setup (5 minutes)
```sql
-- Run scripts in this order:
1. Create notification category
2. Create notification policy
3. Add system configurations
```

### 2. Backend Deploy (10 minutes)
```bash
dotnet build
dotnet publish
# Deploy to server
```

### 3. Service Registration
```csharp
// In Program.cs
services.AddHostedService<TankVolumeEntryCheckService>();
```

### 4. Frontend Deploy (5 minutes)
```bash
cd fms.frontend
npm run build:prod
# Deploy static files
```

### 5. Verify (5 minutes)
- ✅ Site administrators assigned to all sites
- ✅ SMTP configured for emails
- ✅ Background service started
- ✅ Configuration values set

---

## 🐛 Troubleshooting

### Service Not Running
```bash
# Check logs
tail -f /logs/tankstock-service.log

# Verify service registered
# Check Program.cs for AddHostedService call
```

### No Emails Sent
1. ✅ Check SMTP configuration in `appsettings.json`
2. ✅ Verify site has `SiteAdministratorId` assigned
3. ✅ Verify administrator user has email address
4. ✅ Check notification policy has `EnableEmail = true`

### Wrong Missing Entries
1. ✅ Verify query date logic (timezone issues?)
2. ✅ Check `VolumeChangeReasonEnum` values
3. ✅ Ensure `IsDeleted = false` filter applied
4. ✅ Check tank `IsActive` status

---

## 📊 Monitoring

### Logs to Watch
```
[INFO] Tank Volume Entry Check Service started
[INFO] Next check scheduled for: 2025-11-04 10:00:00
[INFO] Checking for missing entries on 2025-11-03
[INFO] Found 5 tanks with missing entries across 2 sites
[INFO] Notification sent to site admin for Site: Main Depot
[SUCCESS] Missing entry check completed successfully
```

### Metrics to Track
- Number of missing entries detected
- Notifications sent successfully
- Email delivery failures
- Sites with no administrator assigned

---

## 🔐 Permissions

### Required Permissions
| User Role | Permission | Access |
|-----------|-----------|--------|
| System Admin | Configure policies | Full |
| Site Admin | View notifications | Site-specific |
| Tank Manager | Manual trigger | Site-specific |

---

## 📞 Quick Links

### Documentation
- Full Plan: `IMPLEMENTATION_PLAN.md`
- API Docs: `Documentation/API/`
- User Guide: TBD

### Related Features
- Notification System: `Documentation/NotificationSystem/`
- Email Service: `Documentation/NotificationSystem/EmailService_Implementation_Summary.md`
- Tank Management: `Documentation/Features/TankManagement/`

---

**Quick Start Time Estimate**: ~2-3 hours for basic implementation
**Full Implementation**: ~1-2 days including testing
