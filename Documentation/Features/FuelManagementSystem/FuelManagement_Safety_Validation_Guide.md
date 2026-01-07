# Fuel Management System - Complete Feature Guide

## 🛡️ Safety & Validation Features

**Version:** 1.0
**Last Updated:** January 2026
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Fuel Rules Validation](#fuel-rules-validation)
3. [Tank Capacity Protection](#tank-capacity-protection)
4. [GPS Fuel Level Monitoring](#gps-fuel-level-monitoring)
5. [Location-Based Validation](#location-based-validation)
6. [Nozzle State Validation](#nozzle-state-validation)
7. [Stuck Transaction Detection](#stuck-transaction-detection)
8. [Daily/Monthly Limit Enforcement](#dailymonthly-limit-enforcement)
9. [Refill Count Restrictions](#refill-count-restrictions)
10. [Time Window Restrictions](#time-window-restrictions)
11. [Master Tag Override](#master-tag-override)
12. [Audit & Logging](#audit--logging)
13. [Configuration Reference](#configuration-reference)

---

## Overview

The FMS Safety & Validation system provides a multi-layered approach to prevent fuel theft, unauthorized dispensing, and operational errors. Each layer operates independently but works together to create a comprehensive protection system.

### Protection Layers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       FUEL AUTHORIZATION REQUEST                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │   Step 1: Nozzle State Check  │ ← Physical validation
                    └───────────────┬───────────────┘
                                    │ ✓
                    ┌───────────────▼───────────────┐
                    │ Step 2: Stuck Transaction     │ ← System integrity
                    └───────────────┬───────────────┘
                                    │ ✓
                    ┌───────────────▼───────────────┐
                    │ Step 3: Location Validation   │ ← Proximity enforcement
                    └───────────────┬───────────────┘
                                    │ ✓
                    ┌───────────────▼───────────────┐
                    │ Step 4: Fueling Rules Check   │ ← Business rules
                    │  • No Rules = BLOCKED         │
                    │  • Check limits & allowances  │
                    └───────────────┬───────────────┘
                                    │ ✓
                    ┌───────────────▼───────────────┐
                    │ Step 5: Tank Capacity Check   │ ← Overfill prevention
                    └───────────────┬───────────────┘
                                    │ ✓
                    ┌───────────────▼───────────────┐
                    │    ✅ AUTHORIZATION GRANTED    │
                    └───────────────────────────────┘
```

### Key Principles

| Principle                 | Description                                                             |
| ------------------------- | ----------------------------------------------------------------------- |
| **Fail-Safe**             | If validation cannot be performed, system fails secure (blocks fueling) |
| **Opt-In Rules**          | Vehicles must have rules assigned before fueling is allowed             |
| **Cascading Limits**      | More restrictive rules always win                                       |
| **Real-Time Enforcement** | All checks performed at authorization time                              |
| **Audit Trail**           | Every validation decision is logged                                     |

---

## Fuel Rules Validation

### No Rules = Blocked Policy

Vehicles without any fueling rules assigned are **automatically blocked** from fueling. This "opt-in" approach ensures:

- ✅ Administrators must explicitly configure rules before a vehicle can fuel
- ✅ Prevents unauthorized or accidental fueling
- ✅ Forces proper fleet configuration
- ⚠️ New vehicles require rule assignment before first fueling

### Rule Cascade Hierarchy

Rules can be assigned at multiple levels with automatic priority-based merging:

| Level            | Priority | Description                                   |
| ---------------- | -------- | --------------------------------------------- |
| **Site**         | 10       | Organization-wide defaults                    |
| **Vehicle Type** | 50       | Type-specific rules (trucks vs. cars)         |
| **Tag**          | 80       | Tag-based rules for vehicle groups            |
| **Vehicle**      | 100      | Vehicle-specific overrides (highest priority) |

```
┌─────────────────────────────────────────────────────────────────┐
│                     Cascade Priority Flow                        │
│                                                                  │
│   Site (P:10)  →  VehicleType (P:50)  →  Tag (P:80)  →  Vehicle (P:100)
│      ↓                   ↓                  ↓              ↓     │
│   ┌─────────┐      ┌──────────┐       ┌─────────┐    ┌─────────┐│
│   │ 100L/day│  →   │ 80L/day  │   →   │ 60L/day │ →  │ 50L/day ││
│   └─────────┘      └──────────┘       └─────────┘    └─────────┘│
│                                                                  │
│   Final Effective Limit: 50L/day (highest priority wins)        │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile App Warning

When a vehicle has no rules assigned, the mobile app displays a warning modal:

```javascript
// NoFuelRulesWarning component options:
1. Assign Rules - Select and assign a rule set immediately
2. Continue with Master Tag - Use operator override (if permitted)
3. Cancel - Return to vehicle selection
```

### API Endpoint for Effective Rules

```http
GET /api/v1/fueling-rule/vehicle/{vehicleId}/effective-rules
```

**Response:**

```json
{
  "isSuccess": true,
  "data": {
    "vehicleId": 123,
    "hyoungNo": "V-001",
    "hasRulesAssigned": true,
    "maxFuelAllowed": 50.0,
    "limitingFactor": "Tank Capacity",
    "tankCapacity": 200,
    "currentFuelLevel": 150,
    "hardLimit": 50,
    "dailyLimit": 100,
    "dailyRemaining": 75,
    "monthlyLimit": 2000,
    "monthlyRemaining": 1500,
    "perTransactionLimit": 50,
    "appliedRuleSets": [
      {
        "ruleSetName": "Standard Fleet",
        "targetType": "VehicleType",
        "targetName": "Truck"
      }
    ]
  }
}
```

---

## Tank Capacity Protection

### Overview

Prevents overfilling by enforcing the physical limit of the vehicle's fuel tank. This is considered a **hard limit** that cannot be exceeded regardless of other rules.

### Calculation

```
Hard Limit (Available Space) = Tank Capacity - Current Fuel Level
```

### Components

| Component              | Source              | Description                        |
| ---------------------- | ------------------- | ---------------------------------- |
| **Tank Capacity**      | Vehicle Master Data | Maximum fuel the tank can hold     |
| **Current Fuel Level** | GPS Fuel Sensor     | Real-time fuel level (if equipped) |
| **Hard Limit**         | Calculated          | Available space in tank            |

### Mobile UI Display

The `VehicleConfirmationStep` displays hard limits prominently:

```
┌─────────────────────────────────────────┐
│ 🔒 Hard Limit (Tank Capacity)           │
├─────────────────────────────────────────┤
│ Tank Capacity:    200 L                 │
│ Current Fuel:     150 L                 │
│ Available Space:   50 L  ← Maximum!     │
│                                         │
│ 📡 GPS Fuel Sensor Active               │
└─────────────────────────────────────────┘
```

### Volume Input Validation

The `FuelingVolumeStep` component validates volume against limits:

```javascript
// Validation logic in FuelingVolumeStep.js
if (maxFuelAllowed !== null && numValue > maxFuelAllowed) {
  let errorMessage = `Exceeds maximum allowed (${maxFuelAllowed.toLocaleString()} L)`;

  if (limitingFactor) {
    errorMessage += ` - Limited by: ${limitingFactor}`;
  } else if (hasGpsFuelSensor && currentFuelLevel != null) {
    errorMessage += ` - Current fuel: ${currentFuelLevel.toFixed(0)} L`;
  }

  setVolumeError(errorMessage);
  return false;
}
```

---

## GPS Fuel Level Monitoring

### Overview

Integrates with GPS tracking systems to get real-time vehicle fuel levels, enabling accurate tank space calculations and consumption tracking.

### How It Works

```
┌────────────────┐    ┌─────────────────┐    ┌──────────────────┐
│    Vehicle     │───▶│   GPS Provider  │───▶│   FMS Backend    │
│  (Fuel Sensor) │    │   (GPSGate)     │    │  (GPS Service)   │
└────────────────┘    └─────────────────┘    └──────────────────┘
                                                      │
                                                      ▼
                                              ┌──────────────────┐
                                              │ FuelingRuleEval  │
                                              │     Service      │
                                              └──────────────────┘
```

### Configuration

Admin-managed settings in PTS Automation Configuration:

| Setting                        | Default | Description                                    |
| ------------------------------ | ------- | ---------------------------------------------- |
| `EnableGPSFuelLevelCheck`      | `true`  | Use GPS sensor data for tank space calculation |
| `EnableFuelCapacityValidation` | `true`  | Prevent tank overfilling                       |
| `EnableFuelRulesCheck`         | `true`  | Warn if no rules assigned                      |

### API for Mobile Settings

```http
GET /api/v1/automated-fueling-configuration/mobile-validation-settings?siteId={optional}
```

**Response:**

```json
{
  "success": true,
  "message": "Validation settings retrieved",
  "data": {
    "enableFuelRulesCheck": true,
    "enableFuelCapacityValidation": true,
    "enableGPSFuelLevelCheck": true
  }
}
```

### Mobile App Behavior

- Settings are fetched from backend API when app loads
- Settings cached locally for 5 minutes
- Falls back to cached settings when offline
- Settings display is read-only with "Admin" badge

---

## Location-Based Validation

### Overview

Ensures fueling operations only occur when the vehicle and/or operator are physically present at the fuel dispenser location.

### Tank Types

| Type             | Description                 | Location Source                |
| ---------------- | --------------------------- | ------------------------------ |
| **Stationary**   | Fixed tank at depot/station | Configured GPS coordinates     |
| **MobileTanker** | Fuel bowser/tanker truck    | Linked vehicle's real-time GPS |

### Proximity Checks

1. **Vehicle Proximity**: Ensures vehicle receiving fuel is near the dispenser
2. **Mobile App Proximity**: Ensures operator's device is near the dispenser

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Mobile App / Frontend                        │
│    Sends: TankId, VehicleId, MobileLocation (lat/lng/accuracy)  │
└─────────────────────────────────────┬───────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PumpAuthorizeCommand                          │
│    Step 3: Location Validation (after nozzle & stuck checks)   │
└─────────────────────────────────────┬───────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                  ILocationValidationService                      │
│                                                                  │
│  1. Check if PTS device has EnableLocationValidation = true     │
│  2. Get tank location (static or from linked vehicle GPS)       │
│  3. Check vehicle proximity (if RequireVehicleProximity)        │
│  4. Check mobile proximity (if RequireMobileAppProximity)       │
│  5. Return validation result with distances                     │
└─────────────────────────────────────────────────────────────────┘
```

### PTS Device Settings

| Setting                     | Default | Description                           |
| --------------------------- | ------- | ------------------------------------- |
| `EnableLocationValidation`  | Off     | Master switch for all location checks |
| `RequireVehicleProximity`   | Off     | Vehicle must be near tank             |
| `RequireMobileAppProximity` | Off     | Operator device must be near tank     |
| `VehicleProximityRadius`    | 100m    | Maximum distance for vehicle          |
| `MobileAppProximityRadius`  | 50m     | Maximum distance for operator         |
| `BypassOnGPSFailure`        | On      | Allow fueling if GPS unavailable      |
| `MinimumGPSAccuracy`        | 20m     | Required GPS accuracy threshold       |
| `ProximityGracePeriod`      | 10m     | Tolerance added to radius             |

### Authorization Request with Location

```json
POST /api/v1/Pump/authorize
{
  "deviceId": "PTS-001",
  "pumpId": 1,
  "nozzle": 1,
  "tankId": 5,
  "vehicleId": 123,
  "dose": 50,
  "mobileLocation": {
    "latitude": -1.286389,
    "longitude": 36.817223,
    "accuracy": 10,
    "isCached": false
  }
}
```

### Validation Failure Response

```json
{
  "success": false,
  "message": "Location validation failed",
  "validationErrors": [
    "⚠️ Location validation failed",
    "Vehicle is 523m away, must be within 100m"
  ]
}
```

---

## Nozzle State Validation

### Overview

Ensures the physical nozzle is lifted before authorization is granted. This prevents remote authorization fraud and ensures someone is physically at the pump.

### How It Works

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PTS Device    │───▶│  Pump Status    │───▶│  Authorization  │
│ (Hardware)      │    │  (nozzleUp)     │    │     Check       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Pump Status Values

| nozzleUp Value | Meaning          |
| -------------- | ---------------- |
| 0              | No nozzle lifted |
| 1              | Nozzle 1 lifted  |
| 2              | Nozzle 2 lifted  |
| N              | Nozzle N lifted  |

### Mobile UI Feedback

The `FuelingVolumeStep` shows real-time nozzle status:

```
┌─────────────────────────────────────────┐
│ 🟢 Nozzle Ready                         │  ← When nozzle is up
│ Pump 1 • Nozzle 2                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ⚠️ Lift Nozzle to Continue              │  ← When nozzle is down
│ Pump 1 • Nozzle 2 (Currently down)  🔄  │
└─────────────────────────────────────────┘
```

### Proceed Validation

```javascript
// User can only proceed when nozzle is up AND volume is set
const canProceed =
  isNozzleUp && (volume || isFullTank) && !volumeError && !odometerError;
```

---

## Stuck Transaction Detection

### Overview

Detects and handles transactions that were started but not properly completed, preventing pump lockout situations.

### Detection Logic

The `PumpAuthorizationPreCheckService` checks for stuck transactions before allowing new authorizations:

```csharp
// Step 2 in PumpAuthorizeCommand
var stuckTransaction = await _preCheckService.CheckForStuckTransactionAsync(
    request.DeviceId, request.PumpId, cancellationToken);

if (stuckTransaction != null)
{
    return FMSResponse<PumpAuthorizeResponse>.Failed(
        $"Pump {request.PumpId} has a stuck transaction ({stuckTransaction.TransactionId}) " +
        "that must be cleared first. Please contact support or use the emergency cleanup feature."
    );
}
```

### Emergency Cleanup Endpoint

```http
DELETE /api/v1/pump/{deviceId}/stuck-transactions?pumpId={optional}
```

**Response:**

```json
{
  "success": true,
  "message": "Cleared 1 stuck transaction(s)",
  "data": {
    "clearedTransactions": ["TX-2024-001234"]
  }
}
```

### Causes of Stuck Transactions

| Cause                                | Resolution                                         |
| ------------------------------------ | -------------------------------------------------- |
| Network disconnection during fueling | Automatic retry on reconnection                    |
| App crash during monitoring          | Manual cleanup via admin portal                    |
| PTS device restart                   | Transaction context cleared in Redis               |
| Power failure                        | System automatically detects orphaned transactions |

---

## Daily/Monthly Limit Enforcement

### Overview

Enforces volume limits over time periods to control fuel consumption and budgets.

### Limit Types

| Limit                 | Description             | Calculation                     |
| --------------------- | ----------------------- | ------------------------------- |
| **Daily Limit**       | Maximum fuel per day    | Resets at midnight              |
| **Daily Remaining**   | Available today         | Daily Limit - Used Today        |
| **Monthly Limit**     | Maximum fuel per month  | Resets on 1st of month          |
| **Monthly Remaining** | Available this month    | Monthly Limit - Used This Month |
| **Per Transaction**   | Maximum per single fill | Applied to each authorization   |

### Effective Limit Calculation

```
Max Fuel Allowed = MIN(
  Hard Limit (tank space),
  Daily Remaining,
  Monthly Remaining,
  Per Transaction Limit
)
```

### UI Status Indicators

```javascript
// Daily status calculation
const getDailyStatus = () => {
  if (!rules.dailyLimit || rules.dailyLimit === 0) return "normal"; // Unlimited
  const remaining = rules.dailyRemaining || 0;
  if (remaining <= 0) return "danger"; // Red - limit reached
  if (remaining < 50) return "warning"; // Yellow - low remaining
  return "normal"; // Green - OK
};
```

### Mobile App Display

```
┌─────────────────────────────────────────┐
│ 📋 Soft Limits (Rules)                  │
├─────────────────────────────────────────┤
│ Daily Remaining:   75 L                 │
│ Used: 25 L / 100 L                      │
│                                         │
│ Monthly Remaining: 1,500 L              │
│ Used: 500 L / 2,000 L                   │
│                                         │
│ Per Transaction:   50 L                 │
└─────────────────────────────────────────┘
```

---

## Refill Count Restrictions

### Overview

Limits the number of fueling transactions allowed per time period, preventing multiple small fills that might indicate suspicious activity.

### Limit Types

| Limit                | Description                         |
| -------------------- | ----------------------------------- |
| `MaxRefillsPerDay`   | Maximum number of refuels per day   |
| `MaxRefillsPerWeek`  | Maximum number of refuels per week  |
| `MaxRefillsPerMonth` | Maximum number of refuels per month |

### Enforcement

```csharp
// NoOfRefillRule validation
public bool Validate(FuelingContext context)
{
    if (MaxRefillsPerDay.HasValue && context.NoOfRefillToday >= MaxRefillsPerDay.Value)
        return false; // Daily refill limit reached

    if (MaxRefillsPerWeek.HasValue && context.NoOfRefillThisWeek >= MaxRefillsPerWeek.Value)
        return false; // Weekly refill limit reached

    if (MaxRefillsPerMonth.HasValue && context.NoOfRefillThisMonth >= MaxRefillsPerMonth.Value)
        return false; // Monthly refill limit reached

    return true;
}
```

### Mobile Display

```
┌─────────────────────────────────────────┐
│ Refills Remaining:   3                  │
│ 2 of 5 used                            │
└─────────────────────────────────────────┘
```

---

## Time Window Restrictions

### Overview

Restricts fueling to specific hours of the day, useful for fleet operations that should only occur during business hours.

### Configuration

```json
{
  "timeWindowStart": "06:00",
  "timeWindowEnd": "22:00"
}
```

### Display

```javascript
const formatTimeWindow = () => {
  if (rules.timeWindowStart && rules.timeWindowEnd) {
    return `${rules.timeWindowStart} - ${rules.timeWindowEnd}`;
  }
  return "24 Hours"; // No restrictions
};
```

### Enforcement

Authorization is blocked if current time falls outside the allowed window.

---

## Master Tag Override

### Overview

Allows operators with master tags to override certain validation rules in emergency situations. All overrides are logged for audit purposes.

### Override Capabilities

| Feature             | Master Tag Can Override?            |
| ------------------- | ----------------------------------- |
| No Rules Warning    | ✅ Yes - Continue with operator tag |
| Volume Limits       | ❌ No - Hard limits always enforced |
| Location Validation | ⚠️ Configurable per device          |
| Time Window         | ✅ Yes - With audit log             |

### Mobile App Flow

```
┌─────────────────────────────────────────┐
│ ⚠️ No Fueling Rules Assigned            │
│                                         │
│ This vehicle has no fueling rules.      │
│ Choose an action:                       │
│                                         │
│ [🔧 Assign Rules]                       │
│ [🏷️ Continue with Master Tag]          │
│ [← Cancel]                              │
└─────────────────────────────────────────┘
```

### Audit Logging

When master tag is used:

```json
{
  "eventType": "MASTER_TAG_OVERRIDE",
  "operatorId": "OP-001",
  "vehicleId": 123,
  "reason": "No rules assigned",
  "timestamp": "2026-01-06T10:30:00Z",
  "siteId": 5
}
```

---

## Audit & Logging

### Location Validation Logging

All location validations are logged to `locationvalidationlogs` table:

```sql
CREATE TABLE locationvalidationlogs (
  Id INT PRIMARY KEY AUTO_INCREMENT,
  TankId INT,
  VehicleId INT,
  PtsDeviceId VARCHAR(50),
  ValidationPerformed BOOLEAN,
  IsValid BOOLEAN,
  VehicleDistanceMeters DECIMAL(10,2),
  MobileDistanceMeters DECIMAL(10,2),
  FailureReason VARCHAR(500),
  TankLatitude DECIMAL(10,8),
  TankLongitude DECIMAL(11,8),
  VehicleLatitude DECIMAL(10,8),
  VehicleLongitude DECIMAL(11,8),
  MobileLatitude DECIMAL(10,8),
  MobileLongitude DECIMAL(11,8),
  CreatedAt DATETIME
);
```

### Transaction Logging

All fuel transactions are logged with complete validation context:

| Field               | Description                   |
| ------------------- | ----------------------------- |
| `TransactionId`     | Unique transaction identifier |
| `VehicleId`         | Vehicle receiving fuel        |
| `OperatorId`        | Operator who authorized       |
| `RulesApplied`      | List of rule sets evaluated   |
| `ValidationResults` | All validation outcomes       |
| `MaxAllowed`        | Calculated maximum allowed    |
| `ActualDispensed`   | Actual volume dispensed       |

---

## Configuration Reference

### System Configurations

| Key                                          | Default | Description                       |
| -------------------------------------------- | ------- | --------------------------------- |
| `FuelingRules.EnableLocationValidation`      | false   | Global location validation switch |
| `FuelingRules.DefaultVehicleProximityRadius` | 100     | Default vehicle radius (meters)   |
| `FuelingRules.DefaultMobileProximityRadius`  | 50      | Default mobile radius (meters)    |
| `FuelingRules.AllowNonGPSVehicles`           | true    | Allow vehicles without GPS        |
| `FuelingRules.BypassOnGPSFailure`            | true    | Graceful degradation              |
| `FuelingRules.MinimumGPSAccuracy`            | 20      | Min accuracy (meters)             |
| `FuelingRules.ProximityGracePeriodMeters`    | 10      | Grace period tolerance            |

### PTS Device Settings

| Setting                      | Type    | Description              |
| ---------------------------- | ------- | ------------------------ |
| `EnableLocationValidation`   | Boolean | Master switch            |
| `RequireVehicleProximity`    | Boolean | Check vehicle GPS        |
| `RequireMobileAppProximity`  | Boolean | Check operator GPS       |
| `VehicleProximityRadius`     | Integer | Meters                   |
| `MobileAppProximityRadius`   | Integer | Meters                   |
| `BypassOnGPSFailure`         | Boolean | Allow if GPS unavailable |
| `MinimumGPSAccuracy`         | Integer | Meters                   |
| `ProximityGracePeriodMeters` | Integer | Meters                   |

### Mobile Validation Settings

| Setting                        | Type    | Description         |
| ------------------------------ | ------- | ------------------- |
| `EnableFuelRulesCheck`         | Boolean | Warn if no rules    |
| `EnableFuelCapacityValidation` | Boolean | Prevent overfilling |
| `EnableGPSFuelLevelCheck`      | Boolean | Use GPS fuel sensor |

---

## 🚀 Upcoming Features

The following features are planned for future releases. See the PRD for full details:

### Fixed Vehicle Proximity Validation

Ensure the mobile tanker is at the same location as fixed vehicles (generators, construction equipment) before fueling.

### Geofence-Based Fueling Restrictions

Fueling rules can specify valid geofence areas where fueling is permitted, integrating with GPSGate geofence data.

📄 **[PRD: Geofence & Fixed Vehicle Location Validation](./PRD_Geofence_Location_Validation.md)**

---

## Related Documentation

- [Fueling Rules Cascade Hierarchy](../FuelingRule/CASCADE_HIERARCHY_IMPLEMENTATION.md)
- [Fuel Rule Management System](../FuelingRule/readme.md)
- [Location Validation Feature](../LocationValidation/README.md)
- [Mobile Fueling Validation Settings](../MobileFuelingValidation/ADMIN_MANAGED_SETTINGS.md)
- [Fuel Audit System PRD](../FuelAudit/Implementation/FuelAudit_PRD.md)
- [Mobile Fueling Process](../../Mobile/Features/FuelingProcess.md)
- [🆕 PRD: Geofence & Fixed Vehicle Validation](./PRD_Geofence_Location_Validation.md)

---

## Troubleshooting

### Common Issues

| Issue                        | Cause                           | Resolution                    |
| ---------------------------- | ------------------------------- | ----------------------------- |
| "No fueling rules assigned"  | Vehicle not configured          | Assign rules via admin portal |
| "Location validation failed" | Vehicle/operator too far        | Move closer to dispenser      |
| "Stuck transaction detected" | Previous transaction incomplete | Use emergency cleanup         |
| "Nozzle not lifted"          | Physical nozzle down            | Lift nozzle at pump           |
| "Daily limit exceeded"       | Used full daily allowance       | Wait until midnight reset     |

### Diagnostic Endpoints

```http
# Check effective rules for vehicle
GET /api/v1/fueling-rule/vehicle/{vehicleId}/effective-rules

# Check location validation settings
GET /api/v1/automated-fueling-configuration/mobile-validation-settings

# View active transactions for device
GET /api/v1/pump/{deviceId}/transactions

# Clear stuck transactions (emergency)
DELETE /api/v1/pump/{deviceId}/stuck-transactions
```

---

_This document provides a comprehensive overview of all safety and validation features in the FMS fuel management system. For implementation details, refer to the linked documentation._
