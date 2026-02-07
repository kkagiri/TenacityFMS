# PRD: Unified Alert Configuration System

## Version: 1.0 | Date: 2026-02-07

---

## 1. Problem Statement

The FMS system has **~59 hardcoded threshold values** scattered across **13+ files** for notifications, alarms, and alert triggers. These include:

- Tank stock discrepancy thresholds (50L, 5%, 100L, 10%)
- Sensor variance thresholds (5L, 2%)
- Tank level thresholds (10% low, 95% high)
- Water detection (5mm), temperature range (-10°C to 50°C)
- Device offline duration (30min), stale data (2hr)
- Vehicle maintenance warning (7 days), check interval (6hr)
- Escalation timing (30min unack, 2hr re-escalation)
- PTS probe alarm cooldowns (5min, 15min)
- Reconciliation thresholds (1L, 1%, 150 KES/L)
- Business impact calculation (10L/point, max 100, 2x multiplier)

**Consequences:**
- Cannot tune thresholds without code deployment
- Cannot enable/disable specific alert types
- Cannot set per-site thresholds
- No visibility into what alerts exist and their configuration
- Users receive irrelevant alerts they cannot control

---

## 2. Solution Overview

Build a **Unified Alert Configuration System** that:
1. Stores all alert thresholds in the existing `SystemConfiguration` database table
2. Provides a cached service layer for fast threshold lookups
3. Adds a management UI in the existing Notification Policy Center
4. Allows each alert type to be toggled on/off
5. Supports per-site overrides (Phase 2)

---

## 3. Architecture

### 3.1 Data Layer
Uses existing `system_configurations` table with category grouping:
- **Category**: `AlertConfiguration.{AlertGroup}`
- **ConfigKey**: `Alert.{AlertType}.{Parameter}`
- **ConfigValue**: Threshold value (string, parsed to appropriate type)
- **DataType**: Int, Decimal, Bool, String
- **DefaultValue**: Factory default

### 3.2 Service Layer
New `AlertConfigurationService` in `FMS.Application/Features/Notification/Services/AlertConfiguration/`:
- Reads from `SystemConfiguration` table
- Uses in-memory cache (5min TTL) for performance
- Provides typed getters: `GetDecimalAsync(key, default)`, `GetIntAsync(key, default)`, `GetBoolAsync(key, default)`
- Provides bulk getter: `GetAlertGroupConfigAsync(alertType)` → returns all params for an alert type
- Cache invalidation on update

### 3.3 API Layer
New endpoints under existing `api/v1/system-configuration/alerts`:
- `GET /` — List all alert configurations grouped by category
- `GET /{alertType}` — Get config for specific alert type
- `PUT /{alertType}` — Update alert type configuration
- `PUT /{alertType}/toggle` — Enable/disable an alert type
- `POST /reset/{alertType}` — Reset to defaults
- `POST /seed` — Seed all defaults (admin only)

### 3.4 Frontend
New "Alert Thresholds" tab in the existing Notification Policy Center (`/admin/notification/alert-configuration`):
- Grouped by category (Tank, PTS, GPS/Vehicle, System)
- Each alert type shows: name, description, enabled toggle, threshold parameters
- Inline editing of threshold values
- Reset to defaults button per alert type

---

## 4. Alert Type Registry

### 4.1 Tank Operations
| Alert Type Key | Display Name | Parameters | Defaults |
|---|---|---|---|
| `TankClosingStockDiscrepancy` | Closing Stock Discrepancy | `significanceThresholdLiters`, `significanceThresholdPercent`, `investigationThresholdLiters`, `investigationThresholdPercent` | 50, 5, 100, 10 |
| `TankSensorVariance` | Sensor vs Manual Variance | `varianceThresholdLiters`, `varianceThresholdPercent`, `criticalLiters`, `criticalPercent`, `highLiters`, `highPercent` | 5, 2, 20, 10, 10, 5 |
| `TankLowLevel` | Low Tank Level | `thresholdPercent`, `hysteresisPercent` | 10, 1 |
| `TankHighLevel` | High Tank Level | `thresholdPercent` | 95 |
| `TankCriticalLowLevel` | Critical Low Level | `thresholdPercent` | 10 |
| `TankCriticalHighLevel` | Critical High Level | `thresholdPercent` | 95 |
| `TankWaterDetection` | Water Detection | `waterHeightMm`, `sustainedForMinutes` | 5, 5 |
| `TankTemperature` | Temperature Alarm | `minTempCelsius`, `maxTempCelsius` | -10, 50 |
| `TankStaleData` | Stale Data Alert | `staleDataHours` | 2 |
| `TankUnusualConsumption` | Unusual Consumption | `dropPercent`, `withinHours` | 20, 1 |
| `TankCapacityLimit` | Capacity Limit | `capacityPercent` | 90 |
| `TankReconciliation` | Reconciliation Discrepancy | `minVarianceLiters`, `minVariancePercent`, `fallbackPricePerLiter` | 1, 1, 150 |

### 4.2 PTS Device
| Alert Type Key | Display Name | Parameters | Defaults |
|---|---|---|---|
| `PTSDeviceOffline` | PTS Device Offline | `offlineDurationMinutes` | 30 |
| `PTSProbeAlarmCooldown` | Probe Alarm Cooldown | `cooldownMinutes` | 5 |
| `PTSSystemLevelCooldown` | System Level Cooldown | `cooldownMinutes` | 15 |

### 4.3 GPS & Vehicle
| Alert Type Key | Display Name | Parameters | Defaults |
|---|---|---|---|
| `GPSTagOffline` | GPS Tag Offline | `offlineHours`, `longTermOfflineHours` | 2, 24 |
| `VehicleMaintenanceDue` | Vehicle Maintenance Due | `warningDaysBefore`, `checkIntervalHours` | 7, 6 |
| `OdometerSync` | Odometer Sync | `syncIntervalHours`, `distanceToleranceKm` | 4, 10 |

### 4.4 System
| Alert Type Key | Display Name | Parameters | Defaults |
|---|---|---|---|
| `EscalationAutoEscalate` | Auto-Escalation | `unacknowledgedMinutes`, `reEscalationCooldownHours` | 30, 2 |
| `BusinessImpactCalc` | Business Impact Scoring | `litersPerPoint`, `maxScore`, `capacityWeightMultiplier` | 10, 100, 2 |

---

## 5. Files to Modify (Backend)

| # | File | Changes |
|---|------|---------|
| 1 | `FMS.Application/Configuration/SystemConfiguration.cs` | Add alert config DB key constants and defaults |
| 2 | NEW: `FMS.Application/Features/Notification/Services/AlertConfiguration/AlertConfigurationService.cs` | Cached alert config service |
| 3 | NEW: `FMS.Application/Features/Notification/Services/AlertConfiguration/IAlertConfigurationService.cs` | Interface |
| 4 | NEW: `FMS.Application/Features/Notification/Services/AlertConfiguration/AlertConfigurationConstants.cs` | Alert type registry with all types, params, defaults |
| 5 | NEW: `FMS.Application/Features/Notification/DTOs/AlertConfiguration/AlertConfigurationDto.cs` | DTOs |
| 6 | NEW: `FMS.Application/Features/Notification/DTOs/AlertConfiguration/AlertTypeGroupDto.cs` | Grouped response DTO |
| 7 | NEW: `FMS.Application/Features/Notification/Queries/AlertConfiguration/GetAlertConfigurationsQuery.cs` | Query |
| 8 | NEW: `FMS.Application/Features/Notification/Queries/AlertConfiguration/GetAlertConfigurationsQueryHandler.cs` | Handler |
| 9 | NEW: `FMS.Application/Features/Notification/Commands/AlertConfiguration/UpdateAlertConfigurationCommand.cs` | Command |
| 10 | NEW: `FMS.Application/Features/Notification/Commands/AlertConfiguration/UpdateAlertConfigurationCommandHandler.cs` | Handler |
| 11 | NEW: `FMS.Application/Features/Notification/Commands/AlertConfiguration/ToggleAlertCommand.cs` | Toggle command |
| 12 | NEW: `FMS.Application/Features/Notification/Commands/AlertConfiguration/ToggleAlertCommandHandler.cs` | Handler |
| 13 | NEW: `FMS.Application/Features/Notification/Commands/AlertConfiguration/ResetAlertDefaultsCommand.cs` | Reset command |
| 14 | NEW: `FMS.Application/Features/Notification/Commands/AlertConfiguration/ResetAlertDefaultsCommandHandler.cs` | Handler |
| 15 | NEW: `FMS.Application/Features/Notification/Commands/AlertConfiguration/SeedAlertConfigurationCommand.cs` | Seed command |
| 16 | NEW: `FMS.Application/Features/Notification/Commands/AlertConfiguration/SeedAlertConfigurationCommandHandler.cs` | Handler |
| 17 | NEW: `FMS.WebClient/Controllers/AlertConfigurationController.cs` | API controller |
| 18 | `FMS.Application/Features/TankManagement/TankStock/Commands/ClosingStockCommand.cs` | Replace hardcoded thresholds |
| 19 | `FMS.Application/Services/AlarmHandlerService.cs` | Replace hardcoded thresholds |
| 20 | `FMS.Application/Features/Notification/Services/ActiveAlarm/ActiveAlarmService.cs` | Replace escalation thresholds |
| 21 | `FMS.BackgroundServices/VehicleMaintenance/VehicleMaintenanceNotifierService.cs` | Replace hardcoded thresholds |
| 22 | `FMS.WebClient/Extensions/FmsServiceCollectionExtensions.cs` | Register new service in DI |

## 6. Files to Create/Modify (Frontend)

| # | File | Changes |
|---|------|---------|
| 1 | NEW: `fms.frontend/src/pages/notifications/alert-configuration/AlertConfiguration.js` | Main alert config page |
| 2 | NEW: `fms.frontend/src/pages/notifications/alert-configuration/AlertConfiguration.scss` | Styles |
| 3 | NEW: `fms.frontend/src/pages/notifications/alert-configuration/AlertTypeCard.js` | Individual alert type card |
| 4 | NEW: `fms.frontend/src/dataservice/alertConfigurationApi.js` | API service |
| 5 | `fms.frontend/src/pages/notifications/index.js` | Add alert-configuration route |
| 6 | `fms.frontend/src/pages/notifications/layout/NotificationLayout.js` | Add tab |
| 7 | `fms.frontend/src/pages/notifications/utils/navigationHelper.js` | Add route constant |

---

## 7. Out of Scope (Phase 2)
- Per-site threshold overrides
- Per-tank threshold overrides
- Threshold change audit log
- Threshold A/B testing
- Automatic threshold recommendation based on historical data
