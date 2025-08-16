# ActiveAlarm Integration Documentation

## Overview

The ActiveAlarm system provides comprehensive alarm lifecycle management across the FMS application. This document covers the implementation, usage, and integration patterns for ActiveAlarm functionality.

## Architecture Overview

### Core Components

1. **ActiveAlarm Entity** - The main alarm record in the database
2. **ActiveAlarmService** - Core service for alarm lifecycle operations
3. **AlarmHandlerActiveAlarmIntegration** - Bridge service connecting different alarm sources
4. **ActiveAlarmController** - REST API endpoints for frontend integration
5. **UploadAlertRecordHandler** - PTS hardware alert integration
6. **ClosingStockCommand** - Tank stock discrepancy alarm creation

## ActiveAlarm Entity Structure

```csharp
public class ActiveAlarm {
    public int Id { get; set; }
    public string AlarmType { get; set; }           // LowTankVolume, DiscrepancyDetected, etc.
    public string State { get; set; }               // Active, Acknowledged, Resolved, Suppressed
    public string TriggerSource { get; set; }       // Manual, Policy, Hardware, System
    public DateTime TriggeredAt { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? AcknowledgedBy { get; set; }
    public string? ResolvedBy { get; set; }
    public DiscrepancySeverity Severity { get; set; } // Low, Medium, High, Critical
    public string Priority { get; set; }            // Low, Medium, High, Critical
    public string Message { get; set; }
    public string? Description { get; set; }

    // Relationships
    public int? SiteId { get; set; }
    public int? TankId { get; set; }
    public int? DeviceId { get; set; }
    public string? PtsDeviceId { get; set; }
    public int? AlarmHandlerId { get; set; }
    public int? AlertRecordId { get; set; }
    public int? ReconciliationDiscrepancyId { get; set; }

    // Escalation & Auto-resolution
    public int EscalationLevel { get; set; }
    public DateTime? LastEscalatedAt { get; set; }
    public int AutoResolveMinutes { get; set; }

    // Additional data and metadata
    public string? AdditionalData { get; set; }      // JSON format
    public string? ResolutionNotes { get; set; }
    public bool SuppressNotifications { get; set; }
}
```

## Implementation Examples

### 1. UploadAlertRecordHandler Integration

The PTS hardware alert handler integrates with ActiveAlarm to prevent duplicate alarms and manage alarm lifecycle:

```csharp
public class UploadAlertRecordHandler : IPacketHandler {
    private readonly AlarmHandlerActiveAlarmIntegration _activeAlarmIntegration;
    private readonly IDatabase _redisDb;

    // Key Features:
    // - Deduplication using Redis cooldown (5-minute periods)
    // - Automatic alarm resolution on "Finished" state
    // - Occurrence tracking and escalation logic
    // - Proper PTS state handling: "Started", "Detected", "Finished"

    private async Task HandleActiveAlarmAsync(string deviceId, AlertRecordDto alertDto,
        Alarm alarm, Ptsdevice device, Tank tank) {

        var alarmIdentifier = CreateAlarmIdentifier(deviceId, alertDto, alarm);
        var existingActiveAlarm = await FindExistingActiveAlarmAsync(alarmIdentifier,
            deviceId, alarm.Id, tank?.Id);

        if (alertDto.State == "Started" || alertDto.State == "Detected") {
            if (existingActiveAlarm != null && existingActiveAlarm.State != "Resolved") {
                // Update existing alarm - prevents duplicates
                await UpdateExistingActiveAlarmAsync(existingActiveAlarm, alertDto);
            } else {
                // Create new ActiveAlarm
                await CreateNewActiveAlarmAsync(deviceId, alertDto, alarm, device, tank);
            }
        } else if (alertDto.State == "Finished") {
            if (existingActiveAlarm != null && existingActiveAlarm.State != "Resolved") {
                // Auto-resolve alarm
                await ResolveActiveAlarmAsync(existingActiveAlarm, alertDto);
            }
        }
    }
}
```

### 2. ClosingStockCommand Integration

Tank stock operations create ActiveAlarms for significant discrepancies:

```csharp
public class ClosingStockCommandHandler : IRequestHandler<ClosingStockCommand, FMSResponseMessage> {
    private readonly AlarmHandlerActiveAlarmIntegration _activeAlarmIntegration;

    // Creates ActiveAlarms for:
    // - Large tank stock discrepancies
    // - Sensor variance issues
    // - Unexpected volume changes

    private async Task<Domain.Entities.ActiveAlarm?> CreateDiscrepancyActiveAlarmAsync(
        Tank tank, TankStock latestStock, decimal discrepancyAmount,
        DiscrepancySeverity severity, CancellationToken cancellationToken) {

        var alarmRequest = new CreateAlarmNotificationRequest {
            AlarmType = "TankStockDiscrepancy",
            Category = "TankManagement",
            Message = $"Tank discrepancy detected: {Math.Abs(discrepancyAmount):F2}L",
            Priority = GetPriorityFromSeverity(severity),
            TriggeredBy = "System",
            SiteId = tank.SiteId,
            TankId = tank.Id,
            Data = new {
                DiscrepancyAmount = discrepancyAmount,
                LatestStockLevel = latestStock.ClosingStock,
                Severity = severity.ToString(),
                TankName = tank.Name
            }
        };

        return await _activeAlarmIntegration.CreateActiveAlarmFromDiscrepancy(
            alarmRequest, latestStock.Id, cancellationToken);
    }
}
```

## API Endpoints

### ActiveAlarm REST API

Base URL: `/api/active-alarms`

#### Core Operations
- `GET /` - Get active alarms with filtering and pagination
- `GET /{id}` - Get specific alarm details
- `POST /` - Create new active alarm
- `POST /{id}/acknowledge` - Acknowledge an alarm
- `POST /{id}/resolve` - Resolve an alarm
- `POST /{id}/suppress` - Suppress an alarm
- `POST /{id}/escalate` - Escalate an alarm

#### Bulk Operations
- `POST /bulk-acknowledge` - Acknowledge multiple alarms
- `GET /statistics` - Get alarm statistics for dashboard

#### System Operations
- `POST /process-auto-resolve` - Process auto-resolution (Admin only)
- `POST /process-escalation` - Process escalation (Admin only)

### Example API Usage

```javascript
// Get active alarms for a specific site
const response = await fetch('/api/active-alarms?siteId=1&state=Active&take=20');
const alarms = await response.json();

// Acknowledge an alarm
await fetch('/api/active-alarms/123/acknowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: 'Investigating issue' })
});

// Get alarm statistics
const stats = await fetch('/api/active-alarms/statistics?siteId=1');
const statistics = await stats.json();
```

## Frontend Integration Points

### 1. Main Dashboard
- **Active Alarm Count**: Display total critical/high priority alarms
- **Recent Alarms Widget**: Show latest 5-10 alarms with quick actions
- **Alarm Trend Chart**: Historical alarm frequency over time

### 2. Tank Dashboard
- **Tank-Specific Alarms**: Filter alarms by `TankId`
- **Stock Discrepancy Alerts**: Highlight tank volume issues
- **Sensor Status Indicators**: Show device-related alarms

### 3. PTS Dashboard
- **Device Alarms**: Filter by `PtsDeviceId`
- **Hardware Status**: Show pump, probe, reader alarms
- **Communication Issues**: Display connectivity problems

### 4. Dedicated Alarm Management
- **Alarm List View**: Full alarm management interface
- **Bulk Operations**: Multi-select acknowledge/resolve
- **Filtering & Search**: By type, severity, date range, etc.
- **Alarm Details Modal**: Full alarm context and history

## Notification Integration

### NotificationPolicy Integration

ActiveAlarms integrate with the notification policy system:

```json
{
  "policyName": "Critical Tank Alarms",
  "triggers": [
    {
      "triggerType": "ActiveAlarmCreated",
      "conditions": {
        "alarmType": "TankStockDiscrepancy",
        "severity": "Critical",
        "tankId": [1, 2, 3]
      }
    }
  ],
  "actions": [
    {
      "type": "EmailNotification",
      "recipients": ["tank-managers"],
      "template": "critical-tank-alarm"
    },
    {
      "type": "SmsNotification",
      "recipients": ["on-call-staff"],
      "conditions": {
        "afterHours": true
      }
    }
  ]
}
```

### NotificationGroup Usage

Groups define who receives alarm notifications:

- **Tank Managers**: Stock discrepancy alarms
- **Maintenance Team**: Hardware/device alarms
- **Operations**: High priority operational alarms
- **Management**: Critical system-wide issues

## Key Features & Benefits

### 1. Deduplication
- **Redis Cooldown**: Prevents alarm spam from periodic data (every 2 seconds)
- **Alarm Identifiers**: Unique identification prevents duplicate creation
- **State Management**: Proper lifecycle from creation to resolution

### 2. Escalation System
- **Automatic Escalation**: Unacknowledged alarms escalate after 15 minutes
- **Escalation Levels**: Progressive escalation (Level 1-3)
- **Escalation Notifications**: Different recipients at each level

### 3. Auto-Resolution
- **Time-Based**: Alarms can auto-resolve after specified minutes
- **Event-Based**: PTS "Finished" state auto-resolves related alarms
- **System Integration**: Stock corrections can resolve discrepancy alarms

### 4. Rich Metadata
- **Additional Data**: JSON storage for alarm-specific details
- **Relationships**: Link to tanks, devices, discrepancies, etc.
- **Audit Trail**: Full history of alarm state changes

## Database Configuration

### Entity Framework Configuration

```csharp
public class ActiveAlarmConfiguration : IEntityTypeConfiguration<ActiveAlarm> {
    public void Configure(EntityTypeBuilder<ActiveAlarm> builder) {
        builder.ToTable("ActiveAlarms");

        // Indexes for performance
        builder.HasIndex(e => e.State);
        builder.HasIndex(e => e.TriggeredAt);
        builder.HasIndex(e => e.AlarmType);
        builder.HasIndex(e => new { e.SiteId, e.State });
        builder.HasIndex(e => new { e.TankId, e.State });
        builder.HasIndex(e => new { e.PtsDeviceId, e.State });

        // Relationships
        builder.HasOne(d => d.Site)
            .WithMany(p => p.ActiveAlarms)
            .HasForeignKey(d => d.SiteId);

        builder.HasOne(d => d.Tank)
            .WithMany(p => p.ActiveAlarms)
            .HasForeignKey(d => d.TankId);
    }
}
```

## Background Processing

### ActiveAlarmProcessingService

Handles automatic alarm processing:

```csharp
public class ActiveAlarmProcessingService : BackgroundService {
    // Runs every 5 minutes
    protected override async Task ExecuteAsync(CancellationToken stoppingToken) {
        while (!stoppingToken.IsCancellationRequested) {
            await ProcessAutoResolveAlarms();
            await ProcessEscalationAlarms();
            await CleanupOldResolvedAlarms();

            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }
}
```

## Next Steps for Frontend Implementation

### 1. Create React Components
- `ActiveAlarmsList` - Main alarm listing component
- `AlarmCard` - Individual alarm display
- `AlarmFilters` - Filtering and search interface
- `AlarmActions` - Acknowledge, resolve, escalate buttons
- `AlarmStatistics` - Dashboard statistics widget

### 2. Add to Navigation
- Main navigation: "Active Alarms" section
- Dashboard widgets: Alarm counts and recent alarms
- Module-specific: Tank alarms in tank module, PTS alarms in PTS module

### 3. Integrate with NotificationPolicy
- Policy creation UI for alarm-based triggers
- Group management for alarm recipients
- Template management for alarm notifications

### 4. Mobile Responsiveness
- Ensure alarm management works on mobile devices
- Consider push notifications for critical alarms
- Optimize for field staff using mobile devices

This documentation provides a comprehensive overview of the ActiveAlarm system implementation and integration patterns across the FMS application.
