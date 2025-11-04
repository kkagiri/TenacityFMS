# Tank Volume History Missing Entry Notification - Implementation Plan

## 📋 Overview

**Feature**: Automated Daily Notification for Missing Tank Volume History Entries

**Purpose**: Automatically check all tanks for missing daily fuel entries (opening, closing, transfer, or dispensed) and notify site administrators via email when data is missing.

**Trigger**: Daily at 10:00 AM automatically

**Target Recipients**: Site Administrators (from `Site.SiteAdministratorId`)

---

## 🎯 Business Requirements

### What to Check
For each tank, check for missing entries in `tankvolumehistory` from **the last entry date up to yesterday**:

- **Date Range**: Dynamic - from last entry date to yesterday (Today -1)
  - Example: If last entry was 7 days ago, check all 7 days
  - Example: If last entry was 1 month ago, check all days in that month
  - This catches ALL missing data gaps, not just recent ones

- **Check for ANY of these entry types per day**:
  - Opening balance
  - Closing balance
  - Transfers (in/out)
  - Dispensed fuel (refills)

### When to Send Notification
Send notification when a tank has **NO entries** for one or more dates between the last entry and yesterday. This catches:
- Yesterday's missing data
- Data missing from earlier in the week
- Data missing from weeks or months ago
- Tanks with no activity for extended periods

**Important**: Only report missing dates **after** the last entry date. Don't flag dates before the tank started operations.

### Who to Notify
- **Primary**: Site Administrator (from `Site.SiteAdministratorId`)
- **Format**: Email notification with:
  - List of tanks with missing data
  - All missing dates for each tank (could be multiple dates)
  - Last successful entry date for context

---

## 🏗️ Architecture Overview

### Components Required

```
┌─────────────────────────────────────────────────────────────────┐
│                    BACKGROUND SERVICE                            │
│  (Runs daily at 10:00 AM)                                       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ TankVolumeEntryCheckService                              │  │
│  │ - Scheduled via Hangfire/Windows Service                 │  │
│  │ - Triggers at 10:00 AM daily                             │  │
│  └────────────────┬─────────────────────────────────────────┘  │
└─────────────────────┼─────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ QUERY: GetMissingTankVolumeEntriesQuery                  │  │
│  │ - For each tank, find last entry date                    │  │
│  │ - Check all dates from last entry to yesterday           │  │
│  │ - Group by site                                           │  │
│  │ - Return list of tanks with missing dates                │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                              │
│  ┌────────────────▼─────────────────────────────────────────┐  │
│  │ COMMAND: ProcessMissingEntryNotificationsCommand         │  │
│  │ - Receives list of missing entries by site               │  │
│  │ - Creates notification for each site                     │  │
│  │ - Integrates with NotificationService                    │  │
│  └────────────────┬─────────────────────────────────────────┘  │
└─────────────────────┼─────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                 NOTIFICATION SYSTEM                              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ NotificationService.CreateNotificationAsync              │  │
│  │ - Creates notification with category "Data Entry"        │  │
│  │ - Links to NotificationPolicy                            │  │
│  │ - Resolves recipients (Site Admin)                       │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                              │
│  ┌────────────────▼─────────────────────────────────────────┐  │
│  │ EmailService.SendEmailAsync                              │  │
│  │ - Formats email with missing tank details                │  │
│  │ - Sends to Site Administrator email                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Design

### 1. Notification Policy for Missing Entries (ONE-TIME SETUP)

Create a notification policy **once** during database setup. This policy will be **reused** by all future notifications for missing tank volume entries:

```sql
-- Insert notification policy for missing tank volume entries
INSERT INTO notificationpolicies (
    PolicyName,
    NotificationCategoryId,
    Priority,
    EnableEmail,
    EnableSMS,
    EnableSystem,
    EmailTemplate,
    IsActive,
    CreatedAt
) VALUES (
    'Tank Volume Missing Entry Policy',
    (SELECT Id FROM notificationcategories WHERE CategoryName = 'Data Entry' LIMIT 1),
    'High',
    1, -- Enable email
    0, -- Disable SMS
    1, -- Enable system notification
    '<h2>Missing Tank Volume Entries</h2>
     <p>Dear Site Administrator,</p>
     <p>The following tanks at {{SiteName}} are missing volume entries for {{Date}}:</p>
     <ul>
     {{#TankList}}
     <li><strong>{{TankName}}</strong> - No entries for {{MissingDate}}</li>
     {{/TankList}}
     </ul>
     <p>Please ensure data is entered by end of day.</p>
     <p><em>This is an automated notification from FMS Tank Management System.</em></p>',
    1, -- Active
    NOW()
);
```

### 2. System Configuration for Schedule

Add configuration for schedule customization:

```sql
-- System configuration for missing entry check
INSERT INTO systemconfigurations (
    ConfigKey,
    ConfigValue,
    Category,
    Description,
    CreatedAt
) VALUES
(
    'TankVolumeEntryCheck_ScheduleTime',
    '10:00',
    'TankStock',
    'Daily time to check for missing tank volume entries (HH:mm format)',
    NOW()
),
(
    'TankVolumeEntryCheck_Enabled',
    'true',
    'TankStock',
    'Enable/disable automated missing entry notifications',
    NOW()
),
(
    'TankVolumeEntryCheck_MaxLookbackDays',
    '90',
    'TankStock',
    'Maximum number of days to look back from last entry (safety limit to prevent excessive queries)',
    NOW()
);
```

**Note**: The system dynamically checks from the last entry date to yesterday. The `MaxLookbackDays` setting is a safety limit - if a tank hasn't had an entry for more than this number of days, it will only check the most recent `MaxLookbackDays` to prevent performance issues.
```

### 3. Notification Category

Ensure "Data Entry" category exists:

```sql
-- Check/Create Data Entry category
INSERT INTO notificationcategories (CategoryName, Description, CreatedAt)
SELECT 'Data Entry', 'Notifications for missing or incomplete data entries', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM notificationcategories WHERE CategoryName = 'Data Entry'
);
```

---

## 🔧 Backend Implementation

### File Structure

```
FMS.Application/Features/TankManagement/
├── TankVolumeHistory/
│   ├── Queries/
│   │   └── GetMissingTankVolumeEntriesQuery.cs (NEW)
│   ├── Commands/
│   │   └── ProcessMissingEntryNotificationsCommand.cs (NEW)
│   └── DTOs/
│       ├── MissingTankVolumeEntryDto.cs (NEW)
│       └── MissingEntriesBySiteDto.cs (NEW)
│
FMS.BackgroundServices/
└── TankStock/
    └── TankVolumeEntryCheckService.cs (NEW)

FMS.WebClient/Controllers/
└── TankManagement/
    └── TankVolumeHistoryController.cs (UPDATE - add manual trigger endpoint)
```

### 1. Query: GetMissingTankVolumeEntriesQuery

**Location**: `FMS.Application/Features/TankManagement/TankVolumeHistory/Queries/GetMissingTankVolumeEntriesQuery.cs`

**Purpose**: Query database to find tanks with missing entries from last entry date up to yesterday

**Logic**:

```csharp
// Pseudo-code
1. Get yesterday's date (DateTime.Today.AddDays(-1))
2. Get all active tanks (IsActive = true)
3. For each tank:
   a. Find the LAST entry date in tankvolumehistory for this tank
      - Get MAX(RecordedDate) from tankvolumehistory WHERE TankId = tank.Id

   b. If no last entry found (new tank with no history):
      - Skip this tank (no baseline to compare against)

   c. If last entry exists:
      - Calculate date range: startDate = lastEntryDate + 1 day, endDate = Yesterday
      - For each date in this range:
        * Check if ANY volume history exists for that date
        * Check for these ChangeReasons:
          - Opening (VolumeChangeReasonEnum.Opening)
          - Closing (VolumeChangeReasonEnum.Closing)
          - Transfer (VolumeChangeReasonEnum.Transfer)
          - Dispensing (VolumeChangeReasonEnum.Dispensing)
        * If NO entries found for that date, add to missing dates list

   d. If tank has any missing dates, add to results with:
      - All missing dates (List<DateTime>)
      - Last successful entry date
      - Tank details

4. Group results by SiteId
5. Include site administrator info
6. Return FMSResponse<List<MissingEntriesBySiteDto>>
```

**Return Type**:

```csharp
public class MissingTankVolumeEntryDto {
    public int TankId { get; set; }
    public string TankName { get; set; }
    public int SiteId { get; set; }
    public string SiteName { get; set; }
    public List<DateTime> MissingDates { get; set; }  // All missing dates from last entry to yesterday
    public DateTime? LastEntryDate { get; set; }      // Last successful entry date for context
    public int TotalMissingDays { get; set; }         // Count of missing days
}

public class MissingEntriesBySiteDto {
    public int SiteId { get; set; }
    public string SiteName { get; set; }
    public int SiteAdministratorId { get; set; }
    public string SiteAdministratorEmail { get; set; }
    public List<MissingTankVolumeEntryDto> MissingTanks { get; set; }
    public int TotalMissingDays { get; set; }         // Total across all tanks for this site
}
```

**Example Scenarios**:

- **Scenario 1**: Tank last entry was yesterday → No missing dates, skip
- **Scenario 2**: Tank last entry was 3 days ago → Check 2 dates (day before yesterday, yesterday)
- **Scenario 3**: Tank last entry was 1 month ago → Check all 30 dates
- **Scenario 4**: Tank has entry for some days but not all → Only report missing dates
```

### 2. Command: ProcessMissingEntryNotificationsCommand

**Location**: `FMS.Application/Features/TankManagement/TankVolumeHistory/Commands/ProcessMissingEntryNotificationsCommand.cs`

**Purpose**: Process the missing entries and trigger notifications based on existing policy

**Logic**:
```csharp
// Pseudo-code
1. Receive List<MissingEntriesBySiteDto>
2. Lookup the "Data Entry" notification policy (created during database setup)
   - Find policy by category name "Data Entry" OR
   - Use well-known policy ID from configuration
3. For each site with missing entries:
   - Get Site Administrator from Site.SiteAdministratorId
   - Validate admin exists and has email
   - Format notification message with all missing tanks/dates
   - Create notification request:
     * CategoryId: WellKnownCategories.DataEntry (resolved to "Data Entry")
     * NotificationPolicyId: {policyId from step 2}
     * Title: "Missing Tank Volume Entries - {SiteName}"
     * Message: Formatted HTML with tank details
     * Priority: NotificationPriority.High
     * SiteId: {siteId}
     * TriggerSource: "TankVolumeEntryCheck"
     * TriggeredBy: "System"
   - Call NotificationService.CreateNotificationAsync(request)
     → Service will use the policy's email template
     → Recipients resolved by NotificationRecipientResolver (site admin)
     → Email sent automatically via policy configuration
4. Return FMSResponse with success/failure summary
```

**Key Points**:
- ✅ **Policy is created ONCE** during database setup (see Database Design section)
- ✅ **Each notification references that policy** via `NotificationPolicyId`
- ✅ **Policy defines**: Email template, delivery channels, rate limits
- ✅ **Recipients are resolved dynamically** by the notification system based on `SiteId` and `TriggerSource`

### 3. Background Service: TankVolumeEntryCheckService

**Location**: `FMS.BackgroundServices/TankStock/TankVolumeEntryCheckService.cs`

**Purpose**: Scheduled service to run daily at 10:00 AM

**Options for Scheduling**:
- **Option A**: Use existing Hangfire (if configured)
- **Option B**: Use Windows Service timer (FMS.PTS.WindowsService pattern)
- **Option C**: Hosted Background Service in FMS.WebClient

**Implementation** (Using BackgroundService pattern):
```csharp
public class TankVolumeEntryCheckService : BackgroundService {
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TankVolumeEntryCheckService> _logger;
    private Timer? _timer;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken) {
        _logger.LogInformation("Tank Volume Entry Check Service started");

        while (!stoppingToken.IsCancellationRequested) {
            var now = DateTime.Now;
            var scheduledTime = DateTime.Today.AddHours(10); // 10:00 AM

            if (now > scheduledTime) {
                scheduledTime = scheduledTime.AddDays(1); // Schedule for tomorrow
            }

            var delay = scheduledTime - now;

            _logger.LogInformation($"Next check scheduled for: {scheduledTime}");

            await Task.Delay(delay, stoppingToken);

            if (!stoppingToken.IsCancellationRequested) {
                await CheckMissingEntries(stoppingToken);
            }
        }
    }

    private async Task CheckMissingEntries(CancellationToken cancellationToken) {
        using var scope = _serviceProvider.CreateScope();
        var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

        // 1. Query for missing entries
        var missingEntriesResult = await mediator.Send(
            new GetMissingTankVolumeEntriesQuery(),
            cancellationToken
        );

        if (missingEntriesResult.IsSuccess && missingEntriesResult.Data?.Any() == true) {
            // 2. Process notifications
            await mediator.Send(
                new ProcessMissingEntryNotificationsCommand(missingEntriesResult.Data),
                cancellationToken
            );
        }
    }
}
```

---

## 🌐 Frontend Implementation

### Location
`fms.frontend/src/pages/tankStock/analytics/components/reporting/`

### New Component: MissingEntryNotificationSettings

**Purpose**: Allow administrators to configure the notification policy

**Features**:
- Enable/Disable automated checks
- Configure schedule time
- Test notification (manual trigger)
- View notification history

**File**: `MissingEntryNotificationSettings.js`

```jsx
// Key features:
- Toggle enable/disable
- Time picker for schedule
- Button to test notification manually
- List of recent notifications sent
- Configuration for lookback days
```

### Integration Points

1. **Add to Tank Stock Settings/Configuration page**
2. **Add manual trigger button in reporting section**
3. **Show notification status in dashboard**

---

## 🔌 API Endpoints

### TankVolumeHistoryController Updates

**Location**: `FMS.WebClient/Controllers/FuelManagement/TankVolumeHistoryController.cs`

```csharp
// GET: api/tankvolumehistory/missing-entries
[HttpGet("missing-entries")]
public async Task<IActionResult> GetMissingEntries(
    [FromQuery] DateTime? checkDate = null,
    CancellationToken cancellationToken = default)
{
    var date = checkDate ?? DateTime.Today.AddDays(-1);
    var query = new GetMissingTankVolumeEntriesQuery(date);
    var result = await _mediator.Send(query, cancellationToken);
    return result.IsSuccess ? Ok(result) : BadRequest(result);
}

// POST: api/tankvolumehistory/notify-missing-entries
[HttpPost("notify-missing-entries")]
public async Task<IActionResult> NotifyMissingEntries(
    [FromQuery] DateTime? checkDate = null,
    CancellationToken cancellationToken = default)
{
    // Manual trigger for testing
    var date = checkDate ?? DateTime.Today.AddDays(-1);
    var missingQuery = new GetMissingTankVolumeEntriesQuery(date);
    var missingResult = await _mediator.Send(missingQuery, cancellationToken);

    if (!missingResult.IsSuccess || !missingResult.Data.Any())
    {
        return Ok(FMSResponse<string>.Success("No missing entries found"));
    }

    var notifyCommand = new ProcessMissingEntryNotificationsCommand(missingResult.Data);
    var result = await _mediator.Send(notifyCommand, cancellationToken);

    return result.IsSuccess ? Ok(result) : BadRequest(result);
}
```

---

## 📧 Email Template

### HTML Template (Stored in NotificationPolicy)

**Note**: This template handles multiple missing dates per tank

```html
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .header { background-color: #498205; color: white; padding: 15px; }
        .content { padding: 20px; }
        .summary { background-color: #fff3cd; padding: 15px; margin: 15px 0; border-left: 4px solid #ffc107; }
        .tank-list { background-color: #f9f9f9; padding: 15px; margin: 10px 0; }
        .tank-item { padding: 12px; border-bottom: 1px solid #ddd; margin-bottom: 10px; }
        .missing-dates { color: #d32f2f; font-weight: bold; margin-top: 5px; }
        .date-badge { display: inline-block; background-color: #ffebee; padding: 3px 8px; margin: 2px; border-radius: 3px; font-size: 12px; }
        .footer { color: #666; font-size: 12px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>⚠️ Missing Tank Volume Entries - {{SiteName}}</h2>
    </div>
    <div class="content">
        <p>Dear Site Administrator,</p>

        <div class="summary">
            <strong>📊 Summary:</strong> {{TotalMissingDays}} missing entry day(s) detected across {{TankCount}} tank(s)
        </div>

        <p>The following tanks at <strong>{{SiteName}}</strong> have missing volume entries:</p>

        <div class="tank-list">
            {{#each MissingTanks}}
            <div class="tank-item">
                <strong>🛢️ {{this.TankName}}</strong><br/>
                <em>Last successful entry: {{this.LastEntryDate}}</em>

                <div class="missing-dates">
                    Missing Dates ({{this.TotalMissingDays}} day(s)):
                    <div>
                        {{#each this.MissingDates}}
                        <span class="date-badge">{{this}}</span>
                        {{/each}}
                    </div>
                </div>
            </div>
            {{/each}}
        </div>

        <p><strong>⚡ Action Required:</strong> Please enter missing tank volume data as soon as possible to maintain accurate fuel inventory records.</p>

        <p><strong>📝 What's needed:</strong> For each missing date, enter at least one of the following:</p>
        <ul>
            <li>Opening balance</li>
            <li>Closing balance</li>
            <li>Transfer (in/out)</li>
            <li>Dispensed fuel (refills)</li>
        </ul>

        <p>To enter data, please visit the <strong>Tank Stock Management</strong> module in the FMS system.</p>

        <div class="footer">
            <p><em>This is an automated notification from the FMS Tank Management System.</em></p>
            <p>This check runs daily at 10:00 AM and identifies all missing entries from the last entry date to yesterday.</p>
            <p>If you have questions, please contact your system administrator.</p>
        </div>
    </div>
</body>
</html>
```

### Email Template Variables

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `{{SiteName}}` | string | Name of the site | "Main Depot" |
| `{{TotalMissingDays}}` | int | Total count of missing days across all tanks | 15 |
| `{{TankCount}}` | int | Number of tanks with missing data | 3 |
| `{{MissingTanks}}` | array | Array of tank objects with missing data | - |
| `{{MissingTanks.TankName}}` | string | Name of tank | "Tank A - Diesel" |
| `{{MissingTanks.LastEntryDate}}` | date | Last successful entry date | "2025-10-25" |
| `{{MissingTanks.TotalMissingDays}}` | int | Missing days for this tank | 5 |
| `{{MissingTanks.MissingDates}}` | array | List of missing dates | ["2025-10-26", "2025-10-27", ...] |

---

## ✅ Implementation Checklist

### Phase 1: Database Setup
- [ ] Create/verify "Data Entry" notification category
- [ ] Create notification policy for missing entries
- [ ] Add system configurations for schedule
- [ ] Verify Site.SiteAdministratorId is populated for all sites

### Phase 2: Backend - Queries & Commands
- [ ] Create `MissingTankVolumeEntryDto.cs`
- [ ] Create `MissingEntriesBySiteDto.cs`
- [ ] Implement `GetMissingTankVolumeEntriesQuery` and handler
- [ ] Implement `ProcessMissingEntryNotificationsCommand` and handler
- [ ] Add unit tests for query and command

### Phase 3: Background Service
- [ ] Create `TankVolumeEntryCheckService.cs`
- [ ] Register service in DI container
- [ ] Add configuration for schedule time
- [ ] Test service execution

### Phase 4: API Endpoints
- [ ] Add `GetMissingEntries` endpoint
- [ ] Add `NotifyMissingEntries` endpoint (manual trigger)
- [ ] Add authorization checks
- [ ] Test endpoints

### Phase 5: Frontend
- [ ] Create `MissingEntryNotificationSettings.js` component
- [ ] Add to Tank Stock settings/configuration
- [ ] Implement manual trigger UI
- [ ] Add notification history view

### Phase 6: Integration & Testing
- [ ] Test email template rendering
- [ ] Test notification creation and delivery
- [ ] Test background service scheduling
- [ ] End-to-end testing
- [ ] Load testing with multiple sites

### Phase 7: Documentation
- [ ] Update API documentation
- [ ] Create user guide for site administrators
- [ ] Create admin guide for configuration
- [ ] Update system documentation

---

## 🔍 Testing Strategy

### Unit Tests
```csharp
// Test missing entry detection
[Fact]
public async Task GetMissingEntries_WithMissingYesterdayData_ReturnsMissingTanks()

// Test notification creation
[Fact]
public async Task ProcessNotifications_WithMissingEntries_CreatesNotifications()

// Test site admin resolution
[Fact]
public async Task ProcessNotifications_WithNoSiteAdmin_HandlesGracefully()
```

### Integration Tests
- Test full workflow from query to email
- Test with multiple sites
- Test with no site administrator assigned
- Test schedule triggering

### Manual Testing
1. Set schedule to current time + 2 minutes
2. Verify service triggers
3. Check missing entries detected
4. Verify email sent to site admin
5. Check notification appears in system

---

## 🚀 Deployment Steps

### 1. Database Migration
```bash
# Run SQL scripts to create:
- Notification category
- Notification policy
- System configurations
```

### 2. Backend Deployment
```bash
# Build and deploy updated services
dotnet build
dotnet publish
```

### 3. Service Registration
- Register `TankVolumeEntryCheckService` in `Program.cs`
- Configure service to start with application

### 4. Frontend Deployment
```bash
cd fms.frontend
npm run build:prod
# Deploy to web server
```

### 5. Configuration
- Verify SMTP settings for email
- Configure schedule time if different from 10:00 AM
- Assign site administrators to all sites

---

## 📈 Future Enhancements

1. **Multiple Notification Channels**
   - Add SMS notifications
   - Add in-app push notifications

2. **Configurable Rules**
   - Allow per-site custom rules
   - Different schedules for different sites
   - Weekend/holiday handling

3. **Escalation**
   - Escalate to regional managers if not resolved
   - Auto-escalation after X days

4. **Analytics**
   - Track compliance rates
   - Site performance reports
   - Missing entry trends

5. **Mobile App Integration**
   - Push notifications to mobile app
   - Quick data entry from notification

---

## 📞 Support & Maintenance

### Monitoring
- Log all scheduled runs
- Track notification success/failure rates
- Monitor email delivery status

### Troubleshooting
Common issues and solutions:
1. **Service not triggering**: Check service registration and logs
2. **No emails sent**: Verify SMTP configuration and site admin emails
3. **Incorrect missing entries**: Verify query logic and date handling
4. **Performance issues**: Add database indexes on TankVolumeHistory

### Configuration Access
- System Configuration: `/admin/systemconfig`
- Notification Policies: `/notifications/policies`
- Site Administrators: `/admin/sites`

---

## 📝 Notes

### Key Considerations
1. **Time Zone Handling**: Ensure all date comparisons use consistent time zone
2. **Site Administrator Validation**: Always check if site has assigned administrator
3. **Email Validation**: Verify administrator has valid email before sending
4. **Performance**: Consider batching for sites with many tanks
5. **Logging**: Log all executions for audit trail

### Dependencies
- Existing Notification System
- EmailService implementation
- Site entity with SiteAdministratorId
- TankVolumeHistory entity

### Permissions Required
- Site Administrator: Read notifications
- System Admin: Configure policies and schedules
- Tank Stock Manager: Manual trigger access

---

**Document Version**: 1.0
**Last Updated**: November 3, 2025
**Author**: System Architect
**Status**: Ready for Implementation
