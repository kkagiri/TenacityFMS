# Notification & Active Alarm System — Master Guide

> **Version:** 3.0 · **Date:** February 2026 · **Status:** Current
> Consolidated from `Documentation/Notification/` and `Documentation/NotificationSystem/` (both deleted).

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Database Entities](#3-database-entities)
4. [Backend Services](#4-backend-services)
5. [Alert Configuration (Thresholds)](#5-alert-configuration-thresholds)
6. [Active Alarm Lifecycle](#6-active-alarm-lifecycle)
7. [Notification Delivery Pipeline](#7-notification-delivery-pipeline)
8. [API Reference](#8-api-reference)
9. [Frontend Module](#9-frontend-module)
10. [How-To Guides](#10-how-to-guides)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. System Overview

The FMS Notification & Active Alarm system handles the entire lifecycle from **event detection → alarm creation → notification delivery → user acknowledgment**. It encompasses:

| Capability | Description |
|---|---|
| **Active Alarms** | Alarm lifecycle (create → escalate → acknowledge → resolve) |
| **Multi-Channel Notifications** | System (SignalR), Email (SMTP), SMS, Push (Firebase) |
| **Notification Policies** | Configurable rules for category-based routing & templating |
| **Alert Configuration** | UI-driven thresholds — every hardcoded value is now configurable |
| **Recipient Resolution** | Dynamic resolution from policies, groups, and user preferences |
| **Escalation** | Auto-escalation of unacknowledged alarms with configurable timers |
| **Rate Limiting** | Per-policy cooldowns to prevent notification spam |
| **Categories & Groups** | Reusable notification categories and recipient groups |

### Key Business Domains

| Domain | Trigger Sources | Example Alerts |
|---|---|---|
| **Tank Stock** | ClosingStockCommand, sensor data | Reconciliation discrepancy, sensor variance |
| **Tank Alarms** | AlarmHandlerService, PTS devices | Low volume, high volume, water detection, temperature |
| **PTS Devices** | UploadAlertRecordHandler | Device offline, probe alarm, pump fault |
| **Vehicle** | VehicleMaintenanceNotifierService | Maintenance due, odometer sync |
| **System** | Background services | Stale data, unusual consumption |

---

## 2. Architecture

### High-Level Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         EVENT SOURCES                                    │
│                                                                          │
│  PTS Device ──► UploadAlertRecordHandler                                 │
│  Closing Stock ──► ClosingStockCommand                                   │
│  Background Jobs ──► VehicleMaintenanceNotifierService                   │
│  Tank Monitoring ──► AlarmHandlerService                                 │
│                                                                          │
│  All sources check AlertConfigurationService for thresholds & enabled    │
└──────────────┬───────────────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      ACTIVE ALARM LAYER                                  │
│                                                                          │
│  ActiveAlarmService ◄───► AlarmHandlerActiveAlarmIntegration              │
│  • Create / Update / Resolve alarms                                      │
│  • Deduplication (Redis cooldown)                                        │
│  • Escalation engine (configurable minutes)                              │
│  • State machine: Active → Acknowledged → Resolved / Suppressed          │
└──────────────┬───────────────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION PIPELINE                                  │
│                                                                          │
│  NotificationService                                                     │
│  ├── PolicyRulesProcessor ──► find matching NotificationPolicy            │
│  ├── NotificationRecipientResolver ──► resolve recipients                 │
│  ├── NotificationChannelRegistry ──► pick delivery channels               │
│  │   ├── SystemNotificationChannel (SignalR)                             │
│  │   ├── EmailNotificationChannel (SMTP)                                 │
│  │   ├── SmsNotificationChannel                                          │
│  │   └── PushNotificationChannel (Firebase)                              │
│  └── Persist Notification + NotificationRecipient rows                   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Project Map

| Project | Role | Key Files |
|---|---|---|
| `FMS.Application/Features/Notification/` | Business logic, CQRS, services | All services, commands, queries, DTOs |
| `FMS.Application/Services/AlarmHandlerService.cs` | Tank alarm processing *(legacy location)* | Threshold checks via AlertConfigurationService |
| `FMS.BackgroundServices/` | Scheduled checks | `NotificationBackgroundService.cs`, `VehicleMaintenanceNotifierService.cs` |
| `FMS.WebClient/Controllers/` | API layer | `NotificationController.cs`, `ActiveAlarmController.cs`, `AlertConfigurationController.cs` |
| `FMS.Domain/Entities/` | Database entities | `Notification.cs`, `ActiveAlarm.cs`, `NotificationPolicy.cs`, etc. |
| `fms.frontend/src/pages/notifications/` | React UI | Dashboard, Policies, Alert Thresholds, Recipients, History |

---

## 3. Database Entities

### Entity Relationship Diagram

```
                    NotificationCategory
                    ├── Id, Name, Description
                    ├── DefaultPriority, DefaultDeliveryMethods
                    └── IsActive
                         │                    │
                         ▼                    ▼
                 NotificationPolicy      Notification
                 ├── CategoryId          ├── NotificationCategoryId
                 ├── Name, Template      ├── Type, Priority, Status
                 ├── RateLimit           ├── Title, Message, Data (JSON)
                 ├── CooldownMinutes     ├── SiteId, TankId, VehicleId
                 └── IsActive            ├── AlarmId, PtsDeviceId
                      │                  └── SentAt, CreatedAt
                      ▼                       │
              NotificationPolicy              ▼
              Recipient                  NotificationRecipient
              ├── UserId                 ├── NotificationId
              └── DeliveryMethods        ├── UserId, DeliveryMethod
                                         ├── DeliveryStatus
                                         ├── IsRead, IsAcknowledged
                                         └── SentAt, DeliveredAt

 NotificationGroup ──► NotificationGroupMember ──► User
                  └──► NotificationPolicyGroup ──► NotificationPolicy

 UserNotificationPreference
 ├── UserId, NotificationCategoryId
 ├── EnabledMethods, QuietHoursStart/End
 └── MinPriority

 ActiveAlarm
 ├── AlarmType, State, Severity, Priority
 ├── SiteId, TankId, DeviceId, PtsDeviceId
 ├── TriggeredAt, AcknowledgedAt, ResolvedAt
 ├── EscalationLevel, LastEscalatedAt
 ├── AutoResolveMinutes
 └── SuppressNotifications

 SystemConfiguration  (used by Alert Configuration)
 ├── ConfigurationKey   (e.g., "Alert.TankLowLevel.ThresholdPercent")
 ├── ConfigurationValue (e.g., "10")
 ├── DataType, Category, IsActive, IsEditable
 └── DefaultValue, MinValue, MaxValue
```

### Key Entities Quick Reference

| Entity | Table | Purpose |
|---|---|---|
| `Notification` | `notifications` | Every notification sent in the system |
| `NotificationRecipient` | `notification_recipients` | Per-user delivery tracking |
| `NotificationCategory` | `notification_categories` | Taxonomy (Tank, Security, System, etc.) |
| `NotificationPolicy` | `notification_policies` | Rules & templates per category |
| `NotificationPolicyRecipient` | `notification_policy_recipients` | Who receives policy notifications |
| `NotificationGroup` | `notification_groups` | Reusable recipient lists |
| `NotificationGroupMember` | `notification_group_members` | Users in groups |
| `UserNotificationPreference` | `user_notification_preferences` | Per-user overrides and quiet hours |
| `ActiveAlarm` | `active_alarms` | Alarm lifecycle record |
| `AlertRecord` | `alert_records` | Raw PTS alert packets |
| `AlarmHandler` | `alarm_handlers` | Maps alarm types to policies |
| `AlarmHandlerExecution` | `alarm_handler_executions` | Tracks handler runs |
| `SystemConfiguration` | `SystemConfigurations` | Configurable thresholds & settings |

---

## 4. Backend Services

### Service Directory

All services live under `FMS.Application/Features/Notification/Services/`:

```
Services/
├── INotificationService.cs / NotificationService.cs     — Core CRUD + send
├── PolicyRulesProcessor.cs                              — Match notifications to policies
│
├── ActiveAlarm/
│   ├── IActiveAlarmService.cs / ActiveAlarmService.cs   — Alarm lifecycle
│
├── AlertConfiguration/
│   ├── AlertConfigurationConstants.cs                   — 22 alert type definitions
│   ├── IAlertConfigurationService.cs / AlertConfigurationService.cs — Cached config reads
│
├── Businessfunction/
│   ├── IBusinessFunctionNotificationService.cs / ...    — Business event notifications
│
├── Category/
│   ├── CategoryMetadata.cs                              — In-memory category provider
│   ├── INotificationCategoryService.cs / ...            — Category CRUD
│   └── NotificationCategorySeeder.cs                    — Seed default categories
│
├── Channels/
│   ├── INotificationChannel.cs                          — Channel interface
│   ├── NotificationChannelRegistry.cs                   — Registry of all channels
│   ├── SystemNotificationChannel.cs                     — SignalR delivery
│   ├── EmailNotificationChannel.cs                      — SMTP delivery
│   ├── SmsNotificationChannel.cs                        — SMS delivery
│   └── PushNotificationChannel.cs                       — Firebase push
│
├── DeliveryChannel/
│   ├── IEmailService.cs / EmailService.cs               — Raw SMTP client
│   ├── ISmsService.cs / SmsService.cs                   — SMS client
│   └── PushNotificationService.cs                       — Firebase FCM client
│
├── Groups/
│   ├── INotificationGroupService.cs / ...               — Recipient group CRUD
│   └── NotificationGroupSeeder.cs
│
├── Integration/
│   └── AlarmHandlerActiveAlarmIntegration.cs             — Bridge: alarm → active alarm
│
└── RecipientResolver/
    ├── INotificationRecipientResolver.cs / ...          — Dynamic recipient resolution
```

### Service Interaction Summary

| Service | Depends On | Called By |
|---|---|---|
| `AlertConfigurationService` | `GpsdataContext`, `SystemConfiguration` table | AlarmHandlerService, ClosingStockCommand, ActiveAlarmService, VehicleMaintenanceNotifierService |
| `ActiveAlarmService` | `GpsdataContext`, `AlertConfigurationService` | AlarmHandlerActiveAlarmIntegration, Controllers |
| `AlarmHandlerService` | `AlertConfigurationService`, `ActiveAlarmService` | UploadAlertRecordHandler, background jobs |
| `NotificationService` | PolicyRulesProcessor, RecipientResolver, Channels | All alarm/business services |
| `NotificationRecipientResolver` | Groups, Policies, User Preferences | NotificationService |

---

## 5. Alert Configuration (Thresholds)

### Overview

Every hardcoded alarm threshold and timing value has been extracted to the `SystemConfiguration` database table, configurable through the **Alert Thresholds** tab in the frontend notification module.

### Alert Type Registry

All alert types are defined in `AlertConfigurationConstants.cs` with 4 groups:

| Group | Alert Types | Parameters |
|---|---|---|
| **Tank Stock** | ClosingStockDiscrepancy, SensorVariance, Reconciliation, Leakage, UnusualConsumption, CapacityLimit | Thresholds (L, %), severity levels |
| **Tank Alarms** | LowLevel, HighLevel, CriticalLowLevel, CriticalHighLevel, WaterDetection, Temperature, StaleData | Volume %, mm, °C, hours |
| **PTS & Device** | DeviceOffline, ProbeAlarmCooldown, SystemLevelCooldown, GPSTagOffline | Timeout minutes, cooldown minutes |
| **Vehicle & Operations** | MaintenanceDue, OdometerSync, EscalationAutoEscalate, BusinessImpactCalc | Days, hours, minutes, enabled flags |

### Config Key Convention

All keys follow the pattern: `Alert.{AlertType}.{ParameterName}`

Examples:
- `Alert.TankLowLevel.ThresholdPercent` = `10`
- `Alert.TankLowLevel.Enabled` = `True`
- `Alert.TankTemperature.MinTemperature` = `-10`
- `Alert.TankTemperature.MaxTemperature` = `50`
- `Alert.EscalationAutoEscalate.UnacknowledgedMinutes` = `30`

### Backend Usage Pattern

Services inject `IAlertConfigurationService` and call typed getters:

```csharp
// In AlarmHandlerService constructor
private readonly IAlertConfigurationService _alertConfigService;

// In alarm-checking method
var isEnabled = await _alertConfigService.IsAlertEnabledAsync(
    AlertConfigurationConstants.TankLowLevel, cancellationToken);

if (!isEnabled) return; // Skip if alert type is disabled

var threshold = await _alertConfigService.GetDecimalAsync(
    AlertConfigurationConstants.TankLowLevel, "ThresholdPercent", 10m, cancellationToken);
```

### Caching

`AlertConfigurationService` uses a `ConcurrentDictionary` cache with a 5-minute TTL. The cache is bulk-loaded from the `SystemConfiguration` table on first access, then individual keys are served from cache. Cache is invalidated on any update/toggle/reset via the API.

### API Endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/api/v1/alert-configuration` | Get all alert configs grouped |
| GET | `/api/v1/alert-configuration/{alertType}` | Get single alert type config |
| PUT | `/api/v1/alert-configuration/{alertType}` | Update thresholds & parameters |
| PUT | `/api/v1/alert-configuration/{alertType}/toggle` | Enable/disable alert type |
| POST | `/api/v1/alert-configuration/{alertType}/reset` | Reset to factory defaults |
| POST | `/api/v1/alert-configuration/seed` | Seed all defaults into DB |

### Files That Consume Thresholds

| File | What It Reads |
|---|---|
| `AlarmHandlerService.cs` | TankLowLevel, TankHighLevel, TankWaterDetection, TankTemperature, TankStaleData thresholds |
| `ClosingStockCommand.cs` | ClosingStockDiscrepancy, SensorVariance, Reconciliation thresholds + severity determination |
| `ActiveAlarmService.cs` | EscalationAutoEscalate (unacknowledged minutes, re-escalation cooldown) + enabled check |
| `VehicleMaintenanceNotifierService.cs` | MaintenanceDue (check interval, warning days) + enabled check |

---

## 6. Active Alarm Lifecycle

### State Machine

```
                    ┌────────────────┐
     Event ──────► │    Active       │
                    └────┬───────────┘
                         │
              ┌──────────┼──────────────┐
              ▼          ▼              ▼
      ┌─────────┐  ┌──────────┐  ┌────────────┐
      │Escalated│  │Acknowledged│  │ Suppressed │
      └────┬────┘  └─────┬─────┘  └────────────┘
           │             │
           ▼             ▼
      ┌──────────────────────┐
      │      Resolved        │
      └──────────────────────┘
```

### Alarm Sources

| Source | Service | Deduplication |
|---|---|---|
| PTS hardware alerts | `UploadAlertRecordHandler` → `AlarmHandlerActiveAlarmIntegration` | Redis 5-min cooldown per device+alarm |
| Tank stock discrepancies | `ClosingStockCommand` → `ActiveAlarmService` | Check existing active alarm for same tank |
| Tank monitoring | `AlarmHandlerService` → `ActiveAlarmService` | Alarm identifier matching |
| Vehicle maintenance | `VehicleMaintenanceNotifierService` | 6-hour check interval (configurable) |

### Escalation Engine

Located in `ActiveAlarmService.cs`:
- **Unacknowledged timer**: Configurable (default 30 min) — `Alert.EscalationAutoEscalate.UnacknowledgedMinutes`
- **Re-escalation cooldown**: Configurable (default 120 min) — `Alert.EscalationAutoEscalate.ReEscalationCooldownMinutes`
- **Enabled check**: `Alert.EscalationAutoEscalate.Enabled` — can be toggled off entirely

### Auto-Resolution

- PTS alerts: When device sends `State = "Finished"`, the active alarm is auto-resolved
- Background service: Checks `AutoResolveMinutes` on each active alarm

---

## 7. Notification Delivery Pipeline

### Step-by-Step Flow

1. **Event occurs** → service creates a `CreateNotificationRequest`
2. **NotificationService.CreateNotificationAsync()** receives the request
3. **PolicyRulesProcessor** finds matching `NotificationPolicy` by category/type
4. **NotificationRecipientResolver** resolves recipients from:
   - Policy recipients (NotificationPolicyRecipient)
   - Recipient groups (NotificationGroup → members)
   - User preferences filter (min priority, enabled methods, quiet hours)
5. **Notification entity** is persisted to the database with status `Pending`
6. **NotificationRecipient** rows are created for each resolved user + delivery method
7. **NotificationChannelRegistry** dispatches to the appropriate channel:
   - `SystemNotificationChannel` → SignalR hub → real-time in-app
   - `EmailNotificationChannel` → `EmailService` → SMTP
   - `SmsNotificationChannel` → `SmsService`
   - `PushNotificationChannel` → Firebase FCM
8. **Delivery status** is updated on each `NotificationRecipient` row

### Priority Levels

| Priority | Meaning | Default Behavior |
|---|---|---|
| `Low` | Informational | System only, no escalation |
| `Medium` | Should review soon | System + Email if policy says |
| `High` | Requires attention | All configured channels |
| `Critical` | Immediate action needed | All channels + require acknowledgment |

### Notification Categories (WellKnownCategories)

Categories are seeded by `NotificationCategorySeeder` and provide defaults:

| Category | Default Priority | Default Methods | Requires Ack |
|---|---|---|---|
| TankAlarm | High | System, Email | Yes |
| SensorVariance | Medium | System, Email | No |
| SecurityAlert | Critical | System, Email, SMS | Yes |
| SystemMaintenance | Low | System | No |
| StockReconciliation | Medium | System, Email | No |
| VehicleMaintenance | Medium | System | No |
| DeviceStatus | High | System, Email | No |
| UserManagement | Low | System | No |

---

## 8. API Reference

### Notification Management

**Base:** `/api/v1/notification`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List notifications (paginated, filtered) |
| GET | `/{id}` | Get notification by ID |
| POST | `/` | Create notification manually |
| POST | `/test` | Send test notification |
| PUT | `/{id}/read` | Mark as read |
| PUT | `/{id}/acknowledge` | Acknowledge notification |
| DELETE | `/{id}` | Delete notification |
| GET | `/statistics` | Notification statistics |
| GET | `/policies` | List notification policies |
| POST | `/policies` | Create policy |
| PUT | `/policies/{id}` | Update policy |
| DELETE | `/policies/{id}` | Delete policy |
| GET | `/categories` | List notification categories |
| GET | `/email-config` | Get email configuration |
| PUT | `/email-config` | Update email configuration |
| POST | `/email-config/test` | Test email connection |

### Active Alarms

**Base:** `/api/v1/active-alarm`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List active alarms (filtered) |
| GET | `/{id}` | Get alarm by ID |
| PUT | `/{id}/acknowledge` | Acknowledge alarm |
| PUT | `/{id}/resolve` | Resolve alarm |
| PUT | `/{id}/suppress` | Suppress alarm notifications |
| GET | `/statistics` | Alarm statistics |

### Alert Configuration

**Base:** `/api/v1/alert-configuration`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get all alert configs (grouped) |
| GET | `/{alertType}` | Get config for one alert type |
| PUT | `/{alertType}` | Update thresholds |
| PUT | `/{alertType}/toggle` | Enable/disable alert type |
| POST | `/{alertType}/reset` | Reset to factory defaults |
| POST | `/seed` | Seed all defaults into DB |

### Notification Groups

**Base:** `/api/v1/notification-groups`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List groups |
| POST | `/` | Create group |
| PUT | `/{id}` | Update group |
| DELETE | `/{id}` | Delete group |
| POST | `/{id}/members` | Add members |
| DELETE | `/{id}/members/{userId}` | Remove member |

---

## 9. Frontend Module

### Location

`fms.frontend/src/pages/notifications/`

### Navigation

The module is accessed at `/admin/notification` and uses DevExtreme `Tabs` for sub-navigation:

| Tab | Route | Component | Description |
|---|---|---|---|
| Dashboard | `/admin/notification` | `Dashboard.js` | Statistics, recent notifications, health |
| Notification Rules | `/admin/notification/policies` | `PolicyManagement.js` | Policy CRUD |
| Categories | `/admin/notification/categories` | *(via Preferences)* | Category listing |
| Recipient Groups | `/admin/notification/recipients` | `RecipientManagement.js` | Group management |
| **Alert Thresholds** | `/admin/notification/alert-configuration` | `AlertConfiguration.js` | Configure all thresholds |
| History | `/admin/notification/history` | `NotificationHistory.js` | Delivery log |
| Email Settings | `/admin/notification/configuration/email` | `EmailConfiguration.js` | SMTP setup |

### File Structure

```
notifications/
├── index.js                          # Path-based routing switch
├── layout/
│   ├── NotificationLayout.js         # Tab navigation + header
│   └── NotificationLayout.scss
├── dashboard/
│   └── Dashboard.js
├── alert-configuration/              ← NEW (Alert Configuration feature)
│   ├── AlertConfiguration.js         # Main page — grouped cards with search
│   ├── AlertConfiguration.scss
│   └── AlertTypeCard.js              # Per-alert card (toggle, params, reset)
├── policies/
│   ├── PolicyManagement.js
│   ├── PolicyCreate.js / PolicyEdit.js
│   ├── PolicyTriggersManager.js
│   └── TriggerCreate.js
├── recipients/
│   └── RecipientManagement.js
├── preferences/
│   └── UserPreferences.js
├── history/
│   └── NotificationHistory.js
├── configuration/
│   ├── EmailConfiguration.js
│   └── TemplateManagement.js
├── components/
│   └── NotificationHelpPopup.js
├── constants/
│   └── notificationEnums.js
├── testing/
│   └── TestingPanel.js
└── utils/
    └── navigationHelper.js           # Route constants + helpers
```

### Alert Thresholds UI

The Alert Configuration page (`AlertConfiguration.js`) shows all 22 alert types organized into 4 collapsible groups. Each alert type renders as an `AlertTypeCard.js` with:

- **Toggle switch** — enable/disable the alert type entirely
- **Parameter fields** — NumberBox or TextBox for each configurable parameter
- **Current vs. default** — shows factory default alongside current value
- **Inline edit** — Edit/Save/Cancel pattern
- **Reset to defaults** — one-click reset per alert type
- **Seed defaults** — global "Seed All Defaults" button to initialize all configs

### API Service

`fms.frontend/src/dataservice/alertConfigurationApi.js` wraps all API calls with consistent `{isSuccess, data, message}` return shape.

---

## 10. How-To Guides

### How to Add a New Alert Type

1. **Add constant** in `AlertConfigurationConstants.cs`:
   ```csharp
   public const string MyNewAlert = "MyNewAlert";
   ```

2. **Register in `GetAllAlertTypes()`** with parameters:
   ```csharp
   { MyNewAlert, new AlertTypeDef(
       "My New Alert", "Description", "GroupName", true, new[] {
           new ParamDef("ThresholdValue", "Threshold", "decimal", "units", true, 50.0m, "Threshold description")
       })
   }
   ```

3. **Add to the appropriate group** in `GetAlertGroups()`

4. **Use in your service**:
   ```csharp
   var threshold = await _alertConfigService.GetDecimalAsync(
       AlertConfigurationConstants.MyNewAlert, "ThresholdValue", 50m, ct);
   ```

5. **Seed defaults**: Call `POST /api/v1/alert-configuration/seed` — new types auto-appear

6. **Frontend**: The UI auto-discovers new types from the API response — no frontend changes needed

### How to Create a Notification Policy

1. Navigate to **Notification Rules** tab
2. Click **Create Policy**
3. Select a **Category** (e.g., Tank Alarm)
4. Configure:
   - Name and description
   - Priority level
   - Delivery methods (System, Email, SMS)
   - Rate limit / cooldown
   - Template (with `{{variable}}` placeholders)
5. Assign **recipients** (individual users or groups)
6. Save — the policy is now active

### How to Configure Recipients

1. Navigate to **Recipient Groups** tab
2. Create a new group (e.g., "Site A Operations")
3. Add users to the group
4. Reference the group in notification policies
5. Users can also set personal preferences under **My Preferences**:
   - Enable/disable specific categories
   - Set minimum priority (e.g., "only High and Critical")
   - Configure quiet hours

### How to Set Up Email

1. Navigate to **Email Settings** tab
2. Configure SMTP:
   - Server hostname and port
   - Authentication credentials
   - TLS/SSL settings
   - From address
3. Click **Test Connection** to verify
4. Click **Send Test Email** to confirm delivery

---

## 11. Troubleshooting

### Notifications Not Being Sent

| Check | Fix |
|---|---|
| Is the alert type enabled? | Check Alert Thresholds → toggle on |
| Is there a matching policy? | Create a policy for the category |
| Are there recipients? | Add users/groups to the policy |
| Is email configured? | Check Email Settings tab |
| Is the user in quiet hours? | Check User Preferences |
| Rate limited? | Check policy cooldown settings |

### Alarms Not Appearing

| Check | Fix |
|---|---|
| Is the threshold correct? | Check Alert Thresholds → verify value |
| Is Redis running? | PTS deduplication requires Redis |
| Is the background service running? | Check `NotificationBackgroundService` |
| Check logs | Search for `AlertConfigurationService` or `ActiveAlarmService` in Serilog output |

### Escalation Not Working

- Verify `Alert.EscalationAutoEscalate.Enabled` is `True`
- Check `UnacknowledgedMinutes` value (default 30)
- Ensure `NotificationBackgroundService` is running

### Cache Issues

After changing thresholds directly in the database (bypassing API), the cache won't update for up to 5 minutes. To force refresh:
- Call any update/toggle/reset API endpoint (clears cache), or
- Restart the application

---

## Related Documentation

- [Alert Configuration PRD](./AlertConfiguration/V1/implementation/PRD.md)
- [Alert Configuration Task List](./AlertConfiguration/V1/implementation/TASKLIST.md)

---

*This document is the single source of truth for the FMS Notification & Active Alarm system. If you find discrepancies with the code, the code is authoritative — update this document.*
