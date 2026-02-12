# Task List: Event Expression Engine Refactor

## Status Legend
- ⬜ Not started
- 🟡 In progress
- ✅ Complete
- 🔴 Blocked

---

## Phase 1: Foundation (Non-breaking)

### Backend — Domain & Core

| # | Task | File(s) | Status | Depends On | Notes |
|---|------|---------|--------|------------|-------|
| B1.1 | Create `FMSEvent` abstract base class | `FMS.Application/Features/EventEngine/Events/FMSEvent.cs` | ⬜ | — | Base class with EventType, SiteId, TankId, DeviceId, Severity, Data dict, GetTemplateVariables() |
| B1.2 | Create `TankClosingStockEvent` subclass | `Events/TankClosingStockEvent.cs` | ⬜ | B1.1 | OpeningStock, ClosingStock, Variance, VariancePercentage, VarianceType |
| B1.3 | Create `TankLevelEvent` subclass | `Events/TankLevelEvent.cs` | ⬜ | B1.1 | CurrentLevel, TankCapacity, PercentageFull, ProductVolume |
| B1.4 | Create `SensorVarianceEvent` subclass | `Events/SensorVarianceEvent.cs` | ⬜ | B1.1 | ManualReading, SensorReading, Variance, VariancePercentage |
| B1.5 | Create `DeviceStatusEvent` subclass | `Events/DeviceStatusEvent.cs` | ⬜ | B1.1 | DeviceStatus, OfflineDuration, LastSeenAt |
| B1.6 | Create `PumpAlarmEvent` subclass | `Events/PumpAlarmEvent.cs` | ⬜ | B1.1 | PumpId, PumpStatus, AlarmCode |
| B1.7 | Create `VehicleGpsEvent` subclass | `Events/VehicleGpsEvent.cs` | ⬜ | B1.1 | VehicleId, GpsStatus, LastKnownLocation |
| B1.8 | Create `SystemEvent` subclass | `Events/SystemEvent.cs` | ⬜ | B1.1 | Catch-all for issue tracker, maintenance, security |
| B1.9 | Create `EventProcessingResult` class | `Events/EventProcessingResult.cs` | ⬜ | — | MatchedExpressions, TriggeredCount, SuppressedCount, Errors |

### Backend — Domain Entities

| # | Task | File(s) | Status | Depends On | Notes |
|---|------|---------|--------|------------|-------|
| B1.10 | Create `EventExpression` entity | `FMS.Domain/Entities/Features/EventEngine/EventExpression.cs` | ⬜ | — | Replaces AlarmHandler. Same columns, renamed. |
| B1.11 | Create `EventExpressionExecution` entity | `FMS.Domain/Entities/Features/EventEngine/EventExpressionExecution.cs` | ⬜ | B1.10 | Replaces AlarmHandlerExecution |
| B1.12 | Create `ActiveEvent` entity | `FMS.Domain/Entities/Features/EventEngine/ActiveEvent.cs` | ⬜ | — | Replaces ActiveAlarm. Adds EventExpressionId FK, EventData JSON |

### Backend — Persistence

| # | Task | File(s) | Status | Depends On | Notes |
|---|------|---------|--------|------------|-------|
| B1.13 | Create `EventExpressionConfiguration` | `FMS.Persistence/EntityConfigurations/EventExpressionConfiguration.cs` | ⬜ | B1.10 | EF Core entity config |
| B1.14 | Create `EventExpressionExecutionConfiguration` | `FMS.Persistence/EntityConfigurations/EventExpressionExecutionConfiguration.cs` | ⬜ | B1.11 | |
| B1.15 | Create `ActiveEventConfiguration` | `FMS.Persistence/EntityConfigurations/ActiveEventConfiguration.cs` | ⬜ | B1.12 | |
| B1.16 | Add DbSets to `GpsdataContext` | `FMS.Persistence/DataAccess/GpsdataContext.cs` | ⬜ | B1.13-15 | `EventExpressions`, `EventExpressionExecutions`, `ActiveEvents` |
| B1.17 | Create DB migration SQL | `Documentation/Features/NotificationAndAlarm/EventExpressionEngine/database/migration.sql` | ⬜ | B1.13-16 | MySQL CREATE TABLE statements |

### Backend — Expression Evaluation Engine

| # | Task | File(s) | Status | Depends On | Notes |
|---|------|---------|--------|------------|-------|
| B1.18 | Create `IExpressionEvaluator` interface | `Features/EventEngine/Expressions/IExpressionEvaluator.cs` | ⬜ | B1.1 | `bool Evaluate(FMSEvent, string conditionsJson)` |
| B1.19 | Create `ExpressionEvaluatorFactory` | `Expressions/ExpressionEvaluatorFactory.cs` | ⬜ | B1.18 | Maps EventType → IExpressionEvaluator |
| B1.20 | Create `ThresholdEvaluator` | `Expressions/Evaluators/ThresholdEvaluator.cs` | ⬜ | B1.18 | Generic numeric threshold: min/max/equals |
| B1.21 | Create `TankLevelEvaluator` | `Expressions/Evaluators/TankLevelEvaluator.cs` | ⬜ | B1.18 | PercentageFull <= threshold, hysteresis |
| B1.22 | Create `DeviceOfflineEvaluator` | `Expressions/Evaluators/DeviceOfflineEvaluator.cs` | ⬜ | B1.18 | OfflineDuration >= minutes |
| B1.23 | Create `AlwaysTrueEvaluator` | `Expressions/Evaluators/AlwaysTrueEvaluator.cs` | ⬜ | B1.18 | For event types that always trigger (system errors) |
| B1.24 | Create `ExpressionCooldownService` | `Expressions/ExpressionCooldownService.cs` | ⬜ | B1.11 | Cooldown check + daily cap via DB query |

### Backend — Core Engine

| # | Task | File(s) | Status | Depends On | Notes |
|---|------|---------|--------|------------|-------|
| B1.25 | Create `IEventExpressionEngine` interface | `Engine/IEventExpressionEngine.cs` | ⬜ | B1.1, B1.9 | `Task<EventProcessingResult> ProcessAsync(FMSEvent, CancellationToken)` |
| B1.26 | Create `EventExpressionEngine` implementation | `Engine/EventExpressionEngine.cs` | ⬜ | B1.18-25 | Core orchestrator: find expressions → evaluate → cooldown → notify → log |
| B1.27 | Create `EventLogService` | `Engine/EventLogService.cs` | ⬜ | B1.11, B1.12 | Persist ActiveEvent + EventExpressionExecution |

### Backend — CQRS & API

| # | Task | File(s) | Status | Depends On | Notes |
|---|------|---------|--------|------------|-------|
| B1.28 | Create `EventExpressionDto` | `DTOs/EventExpressionDto.cs` | ⬜ | B1.10 | |
| B1.29 | Create `CreateEventExpressionRequest` | `DTOs/CreateEventExpressionRequest.cs` | ⬜ | — | |
| B1.30 | Create `UpdateEventExpressionRequest` | `DTOs/UpdateEventExpressionRequest.cs` | ⬜ | — | |
| B1.31 | Create `EventExpressionTypeMetadataDto` | `DTOs/EventExpressionTypeMetadataDto.cs` | ⬜ | — | Available event types, fields, defaults |
| B1.32 | Create CRUD commands + handlers | `Commands/` folder (6 files) | ⬜ | B1.28-30 | Create, Update, Delete — one class per file |
| B1.33 | Create queries + handlers | `Queries/` folder (4 files) | ⬜ | B1.28, B1.31 | GetAll, GetById, GetTypes, GetExecutions |
| B1.34 | Create `EventExpressionsController` | `FMS.WebClient/Controllers/EventEngine/EventExpressionsController.cs` | ⬜ | B1.32-33 | REST endpoints |
| B1.35 | Create `ActiveEventsController` | `FMS.WebClient/Controllers/EventEngine/ActiveEventsController.cs` | ⬜ | B1.12 | List, Acknowledge, Resolve endpoints |
| B1.36 | Register DI services | `FMS.WebClient/Extensions/FmsServiceCollectionExtensions.cs` | ⬜ | B1.25-27 | Register IEventExpressionEngine, evaluators, etc. |
| B1.37 | Create AutoMapper profile | `FMS.Application/MappingProfile/EventEngineMappingProfile.cs` | ⬜ | B1.28-31 | |

### Backend — Data Migration

| # | Task | File(s) | Status | Depends On | Notes |
|---|------|---------|--------|------------|-------|
| B1.38 | Create `alarm_handlers` → `event_expressions` migration script | `database/migrate_alarm_handlers.sql` | ⬜ | B1.17 | INSERT INTO event_expressions SELECT FROM alarm_handlers |
| B1.39 | Fix `WellKnownCategories` enum to match DB IDs | `Features/Notification/Enums/NotificationEnums.cs` | ⬜ | — | Enum values must match notification_categories.id |

---

## Phase 2: Integration — Wire Up Business Code (Parallel Run)

### Backend — Replace Direct Notification Calls

| # | Task | File(s) | Status | Depends On | Notes |
|---|------|---------|--------|------------|-------|
| B2.1 | `ClosingStockCommand` → emit `TankClosingStockEvent` | `Features/TankManagement/TankStock/Commands/ClosingStockCommand.cs` | ⬜ | B1.26 | Replace `CreateNotificationAsync` + `CreateActiveAlarmFromDiscrepancy` with single `ProcessAsync()` |
| B2.2 | `ClosingStockCommand` → emit `SensorVarianceEvent` | Same file | ⬜ | B1.26 | Replace `SendSensorVarianceNotificationAsync` + `CreateSensorVarianceActiveAlarmAsync` |
| B2.3 | `CreateTankMeasurementCommand` → emit `TankLevelEvent` | `Commands/PTSCommands/TankMeasurementsCommand/CreateTankMeasurementCommand.cs` | ⬜ | B1.26 | Replace `ProcessTankMeasurementAlarmsAsync` call |
| B2.4 | `UploadAlertRecordHandler` → emit typed events | PTS alert record processing | ⬜ | B1.26 | Replace `ProcessPumpAlarmAsync`, `ProcessTankAlarmAsync`, `ProcessDeviceAlarmAsync` |
| B2.5 | `VehicleGpsOfflineAlertService` → emit `VehicleGpsEvent` | `Features/Vehicle/Services/VehicleGpsOfflineAlertService.cs` | ⬜ | B1.26 | Replace direct `CreateAlarmNotificationAsync` |
| B2.6 | `UnifiedTankReconciliationService` → emit events | `Features/Notification/Services/...` or background service | ⬜ | B1.26 | Replace direct notification call |
| B2.7 | `AutomatedReconciliationService` → emit events | `Services/AutomatedReconciliation/` | ⬜ | B1.26 | Replace direct notification call |
| B2.8 | `IssueMonitoringService` → emit `SystemEvent` | Background service | ⬜ | B1.26 | Replace direct notification call |
| B2.9 | `CreateIssueCommand` → emit `SystemEvent` | Issue tracker commands | ⬜ | B1.26 | Replace direct notification call |
| B2.10 | Device disconnection handler → emit `DeviceStatusEvent` | Background service / PTS processing | ⬜ | B1.26 | Replace `ProcessDeviceDisconnectionAlarmAsync` |

### Backend — ActiveAlarm Lifecycle → Engine

| # | Task | File(s) | Status | Depends On | Notes |
|---|------|---------|--------|------------|-------|
| B2.11 | `ActiveAlarmService` acknowledge/resolve/escalate → emit lifecycle events | `ActiveAlarmService.cs` | ⬜ | B1.26 | Replace `CreateAlarmNotificationAsync("Acknowledged")` etc. with `ProcessAsync(new EventLifecycleEvent(...))` |
| B2.12 | Create `EventLifecycleEvent` subclass | `Events/EventLifecycleEvent.cs` | ⬜ | B1.1 | For Acknowledged, Resolved, Escalated, AutoResolved actions |

---

## Phase 3: Frontend

### Frontend — New Event Expression Pages

| # | Task | File(s) | Status | Depends On | Notes |
|---|------|---------|--------|------------|-------|
| F3.1 | Create `EventExpressionManagement.js` | `pages/notifications/event-expressions/` | ⬜ | B1.34 | DataGrid listing all expressions with filters |
| F3.2 | Create `EventExpressionCreate.js` | Same folder | ⬜ | B1.34 | Form: select event type → auto-load condition fields → set scope → link policy |
| F3.3 | Create `EventExpressionEdit.js` | Same folder | ⬜ | B1.34 | Edit existing expression, view execution history |
| F3.4 | Create `EventExpressionTester.js` | Same folder | ⬜ | B1.34 | Build a sample FMSEvent, submit to test endpoint, show matched expressions |
| F3.5 | Create `event-expressions.scss` | Same folder | ⬜ | — | Styling with `tw-` prefix |
| F3.6 | Create `eventExpressionApi.js` | `src/dataservice/eventExpressionApi.js` | ⬜ | B1.34 | API client for all event expression endpoints |
| F3.7 | Create `activeEventsApi.js` | `src/dataservice/activeEventsApi.js` | ⬜ | B1.35 | API client for active events endpoints |

### Frontend — Modify Existing Pages

| # | Task | File(s) | Status | Depends On | Notes |
|---|------|---------|--------|------------|-------|
| F3.8 | Remove "Active Alarm Filters" tab from `PolicyEdit.js` | `policies/PolicyEdit.js` | ⬜ | — | Remove tab index 1, remove `activeAlarmFilter` state, remove `parseActiveAlarmFilter`, remove `buildActiveAlarmFilterPayload`, remove `renderActiveAlarmFiltersTab` |
| F3.9 | Remove trigger filter section from `PolicyCreate.js` | `policies/PolicyCreate.js` | ⬜ | — | Remove `triggerFilter` state and "Trigger Conditions" UI section. Policy is delivery-only. |
| F3.10 | Deprecate `PolicyTriggersManager.js` | `policies/PolicyTriggersManager.js` | ⬜ | F3.1 | Show deprecation banner: "Triggers have moved to Event Expressions" with link |
| F3.11 | Deprecate `TriggerCreate.js` | `policies/TriggerCreate.js` | ⬜ | F3.2 | Same deprecation banner |
| F3.12 | Update Active Alarms dashboard to use Active Events API | `dashboard/Dashboard.js` or dedicated page | ⬜ | F3.7 | Switch API calls from `/active-alarms` to `/active-events` |

### Frontend — Navigation & Routing

| # | Task | File(s) | Status | Depends On | Notes |
|---|------|---------|--------|------------|-------|
| F3.13 | Add "Event Expressions" nav item to notification layout | `layout/NotificationLayout.js` | ⬜ | F3.1 | Between Policies and Testing |
| F3.14 | Add routes to notification index | `pages/notifications/index.js` | ⬜ | F3.1-4 | `/notifications/event-expressions/*` routes |
| F3.15 | Update `navigationHelper.js` with new routes | `utils/navigationHelper.js` | ⬜ | — | `eventExpressions`, `eventExpressionCreate`, `eventExpressionEdit` |
| F3.16 | Update frontend notification enums/types | `constants/notificationEnums.js` | ⬜ | — | Add event expression related constants |

---

## Phase 4: Cleanup & Deprecation

### Backend Cleanup

| # | Task | File(s) | Status | Depends On | Notes |
|---|------|---------|--------|------------|-------|
| C4.1 | Remove `AlarmHandlerService.cs` (1625 lines, obsolete) | `FMS.Application/Services/AlarmHandlerService.cs` | ⬜ | B2.1-10 | All callers must be migrated first |
| C4.2 | Remove `AlarmHandlerActiveAlarmIntegration.cs` | `Features/Notification/Services/Integration/` | ⬜ | B2.1-10 | Engine handles the integration |
| C4.3 | Remove `PolicyRulesProcessor.cs` | `Features/Notification/Services/RuleProcessor/` | ⬜ | B2.1-10 | Replaced by expression evaluators |
| C4.4 | Remove `PolicyMatchesActiveAlarm()` from `ActiveAlarmService` | `ActiveAlarmService.cs` | ⬜ | B2.11 | |
| C4.5 | Remove `CreateAlarmNotificationAsync` from `ActiveAlarmService` | `ActiveAlarmService.cs` | ⬜ | B2.11 | |
| C4.6 | Remove `CreateAlarmNotificationAsync` from `NotificationService` | `NotificationService.cs` | ⬜ | B2.1-10 | |
| C4.7 | Remove `TriggerConditions` column from `NotificationPolicy` entity | `NotificationPolicy.cs` + EF config | ⬜ | F3.8-9 | DB migration: ALTER TABLE DROP COLUMN |
| C4.8 | Remove `NullPolicyRulesProcessor` inner class | `NotificationService.cs` line 84 | ⬜ | C4.3 | |
| C4.9 | Remove alarm handler DTOs | `Features/Notification/DTOs/AlarmHandlers/` (5 files) | ⬜ | C4.1 | |
| C4.10 | Remove alarm handler API endpoints from `NotificationController` | `NotificationController.cs` | ⬜ | C4.1 | Move to deprecated or remove |

### Database Cleanup

| # | Task | File(s) | Status | Depends On | Notes |
|---|------|---------|--------|------------|-------|
| C4.11 | Verify `event_expressions` data matches `alarm_handlers` | Manual verification | ⬜ | B1.38 | Run comparison queries |
| C4.12 | Drop `alarm_handlers` table | Migration SQL | ⬜ | C4.11 | After validation period |
| C4.13 | Drop `alarm_handler_executions` table | Migration SQL | ⬜ | C4.11 | After validation period |
| C4.14 | Remove `TriggerConditions` column from `notification_policies` table | Migration SQL | ⬜ | C4.7 | |

### Frontend Cleanup

| # | Task | File(s) | Status | Depends On | Notes |
|---|------|---------|--------|------------|-------|
| C4.15 | Remove `PolicyTriggersManager.js` | `policies/PolicyTriggersManager.js` | ⬜ | F3.10 | After deprecation period |
| C4.16 | Remove `TriggerCreate.js` | `policies/TriggerCreate.js` | ⬜ | F3.11 | After deprecation period |
| C4.17 | Remove `PolicyJsonFieldsEditor.js` if unused | `policies/PolicyJsonFieldsEditor.js` | ⬜ | — | Check for remaining usages |
| C4.18 | Remove `alarmHandlerApi.js` dataservice | `src/dataservice/alarmHandlerApi.js` | ⬜ | C4.15-16 | After all consumers migrated |

---

## Task Summary

| Phase | Backend | Frontend | Database | Total |
|-------|---------|----------|----------|-------|
| Phase 1: Foundation | 39 tasks | 0 | 2 | 41 |
| Phase 2: Integration | 12 tasks | 0 | 0 | 12 |
| Phase 3: Frontend | 0 | 16 tasks | 0 | 16 |
| Phase 4: Cleanup | 10 tasks | 4 tasks | 4 tasks | 18 |
| **Total** | **61** | **20** | **6** | **87** |

---

## Execution Order (Recommended)

```
Week 1-2: B1.1 → B1.17  (Domain entities, DB tables)
Week 2-3: B1.18 → B1.27 (Engine core)
Week 3-4: B1.28 → B1.39 (CQRS, API, migration)
Week 4-5: B2.1 → B2.12  (Wire up business code)
Week 5-6: F3.1 → F3.16  (Frontend pages)
Week 7:   C4.1 → C4.18  (Cleanup old code)
```

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Double notifications during migration | Medium | Phase 2 shadow mode — engine logs but doesn't deliver |
| Missing event types during cutover | High | Comprehensive mapping of ALL callers before Phase 2 |
| AlarmHandler data loss in migration | High | Keep old tables, run both for validation period |
| Frontend routing breaks | Low | Add both old and new routes, deprecation banners |
| Performance regression (DB queries per event) | Medium | Index `event_expressions` by EventType + IsActive |
