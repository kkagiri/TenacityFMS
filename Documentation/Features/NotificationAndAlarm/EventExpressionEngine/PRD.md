# PRD: FMS Event Expression Engine

## Product Requirements Document

**Version:** 1.0
**Date:** 2026-02-11
**Status:** Draft
**Author:** Engineering Team

---

## 1. Problem Statement

The current notification/alarm system has **three disconnected pipelines** that duplicate logic, produce double notifications, and confuse administrators:

| Pipeline | Entry Point | Filter System | Touches AlarmHandler? | Touches Policy.TriggerConditions? |
|----------|-------------|--------------|----------------------|----------------------------------|
| **1 — AlarmHandler** | `AlarmHandlerService.Process*()` | `AlarmHandler` DB columns (type, site, tank) | ✅ Yes | ✅ Also checks via PolicyRulesProcessor |
| **2 — ActiveAlarm Lifecycle** | `ActiveAlarmService.CreateAlarmNotificationAsync()` | `Policy.TriggerConditions` JSON ("Active Alarm Filters") | ❌ Never | ✅ Yes |
| **3 — Direct Calls** | `ClosingStockCommand`, `ReconciliationService`, etc. | None — hardcoded | ❌ Never | ❌ Never |

### Concrete Issues

1. **Double notifications** — `ClosingStockCommand` calls `CreateNotificationAsync()` directly AND creates an ActiveAlarm with `CreateNotification=true`, producing two notifications for the same event.
2. **Orphaned filters** — "Active Alarm Filters" tab on PolicyEdit edits `Policy.TriggerConditions`, but Pipeline 1 (the main path) ignores it. Pipeline 2 uses it but Pipeline 1 doesn't.
3. **Duplicate scope** — `alarmType`, `siteId`, `tankId` exist on BOTH `AlarmHandler` (DB columns) and `Policy.TriggerConditions` (JSON), evaluated by different code.
4. **Category ID mismatch** — `WellKnownCategories` enum values don't match database IDs (e.g., enum `PtsTankAlarm=17` → DB id 17 is "TankVariance").
5. **1625-line obsolete service** — `AlarmHandlerService.cs` is marked `[Obsolete]` but is still the primary code path for PTS telemetry alarms.
6. **No single entry point** — Business code must know which pipeline to call, which service to inject, and what category IDs to hardcode.

---

## 2. Proposed Solution: Event Expression Engine

### 2.1 Naming Convention

| Old Term | New Term | Rationale |
|----------|----------|-----------|
| Alarm / ActiveAlarm | **Event** / **FMSEvent** | Not all events are "alarms" — discrepancies, status changes, maintenance due |
| AlarmHandler | **EventExpression** | An expression/rule that evaluates whether an event should trigger a notification (like GPSgate EventRules) |
| AlarmType | **EventType** | Consistent naming |
| Policy TriggerConditions | ❌ Removed | Conditions belong on EventExpression, not on policies |
| Active Alarm Filters (UI tab) | ❌ Removed | Replaced by EventExpression management |
| NotificationCategory | **EventCategory** | Classification/grouping only (unchanged table, clarified role) |

### 2.2 Architecture — Three Building Blocks

```
┌────────────────────────────────────────────────────┐
│  FMSEvent (abstract base class)                    │
│  "WHAT happened"                                   │
│                                                    │
│  - EventType: string (e.g. "TankStockDiscrepancy") │
│  - EventCategory: string (grouping)                │
│  - Severity, SiteId, TankId, DeviceId              │
│  - OccurredAt, TriggeredBy                         │
│  - Data: Dictionary<string, object>                │
│                                                    │
│  Subclasses carry typed data:                      │
│  TankClosingStockEvent, TankLevelEvent,            │
│  DeviceStatusEvent, SensorVarianceEvent, etc.      │
└────────────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────┐
│  EventExpression (DB entity, replaces AlarmHandler)│
│  "WHEN to care"                                    │
│                                                    │
│  - EventType: string (match against FMSEvent)      │
│  - Conditions: JSON (thresholds, ranges)           │
│  - Scope: SiteId, TankId, DeviceId (DB columns)   │
│  - MinimumSeverity: string                         │
│  - CooldownMinutes, MaxPerDay                      │
│  - NotificationPolicyId → FK                       │
│  - IsActive, Priority                              │
│  - CreatedBy, CreatedAt, etc.                      │
└────────────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────┐
│  NotificationPolicy (unchanged table)              │
│  "HOW to deliver"                                  │
│                                                    │
│  - EnableEmail, EnableSms, EnableSystem             │
│  - TitleTemplate, MessageTemplate                  │
│  - Recipients / Groups                             │
│  - Rate limits (policy-level defaults)             │
│  - RequireAcknowledgment                           │
│  - TriggerConditions: ❌ REMOVED                   │
└────────────────────────────────────────────────────┘
```

### 2.3 Single Evaluation Path

**Every** business operation emits an `FMSEvent`. **Nothing** calls `CreateNotificationAsync()` directly.

```
Business Operation (ClosingStock, PTS telemetry, etc.)
    │
    ▼
Emit FMSEvent (typed subclass with data)
    │
    ▼
IEventExpressionEngine.ProcessAsync(FMSEvent)
    ├── 1. Query EventExpressions matching EventType + scope
    ├── 2. Evaluate conditions against event data
    ├── 3. Check cooldown + rate limits
    ├── 4. Resolve NotificationPolicy → channels, templates, recipients
    ├── 5. Deliver notification
    ├── 6. Persist EventLog (replaces ActiveAlarm for audit)
    └── 7. Record EventExpressionExecution (replaces AlarmHandlerExecution)
```

---

## 3. Data Model

### 3.1 New/Modified Tables

#### `event_expressions` (replaces `alarm_handlers`)

| Column | Type | Notes |
|--------|------|-------|
| Id | int PK | |
| Name | varchar(100) | Display name |
| Description | varchar(500) | |
| IsActive | bool | |
| EventType | varchar(50) | Match key (e.g., "TankStockDiscrepancy") |
| SiteId | int? FK | Scope filter |
| TankId | int? FK | Scope filter |
| DeviceId | int? FK | Scope filter |
| MinimumSeverity | varchar(20) | Low/Medium/High/Critical |
| Conditions | JSON | Type-specific: `{ "minVariance": 50, "minVariancePercent": 5 }` |
| NotificationPolicyId | int FK | Which policy delivers |
| CooldownMinutes | int | Per-expression override |
| MaxNotificationsPerDay | int | Per-expression override |
| Priority | varchar(20) | |
| CreateActiveEvent | bool | Whether to also create an ActiveEvent record |
| CreatedBy | varchar(100) | |
| CreatedAt | datetime | |
| ModifiedBy | varchar(100) | |
| ModifiedAt | datetime | |
| TriggerCount | int | |
| LastTriggeredAt | datetime? | |

#### `event_expression_executions` (replaces `alarm_handler_executions`)

| Column | Type | Notes |
|--------|------|-------|
| Id | int PK | |
| EventExpressionId | int FK | |
| EventType | varchar(50) | |
| ExecutedAt | datetime | |
| WasTriggered | bool | |
| SuppressedReason | varchar(100) | Cooldown, DailyCap, ConditionNotMet |
| EventData | JSON | Snapshot of the FMSEvent data |
| NotificationId | int? FK | Created notification, if any |

#### `active_events` (replaces `active_alarms`)

| Column | Type | Notes |
|--------|------|-------|
| Id | int PK | |
| EventType | varchar(50) | |
| State | varchar(20) | Active, Acknowledged, Resolved, Suppressed |
| TriggerSource | varchar(20) | |
| Severity | enum | |
| Priority | varchar(20) | |
| Message | varchar(500) | |
| Description | varchar(1000) | |
| SiteId | int? FK | |
| TankId | int? FK | |
| DeviceId | int? FK | |
| EventExpressionId | int? FK | Which expression triggered this |
| TriggeredAt | datetime | |
| AcknowledgedAt | datetime? | |
| ResolvedAt | datetime? | |
| AcknowledgedBy | varchar(100) | |
| ResolvedBy | varchar(100) | |
| ThresholdValue | decimal? | |
| ActualValue | decimal? | |
| Unit | varchar(20) | |
| EscalationLevel | int | |
| EventData | JSON | Full FMSEvent snapshot |

#### `notification_policies` (MODIFIED — remove TriggerConditions)

| Change | Detail |
|--------|--------|
| DROP column | `TriggerConditions` — conditions now live on `event_expressions` |
| KEEP everything else | Channels, templates, recipients, rate limits, escalation |

### 3.2 Migration Strategy

- **Phase 1**: Create new tables alongside old ones. New engine writes to both.
- **Phase 2**: Migrate `alarm_handlers` → `event_expressions` via script.
- **Phase 3**: Remove old tables after validation period.

---

## 4. Backend Architecture

### 4.1 File Structure

```
FMS.Application/Features/EventEngine/
├── Events/                          # FMSEvent base + typed subclasses
│   ├── FMSEvent.cs                  # Abstract base class
│   ├── TankClosingStockEvent.cs
│   ├── TankLevelEvent.cs
│   ├── SensorVarianceEvent.cs
│   ├── DeviceStatusEvent.cs
│   ├── PumpAlarmEvent.cs
│   ├── VehicleGpsEvent.cs
│   └── SystemEvent.cs
├── Expressions/                     # Condition evaluation
│   ├── IExpressionEvaluator.cs      # Interface for condition evaluation
│   ├── ExpressionEvaluatorFactory.cs
│   ├── Evaluators/                  # Per-EventType evaluators
│   │   ├── TankLevelEvaluator.cs
│   │   ├── ThresholdEvaluator.cs    # Generic numeric threshold
│   │   ├── DeviceOfflineEvaluator.cs
│   │   └── AlwaysTrueEvaluator.cs   # For event types that always trigger
│   └── ExpressionCooldownService.cs # Cooldown + rate limit logic
├── Engine/                          # Core processing engine
│   ├── IEventExpressionEngine.cs    # Main interface
│   ├── EventExpressionEngine.cs     # Implementation
│   └── EventLogService.cs          # Audit trail persistence
├── DTOs/
│   ├── EventExpressionDto.cs
│   ├── CreateEventExpressionRequest.cs
│   ├── UpdateEventExpressionRequest.cs
│   └── EventExpressionTypeMetadataDto.cs
├── Commands/
│   ├── CreateEventExpressionCommand.cs
│   ├── CreateEventExpressionCommandHandler.cs
│   ├── UpdateEventExpressionCommand.cs
│   ├── UpdateEventExpressionCommandHandler.cs
│   ├── DeleteEventExpressionCommand.cs
│   └── DeleteEventExpressionCommandHandler.cs
├── Queries/
│   ├── GetEventExpressionsQuery.cs
│   ├── GetEventExpressionsQueryHandler.cs
│   ├── GetEventExpressionTypesQuery.cs
│   └── GetEventExpressionTypesQueryHandler.cs
└── Services/
    ├── IEventExpressionService.cs
    └── EventExpressionService.cs
```

### 4.2 Domain Entities

```
FMS.Domain/Entities/Features/EventEngine/
├── EventExpression.cs               # Replaces AlarmHandler
├── EventExpressionExecution.cs      # Replaces AlarmHandlerExecution
└── ActiveEvent.cs                   # Replaces ActiveAlarm
```

### 4.3 Key Interfaces

```csharp
// The single entry point for ALL business code
public interface IEventExpressionEngine
{
    /// <summary>
    /// Process an FMSEvent through the expression engine.
    /// Finds matching expressions, evaluates conditions, delivers notifications.
    /// This is the ONLY way to trigger notifications in the system.
    /// </summary>
    Task<EventProcessingResult> ProcessAsync(FMSEvent fmsEvent, CancellationToken ct = default);
}

// Base class for all events in the system
public abstract class FMSEvent
{
    public string EventType { get; set; }
    public string EventCategory { get; set; }
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    public string Severity { get; set; } = "Medium";
    public int? SiteId { get; set; }
    public int? TankId { get; set; }
    public int? DeviceId { get; set; }
    public string? PtsDeviceId { get; set; }
    public string TriggeredBy { get; set; } = "System";
    public Dictionary<string, object> Data { get; set; } = new();

    /// <summary>
    /// Build template variables for notification message rendering.
    /// Override in subclasses to add typed properties.
    /// </summary>
    public virtual Dictionary<string, string> GetTemplateVariables() { ... }
}
```

### 4.4 Backward Compatibility

During migration, the engine will:
1. Write to BOTH `active_alarms` AND `active_events` tables
2. Existing `AlarmHandlerService` methods will internally convert to `FMSEvent` and call the engine
3. `ActiveAlarmService.CreateAlarmNotificationAsync()` will delegate to the engine
4. Direct `CreateNotificationAsync()` calls will be progressively replaced

---

## 5. Frontend Architecture

### 5.1 Pages Affected

| Current Page | Change | New Name |
|-------------|--------|----------|
| `PolicyManagement.js` | Keep — policies are delivery config | No change |
| `PolicyEdit.js` | **Remove "Active Alarm Filters" tab** | Minor edit |
| `PolicyCreate.js` | Keep — creates delivery policies | Minor edit (remove trigger filter section) |
| `PolicyTriggersManager.js` | **Replace** — becomes EventExpression manager | `EventExpressionManager.js` |
| `TriggerCreate.js` | **Replace** — becomes EventExpression creator | `EventExpressionCreate.js` |
| `TriggerEvaluationTester.js` | **Adapt** — test with FMSEvent format | `EventExpressionTester.js` |
| `alert-configuration/` | Keep — configures thresholds/defaults per event type | No change |
| `testing/TestingPanel.js` | Adapt — emit test FMSEvents | Minor edit |

### 5.2 New/Modified Frontend Components

```
fms.frontend/src/pages/notifications/
├── event-expressions/               # NEW - replaces policies/triggers
│   ├── EventExpressionManagement.js  # List/grid of all expressions
│   ├── EventExpressionCreate.js      # Create new expression
│   ├── EventExpressionEdit.js        # Edit expression
│   └── EventExpressionTester.js      # Test expression against sample events
├── policies/
│   ├── PolicyManagement.js           # KEEP (delivery config list)
│   ├── PolicyCreate.js               # MODIFY (remove trigger filter section)
│   ├── PolicyEdit.js                 # MODIFY (remove Active Alarm Filters tab)
│   └── PolicyTriggersManager.js      # DEPRECATED → redirect to event-expressions
```

### 5.3 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/event-expressions` | List all expressions |
| GET | `/api/v1/event-expressions/{id}` | Get expression detail |
| POST | `/api/v1/event-expressions` | Create expression |
| PUT | `/api/v1/event-expressions/{id}` | Update expression |
| DELETE | `/api/v1/event-expressions/{id}` | Delete expression |
| GET | `/api/v1/event-expressions/types` | Get metadata (available event types, fields, defaults) |
| POST | `/api/v1/event-expressions/test` | Test expression against a sample FMSEvent |
| GET | `/api/v1/event-expressions/{id}/executions` | Execution history |
| GET | `/api/v1/active-events` | List active events (replaces active-alarms) |
| POST | `/api/v1/active-events/{id}/acknowledge` | Acknowledge event |
| POST | `/api/v1/active-events/{id}/resolve` | Resolve event |

---

## 6. Scope — What Changes, What Stays

### Changes

| Component | Action |
|-----------|--------|
| `AlarmHandlerService.cs` (1625 lines, obsolete) | Replace with `EventExpressionEngine` |
| `AlarmHandlerActiveAlarmIntegration.cs` | Remove — engine handles everything |
| `PolicyRulesProcessor.cs` | Remove — conditions move to expression evaluators |
| `ActiveAlarmService.CreateAlarmNotificationAsync()` | Remove — engine handles notifications |
| `PolicyMatchesActiveAlarm()` | Remove — engine evaluates expressions directly |
| `NotificationService.CreateAlarmNotificationAsync()` | Remove — engine replaces this |
| `Policy.TriggerConditions` column | Drop after migration |
| `AlarmHandler` entity | Migrate data → `EventExpression` |
| `ActiveAlarm` entity | Migrate to `ActiveEvent` (keep old table during transition) |
| `AlarmHandlerExecution` entity | Migrate to `EventExpressionExecution` |
| Direct `CreateNotificationAsync()` calls in business code | Replace with `_eventEngine.ProcessAsync(event)` |

### Stays (No Changes)

| Component | Reason |
|-----------|--------|
| `NotificationPolicy` entity (minus TriggerConditions) | Delivery config is correct as-is |
| `NotificationService.CreateNotificationAsync()` | Still used internally by the engine |
| `INotificationService` interface (other methods) | Recipient resolution, delivery channels |
| `AlertConfigurationConstants.cs` | Event type registry — becomes the `EventType` source of truth |
| `AlertConfiguration` UI page | Configures default thresholds — still relevant |
| Notification categories DB table | Used for grouping/subscriptions |
| Notification preferences system | User subscription management |
| SignalR notification hub | Delivery channel — unchanged |
| Email/SMS delivery channels | Unchanged |

---

## 7. Acceptance Criteria

1. ✅ Business code emits `FMSEvent` — never calls notification services directly
2. ✅ Single evaluation path — no duplicate notifications
3. ✅ `EventExpression` replaces both `AlarmHandler` and `Policy.TriggerConditions`
4. ✅ Existing alarm handlers are migrated to event expressions
5. ✅ `WellKnownCategories` enum values match database IDs
6. ✅ ClosingStockCommand produces exactly ONE notification per discrepancy event
7. ✅ Frontend removes "Active Alarm Filters" tab from PolicyEdit
8. ✅ Frontend has EventExpression management page (create, edit, list, test)
9. ✅ All existing notification behaviors are preserved (no regression)
10. ✅ Backward-compatible REST API (old endpoints return deprecation warnings)
11. ✅ Cooldown and rate limiting work per-expression
12. ✅ Template variable substitution uses typed FMSEvent properties
13. ✅ Audit trail: every event evaluation is logged (triggered or suppressed)
14. ✅ Future events can be added by creating a subclass + evaluator (see README)

---

## 8. Rollout Plan

### Phase 1: Foundation (non-breaking)
- Create `FMSEvent` base class and subclasses
- Create `IEventExpressionEngine` interface and implementation
- Create `EventExpression` entity and DB migration
- Wire up DI registration
- No behavior changes yet

### Phase 2: Parallel Run
- Business code emits `FMSEvent` AND keeps old calls
- Engine processes events and logs results but does NOT deliver (shadow mode)
- Compare engine decisions vs actual notifications for validation

### Phase 3: Cutover
- Remove direct `CreateNotificationAsync()` calls from business code
- Engine becomes the sole notification path
- Remove "Active Alarm Filters" tab from UI
- Deploy EventExpression management UI

### Phase 4: Cleanup
- Remove `AlarmHandlerService.cs`
- Remove `AlarmHandlerActiveAlarmIntegration.cs`
- Remove `PolicyRulesProcessor.cs`
- Remove `Policy.TriggerConditions` column
- Drop `alarm_handlers` table (after data migration verified)
