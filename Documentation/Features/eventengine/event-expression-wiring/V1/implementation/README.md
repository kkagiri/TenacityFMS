# Event Expression Engine — Implementation Guide for AI Agents

> **Purpose**: Complete reference for the FMS Event Expression Engine. Covers architecture, current
> implementation state, the 15 TODO wiring locations, and step-by-step instructions for wiring
> `IEventExpressionEngine.ProcessAsync()` into each call site.
>
> **Audience**: AI coding agents working on the Tenacy.FMS codebase.
>
> **Last Updated**: 2026-02-11

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Core Components](#2-core-components)
3. [Event Type Catalogue](#3-event-type-catalogue)
4. [Wiring Plan — Backend TODO Locations](#4-wiring-plan--backend-todo-locations)
5. [Frontend Pages & API](#5-frontend-pages--api)
6. [DI Registration](#6-di-registration)
7. [Adding a New Event Type Checklist](#7-adding-a-new-event-type-checklist)
8. [Navigation Setup](#8-navigation-setup)
9. [Testing Strategy](#9-testing-strategy)

---

## 1. Architecture Overview

The **Event Expression Engine** replaces the old AlarmHandler/ActiveAlarm system with a clean,
rule-driven notification pipeline:

```
┌──────────────────────────────────────────────────────────────────────────┐
│  BUSINESS CODE (Commands, Services, Background Jobs)                    │
│                                                                          │
│  1. Something happens → build a typed FMSEvent subclass                  │
│  2. Call IEventExpressionEngine.ProcessAsync(fmsEvent, ct)               │
│  3. Done. The engine handles everything else.                            │
└──────────────────┬───────────────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  EventExpressionEngine.ProcessAsync()                                    │
│                                                                          │
│  ① Query EventExpressions matching EventType + scope (SiteId/TankId/    │
│     DeviceId) + IsActive = true                                          │
│  ② For each matched expression:                                         │
│     a. Check MinimumSeverity filter                                      │
│     b. Evaluate conditions via ExpressionEvaluatorFactory → evaluator    │
│     c. Check cooldown (ExpressionCooldownService)                        │
│     d. Create ActiveEvent record (if CreateActiveEvent = true)           │
│     e. Update TriggerCount + LastTriggeredAt                             │
│     f. Log EventExpressionExecution for audit trail                      │
│  ③ SaveChangesAsync()                                                    │
│  ④ Return EventProcessingResult                                         │
└──────────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **One interface, one method** | `IEventExpressionEngine.ProcessAsync(FMSEvent, CancellationToken)` — business code never calls anything else |
| **Typed events with base class** | `FMSEvent` base + subclasses (TankLevelEvent, PumpAlarmEvent, etc.) carry typed data |
| **Evaluator per type** | ExpressionEvaluatorFactory maps EventType → IExpressionEvaluator. Falls back to AlwaysTrueEvaluator |
| **Cooldown lives in engine** | ExpressionCooldownService checks execution table. No Redis needed (old system had Redis cooldowns in business code that should be removed when wiring) |
| **ActiveEvent replaces ActiveAlarm** | EventLogService creates ActiveEvent records. Issue tracker uses ActiveAlarmId FK (still column name, maps to ActiveEvent conceptually) |

---

## 2. Core Components

### 2.1 File Map

```
FMS.Application/Features/EventEngine/
├── Engine/
│   ├── IEventExpressionEngine.cs        → Interface (single ProcessAsync method)
│   ├── EventExpressionEngine.cs         → Core orchestrator implementation
│   └── EventLogService.cs              → Creates ActiveEvent records
├── Events/
│   ├── FMSEvent.cs                      → Abstract base class
│   ├── TankLevelEvent.cs               → Tank measurement thresholds
│   ├── TankClosingStockEvent.cs        → Stock discrepancy
│   ├── SensorVarianceEvent.cs          → Manual vs sensor variance
│   ├── PumpAlarmEvent.cs               → PTS pump alarms
│   ├── DeviceStatusEvent.cs            → Device offline/online
│   ├── VehicleGpsEvent.cs              → Vehicle GPS status
│   ├── SystemEvent.cs                  → Generic system events (maintenance, docs, etc.)
│   ├── EventLifecycleEvent.cs          → Event state changes
│   └── EventProcessingResult.cs        → Result DTO returned by ProcessAsync
├── Expressions/
│   ├── IExpressionEvaluator.cs         → Evaluator interface
│   ├── ExpressionEvaluatorFactory.cs   → EventType → evaluator registry
│   ├── ExpressionCooldownService.cs    → Cooldown + daily cap checks
│   └── Evaluators/
│       ├── AlwaysTrueEvaluator.cs      → Fallback (no conditions)
│       ├── ThresholdEvaluator.cs       → Generic threshold comparison
│       ├── TankLevelEvaluator.cs       → Tank level conditions
│       ├── TankClosingStockEvaluator.cs→ Stock variance conditions
│       ├── SensorVarianceEvaluator.cs  → Sensor variance conditions
│       ├── DeviceOfflineEvaluator.cs   → Device offline conditions
│       └── PumpAlarmEvaluator.cs       → Pump alarm conditions
├── DTOs/
│   ├── EventExpressionDto.cs
│   ├── EventExpressionTypeMetadataDto.cs
│   ├── CreateEventExpressionRequest.cs
│   └── UpdateEventExpressionRequest.cs
├── Commands/
│   ├── CreateEventExpressionCommand.cs
│   ├── CreateEventExpressionCommandHandler.cs
│   ├── UpdateEventExpressionCommand.cs
│   ├── UpdateEventExpressionCommandHandler.cs
│   ├── DeleteEventExpressionCommand.cs
│   └── DeleteEventExpressionCommandHandler.cs
└── Queries/
    ├── GetEventExpressionsQuery.cs
    ├── GetEventExpressionsQueryHandler.cs
    ├── GetEventExpressionByIdQuery.cs
    ├── GetEventExpressionByIdQueryHandler.cs
    ├── GetEventExpressionTypesQuery.cs
    ├── GetEventExpressionTypesQueryHandler.cs
    ├── GetEventExpressionExecutionsQuery.cs
    └── GetEventExpressionExecutionsQueryHandler.cs
```

### 2.2 Domain Entities

```
FMS.Domain/Entities/Features/EventEngine/
├── EventExpression.cs              → Rules table (WHEN to notify)
├── EventExpressionExecution.cs     → Audit log of each evaluation
└── ActiveEvent.cs                  → Active event records
```

### 2.3 Database Tables

| Table | Purpose |
|-------|---------|
| `event_expressions` | Rules: EventType, scope, conditions JSON, cooldown, policy link |
| `event_expression_executions` | Audit trail: every evaluation result, timing, suppression reason |
| `active_events` | Live event records (like old active_alarms) |

### 2.4 Persistence Layer

| File | Purpose |
|------|---------|
| `FMS.Persistence/EntityConfigurations/EventExpressionConfiguration.cs` | EF config for event_expressions |
| `FMS.Persistence/EntityConfigurations/EventExpressionExecutionConfiguration.cs` | EF config for executions |
| GpsdataContext DbSets: `EventExpressions`, `EventExpressionExecutions`, `ActiveEvents` | |

### 2.5 API Controller

**File**: `FMS.WebClient/Controllers/EventExpressionsController.cs`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/event-expressions` | GET | List with filters (eventType, siteId, isActive, pagination) |
| `/api/v1/event-expressions/{id}` | GET | Get by ID |
| `/api/v1/event-expressions/types` | GET | Available event types + condition metadata |
| `/api/v1/event-expressions/{id}/executions` | GET | Execution history |
| `/api/v1/event-expressions` | POST | Create expression |
| `/api/v1/event-expressions/{id}` | PUT | Update expression |
| `/api/v1/event-expressions/{id}` | DELETE | Soft-delete (deactivate) |

---

## 3. Event Type Catalogue

| EventType string | FMSEvent subclass | Evaluator | EventCategory | Source |
|------------------|-------------------|-----------|----------------|--------|
| `TankLevel` | `TankLevelEvent` | `TankLevelEvaluator` | PtsTankAlarm | Tank measurement processing |
| `TankStockDiscrepancy` | `TankClosingStockEvent` | `TankClosingStockEvaluator` | StockReconciliation | Closing stock, reconciliation |
| `SensorVariance` | `SensorVarianceEvent` | `SensorVarianceEvaluator` | SensorVariance | Closing stock (manual vs sensor) |
| `PumpAlarm` | `PumpAlarmEvent` | `PumpAlarmEvaluator` | PtsDeviceAlarm | PTS alert upload |
| `DeviceStatus` | `DeviceStatusEvent` | `DeviceOfflineEvaluator` | DeviceAlerts | Device monitoring |
| `VehicleGps` | `VehicleGpsEvent` | AlwaysTrueEvaluator (fallback) | DeviceAlerts | GPS offline alert service |
| `System` | `SystemEvent` | AlwaysTrueEvaluator (fallback) | SystemMaintenance | Maintenance, docs, generic |

### Missing Evaluators (use AlwaysTrueEvaluator until created)

- **VehicleGps**: No dedicated evaluator yet. Create `VehicleGpsEvaluator` if conditions like
  `minOfflineDuration`, `geofenceName` filtering are needed.
- **System**: Generic events. Create subtype-specific evaluators if complex conditions are needed.

---

## 4. Wiring Plan — Backend TODO Locations

### 4.1 Summary Table

| # | File | TODO Location | Event Type | FMSEvent Subclass | DI Approach |
|---|------|---------------|------------|-------------------|-------------|
| 1 | `UploadStatusCommand.cs` | `CreateProbeAlarmIfNotInCooldownAsync` (~L679) | `TankLevel` | `TankLevelEvent` | Constructor inject |
| 2 | `UploadStatusCommand.cs` | `CreateSystemLevelAlarmAsync` (~L910) | `TankLevel` | `TankLevelEvent` | Constructor inject |
| 3 | `UploadAlertRecordHandler.cs` | `ProcessAlarmNotificationAsync` (~L229) | `PumpAlarm` / `DeviceStatus` | `PumpAlarmEvent` / `DeviceStatusEvent` | Constructor inject |
| 4 | `UploadAlertRecordHandler.cs` | Switch block (~L247) | `PumpAlarm` / `TankLevel` / `DeviceStatus` | Various | Same as #3 |
| 5 | `CreateTankMeasurementCommand.cs` | After SaveChanges (~L130) | `TankLevel` | `TankLevelEvent` | Constructor inject |
| 6 | `ClosingStockCommand.cs` | Stock discrepancy (~L898) | `TankStockDiscrepancy` | `TankClosingStockEvent` | Constructor inject |
| 7 | `ClosingStockCommand.cs` | Sensor variance (~L935) | `SensorVariance` | `SensorVarianceEvent` | Constructor inject |
| 8 | `DiscrepancyDetectionService.cs` | Significant discrepancy (~L67) | `TankStockDiscrepancy` | `TankClosingStockEvent` | Constructor inject |
| 9 | `VehicleGpsOfflineAlertService.cs` | GPS offline (~L167) | `VehicleGps` | `VehicleGpsEvent` | Constructor inject |
| 10 | `InTankDeliveryDetectionService.cs` | ITD alert (~L211) | `System` | `SystemEvent(SubType="InTankDelivery")` | Constructor inject |
| 11 | `UnifiedTankReconciliationService.cs` | Stale data (~L211) | `DeviceStatus` | `DeviceStatusEvent` | Scope resolve |
| 12 | `UnifiedTankReconciliationService.cs` | Low volume (~L239) | `TankLevel` | `TankLevelEvent` | Scope resolve |
| 13 | `UnifiedTankReconciliationService.cs` | High volume (~L246) | `TankLevel` | `TankLevelEvent` | Scope resolve |
| 14 | `VehicleDocumentExpiryNotifierService.cs` | Doc expiry (~L75) | `System` | `SystemEvent(SubType="VehicleDocumentExpiry")` | Scope resolve |
| 15 | `VehicleMaintenanceNotifierService.cs` | Maintenance alarm (~L248) | `System` | `SystemEvent(SubType="VehicleMaintenanceDue/Overdue")` | Scope resolve |

### 4.2 DI Approach Explanation

**Constructor Inject** (for Application-layer services/handlers):
```csharp
// Add to constructor parameters:
private readonly IEventExpressionEngine _eventEngine;

public MyHandler(
    GpsdataContext context,
    IEventExpressionEngine eventEngine,  // ← ADD THIS
    ILogger<MyHandler> logger)
{
    _context = context;
    _eventEngine = eventEngine;          // ← ADD THIS
    _logger = logger;
}
```

**Scope Resolve** (for BackgroundServices that use IServiceScopeFactory):
```csharp
using IServiceScope scope = _scopeFactory.CreateScope();
var eventEngine = scope.ServiceProvider.GetRequiredService<IEventExpressionEngine>();
```

### 4.3 Detailed Wiring Instructions Per Location

---

#### Location 1: `UploadStatusCommand.cs` → `CreateProbeAlarmIfNotInCooldownAsync` (~L679)

**File**: `FMS.Application/Command/PTSCommand/UploadStatusCommands/UploadStatusCommand.cs`

**Current code** (placeholder):
```csharp
// TODO: Wire EventExpressionEngine.ProcessAsync() for probe alarm events
_logger.LogInformation("[UploadStatus] Probe alarm event {AlarmType}...", alarmType, deviceId, probeId, message);
```

**Wire as**:
```csharp
var tankLevelEvent = new TankLevelEvent
{
    SiteId = /* resolve from tank or device */,
    TankId = /* resolve tank.Id if available */,
    DeviceId = /* resolve device ID if available */,
    PtsDeviceId = deviceId,
    Severity = severity.ToString(),
    Message = message,
    // Fill from measurements if available:
    CurrentLevel = measurements?.FirstOrDefault()?.ProductVolume ?? 0,
    TankCapacity = /* from tank entity if loaded */,
    PercentageFull = /* calculate from data */,
    ProductVolume = measurements?.FirstOrDefault()?.ProductVolume ?? 0,
    WaterLevel = measurements?.FirstOrDefault()?.WaterVolume ?? 0,
    Temperature = measurements?.FirstOrDefault()?.Temperature ?? 0,
};
await _eventEngine.ProcessAsync(tankLevelEvent, cancellationToken);
```

**Notes**:
- The Redis cooldown logic already in this method can be REMOVED once wired — the engine has its own ExpressionCooldownService.
- Or keep Redis cooldown as a "pre-filter" to avoid even constructing the event + querying the DB when we know it's spam (8-second upload intervals).
- Decision: Keep Redis cooldown as pre-filter for performance, engine cooldown handles the rest.

---

#### Location 2: `UploadStatusCommand.cs` → `CreateSystemLevelAlarmAsync` (~L910)

**Current code** (placeholder):
```csharp
// TODO: Wire EventExpressionEngine.ProcessAsync() for system tank level events
_logger.LogWarning("[UploadStatus] System tank level event...");
```

**Wire as**:
```csharp
var tankLevelEvent = new TankLevelEvent
{
    SiteId = /* tank.SiteId */,
    TankId = tank.Id,
    Severity = severity.ToString(),
    Message = message,
    TankName = tank.Name ?? "",
    CurrentLevel = currentVolume,
    TankCapacity = tank.TankVolume,
    PercentageFull = percentageFull,
};
await _eventEngine.ProcessAsync(tankLevelEvent);
```

**Notes**: Same Redis-as-pre-filter approach.

---

#### Location 3 & 4: `UploadAlertRecordHandler.cs` → PTS alerts (~L229, ~L247)

**File**: `FMS.Application/Handlers/UploadTransactions/UploadAlertRecordHandler.cs`

**Wire as** (around L229, replace the log line):
```csharp
// Choose event type based on alertDto.DeviceType
FMSEvent ptsEvent;
switch (alertDto.DeviceType.ToUpper())
{
    case "PUMP":
        ptsEvent = new PumpAlarmEvent
        {
            PtsDeviceId = deviceId,
            SiteId = tank?.SiteId ?? device?.Site,
            DeviceId = device?.Id,
            TankId = tank?.Id,
            Severity = "Medium",
            Message = $"{alertDto.DeviceType} alert: {alertDto.Code} ({alertDto.State})",
            AlarmCode = alertDto.Code,
            AlarmDescription = alertDto.AlarmDescription,
            PumpStatus = alertDto.State,
        };
        break;
    case "PROBE":
        ptsEvent = new TankLevelEvent
        {
            PtsDeviceId = deviceId,
            SiteId = tank?.SiteId ?? device?.Site,
            DeviceId = device?.Id,
            TankId = tank?.Id,
            Severity = "Medium",
            Message = $"Tank probe alert: {alertDto.Code} ({alertDto.State})",
            TankName = tank?.Name ?? "",
        };
        break;
    default:
        ptsEvent = new DeviceStatusEvent
        {
            PtsDeviceId = deviceId,
            SiteId = tank?.SiteId ?? device?.Site,
            DeviceId = device?.Id,
            Severity = "Medium",
            Message = $"Device alert: {alertDto.Code} ({alertDto.State})",
            DeviceName = device?.Name ?? deviceId,
            DeviceType = alertDto.DeviceType,
            ErrorCode = alertDto.Code,
        };
        break;
}
await _eventEngine.ProcessAsync(ptsEvent);
```

**Notes**: Remove the switch block TODOs at ~L247 since the same event is fired above.

---

#### Location 5: `CreateTankMeasurementCommand.cs` → After SaveChanges (~L130)

**Wire as**:
```csharp
var tankLevelEvent = new TankLevelEvent
{
    TankId = /* resolve tank ID from tankMeasurementDto.Tank probe number */,
    DeviceId = /* resolve from request.DeviceId */,
    PtsDeviceId = request.DeviceId,
    Severity = "Low",
    Message = $"Tank measurement received for probe {tankMeasurementDto.Tank}",
    CurrentLevel = tankMeasurementDto.ProductVolume ?? 0,
    TankCapacity = /* from tank entity if loaded */,
    PercentageFull = tankMeasurementDto.TankFillingPercentage ?? 0,
    ProductVolume = tankMeasurementDto.ProductVolume ?? 0,
    WaterLevel = tankMeasurementDto.WaterVolume ?? 0,
    Temperature = tankMeasurementDto.Temperature ?? 0,
};
await _eventEngine.ProcessAsync(tankLevelEvent, cancellationToken);
```

**Notes**: This fires on every measurement. The engine's cooldown + condition evaluation prevents notification spam.

---

#### Location 6: `ClosingStockCommand.cs` → Stock discrepancy (~L898)

**Wire as**:
```csharp
var stockEvent = new TankClosingStockEvent
{
    SiteId = tank.SiteId,
    TankId = tank.Id,
    Severity = priority,
    Message = message,
    TankName = tank.Name ?? "",
    ProductName = /* product name if available */,
    SiteName = /* site name if available */,
    OpeningStock = reconciliation.OpeningStock,
    ClosingStock = reconciliation.ActualClosingStock,
    ExpectedClosingStock = reconciliation.ExpectedClosingStock,
    Variance = reconciliation.Variance,
    VariancePercentage = reconciliation.VariancePercentage,
    VarianceType = reconciliation.VarianceType,
    TotalDeliveries = reconciliation.TotalDeliveries,
    TotalSales = reconciliation.TotalDispensing,
};
await _eventEngine.ProcessAsync(stockEvent, cancellationToken);
```

---

#### Location 7: `ClosingStockCommand.cs` → Sensor variance (~L935)

**Wire as**:
```csharp
var sensorEvent = new SensorVarianceEvent
{
    SiteId = tank.SiteId,
    TankId = tank.Id,
    Severity = priority,
    Message = message,
    TankName = tank.Name ?? "",
    ManualReading = manualVolume,
    SensorReading = sensorVolume,
    Variance = variance,
    VariancePercentage = variancePercentage,
};
await _eventEngine.ProcessAsync(sensorEvent, cancellationToken);
```

---

#### Location 8: `DiscrepancyDetectionService.cs` → Significant discrepancy (~L67)

**Wire as**:
```csharp
var stockEvent = new TankClosingStockEvent
{
    SiteId = tank.SiteId,
    TankId = tank.Id,
    Severity = DetermineDiscrepancySeverity(discrepancyResult).ToString(),
    Message = $"Significant discrepancy detected for Tank {tank.Id}",
    Variance = discrepancyResult.VarianceLiters,
    VariancePercentage = discrepancyResult.VariancePercentage,
    ExpectedClosingStock = discrepancyResult.ExpectedVolume,
    ClosingStock = discrepancyResult.ActualVolume,
};
await _eventEngine.ProcessAsync(stockEvent, cancellationToken);
```

---

#### Location 9: `VehicleGpsOfflineAlertService.cs` → GPS offline (~L167)

**Wire as**:
```csharp
var gpsEvent = new VehicleGpsEvent
{
    VehicleId = vehicleId,
    VehicleName = vehicleIdentifier,
    GpsStatus = "Offline",
    Severity = "Medium",
    Message = alertMessage,
    OfflineDuration = result.LastSeenUtc.HasValue
        ? DateTime.UtcNow - result.LastSeenUtc.Value
        : null,
    LastPositionAt = result.LastSeenUtc,
};
await _eventEngine.ProcessAsync(gpsEvent);
```

---

#### Location 10: `InTankDeliveryDetectionService.cs` → ITD alert (~L211)

**Wire as**:
```csharp
var itdEvent = new SystemEvent
{
    SubType = "InTankDelivery",
    SourceComponent = "InTankDeliveryDetection",
    SiteId = tank?.SiteId,
    TankId = tank?.Id,
    Severity = "Low",
    Message = $"ITD detected for {tankName}: {absoluteVolume}L of {fuelGrade}",
    Data = new Dictionary<string, object>
    {
        ["DeliveryId"] = delivery.DeliveryId,
        ["Volume"] = absoluteVolume,
        ["FuelGrade"] = fuelGrade,
        ["TankName"] = tankName,
    }
};
await _eventEngine.ProcessAsync(itdEvent, cancellationToken);
```

---

#### Locations 11-13: `UnifiedTankReconciliationService.cs` → Stale data / Low / High volume

**DI**: Scope-resolve `IEventExpressionEngine` in the service method:
```csharp
var eventEngine = scope.ServiceProvider.GetRequiredService<IEventExpressionEngine>();
```

**Stale data (~L211)**:
```csharp
var staleEvent = new DeviceStatusEvent
{
    TankId = tank.Id,
    SiteId = tank.SiteId,
    DeviceStatus = "StaleData",
    Severity = "Medium",
    Message = $"Tank {tank.Id} measurement is {measurementAge.TotalHours:F1} hours old",
};
await eventEngine.ProcessAsync(staleEvent, cancellationToken);
```

**Low volume (~L239)**:
```csharp
var lowEvent = new TankLevelEvent
{
    TankId = tank.Id,
    SiteId = tank.SiteId,
    Severity = "High",
    TankName = tank.Name ?? "",
    CurrentLevel = currentVolume,
    TankCapacity = tankCapacity,
    PercentageFull = (decimal)fillPercentage,
    Message = $"Tank {tank.Name} low volume: {fillPercentage:F1}%",
};
await eventEngine.ProcessAsync(lowEvent, cancellationToken);
```

**High volume (~L246)**:
```csharp
var highEvent = new TankLevelEvent
{
    TankId = tank.Id,
    SiteId = tank.SiteId,
    Severity = "Medium",
    TankName = tank.Name ?? "",
    CurrentLevel = currentVolume,
    TankCapacity = tankCapacity,
    PercentageFull = (decimal)fillPercentage,
    Message = $"Tank {tank.Name} high volume: {fillPercentage:F1}%",
};
await eventEngine.ProcessAsync(highEvent, cancellationToken);
```

---

#### Location 14: `VehicleDocumentExpiryNotifierService.cs` → Doc expiry (~L75)

**DI**: Scope-resolve `IEventExpressionEngine`.

**Wire as**:
```csharp
var docEvent = new SystemEvent
{
    SubType = daysUntilExpiry <= 0 ? "VehicleDocumentExpired" : "VehicleDocumentExpiringSoon",
    SourceComponent = "VehicleDocumentNotifier",
    Severity = daysUntilExpiry <= 7 ? "High" : "Medium",
    Message = message,
    Data = new Dictionary<string, object>
    {
        ["DocumentId"] = doc.Id,
        ["DocumentType"] = doc.DocumentType,
        ["VehicleNumber"] = doc.Vehicle?.VehicleCode ?? "",
        ["ExpiryDate"] = doc.ExpiryDate.ToString("yyyy-MM-dd"),
        ["DaysUntilExpiry"] = daysUntilExpiry,
    }
};
await eventEngine.ProcessAsync(docEvent, stoppingToken);
```

---

#### Location 15: `VehicleMaintenanceNotifierService.cs` → Maintenance alarm (~L248)

**DI**: Scope-resolve `IEventExpressionEngine` in `ProcessMaintenanceAlertsAsync`.

**Wire the `CreateMaintenanceAlarm` method**:
```csharp
private async Task CreateMaintenanceAlarm(
    IEventExpressionEngine eventEngine,
    string alarmType,
    string priority,
    DiscrepancySeverity severity,
    string message,
    VehicleMaintenance maintenance,
    CancellationToken stoppingToken)
{
    var maintenanceEvent = new SystemEvent
    {
        SubType = alarmType, // "VehicleMaintenanceOverdue" or "VehicleMaintenanceDueSoon"
        SourceComponent = "VehicleMaintenanceNotifier",
        Severity = severity.ToString(),
        Message = message,
        Data = new Dictionary<string, object>
        {
            ["MaintenanceId"] = maintenance.MaintenanceId,
            ["MaintenanceType"] = maintenance.MaintenanceType ?? "",
            ["VehicleNumber"] = maintenance.Vehicle?.VehicleCode ?? "",
            ["ScheduledDate"] = maintenance.ScheduledDate?.ToString("yyyy-MM-dd") ?? "",
        }
    };
    await eventEngine.ProcessAsync(maintenanceEvent, stoppingToken);
}
```

Update call sites to pass `eventEngine` instead of the removed `activeAlarmService`.

---

## 5. Frontend Pages & API

### 5.1 File Structure

```
fms.frontend/src/
├── dataservice/
│   └── eventExpressionApi.js         → API client (CRUD + types + executions)
├── pages/eventExpressions/
│   ├── index.js                      → Module export
│   ├── EventExpressionsMain.js       → Router (list/create/edit/executions)
│   └── components/
│       ├── EventExpressionList.js    → DataGrid listing all expressions
│       ├── EventExpressionList.scss
│       ├── EventExpressionForm.js    → Create/edit form with dynamic conditions
│       ├── EventExpressionForm.scss
│       ├── ExecutionHistory.js       → Execution audit log per expression
│       └── ExecutionHistory.scss
```

### 5.2 Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/event-expressions` | `EventExpressionList` | List all expressions with filters |
| `/event-expressions/create` | `EventExpressionForm` | Create new expression |
| `/event-expressions/:id/edit` | `EventExpressionForm` | Edit existing expression |
| `/event-expressions/:id/executions` | `ExecutionHistory` | View execution history |

### 5.3 Route Registration

**Content.js** (already done):
```jsx
<Route path="/event-expressions" element={...} />
<Route path="/event-expressions/*" element={...} />
```

**app-routes.js** (already done):
```javascript
case "event-expressions":
    return EventExpressionsMain;
```

### 5.4 API Client

**File**: `fms.frontend/src/dataservice/eventExpressionApi.js`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `getEventExpressions(params)` | GET `/api/v1/event-expressions` | List with filters |
| `getEventExpressionById(id)` | GET `/api/v1/event-expressions/{id}` | Get single |
| `getEventExpressionTypes()` | GET `/api/v1/event-expressions/types` | Dynamic form metadata |
| `getExecutionHistory(id, params)` | GET `/api/v1/event-expressions/{id}/executions` | Audit log |
| `createEventExpression(data)` | POST `/api/v1/event-expressions` | Create |
| `updateEventExpression(id, data)` | PUT `/api/v1/event-expressions/{id}` | Update |
| `deleteEventExpression(id)` | DELETE `/api/v1/event-expressions/{id}` | Soft-delete |

### 5.5 Navigation Setup (Pending)

A navigation menu item needs to be added via the Navigation Management UI (`/admin/navigations`):

| Field | Value |
|-------|-------|
| Page | `event-expressions` |
| Link | `/event-expressions` |
| Icon | `fa-light fa-function` |
| Parent | Under "Admin" or "Notifications" section |
| Roles | Admin, System Admin |

---

## 6. DI Registration

**File**: `FMS.WebClient/Extensions/FmsServiceCollectionExtensions.cs` (line ~570)

Already registered:
```csharp
services.AddScoped<IEventExpressionEngine, EventExpressionEngine>();
```

Supporting services also registered:
- `ExpressionEvaluatorFactory` (singleton)
- `ExpressionCooldownService` (scoped)
- `EventLogService` (scoped)

---

## 7. Adding a New Event Type Checklist

When adding a completely new event type (e.g., "FuelRefill"):

1. **Create event subclass**: `FMS.Application/Features/EventEngine/Events/FuelRefillEvent.cs`
   - Extend `FMSEvent`
   - Set `EventType = "FuelRefill"` in constructor
   - Add typed properties (volume, cost, etc.)
   - Override `GetTemplateVariables()`

2. **Create evaluator** (optional): `FMS.Application/Features/EventEngine/Expressions/Evaluators/FuelRefillEvaluator.cs`
   - Implement `IExpressionEvaluator`
   - Set `EventType = "FuelRefill"`
   - Implement `Evaluate()` with JSON conditions parsing

3. **Register evaluator**: In `ExpressionEvaluatorFactory` constructor:
   ```csharp
   Register(new FuelRefillEvaluator());
   ```

4. **Add type metadata**: In `GetEventExpressionTypesQueryHandler.cs`, add entry to the types list
   with condition field metadata so the frontend form knows what fields to show.

5. **Wire business code**: Inject `IEventExpressionEngine`, build `FuelRefillEvent`, call `ProcessAsync()`.

6. **No frontend changes needed**: The `/types` endpoint dynamically provides the event type + conditions
   to `EventExpressionForm.js`, which renders them automatically.

---

## 8. Navigation Setup

### Current Status
- Routes in Content.js: ✅ Done
- Component mapping in app-routes.js: ✅ Done
- Navigation database item: ⬜ **PENDING** — needs to be created via Navigation Management UI

### To Add Navigation
1. Go to `/admin/navigations` in the FMS frontend
2. Create a new navigation item:
   - **Text**: "Event Expressions"
   - **Page**: `event-expressions`
   - **Link**: `/event-expressions`
   - **Icon**: `fa-light fa-function`
   - **Parent**: Admin (or Notifications parent)
3. Assign to appropriate roles (Admin, System Admin)

---

## 9. Testing Strategy

### Backend Unit Tests
- **EventExpressionEngine**: Mock context + evaluator factory, verify ProcessAsync flow
- **Evaluators**: Test each evaluator with various conditions JSON
- **CooldownService**: Test cooldown and daily cap logic

### Integration Testing
1. Create an EventExpression via API with EventType = "TankLevel", low cooldown
2. Trigger a TankLevelEvent from a test endpoint
3. Verify: EventExpressionExecution created, ActiveEvent created, TriggerCount incremented
4. Trigger again within cooldown — verify suppression

### Frontend Testing
1. Navigate to `/event-expressions`
2. Create expression → verify form renders conditions dynamically based on EventType
3. View execution history → verify data loads
4. Edit/delete → verify changes persist

---

## Appendix A: Migration from Old System

### Deleted Components (Old System)
- `AlarmHandler`, `AlarmHandlerExecution`, `AlarmHandlerActiveAlarmIntegration` entities
- `ActiveAlarm`, `ActiveAlarmEscalationHistory` entities
- `Alarm` entity + `AlarmConfiguration` EF config
- `IActiveAlarmService`, `ActiveAlarmService`
- `IAlarmHandlerService`, `AlarmHandlerService`
- `CreateAlarmNotificationRequest`, `CreateActiveAlarmRequest` DTOs
- 83 total files deleted

### FK Columns Preserved (DB compatibility)
- `ActiveAlarmId` on `Issuetracker`, `Notification` — still INT, still FK column in MySQL
- `AlarmId` on `PTSAlertRecord` — still INT, still FK column

### AlarmClearedChecker Stub
`FMS.BackgroundServices/IssueTracker/Checkers/AlarmClearedChecker.cs` — currently returns `false`
always. Needs to be reworked to query `ActiveEvents` table once engine is fully wired.

---

## Appendix B: Quick Reference — How to Wire a TODO

```csharp
// Step 1: Import the engine interface + event type
using FMS.Application.Features.EventEngine.Engine;
using FMS.Application.Features.EventEngine.Events;

// Step 2: Inject (constructor inject or scope resolve)
private readonly IEventExpressionEngine _eventEngine;
// ... add to constructor

// Step 3: Build the event at the TODO location
var myEvent = new TankLevelEvent  // or SystemEvent, PumpAlarmEvent, etc.
{
    SiteId = ...,
    TankId = ...,
    Severity = "Medium",
    Message = "...",
    // Type-specific properties...
};

// Step 4: Fire and forget (engine handles everything)
await _eventEngine.ProcessAsync(myEvent, cancellationToken);

// Step 5: Remove the TODO comment
```
