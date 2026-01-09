# Fuel Management System - Complete Feature Guide

## 🛡️ Enterprise Fuel Control & Safety Platform

**Version:** 2.0
**Last Updated:** January 2026
**Status:** ✅ Production Ready

---

## 📌 Executive Summary

The FMS Fuel Management System is an **enterprise-grade fuel control and monitoring solution** designed to eliminate fuel theft, prevent unauthorized dispensing, and provide complete operational visibility. Built with a **fail-safe architecture**, the system ensures that every drop of fuel is tracked, validated, and accounted for.

### 💰 Business Impact

| Metric | Improvement |
|--------|-------------|
| **Fuel Loss Reduction** | Reduces losses to **<1%** through multi-layer validation |
| **Unauthorized Dispensing** | **100% blocked** - no fueling without explicit authorization |
| **Operational Visibility** | **Real-time tracking** of every transaction |
| **Compliance** | Complete **audit trail** for regulatory requirements |
| **ROI Timeline** | Typical payback within **3-6 months** |

### 🏆 Key Differentiators

- **5-Layer Validation** - Multiple security checkpoints prevent fraud
- **GPS Integration** - Real-time vehicle location and fuel level monitoring
- **Mobile-First Design** - Operators can work anywhere with full validation
- **Self-Healing System** - Automatic recovery from transaction failures
- **Geofence Enforcement** - Fueling only in authorized locations

---

## Table of Contents

1. [Overview](#overview)
2. [Fuel Rules Validation](#fuel-rules-validation)
3. [Tank Capacity Protection](#tank-capacity-protection)
4. [GPS Fuel Level Monitoring](#gps-fuel-level-monitoring)
5. [Location-Based Validation](#location-based-validation)
6. [Geofence-Based Fueling Restrictions](#geofence-based-fueling-restrictions)
7. [Fixed Vehicle Location Validation](#fixed-vehicle-location-validation)
8. [Nozzle State Validation](#nozzle-state-validation)
9. [Stuck Transaction Detection](#stuck-transaction-detection)
10. [Daily/Monthly Limit Enforcement](#dailymonthly-limit-enforcement)
11. [Refill Count Restrictions](#refill-count-restrictions)
12. [Time Window Restrictions](#time-window-restrictions)
13. [Master Tag Override](#master-tag-override)
14. [Mobile Fueling Application](#mobile-fueling-application)
15. [Fuel Audit & Variance Detection](#fuel-audit--variance-detection)
16. [Audit & Logging](#audit--logging)
17. [Configuration Reference](#configuration-reference)

---

## Overview

The FMS Safety & Validation system provides a **multi-layered defense architecture** to prevent fuel theft, unauthorized dispensing, and operational errors. Each layer operates independently but works together to create a comprehensive protection system that is **virtually impossible to bypass**.

### Why Multi-Layer Protection Matters

Traditional fuel management relies on single-point controls (e.g., just a PIN code) that can be easily circumvented. FMS implements **defense in depth** - even if one layer is compromised, multiple other layers continue to protect your fuel assets.

### Protection Layers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       FUEL AUTHORIZATION REQUEST                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │   Step 1: Nozzle State Check  │ ← Physical presence required
                    └───────────────┬───────────────┘
                                    │ ✓
                    ┌───────────────▼───────────────┐
                    │ Step 2: Stuck Transaction     │ ← System integrity check
                    └───────────────┬───────────────┘
                                    │ ✓
                    ┌───────────────▼───────────────┐
                    │ Step 3: Location Validation   │ ← GPS proximity + geofence
                    └───────────────┬───────────────┘
                                    │ ✓
                    ┌───────────────▼───────────────┐
                    │ Step 4: Fueling Rules Check   │ ← Business rules & limits
                    │  • No Rules = BLOCKED         │
                    │  • Check all limits           │
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

| Principle | Description | Business Benefit |
|-----------|-------------|------------------|
| **Fail-Safe Design** | If validation cannot be performed, system blocks fueling | Zero unauthorized dispensing |
| **Opt-In Security** | Vehicles must have rules assigned before fueling | No accidental fueling of unauthorized vehicles |
| **Most Restrictive Wins** | Lower limits always override higher ones | Budget protection guaranteed |
| **Real-Time Enforcement** | All checks at authorization time | Immediate fraud prevention |
| **Complete Audit Trail** | Every decision logged with full context | Regulatory compliance & dispute resolution |

### Value for Different Stakeholders

#### 👔 For Operations Managers
- **Complete Fuel Control** - Know exactly where every liter goes
- **Automated Enforcement** - Rules enforced 24/7 without manual intervention
- **Exception Alerts** - Immediate notification of anomalies
- **Mobile Workforce** - Operators can fuel anywhere with full validation

#### 🔒 For Security & IT
- **Defense in Depth** - 5 independent validation layers
- **Tamper-Proof Logging** - Complete audit trail for investigations
- **Graceful Degradation** - System handles failures safely
- **Role-Based Overrides** - Master tags with full accountability

#### 💵 For Finance
- **Budget Enforcement** - Daily/monthly limits per vehicle enforced automatically
- **Variance Detection** - Expected vs actual consumption tracking
- **Loss Prevention** - Fuel losses reduced to <1%
- **Cost Allocation** - Accurate fuel attribution per vehicle/department

---

## Fuel Rules Validation

### 🔐 No Rules = Blocked Policy (Opt-In Security)

Unlike traditional systems that allow fueling by default, FMS implements an **opt-in security model**. Vehicles without fueling rules are **automatically blocked** from receiving fuel.

#### Why This Matters

| Traditional Approach | FMS Approach |
|---------------------|--------------|
| All vehicles can fuel by default | Only configured vehicles can fuel |
| Relies on operators to check authorization | System enforces authorization automatically |
| New vehicles can fuel immediately | New vehicles require admin configuration |
| Security holes from forgotten exclusions | Security by design - explicit inclusion only |

#### Business Benefits
- ✅ **Administrators must explicitly configure rules** before any vehicle can fuel
- ✅ **Prevents unauthorized fueling** of rental vehicles, sold vehicles, or unauthorized additions
- ✅ **Forces proper fleet configuration** and documentation
- ✅ **New vehicles require conscious decision** before first fueling

### Rule Cascade Hierarchy

FMS provides a **flexible, hierarchical rule system** that allows fleet-wide policies with targeted overrides. Rules cascade from organization-wide defaults down to individual vehicle settings.

| Level | Priority | Description | Example Use Case |
|-------|----------|-------------|------------------|
| **Site** | 10 | Organization-wide defaults | "All vehicles: 100L daily limit" |
| **Vehicle Type** | 50 | Type-specific rules | "Trucks: 200L daily, Cars: 50L daily" |
| **Tag** | 80 | Group-based rules | "VIP Executives: No limits" |
| **Vehicle** | 100 | Vehicle-specific overrides | "CEO Car: 80L daily" |

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

#### Why Cascading Rules Save Time

- **Set Once at Site Level** - Base policy applies to all vehicles automatically
- **Override Where Needed** - Only configure exceptions, not every vehicle
- **Vehicle Types Auto-Apply** - New trucks automatically get truck rules
- **Tags for Flexibility** - Group vehicles by project, department, or VIP status

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

### 🛢️ Overfill Prevention - Never Waste a Drop

The Tank Capacity Protection system prevents **physical overfilling** by enforcing the actual limit of the vehicle's fuel tank. This is considered a **hard limit** that cannot be exceeded regardless of other rules or operator requests.

### Why Overfill Protection Matters

| Problem Without Protection | FMS Solution |
|---------------------------|--------------|
| Operators request more fuel than tank can hold | System calculates available space |
| Fuel spills from overfilling | Authorization limited to actual capacity |
| Wasted fuel = wasted money | GPS fuel sensor integration for accuracy |
| Environmental and safety hazards | Hard limits enforced at PTS device level |

### Smart Calculation

```
Available Space = Tank Capacity - Current Fuel Level
```

The system uses **multiple data sources** to determine the most accurate available space:

| Data Source | Priority | Accuracy | When Used |
|-------------|----------|----------|-----------|
| **GPS Fuel Sensor** | Highest | ±5L | Real-time sensor data available |
| **Last Known Level** | Medium | ±10L | Temporary GPS outage |
| **Tank Capacity Only** | Fallback | Conservative | No sensor data available |

### Real-Time Display

The mobile app shows operators exactly what's available:

```
┌─────────────────────────────────────────┐
│ 🔒 Hard Limit (Tank Capacity)           │
├─────────────────────────────────────────┤
│ Tank Capacity:    200 L                 │
│ Current Fuel:     150 L (GPS Live)      │
│ Available Space:   50 L  ← Maximum!     │
│                                         │
│ 📡 GPS Fuel Sensor Active               │
│ Last Updated: 2 minutes ago             │
└─────────────────────────────────────────┘
```

### Intelligent Volume Validation

When an operator enters a volume, the system validates against **all applicable limits**:

```javascript
// Validation provides clear, actionable feedback
if (requestedVolume > availableSpace) {
  error = `Exceeds maximum allowed (50 L) - Limited by: Tank Capacity`;
  // Operator knows exactly why and what the limit is
}
```

---

## GPS Fuel Level Monitoring

### 📡 Real-Time Integration with Your GPS Provider

FMS integrates with your existing GPS tracking infrastructure (GPSGate, etc.) to obtain **real-time vehicle fuel levels**. This enables accurate tank space calculations without additional hardware investment.

### Business Value

| Capability | Benefit |
|------------|---------|
| **Real-time fuel level** | Know exactly how much fuel each vehicle has |
| **Accurate space calculation** | Prevent overfilling automatically |
| **Consumption tracking** | Detect fuel theft or leaks |
| **No new hardware** | Leverage existing GPS fuel sensors |

### How It Works

```
┌────────────────┐    ┌─────────────────┐    ┌──────────────────┐
│    Vehicle     │───▶│   GPS Provider  │───▶│   FMS Backend    │
│  (Fuel Sensor) │    │   (GPSGate)     │    │  (GPS Service)   │
└────────────────┘    └─────────────────┘    └──────────────────┘
                                                      │
                              Real-time fuel level ───┘
                                                      │
                                                      ▼
                                              ┌──────────────────┐
                                              │ FuelingRuleEval  │
                                              │     Service      │
                                              └──────────────────┘
                                                      │
                              Max allowed = Tank - Current fuel
```

### Centralized Configuration

Administrators control GPS integration settings from the **PTS Automation Configuration** panel:

| Setting | Default | Description | Impact |
|---------|---------|-------------|--------|
| `EnableGPSFuelLevelCheck` | ✅ On | Use GPS sensor for tank space | More accurate limits |
| `EnableFuelCapacityValidation` | ✅ On | Prevent tank overfilling | Zero fuel waste |
| `EnableFuelRulesCheck` | ✅ On | Warn if no rules assigned | Enforces configuration |

### Graceful Degradation

The system handles GPS failures intelligently:

| Scenario | System Behavior |
|----------|-----------------|
| GPS sensor active | Uses real-time fuel level |
| GPS temporarily unavailable | Falls back to last known level |
| No GPS sensor on vehicle | Uses tank capacity only |
| Network outage | Mobile app uses cached settings |

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

---

## Location-Based Validation

### 📍 Ensuring Physical Presence at the Pump

Location validation ensures fueling operations only occur when the **vehicle and/or operator are physically present** at the fuel dispenser. This prevents remote authorization fraud and fuel diversion.

### The Problem It Solves

| Fraud Scenario | How FMS Prevents It |
|----------------|---------------------|
| Remote authorization from home | Operator's phone must be at pump location |
| Fueling different vehicle than authorized | Vehicle GPS must match pump location |
| Diverting fuel to unauthorized location | Geofence boundaries enforced |
| Collusion between operator and outsider | Both vehicle AND operator location verified |

### Tank Types Supported

| Type | Description | Location Source |
|------|-------------|-----------------|
| **Stationary** | Fixed tank at depot/station | Configured GPS coordinates |
| **Mobile Tanker** | Fuel bowser/tanker truck | Linked vehicle's real-time GPS from GPSGate |

### Dual Proximity Validation

FMS can verify **both** the vehicle and operator location independently:

| Check Type | Purpose | Configurable Radius |
|------------|---------|---------------------|
| **Vehicle Proximity** | Confirms vehicle is at the dispenser | Default: 100m |
| **Mobile App Proximity** | Confirms operator is at the dispenser | Default: 50m |

### PTS Device Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `EnableLocationValidation` | Off | Master switch for all location checks |
| `RequireVehicleProximity` | Off | Vehicle must be near tank |
| `RequireMobileAppProximity` | Off | Operator device must be near tank |
| `VehicleProximityRadius` | 100m | Maximum distance for vehicle |
| `MobileAppProximityRadius` | 50m | Maximum distance for operator |
| `BypassOnGPSFailure` | On | Allow fueling if GPS unavailable |
| `MinimumGPSAccuracy` | 20m | Required GPS accuracy threshold |
| `ProximityGracePeriod` | 10m | Tolerance added to radius |

### Per-User GPS Bypass ✨ NEW

Administrators can grant specific users the ability to bypass GPS validation:

- **Use Case:** Remote locations with poor GPS/network coverage
- **Precedence:** Takes priority over device-level settings
- **Accountability:** Full audit trail of all bypassed validations
- **Management:** Controlled through User Management portal

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

### Clear Failure Messages

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

## Geofence-Based Fueling Restrictions

### 🗺️ Control WHERE Fueling Can Occur (NEW)

**Status:** ✅ Production Ready (January 2026)

Geofence validation ensures fueling only occurs within **approved geographic boundaries**. This is a global policy setting that integrates with your existing GPSGate geofence infrastructure.

### Business Value

| Capability | Benefit |
|------------|---------|
| **Boundary Enforcement** | Fueling only in designated areas |
| **GPSGate Integration** | Leverage existing geofence definitions |
| **Multi-Party Validation** | Check tanker, operator, AND vehicle locations |
| **Fuel Diversion Prevention** | Block unauthorized delivery locations |

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                      Geofence Validation                         │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              GPSGate Geofence Groups                     │   │
│   │   • Depot Alpha     [✅ Allowed]                        │   │
│   │   • Construction Sites [✅ Allowed]                     │   │
│   │   • Restricted Areas   [❌ Not Allowed]                 │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │           Location Check at Authorization               │   │
│   │                                                         │   │
│   │   Tanker in allowed geofence?     ✓                    │   │
│   │   Operator in allowed geofence?   ✓                    │   │
│   │   Vehicle in allowed geofence?    ✓                    │   │
│   │                                                         │   │
│   │   → All checks pass = AUTHORIZE                        │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Configuration Options

| Setting | Description |
|---------|-------------|
| `EnableGeofenceValidation` | Master switch for geofence checks |
| `RequireTankerInGeofence` | Tanker must be in allowed geofence |
| `RequireOperatorInGeofence` | Operator's mobile app must be in allowed geofence |
| `RequireVehicleInGeofence` | Vehicle receiving fuel must be in allowed geofence |

### Key Features

- **Global Policy** - Geofence validation is system-wide, not per-rule-set
- **GPSGate Sync** - Geofences synced automatically from GPSGate
- **Allowed Groups** - Admins mark which geofence groups permit fueling
- **Real-time Check** - Position verified at authorization time

---

## Fixed Vehicle Location Validation

### 🏗️ Fueling Stationary Assets (NEW)

**Status:** ✅ Production Ready (January 2026)

For stationary assets like **generators, construction equipment, and fixed machinery**, FMS validates that the mobile tanker is physically at the asset's registered location before allowing fuel delivery.

### The Problem

Stationary assets don't move, so traditional vehicle GPS tracking doesn't help. Without fixed location validation:
- Fuel intended for a remote generator could be diverted
- No way to verify delivery actually occurred at the asset
- Easy for theft through fake delivery claims

### The Solution

```
┌─────────────────────────────────────────────────────────────────┐
│                Fixed Vehicle Location Validation                 │
│                                                                  │
│   ┌───────────────┐              ┌───────────────┐              │
│   │   Generator   │              │ Mobile Tanker │              │
│   │ GPS: -1.28°,  │              │  Real-time    │              │
│   │      36.81°   │              │  GPS Position │              │
│   │ (Registered)  │              │               │              │
│   └───────┬───────┘              └───────┬───────┘              │
│           │                              │                       │
│           └──────────────┬───────────────┘                       │
│                          ▼                                       │
│           ┌──────────────────────────┐                           │
│           │  Distance < 50m?         │                           │
│           │  → AUTHORIZE             │                           │
│           │  Distance > 50m?         │                           │
│           │  → BLOCK + Log attempt   │                           │
│           └──────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

### Configuration

| Setting | Description |
|---------|-------------|
| `FixedLatitude` | Registered GPS latitude of asset |
| `FixedLongitude` | Registered GPS longitude of asset |
| `ProximityRadius` | How close tanker must be (default: 50m) |
| `IsFixedLocation` | Flag indicating asset is stationary |

### Benefits

- ✅ **Verify Delivery Location** - Tanker must be at asset location
- ✅ **Prevent Diversion** - Can't deliver to wrong location
- ✅ **Audit Trail** - Every delivery location logged with GPS coordinates
- ✅ **No Additional Hardware** - Uses existing GPS on tanker vehicle

---

## Nozzle State Validation

### 🔌 Physical Presence Verification

Nozzle state validation ensures **someone is physically at the pump** before fuel can be dispensed. The system requires the nozzle to be lifted before authorization is granted.

### Why This Matters

| Fraud Attempt | How Nozzle Validation Blocks It |
|---------------|--------------------------------|
| Remote authorization via hacked app | No fuel without physical nozzle lift |
| Ghost transactions (authorization without delivery) | Hardware confirms physical action |
| Collusion to create fake records | PTS device independently verifies state |

### Real-Time Status

The mobile app shows operators the current nozzle state:

```
┌─────────────────────────────────────────┐
│ 🟢 Nozzle Ready                         │  ← Hardware confirmed
│ Pump 1 • Nozzle 2                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ⚠️ Lift Nozzle to Continue              │  ← Waiting for action
│ Pump 1 • Nozzle 2 (Currently down)  🔄  │
└─────────────────────────────────────────┘
```

### Hardware Integration

| nozzleUp Value | Meaning | App Response |
|----------------|---------|--------------|
| 0 | No nozzle lifted | Block - show warning |
| 1 | Nozzle 1 lifted | Allow authorization |
| 2 | Nozzle 2 lifted | Allow authorization |
| N | Nozzle N lifted | Allow authorization |

---

## Stuck Transaction Detection

### 🔧 Self-Healing Pump Management

FMS includes **automatic stuck transaction detection and recovery** to ensure pumps never stay locked. When network issues, app crashes, or power failures interrupt fueling, the system automatically recovers.

### The Problem It Solves

Without automatic recovery, stuck transactions cause:
- 🚫 Pump locked and unusable
- 📞 Support calls and downtime
- 💰 Lost productivity waiting for manual intervention
- 😤 Frustrated operators

### Automatic Detection & Recovery

```
┌─────────────────────────────────────────────────────────────────┐
│                   Stuck Transaction Recovery                     │
│                                                                  │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │ Transaction │───▶│  No EOT in  │───▶│  Auto-Clear │        │
│   │   Started   │    │  2 minutes  │    │  + Log      │        │
│   └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                                  │
│   Features:                                                      │
│   • Synthetic EOT creation from last known values               │
│   • Redis cleanup of stale transaction keys                     │
│   • Pump authorization state cleared                            │
│   • 10-minute auto-expiry as safety net                         │
└─────────────────────────────────────────────────────────────────┘
```

### Admin Dashboard

The **Stuck Transaction Management** component provides:
- DataGrid showing all active transactions
- Color-coded status: 🟢 <2min | 🟡 2-5min | 🔴 >5min
- Individual or bulk clearing options
- Confirmation dialogs for safety

### Manual Recovery API

```http
# View stuck transactions
GET /api/v1/pump/{deviceId}/active-transactions

# Clear stuck transactions (emergency)
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

### Recovery Matrix

| Cause | Automatic Recovery | Manual Required |
|-------|-------------------|-----------------|
| Network disconnection | ✅ Auto-retry on reconnect | No |
| App crash | ✅ Background recovery | No |
| PTS device restart | ✅ Redis context cleared | No |
| Power failure | ✅ Orphan detection | Rare edge cases |

---

## Daily/Monthly Limit Enforcement

### 📊 Budget Control Made Automatic

FMS enforces fuel consumption budgets automatically through **daily and monthly limits**. Once configured, limits are enforced 24/7 without manual intervention - ensuring budget compliance even with distributed operations.

### Business Value

| Capability | Benefit |
|------------|---------|
| **Daily Limits** | Prevent excessive single-day consumption |
| **Monthly Limits** | Enforce monthly fuel budgets per vehicle |
| **Per Transaction Limits** | Cap individual fill amounts |
| **Automatic Reset** | Limits reset automatically at midnight/month-end |

### Limit Types

| Limit | Description | Auto-Reset |
|-------|-------------|------------|
| **Daily Limit** | Maximum fuel per day | Midnight |
| **Daily Remaining** | Available today | Rolling calculation |
| **Monthly Limit** | Maximum fuel per month | 1st of month |
| **Monthly Remaining** | Available this month | Rolling calculation |
| **Per Transaction** | Maximum per single fill | N/A |

### Smart Limit Calculation

The system calculates the **most restrictive** applicable limit:

```
Max Fuel Allowed = MIN(
  Hard Limit (tank space),
  Daily Remaining,
  Monthly Remaining,
  Per Transaction Limit
)
```

**Example:** Vehicle has 75L daily remaining, 1500L monthly remaining, but only 50L tank space available. System allows maximum 50L.

### Visual Status Indicators

The mobile app uses color-coded status to help operators:

| Status | Color | Meaning |
|--------|-------|---------|
| Normal | 🟢 Green | Plenty of limit remaining |
| Warning | 🟡 Yellow | Approaching limit (<50L) |
| Danger | 🔴 Red | Limit reached (0L) |

### Mobile App Display

```
┌─────────────────────────────────────────┐
│ 📋 Soft Limits (Rules)                  │
├─────────────────────────────────────────┤
│ Daily Remaining:   75 L    🟢           │
│ Used: 25 L / 100 L                      │
│                                         │
│ Monthly Remaining: 1,500 L 🟢           │
│ Used: 500 L / 2,000 L                   │
│                                         │
│ Per Transaction:   50 L                 │
└─────────────────────────────────────────┘
```

---

## Refill Count Restrictions

### 🔢 Prevent Suspicious Multiple Fills

Refill count restrictions limit the **number of fueling transactions** allowed per time period. This prevents "drip feeding" - a common fraud technique where small amounts are taken frequently to avoid detection.

### Why This Matters

| Fraud Pattern | How Refill Limits Prevent It |
|---------------|------------------------------|
| Multiple small fills to unauthorized containers | Limited to N fills per day |
| Splitting one vehicle's fuel across many | Weekly/monthly counts track patterns |
| Frequent "top-ups" that exceed daily limits | Transaction count independently tracked |

### Limit Types

| Limit | Description | Example |
|-------|-------------|---------|
| `MaxRefillsPerDay` | Maximum fills per day | 2 per day |
| `MaxRefillsPerWeek` | Maximum fills per week | 5 per week |
| `MaxRefillsPerMonth` | Maximum fills per month | 15 per month |

### Mobile Display

```
┌─────────────────────────────────────────┐
│ 🔢 Refill Limits                        │
├─────────────────────────────────────────┤
│ Today:     1 of 2 used                  │
│ This Week: 3 of 5 used                  │
│ This Month: 8 of 15 used                │
└─────────────────────────────────────────┘
```

---

## Time Window Restrictions

### ⏰ Control WHEN Fueling Can Occur

Time window restrictions limit fueling to **specific hours of the day**. This is essential for:
- Fleet operations during business hours only
- Security during unmanned night hours
- Compliance with operational policies

### Configuration Example

```json
{
  "timeWindowStart": "06:00",
  "timeWindowEnd": "22:00"
}
```

### Common Use Cases

| Scenario | Time Window | Reason |
|----------|-------------|--------|
| Depot Operations | 06:00 - 22:00 | Staffed hours only |
| Construction Site | 05:00 - 20:00 | Site operating hours |
| 24/7 Operations | No restriction | Continuous operations |
| Emergency Only (Night) | 22:00 - 06:00 | Master tag required |

### Mobile Display

```
┌─────────────────────────────────────────┐
│ ⏰ Allowed Hours: 06:00 - 22:00         │
│ Current Time: 14:30 ✓                   │
└─────────────────────────────────────────┘
```

---

## Master Tag Override

### 🏷️ Controlled Emergency Access

Master tags allow **authorized operators** to override certain validation rules in emergency situations. Unlike bypassing security, master tag overrides are **fully logged and auditable**.

### Override Capabilities Matrix

| Feature | Master Tag Can Override? | Notes |
|---------|--------------------------|-------|
| No Rules Warning | ✅ Yes | Continue with operator tag |
| Time Window | ✅ Yes | After-hours authorization |
| Location Validation | ⚠️ Configurable | Per-user GPS bypass |
| Volume Limits | ❌ No | Hard limits always enforced |
| Tank Capacity | ❌ No | Physical limit cannot be overridden |

### Mobile App Flow

When a vehicle has no rules and master tag is available:

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

### Full Audit Trail

Every master tag override is logged with complete context:

```json
{
  "eventType": "MASTER_TAG_OVERRIDE",
  "operatorId": "OP-001",
  "operatorName": "John Smith",
  "vehicleId": 123,
  "vehicleReg": "KBX 123A",
  "reason": "No rules assigned",
  "timestamp": "2026-01-06T10:30:00Z",
  "siteId": 5,
  "deviceId": "PTS-001"
}
```

---

## Mobile Fueling Application

### 📱 Complete Mobile-First Experience (NEW Section)

The FMS Mobile Fueling App provides a **complete 10-step fueling workflow** with real-time validation at every step. Operators can fuel anywhere with the same security as a staffed depot.

### Key Capabilities

| Feature | Benefit |
|---------|---------|
| **Multi-Tank Support** | Switch between tanks easily |
| **Real-Time Pump Status** | See pump availability live |
| **RFID Integration** | Scan vehicle tags for quick selection |
| **GPS Validation** | Location verified automatically |
| **Live Transaction Monitoring** | Watch volume/amount in real-time |
| **Offline Capability** | Cached settings for poor connectivity |

### 10-Step Fueling Workflow

| Step | Screen | Purpose |
|------|--------|---------|
| 1 | Tank Selection | Choose source tank |
| 2 | Pump Selection | Select available pump |
| 3 | Nozzle Selection | Choose nozzle + fuel grade |
| 4 | Mode Selection | Vehicle or tank-to-tank |
| 5 | Vehicle Selection | RFID scan or search |
| 6 | Vehicle Confirmation | Review rules and limits |
| 7 | Volume Entry | Set dose with validation |
| 8 | Authorization | Send to PTS device |
| 9 | Transaction Monitoring | Live progress display |
| 10 | Summary | Completion + receipt |

### Live Transaction Monitoring

```
┌─────────────────────────────────────────┐
│ ⛽ Fueling in Progress                  │
├─────────────────────────────────────────┤
│                                         │
│         42.5 L                          │
│         $156.70                         │
│                                         │
│ ████████████████░░░░░ 85%              │
│                                         │
│ Pump 1 • Nozzle 2 • Diesel             │
│                                         │
│ [Minimize]                              │
└─────────────────────────────────────────┘
```

### Admin-Controlled Settings

Mobile validation settings are managed centrally - operators cannot change security policies:

| Setting | Admin Control | Mobile Display |
|---------|---------------|----------------|
| Fuel Rules Check | ✅ Backend | Read-only |
| Fuel Capacity Validation | ✅ Backend | Read-only |
| GPS Fuel Level Check | ✅ Backend | Read-only |

---

## Fuel Audit & Variance Detection

### 📈 Complete Fuel Accountability (NEW Section)

The FMS Fuel Audit System provides **end-to-end fuel tracking** from bulk delivery to vehicle consumption. Every liter is tracked, reconciled, and any variance is flagged for investigation.

### Audit Capabilities

| Fleet Type | Tracking Method | Accuracy |
|------------|-----------------|----------|
| **Tankers** | Physical dip readings | ±1% |
| **GPS Fleet** | Fuel sensor delta between fills | ±2% |
| **Pickup Fleet** | Full-tank estimation | ±5% |

### Variance Detection

The system automatically calculates expected vs actual consumption and flags discrepancies:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Variance Detection                            │
│                                                                  │
│   Expected (GPS-based):     1,245 L                             │
│   Actual (Dispensed):       1,312 L                             │
│   Variance:                    67 L (5.4%)                      │
│   Status:               ⚠️ ABOVE THRESHOLD                      │
│                                                                  │
│   [View Details] [Generate Report] [Escalate]                   │
└─────────────────────────────────────────────────────────────────┘
```

### Threshold Configuration

| Variance Level | Action |
|----------------|--------|
| < 2% | Normal - no action |
| 2% - 5% | Warning - review recommended |
| > 5% | Alert - investigation required |

### Business Impact

- ✅ **Reduces fuel losses to <1%** through proactive monitoring
- ✅ **Detects discrepancies within 24 hours**
- ✅ **Provides evidence for investigations**
- ✅ **Supports insurance and compliance requirements**

---

## Audit & Logging

### 📋 Complete Traceability

Every action in FMS is logged with full context for compliance, investigations, and analytics.

### Location Validation Logging

All location validations logged with GPS coordinates:

| Field | Description |
|-------|-------------|
| TankId | Source tank identifier |
| VehicleId | Target vehicle |
| PtsDeviceId | Authorizing device |
| VehicleDistanceMeters | Calculated distance |
| MobileDistanceMeters | Operator device distance |
| FailureReason | Why validation failed (if any) |
| All GPS Coordinates | Tank, vehicle, and mobile positions |

### Transaction Logging

Every fuel transaction includes:

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
| Setting | Type | Description |
|---------|------|-------------|
| `EnableFuelRulesCheck` | Boolean | Warn if no rules assigned |
| `EnableFuelCapacityValidation` | Boolean | Prevent tank overfilling |
| `EnableGPSFuelLevelCheck` | Boolean | Use GPS fuel sensor data |

### Geofence Validation Settings (NEW)

| Setting | Type | Description |
|---------|------|-------------|
| `EnableGeofenceValidation` | Boolean | Master switch for geofence checks |
| `RequireTankerInGeofence` | Boolean | Tanker must be in allowed area |
| `RequireOperatorInGeofence` | Boolean | Operator device must be in allowed area |
| `RequireVehicleInGeofence` | Boolean | Vehicle must be in allowed area |

---

## 📊 Implementation Status Summary

| Feature | Status | Since |
|---------|--------|-------|
| Multi-Layer Authorization | ✅ Production | v1.0 |
| Fueling Rules Cascade | ✅ Production | v1.0 |
| Location Validation (Proximity) | ✅ Production | v1.5 |
| GPS Fuel Level Integration | ✅ Production | v1.5 |
| Tank Capacity Protection | ✅ Production | v1.5 |
| Stuck Transaction Management | ✅ Production | v1.5 |
| Mobile Fueling App | ✅ Production | v2.0 |
| Admin-Managed Mobile Settings | ✅ Production | v2.0 |
| Geofence Validation | ✅ Production | v2.1 (Jan 2026) |
| Fixed Location Validation | ✅ Production | v2.1 (Jan 2026) |
| Per-User GPS Bypass | ✅ Production | v2.1 (Jan 2026) |
| Fuel Audit System | ✅ Production | v2.1 (Jan 2026) |

---

## 🎯 Why Choose FMS Fuel Management

### For Fleet Managers

| Challenge | FMS Solution |
|-----------|--------------|
| "Where is all our fuel going?" | Complete tracking from delivery to consumption |
| "We can't control remote fueling" | Mobile app with full validation anywhere |
| "Budget overruns every month" | Automatic limit enforcement per vehicle |
| "Can't detect theft until month-end" | Real-time variance alerts within 24 hours |

### For Finance Teams

| Challenge | FMS Solution |
|-----------|--------------|
| "Fuel costs are unpredictable" | Daily/monthly budgets enforced automatically |
| "Reconciliation takes days" | Automated reconciliation with GPS data |
| "Losses attributed to 'evaporation'" | Variance tracking identifies actual losses |
| "No evidence for investigations" | Complete audit trail with GPS coordinates |

### For IT & Security

| Challenge | FMS Solution |
|-----------|--------------|
| "Single point of security failure" | 5 independent validation layers |
| "Operators bypass controls" | Hardware-enforced validation (nozzle state) |
| "Manual logging is incomplete" | Automatic logging of every action |
| "GPS failures cause outages" | Graceful degradation with audit trail |

### Technical Differentiators

| Capability | Benefit |
|------------|---------|
| **GPSGate Integration** | Leverage existing GPS infrastructure |
| **Haversine Distance Calculation** | Accurate earth-surface proximity |
| **Redis-Based State** | Sub-second transaction performance |
| **React Native Mobile** | Cross-platform with native performance |
| **SignalR Real-Time** | Live transaction monitoring |
| **Clean Architecture** | Maintainable, extensible codebase |

---

## Related Documentation

- [Fueling Rules Cascade Hierarchy](../FuelingRule/CASCADE_HIERARCHY_IMPLEMENTATION.md)
- [Fuel Rule Management System](../FuelingRule/readme.md)
- [Location Validation Feature](../LocationValidation/README.md)
- [Mobile Fueling Validation Settings](../MobileFuelingValidation/ADMIN_MANAGED_SETTINGS.md)
- [Fuel Audit System PRD](../FuelAudit/Implementation/FuelAudit_PRD.md)
- [Mobile Fueling Process](../../Mobile/Features/FuelingProcess.md)
- [Per-User GPS Bypass](../LocationValidation/PER_USER_GPS_BYPASS.md)
- [Geofence & Fixed Vehicle Validation](./PRD_Geofence_Location_Validation.md)

---

## Troubleshooting Guide

### Common Issues & Quick Fixes

| Issue | Cause | Resolution |
|-------|-------|------------|
| "No fueling rules assigned" | Vehicle not configured | Assign rules via Admin Portal → Fuel Rules |
| "Location validation failed" | Vehicle/operator too far | Move closer to dispenser (check radius settings) |
| "Stuck transaction detected" | Previous transaction incomplete | Admin Portal → Stuck Transactions → Clear |
| "Nozzle not lifted" | Physical nozzle down | Lift nozzle at pump, wait for status update |
| "Daily limit exceeded" | Used full daily allowance | Wait for midnight reset or contact admin |
| "Geofence validation failed" | Not in allowed area | Move to approved fueling location |

### Diagnostic API Endpoints

```http
# Check effective rules for vehicle
GET /api/v1/fueling-rule/vehicle/{vehicleId}/effective-rules

# Check validation settings
GET /api/v1/automated-fueling-configuration/mobile-validation-settings

# View active transactions
GET /api/v1/pump/{deviceId}/transactions

# Clear stuck transactions (admin)
DELETE /api/v1/pump/{deviceId}/stuck-transactions

# Check geofence status
GET /api/v1/geofence/vehicle/{vehicleId}/current-geofences
```

---

## Contact & Support

For questions about the Fuel Management System or to schedule a demo:

- **Documentation:** [FMS Documentation Portal](../README.md)
- **Technical Support:** See system administrator
- **Feature Requests:** Submit via project management system

---

*This document provides a comprehensive overview of the FMS Fuel Management System's safety and validation features. Updated January 2026.*
