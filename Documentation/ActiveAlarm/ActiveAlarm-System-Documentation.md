# Active Alarm System Documentation

## Overview

The Active Alarm System is a comprehensive alarm management solution within the FMS (Fuel Management System) that handles real-time alarm detection, processing, escalation, and resolution. It provides operators and managers with tools to monitor, acknowledge, and resolve critical system conditions across fuel stations.

## System Architecture

### Core Components

1. **ActiveAlarm Entity** - Domain model representing alarm state
2. **ActiveAlarmService** - Business logic for alarm lifecycle management
3. **ActiveAlarmController** - REST API endpoints for alarm operations
4. **AlarmHandlerService** - Processing of incoming alarm conditions
5. **NotificationService** - Integration for alarm notifications

### Key Features

- ✅ **Real-time alarm detection** from PTS devices and system monitors
- ✅ **Lifecycle management** (Active → Acknowledged → Resolved)
- ✅ **Escalation workflows** for unattended critical alarms
- ✅ **Bulk operations** for efficient alarm handling
- ✅ **Auto-resolution** for temporary conditions
- ✅ **Rich context** linking to tanks, devices, sites, and reconciliations
- ✅ **Notification integration** with email, SMS, and real-time updates
- ✅ **Audit trail** with user actions and timestamps

## Data Model

### ActiveAlarm Entity Properties

#### Core Identity
| Property | Type | Description |
|----------|------|-------------|
| `Id` | int | Primary key identifier |
| `AlarmType` | string(50) | Type of alarm (LowTankVolume, DeviceDisconnection, etc.) |
| `State` | string(20) | Current state: Active, Acknowledged, Resolved, Suppressed |
| `TriggerSource` | string(20) | How triggered: Manual, Policy, Hardware, System |

#### Timestamps
| Property | Type | Description |
|----------|------|-------------|
| `TriggeredAt` | DateTime | When alarm condition was first detected |
| `AcknowledgedAt` | DateTime? | When alarm was acknowledged by user |
| `ResolvedAt` | DateTime? | When alarm condition was resolved |
| `LastEscalatedAt` | DateTime? | Last escalation timestamp |

#### User Actions
| Property | Type | Description |
|----------|------|-------------|
| `AcknowledgedBy` | string(100) | Username who acknowledged the alarm |
| `ResolvedBy` | string(100) | Username who resolved the alarm |
| `ResolutionNotes` | string(1000) | Actions taken and resolution details |

#### Priority & Severity
| Property | Type | Description |
|----------|------|-------------|
| `Severity` | DiscrepancySeverity | System severity level (enum) |
| `Priority` | string(20) | Handling priority: Low, Medium, High, Critical |
| `EscalationLevel` | int | Number of escalations performed |

#### Content
| Property | Type | Description |
|----------|------|-------------|
| `Message` | string(500) | Human-readable alarm message |
| `Description` | string(1000) | Detailed description or context |
| `AdditionalData` | JSON | Extended data in JSON format |

#### Context Links
| Property | Type | Description |
|----------|------|-------------|
| `SiteId` | int? | Related fuel station site |
| `TankId` | int? | Related fuel tank |
| `DeviceId` | int? | Related device |
| `PtsDeviceId` | string(50) | PTS device identifier |
| `AlarmHandlerId` | int? | Processing alarm handler |
| `AlertRecordId` | int? | Source PTS alert record |
| `ReconciliationDiscrepancyId` | int? | Related stock discrepancy |

#### Values & Measurements
| Property | Type | Description |
|----------|------|-------------|
| `ThresholdValue` | decimal? | Threshold that was crossed |
| `ActualValue` | decimal? | Actual value that triggered alarm |
| `Unit` | string(20) | Unit of measurement |

#### Configuration
| Property | Type | Description |
|----------|------|-------------|
| `SuppressNotifications` | bool | Whether to send notifications |
| `AutoResolveMinutes` | int | Auto-resolve after X minutes (0 = manual only) |

#### Navigation Properties
- `Site` - Related fuel station
- `Tank` - Related fuel tank
- `Device` - Related monitoring device
- `AlarmHandler` - Processing handler
- `PTSAlertRecord` - Source hardware alert
- `ReconciliationDiscrepancy` - Related stock issue
- `Notifications` - Generated notifications
- `IssueTrackers` - Related issue tickets

## Alarm States & Lifecycle

### State Flow
```
Triggered → Active → Acknowledged → Resolved
    ↓         ↓           ↓
Suppressed   Escalated   Auto-Resolved
```

### State Definitions

#### **Active**
- Initial state when alarm condition is detected
- Requires operator attention
- Generates notifications per policy
- Can be acknowledged or suppressed

#### **Acknowledged**
- Operator has seen and accepted responsibility
- Stops further notifications
- Can still be escalated if not resolved
- Moves to resolved when condition clears

#### **Resolved**
- Alarm condition has been fixed
- Final state for most alarms
- Includes resolution notes
- Historical record maintained

#### **Suppressed**
- Temporarily silenced by operator
- Stops notifications but remains active
- Used for known issues during maintenance
- Can be un-suppressed to resume normal flow

## API Endpoints

### Core Operations

#### Get Active Alarms
```http
GET /api/active-alarms
```
**Query Parameters:**
- `siteId` (int?) - Filter by site
- `alarmType` (string?) - Filter by alarm type
- `state` (string?) - Filter by state
- `priority` (string?) - Filter by priority
- `fromDate` (DateTime?) - Date range start
- `toDate` (DateTime?) - Date range end
- `skip` (int) - Pagination offset (default: 0)
- `take` (int) - Page size (default: 50)

**Response:** Paginated list of active alarms

#### Get Alarm by ID
```http
GET /api/active-alarms/{id}
```
**Response:** Single alarm with full details

#### Acknowledge Alarm
```http
POST /api/active-alarms/{id}/acknowledge
```
**Body:**
```json
{
  "notes": "Investigating tank level sensor"
}
```

#### Resolve Alarm
```http
POST /api/active-alarms/{id}/resolve
```
**Body:**
```json
{
  "resolutionNotes": "Replaced faulty sensor, levels now normal"
}
```

#### Suppress Alarm
```http
POST /api/active-alarms/{id}/suppress
```
**Effect:** Stops notifications while keeping alarm active

#### Bulk Operations
```http
POST /api/active-alarms/bulk-acknowledge
```
**Body:**
```json
{
  "alarmIds": [123, 124, 125],
  "notes": "Acknowledged during maintenance window"
}
```

## Alarm Types

### Tank-Related Alarms
- **LowTankVolume** - Tank level below minimum threshold
- **HighTankVolume** - Tank level above maximum threshold
- **TankCriticalHighLevel** - Emergency high level condition
- **TankCriticalLowLevel** - Emergency low level condition
- **TankLeakDetected** - Suspected tank leak
- **TankOverfilling** - Tank overfill condition

### Device Alarms
- **DeviceDisconnection** - Device communication lost
- **DeviceOffline** - Device not responding
- **PumpOffline** - Fuel pump not operational
- **SensorMalfunction** - Sensor reading errors
- **HardwareFailure** - Equipment hardware issues

### System Alarms
- **DiscrepancyDetected** - Stock reconciliation variance
- **StockDiscrepancy** - Inventory count mismatch
- **SystemError** - Software system errors
- **CommunicationFailure** - Network/communication issues
- **PolicyViolation** - Business rule violations

## Priority Levels

### **Critical**
- **Response Time:** Immediate (< 15 minutes)
- **Examples:** Tank overfill, critical safety alarms
- **Escalation:** Every 30 minutes if unacknowledged
- **Notifications:** All channels (SMS, email, system)

### **High**
- **Response Time:** 1 hour
- **Examples:** Device failures, significant discrepancies
- **Escalation:** Every 2 hours if unacknowledged
- **Notifications:** Email, system notifications

### **Medium**
- **Response Time:** 4 hours
- **Examples:** Minor discrepancies, sensor warnings
- **Escalation:** Daily if unresolved
- **Notifications:** System notifications, daily email digest

### **Low**
- **Response Time:** Next business day
- **Examples:** Informational alerts, minor variances
- **Escalation:** Weekly summary
- **Notifications:** System notifications only

## Frontend User Stories

### 🚨 **Alarm Operations**
1. **As an operator**, I want to view all active alarms so I can see what needs attention
2. **As an operator**, I want to filter alarms by site/type/priority so I can focus on relevant issues
3. **As an operator**, I want to acknowledge alarms so others know I'm handling them
4. **As a supervisor**, I want to resolve alarms with notes so there's a record of actions taken
5. **As an operator**, I want to bulk acknowledge multiple alarms so I can handle similar issues efficiently

### 📊 **Dashboard & Monitoring**
6. **As a manager**, I want to see alarm statistics so I can understand system health
7. **As an operator**, I want to see unacknowledged critical alarms so I can prioritize urgent issues
8. **As a supervisor**, I want to track resolution times so I can measure team performance
9. **As a manager**, I want to see escalated alarms so I know what needs management attention

### 🔧 **Alarm Management**
10. **As a supervisor**, I want to suppress noisy alarms so operators focus on real issues
11. **As an admin**, I want to escalate critical unacknowledged alarms so nothing is missed
12. **As a system**, I want to auto-resolve temporary alarms so operators aren't overwhelmed
13. **As an operator**, I want to see alarm history and notes so I understand previous actions

### 🎯 **Context & Details**
14. **As an operator**, I want to see tank/device context so I know exactly what equipment is affected
15. **As an operator**, I want to see threshold vs actual values so I understand the severity
16. **As a supervisor**, I want to see alarm source so I know if it's manual or automatic
17. **As an operator**, I want to see time since triggered so I know how urgent it is

## Frontend Implementation Guide

### Required UI Components

#### **Alarm Grid Component**
```typescript
interface AlarmGridProps {
  filters: AlarmFilters;
  onAlarmSelect: (alarm: ActiveAlarm) => void;
  onBulkAction: (action: string, alarmIds: number[]) => void;
  realTimeUpdates: boolean;
}
```

#### **Quick Action Buttons**
```typescript
interface QuickActionsProps {
  alarm: ActiveAlarm;
  onAcknowledge: (notes?: string) => void;
  onResolve: (notes: string) => void;
  onSuppress: () => void;
  onEscalate: () => void;
}
```

#### **Alarm Statistics Dashboard**
```typescript
interface AlarmStatsProps {
  statistics: {
    totalActive: number;
    unacknowledged: number;
    critical: number;
    byPriority: Record<string, number>;
    byType: Record<string, number>;
    bysite: Record<string, number>;
  };
}
```

#### **Alarm Detail Panel**
```typescript
interface AlarmDetailProps {
  alarm: ActiveAlarm;
  showHistory: boolean;
  onEdit: (updates: Partial<ActiveAlarm>) => void;
}
```

### State Management

#### **Alarm State Interface**
```typescript
interface AlarmState {
  alarms: ActiveAlarm[];
  selectedAlarms: number[];
  filters: AlarmFilters;
  statistics: AlarmStatistics;
  loading: boolean;
  error?: string;
}
```

#### **Actions**
```typescript
enum AlarmActionTypes {
  LOAD_ALARMS = 'LOAD_ALARMS',
  ACKNOWLEDGE_ALARM = 'ACKNOWLEDGE_ALARM',
  RESOLVE_ALARM = 'RESOLVE_ALARM',
  BULK_ACKNOWLEDGE = 'BULK_ACKNOWLEDGE',
  UPDATE_FILTERS = 'UPDATE_FILTERS',
  REAL_TIME_UPDATE = 'REAL_TIME_UPDATE'
}
```

### Real-time Updates

#### **SignalR Integration**
```typescript
// Connect to alarm updates hub
const alarmConnection = new HubConnectionBuilder()
  .withUrl("/hubs/active-alarms")
  .build();

// Listen for alarm updates
alarmConnection.on("AlarmCreated", (alarm: ActiveAlarm) => {
  dispatch({ type: 'ALARM_CREATED', payload: alarm });
});

alarmConnection.on("AlarmStateChanged", (alarmId: number, newState: string) => {
  dispatch({ type: 'ALARM_STATE_CHANGED', payload: { alarmId, newState } });
});
```

## Business Rules

### Auto-Resolution
- Alarms with `AutoResolveMinutes > 0` automatically resolve if condition clears
- System checks every 5 minutes for auto-resolution candidates
- Resolution notes include "Auto-resolved: condition cleared"

### Escalation Rules
- **Critical alarms:** Escalate every 30 minutes if unacknowledged
- **High alarms:** Escalate every 2 hours if unacknowledged
- **Medium alarms:** Escalate daily if unresolved
- **Low alarms:** Weekly summary escalation

### Duplicate Prevention
- Same alarm type + source context within 5 minutes = duplicate
- Duplicates update existing alarm instead of creating new
- Count of duplicate occurrences tracked in `AdditionalData`

### Notification Suppression
- `SuppressNotifications = true` prevents all notifications
- Useful during maintenance windows
- Can be toggled via API or dashboard

## Integration Points

### PTS Hardware Integration
```csharp
// UploadAlertRecordHandler processes PTS alerts
public async Task<FMSResponse> ProcessPTSAlert(PTSAlertData alert)
{
    // Convert PTS alert to ActiveAlarm
    var alarmRequest = MapPTSAlertToAlarm(alert);

    // Create active alarm
    var alarm = await _activeAlarmService.CreateActiveAlarmAsync(alarmRequest);

    return FMSResponse.Success(alarm);
}
```

### Notification System Integration
```csharp
// Automatic notification on alarm creation
public async Task<ActiveAlarm> CreateActiveAlarmAsync(CreateActiveAlarmRequest request)
{
    var alarm = new ActiveAlarm { /* ... */ };
    _context.ActiveAlarms.Add(alarm);
    await _context.SaveChangesAsync();

    // Trigger notification if not suppressed
    if (!alarm.SuppressNotifications)
    {
        await TriggerAlarmNotification(alarm);
    }

    return alarm;
}
```

### Issue Tracker Integration
- Resolved alarms can create issue tracker entries
- Links alarm resolution to maintenance tasks
- Provides audit trail for recurring issues

## Performance Considerations

### Database Indexing
```sql
-- Recommended indexes for ActiveAlarms table
CREATE INDEX IX_ActiveAlarms_State_Priority ON ActiveAlarms (State, Priority);
CREATE INDEX IX_ActiveAlarms_SiteId_TriggeredAt ON ActiveAlarms (SiteId, TriggeredAt);
CREATE INDEX IX_ActiveAlarms_AlarmType_State ON ActiveAlarms (AlarmType, State);
CREATE INDEX IX_ActiveAlarms_TankId_State ON ActiveAlarms (TankId, State) WHERE TankId IS NOT NULL;
```

### Caching Strategy
- Cache active alarm counts by priority/site
- Cache alarm statistics for dashboard
- Redis cache for frequently accessed alarm details

### Real-time Performance
- SignalR groups by site for targeted updates
- Debounce rapid alarm updates
- Batch notification sending for bulk operations

## Security & Permissions

### Role-Based Access
- **Operators:** View, acknowledge alarms
- **Supervisors:** All operator permissions + resolve, suppress
- **Managers:** All permissions + bulk operations, statistics
- **Admins:** Full system configuration access

### Audit Trail
- All alarm state changes logged with user and timestamp
- Resolution notes required for alarm closure
- Complete history maintained for compliance

## Troubleshooting

### Common Issues

#### **Alarms Not Creating**
- Check PTS device connectivity
- Verify alarm handler configuration
- Review notification policy settings

#### **Notifications Not Sending**
- Check `SuppressNotifications` flag
- Verify notification service configuration
- Review recipient group settings

#### **Auto-Resolution Not Working**
- Verify `AutoResolveMinutes` setting
- Check background service is running
- Review alarm condition logic

### Monitoring & Metrics
- Track alarm creation rates by type
- Monitor resolution times by priority
- Alert on excessive unacknowledged alarms
- Dashboard for system health metrics

## Future Enhancements

### Planned Features
- **AI-Powered Alarm Correlation** - Detect patterns in related alarms
- **Mobile Push Notifications** - Real-time mobile alerts
- **Alarm Templates** - Configurable alarm response procedures
- **Advanced Analytics** - Predictive alarm analysis
- **Integration APIs** - Third-party SCADA system integration

### Scalability Improvements
- Event sourcing for alarm history
- Microservice decomposition
- Time-series database for metrics
- Advanced caching strategies

---

## Quick Reference

### Common Alarm Types
| Type | Priority | Auto-Resolve | Typical Source |
|------|----------|--------------|----------------|
| LowTankVolume | High | 30 min | PTS Tank Probe |
| DeviceOffline | Medium | 10 min | Device Monitor |
| DiscrepancyDetected | Medium | Manual | Stock Reconciliation |
| TankOverfill | Critical | Manual | PTS Safety System |

### State Transitions
| From | To | Action | Required |
|------|----|---------|---------|
| Active | Acknowledged | User acknowledges | User ID |
| Acknowledged | Resolved | User resolves | Resolution notes |
| Active | Suppressed | User suppresses | - |
| Suppressed | Active | User un-suppresses | - |
| Active | Resolved | Auto-resolve | Timer expires |

### Priority Response Times
| Priority | Response | Escalation | Channels |
|----------|----------|------------|----------|
| Critical | 15 min | 30 min | All |
| High | 1 hour | 2 hours | Email, System |
| Medium | 4 hours | Daily | System |
| Low | Next day | Weekly | System |
