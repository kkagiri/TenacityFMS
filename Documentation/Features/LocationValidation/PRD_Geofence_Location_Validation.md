# Product Requirements Document (PRD)

## Geofence & Fixed Vehicle Location Validation for Fueling Operations

**Version:** 1.1
**Created:** January 6, 2026
**Updated:** January 7, 2026
**Status:** Draft - Pending Review
**Author:** Development Team
**Reviewers:** [To be assigned]

---

## Revision History

| Version | Date       | Author   | Changes                                                                                                                                    |
| ------- | ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1.0     | 2026-01-06 | Dev Team | Initial draft                                                                                                                              |
| 1.1     | 2026-01-07 | Dev Team | Updated to leverage existing GPSGate integration; Added Geofence Groups concept; Clarified that geofences are managed in GPSGate (not FMS) |

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Proposed Features](#proposed-features)
4. [Feature 1: Fixed Vehicle Proximity Validation](#feature-1-fixed-vehicle-proximity-validation)
5. [Feature 2: Geofence-Based Fueling Validation](#feature-2-geofence-based-fueling-validation)
6. [GPSGate Geofence Groups](#gpsgate-geofence-groups)
7. [Technical Architecture](#technical-architecture)
8. [User Stories](#user-stories)
9. [API Specifications](#api-specifications)
10. [Database Schema](#database-schema)
11. [UI/UX Requirements](#uiux-requirements)
12. [Integration Requirements](#integration-requirements)
13. [Security Considerations](#security-considerations)
14. [Testing Strategy](#testing-strategy)
15. [Rollout Plan](#rollout-plan)
16. [Success Metrics](#success-metrics)
17. [Open Questions](#open-questions)

---

## Executive Summary

### Purpose

Enhance the FMS fuel management system with two new location-based validation features:

1. **Fixed Vehicle Proximity Validation** - Ensure fixed/stationary vehicles (e.g., generators, construction equipment) are at the expected location matching the tanker/PTS device location before fueling
2. **Geofence-Based Fueling Validation** - Allow fueling rules to specify valid geofence areas where fueling can occur, integrating with GPS provider geofence data

### Business Value

| Benefit                                | Impact                            |
| -------------------------------------- | --------------------------------- |
| Prevent unauthorized fueling locations | 🔴 High - Reduces fuel theft      |
| Ensure compliance with site policies   | 🔴 High - Regulatory compliance   |
| Track fueling location patterns        | 🟡 Medium - Analytics improvement |
| Reduce fraudulent claims               | 🔴 High - Cost savings            |

### Scope

| In Scope                               | Out of Scope                         |
| -------------------------------------- | ------------------------------------ |
| Fixed vehicle location validation      | ❌ Creating/editing geofences in FMS |
| Sync geofences & groups from GPSGate   | ❌ Real-time geofence monitoring     |
| Geofence group-based fueling rules     | ❌ Geofence-based route planning     |
| Mobile app proximity display           | ❌ Third-party GPS provider support  |
| Audit logging for location checks      | ❌ Geofence management in FMS        |
| Fueling rule geofence/group assignment | ❌ Custom geofence creation          |

> **Important Design Decision:** Geofences are created and managed exclusively in GPSGate software. FMS syncs geofence data (including geofence groups) from GPSGate and uses them for validation. This approach leverages GPSGate's mature geofence drawing tools and eliminates duplicate management.

---

## Problem Statement

### Current Limitations

1. **Fixed Vehicle Challenge**: Some vehicles (generators, excavators, fixed pumps) are stationary at known locations but the current system doesn't validate that the tanker is at the same location as the fixed asset.

2. **Unrestricted Fueling Locations**: Currently, fueling can occur anywhere as long as operator and vehicle are present. There's no way to restrict fueling to designated areas (depots, authorized sites, work zones).

3. **Compliance Gaps**: Organizations with site-specific fueling policies cannot enforce geographic restrictions through the system.

### User Pain Points

```
┌─────────────────────────────────────────────────────────────────┐
│ "We have generators at 10 different sites. How do we ensure    │
│  the tanker is actually AT the generator location and not      │
│  diverting fuel somewhere else?"                                │
│                                              - Fleet Manager    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ "Our fuel policy states that company vehicles can only be      │
│  fueled at designated depots. We need to enforce this."        │
│                                              - Operations Head  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Proposed Features

### Feature Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ENHANCED LOCATION VALIDATION                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Feature 1: Fixed Vehicle Proximity                                     │
│  ┌──────────────┐                    ┌──────────────┐                   │
│  │   Tanker     │  ◄── Must Match ──►│ Fixed Asset  │                   │
│  │  (GPS Live)  │      Proximity     │  (Known Loc) │                   │
│  └──────────────┘                    └──────────────┘                   │
│                                                                          │
│  Feature 2: Geofence Validation                                         │
│  ┌──────────────────────────────────────────────────────┐               │
│  │  ┌─────────────────────────────────────────────────┐ │               │
│  │  │         VALID GEOFENCE AREA                     │ │               │
│  │  │    ┌────────┐                                   │ │               │
│  │  │    │ Tanker │  ✅ Fueling Allowed               │ │               │
│  │  │    └────────┘                                   │ │               │
│  │  └─────────────────────────────────────────────────┘ │               │
│  │                                                      │               │
│  │  ┌────────┐  ❌ Fueling Blocked (Outside Geofence)  │               │
│  │  │ Tanker │                                          │               │
│  │  └────────┘                                          │               │
│  └──────────────────────────────────────────────────────┘               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Feature 1: Fixed Vehicle Proximity Validation

### Overview

Validate that the mobile tanker/PTS device is within acceptable proximity of a fixed vehicle's registered location before allowing fueling.

### Use Cases

| Use Case               | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| Generator Fueling      | Tanker must be at generator's registered site location |
| Construction Equipment | Excavators, cranes at fixed work sites                 |
| Stationary Pumps       | Fixed fuel pumps at remote locations                   |
| Agricultural Equipment | Tractors at farm locations                             |

### Functional Requirements

#### FR-100: Fixed Vehicle Configuration

| ID       | Requirement                                                              | Priority |
| -------- | ------------------------------------------------------------------------ | -------- |
| FR-100.1 | System shall allow marking vehicles as "Fixed Location" type             | High     |
| FR-100.2 | System shall store GPS coordinates (lat/lng) for fixed vehicles          | High     |
| FR-100.3 | System shall allow configurable proximity radius per vehicle             | Medium   |
| FR-100.4 | System shall support importing fixed vehicle locations from GPS provider | Low      |

#### FR-101: Proximity Validation at Fueling

| ID       | Requirement                                                                                 | Priority |
| -------- | ------------------------------------------------------------------------------------------- | -------- |
| FR-101.1 | System shall compare tanker's current GPS location with fixed vehicle's registered location | High     |
| FR-101.2 | System shall block fueling if tanker is outside configured proximity radius                 | High     |
| FR-101.3 | System shall display distance between tanker and fixed vehicle location in mobile app       | High     |
| FR-101.4 | System shall log all proximity validation results                                           | High     |
| FR-101.5 | System shall allow bypass option for administrators with audit trail                        | Medium   |

#### FR-102: Fixed Vehicle Location Updates

| ID       | Requirement                                                         | Priority |
| -------- | ------------------------------------------------------------------- | -------- |
| FR-102.1 | System shall allow updating fixed vehicle location via admin portal | High     |
| FR-102.2 | System shall support bulk location import via CSV                   | Medium   |
| FR-102.3 | System shall track location change history                          | Medium   |

### Data Model

```sql
-- New columns for vehicles table
ALTER TABLE vehicles ADD COLUMN (
    IsFixedLocation TINYINT(1) DEFAULT 0,
    FixedLatitude DECIMAL(10, 8) NULL,
    FixedLongitude DECIMAL(11, 8) NULL,
    FixedLocationRadius INT DEFAULT 100,  -- meters
    FixedLocationName VARCHAR(200) NULL,
    FixedLocationUpdatedAt DATETIME NULL,
    FixedLocationUpdatedBy INT NULL
);

-- Location update history
CREATE TABLE vehicle_fixed_location_history (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    VehicleId INT NOT NULL,
    PreviousLatitude DECIMAL(10, 8),
    PreviousLongitude DECIMAL(11, 8),
    NewLatitude DECIMAL(10, 8),
    NewLongitude DECIMAL(11, 8),
    Reason VARCHAR(500),
    ChangedBy INT,
    ChangedAt DATETIME,
    FOREIGN KEY (VehicleId) REFERENCES vehicles(VehicleId)
);
```

### Validation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                 FIXED VEHICLE PROXIMITY CHECK                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Is target vehicle marked as "Fixed Location"?               │
│     │                                                            │
│     ├─ NO ──► Skip fixed location check, continue normal flow   │
│     │                                                            │
│     └─ YES ─► Continue to step 2                                │
│                                                                  │
│  2. Get tanker's current GPS location                           │
│     │                                                            │
│     ├─ FAILED ──► Apply BypassOnGPSFailure setting              │
│     │                                                            │
│     └─ SUCCESS ─► Continue to step 3                            │
│                                                                  │
│  3. Calculate distance: Tanker ←→ Fixed Vehicle Location        │
│     │                                                            │
│     │  Distance = Haversine(                                    │
│     │    TankerLat, TankerLng,                                  │
│     │    FixedVehicleLat, FixedVehicleLng                       │
│     │  )                                                         │
│     │                                                            │
│  4. Is Distance ≤ FixedLocationRadius + GracePeriod?            │
│     │                                                            │
│     ├─ YES ──► ✅ PASS - Proceed with fueling                   │
│     │                                                            │
│     └─ NO ───► ❌ FAIL - Block fueling, show distance           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile App UI

```
┌─────────────────────────────────────────────────────────────────┐
│ 📍 Fixed Location Validation                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Generator: GEN-001                                             │
│  Registered Location: Site Alpha                                 │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  📍 Generator Location                                    │   │
│  │     Lat: -1.2864   Lng: 36.8172                          │   │
│  │                                                           │   │
│  │  🚛 Tanker Location                                       │   │
│  │     Lat: -1.2865   Lng: 36.8174                          │   │
│  │                                                           │   │
│  │  📏 Distance: 25 meters                                   │   │
│  │  ✅ Within allowed radius (100m)                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [Continue to Fueling]                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Feature 2: Geofence-Based Fueling Validation

### Overview

Allow fueling rules to specify valid geofence areas or geofence groups where fueling is permitted. The system integrates with GPSGate to retrieve geofence definitions and groups, then validates that the tanker/operator is within an authorized geofence before allowing fueling.

> **Key Insight:** Geofences are created and organized into groups within GPSGate software. FMS syncs these geofences and groups, allowing admins to assign either individual geofences OR entire geofence groups to fueling rules.

### GPSGate Geofence Group Concept

In GPSGate, administrators can organize geofences into logical groups:

```
┌─────────────────────────────────────────────────────────────────┐
│                    GPSGATE GEOFENCE GROUPS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📁 Group: "Authorized Fueling Zones"                           │
│  ├── 🗺️ Nairobi Depot                                           │
│  ├── 🗺️ Mombasa Depot                                           │
│  ├── 🗺️ Kisumu Depot                                            │
│  └── 🗺️ Nakuru Depot                                            │
│                                                                  │
│  📁 Group: "Customer Sites"                                     │
│  ├── 🗺️ ABC Corp - Main Gate                                    │
│  ├── 🗺️ ABC Corp - Warehouse                                    │
│  └── 🗺️ XYZ Ltd - Factory                                       │
│                                                                  │
│  📁 Group: "Project Sites"                                      │
│  ├── 🗺️ Highway Project - Site A                                │
│  └── 🗺️ Highway Project - Site B                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Existing Infrastructure (Already Implemented)

FMS already has the following GPSGate geofence integration:

**Models (in `FMS.Infrastructure/VehicleTracking/Models/GPSGate/`):**

- `GPSGateGeofence.cs` - Individual geofence with shape data
- `GPSGateGeofenceGroup.cs` - Group containing multiple geofence IDs
- `GPSGateCircleShape.cs`, `GPSGatePolygonShape.cs`, `GPSGateRouteShape.cs` - Shape types

**Service (in `FMS.Infrastructure/ExternalServices/GPS/GPSGate/Services/`):**

- `IGPSGateGeofenceService` - Interface for geofence operations
- `GPSGateGeofenceService` - Implementation with:
  - `GetGeofencesAsync()` - Retrieve all geofences
  - `GetGeofenceByIdAsync()` - Get specific geofence
  - `IsPointInGeofenceAsync()` - Check if point is in geofence (uses ray-casting algorithm)
  - `IsVehicleInGeofenceAsync()` - Check if vehicle is in geofence
  - `GetVehicleGeofencesAsync()` - Get all geofences containing a vehicle

### Use Cases

| Use Case              | Description                                                 |
| --------------------- | ----------------------------------------------------------- |
| Depot-Only Fueling    | Company vehicles can only be fueled at designated depots    |
| Work Site Restriction | Project vehicles can only fuel within project geofence      |
| Security Zones        | Fuel only in secured, monitored areas                       |
| Customer Sites        | Fuel customer vehicles only at customer premises            |
| Group-Based Rules     | Assign entire geofence group to a rule (e.g., "All Depots") |

### Functional Requirements

#### FR-200: Geofence Sync from GPSGate

| ID       | Requirement                                                                       | Priority |
| -------- | --------------------------------------------------------------------------------- | -------- |
| FR-200.1 | System shall sync all geofences from GPSGate API                                  | High     |
| FR-200.2 | System shall sync all geofence groups from GPSGate API                            | High     |
| FR-200.3 | System shall cache geofence/group data locally with configurable refresh interval | High     |
| FR-200.4 | System shall support polygon, circular, and route geofences                       | High     |
| FR-200.5 | System shall handle sync failures gracefully (use cached data)                    | Medium   |
| FR-200.6 | System shall NOT allow creating/editing geofences in FMS                          | High     |

#### FR-201: Geofence/Group Assignment to Fueling Rules

| ID       | Requirement                                                                          | Priority |
| -------- | ------------------------------------------------------------------------------------ | -------- |
| FR-201.1 | System shall allow assigning individual geofences to a fueling rule set              | High     |
| FR-201.2 | System shall allow assigning geofence groups to a fueling rule set                   | High     |
| FR-201.3 | System shall support "ANY of selected geofences/groups" logic                        | High     |
| FR-201.4 | System shall allow "No geofence restriction" option                                  | High     |
| FR-201.5 | System shall auto-expand group assignments to include new geofences added in GPSGate | Medium   |
| FR-201.6 | System shall display assigned geofences/groups in rule set UI                        | Medium   |

#### FR-202: Geofence Validation at Fueling

| ID       | Requirement                                                                | Priority |
| -------- | -------------------------------------------------------------------------- | -------- |
| FR-202.1 | System shall check if tanker/operator is within any assigned geofence      | High     |
| FR-202.2 | System shall check all geofences in assigned groups                        | High     |
| FR-202.3 | System shall block fueling if outside all assigned geofences/groups        | High     |
| FR-202.4 | System shall display current location and valid geofences in mobile app    | Medium   |
| FR-202.5 | System shall log all geofence validation results                           | High     |
| FR-202.6 | System shall show distance to nearest valid geofence boundary when blocked | Low      |

#### FR-203: Geofence Display (Read-Only)

| ID       | Requirement                                                       | Priority |
| -------- | ----------------------------------------------------------------- | -------- |
| FR-203.1 | System shall display synced geofences from GPSGate (read-only)    | High     |
| FR-203.2 | System shall display synced geofence groups from GPSGate          | High     |
| FR-203.3 | System shall allow searching/filtering geofences by name or group | Medium   |
| FR-203.4 | System shall show geofence on map preview                         | Low      |
| FR-203.5 | System shall track and display last sync time                     | Medium   |

### GPSGate API Endpoints (Existing)

Based on the existing `GPSGateGeofenceService` implementation:

```http
# Get all geofences for application
GET /applications/{applicationId}/geofences

# Get specific geofence by ID
GET /applications/{applicationId}/geofences/{geofenceId}

# Get all geofence groups (NEW - needs implementation)
GET /applications/{applicationId}/geofenceGroups

# Get specific geofence group
GET /applications/{applicationId}/geofenceGroups/{groupId}
```

### GPSGate Data Models (Already Exist)

```csharp
// GPSGateGeofence.cs (exists)
public class GPSGateGeofence
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public GPSGateShapeType ShapeType { get; set; }
    public GPSGateCircleShape? CircleShape { get; set; }
    public GPSGatePolygonShape? PolygonShape { get; set; }
    public GPSGateRouteShape? RouteShape { get; set; }
}

// GPSGateGeofenceGroup.cs (exists)
public class GPSGateGeofenceGroup
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Colour { get; set; }
    public List<int>? GeofenceIds { get; set; }  // List of geofences in this group
    public bool Pinned { get; set; }
    public bool UseInGeocoding { get; set; }
}

// GeofenceDTO.cs (exists in Application layer)
public class GeofenceDTO
{
    public int Id { get; set; }
    public string Name { get; set; }
    public GeofenceType Type { get; set; }  // Circle, Polygon, Route
    public List<GeofenceCoordinate> Coordinates { get; set; }
    public decimal? Radius { get; set; }  // For circle type
}
```

### Data Model

```sql
-- Cached geofences from GPSGate (synced, not created in FMS)
CREATE TABLE gps_geofences (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    ExternalGeofenceId INT NOT NULL,        -- GPSGate geofence ID
    Name VARCHAR(200) NOT NULL,
    Description VARCHAR(500),
    GeofenceType ENUM('Polygon', 'Circle', 'Route') NOT NULL,
    GeometryJson TEXT,                       -- GeoJSON format for coordinates
    CenterLatitude DECIMAL(10, 8) NULL,      -- For circular geofences
    CenterLongitude DECIMAL(11, 8) NULL,
    RadiusMeters INT NULL,                   -- For circular geofences
    IsActive TINYINT(1) DEFAULT 1,
    LastSyncedAt DATETIME,
    CreatedAt DATETIME,
    UpdatedAt DATETIME,
    UNIQUE KEY (ExternalGeofenceId)
);

-- Cached geofence groups from GPSGate (synced, not created in FMS)
CREATE TABLE gps_geofence_groups (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    ExternalGroupId INT NOT NULL,            -- GPSGate group ID
    Name VARCHAR(200) NOT NULL,
    Description VARCHAR(500),
    Colour VARCHAR(20),                      -- Display color from GPSGate
    IsPinned TINYINT(1) DEFAULT 0,
    LastSyncedAt DATETIME,
    CreatedAt DATETIME,
    UpdatedAt DATETIME,
    UNIQUE KEY (ExternalGroupId)
);

-- Many-to-many: Geofences in groups
CREATE TABLE gps_geofence_group_members (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    GroupId INT NOT NULL,
    GeofenceId INT NOT NULL,
    FOREIGN KEY (GroupId) REFERENCES gps_geofence_groups(Id) ON DELETE CASCADE,
    FOREIGN KEY (GeofenceId) REFERENCES gps_geofences(Id) ON DELETE CASCADE,
    UNIQUE KEY (GroupId, GeofenceId)
);

-- Individual geofence assignments to fueling rule sets
CREATE TABLE fuelingruleset_geofences (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    FuelingRuleSetId INT NOT NULL,
    GeofenceId INT NOT NULL,
    CreatedAt DATETIME,
    CreatedBy INT,
    FOREIGN KEY (FuelingRuleSetId) REFERENCES fuelingrulesets(Id),
    FOREIGN KEY (GeofenceId) REFERENCES gps_geofences(Id),
    UNIQUE KEY (FuelingRuleSetId, GeofenceId)
);

-- Geofence GROUP assignments to fueling rule sets
CREATE TABLE fuelingruleset_geofence_groups (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    FuelingRuleSetId INT NOT NULL,
    GeofenceGroupId INT NOT NULL,
    CreatedAt DATETIME,
    CreatedBy INT,
    FOREIGN KEY (FuelingRuleSetId) REFERENCES fuelingrulesets(Id),
    FOREIGN KEY (GeofenceGroupId) REFERENCES gps_geofence_groups(Id),
    UNIQUE KEY (FuelingRuleSetId, GeofenceGroupId)
);

-- Geofence validation logs
CREATE TABLE geofence_validation_logs (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    TransactionId VARCHAR(100),
    VehicleId INT,
    TankerId INT,
    OperatorId INT,
    CheckedLatitude DECIMAL(10, 8),
    CheckedLongitude DECIMAL(11, 8),
    GeofenceCheckType ENUM('Tanker', 'Operator', 'Vehicle'),
    MatchedGeofenceId INT NULL,
    MatchedGeofenceName VARCHAR(200) NULL,
    MatchedGroupId INT NULL,
    MatchedGroupName VARCHAR(200) NULL,
    IsValid TINYINT(1),
    FailureReason VARCHAR(500),
    CheckedGeofenceIds TEXT,                 -- JSON array of checked geofence IDs
    CreatedAt DATETIME,
    INDEX idx_vehicle (VehicleId),
    INDEX idx_transaction (TransactionId)
);
```

````

### Geofence Point-in-Polygon Algorithm

> **Note:** These algorithms are already implemented in `GPSGateGeofenceService.cs`

```csharp
/// <summary>
/// Check if a point is inside a polygon using ray casting algorithm
/// (Already implemented in GPSGateGeofenceService)
/// </summary>
private bool IsPointInPolygon(double lat, double lng, List<GeofenceCoordinate> polygon)
{
    if (polygon == null || polygon.Count < 3) return false;

    bool inside = false;
    int j = polygon.Count - 1;

    for (int i = 0; i < polygon.Count; j = i++)
    {
        var xi = (double)polygon[i].Longitude;
        var yi = (double)polygon[i].Latitude;
        var xj = (double)polygon[j].Longitude;
        var yj = (double)polygon[j].Latitude;

        var intersect = ((yi > lat) != (yj > lat)) &&
            (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);

        if (intersect) inside = !inside;
    }

    return inside;
}

/// <summary>
/// Check if a point is inside a circular geofence using Haversine formula
/// (Already implemented in GPSGateGeofenceService)
/// </summary>
private bool IsPointInCircle(double lat, double lng, GeofenceCoordinate? center, double radiusMeters)
{
    if (center == null) return false;

    const double earthRadius = 6371000; // meters
    var dLat = ToRadians((double)center.Latitude - lat);
    var dLng = ToRadians((double)center.Longitude - lng);

    var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
            Math.Cos(ToRadians(lat)) * Math.Cos(ToRadians((double)center.Latitude)) *
            Math.Sin(dLng / 2) * Math.Sin(dLng / 2);

    var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    var distance = earthRadius * c;

    return distance <= radiusMeters;
}
````

### Validation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              GEOFENCE VALIDATION FLOW (v1.1)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Get effective fueling rules for vehicle                     │
│     │                                                            │
│     └─► Cascade: Site → VehicleType → Tag → Vehicle             │
│                                                                  │
│  2. Check if any rule set has geofence restrictions             │
│     │                                                            │
│     ├─ NO ──► Skip geofence check, continue normal flow         │
│     │                                                            │
│     └─ YES ─► Collect all valid geofences:                      │
│               │                                                  │
│               ├─► Individual geofences assigned to rule         │
│               │                                                  │
│               └─► All geofences from assigned GROUPS            │
│                   (Groups expand to their member geofences)     │
│                                                                  │
│  3. Get current location to validate                            │
│     │                                                            │
│     ├─ RequireTankerInGeofence ──► Get tanker GPS               │
│     ├─ RequireOperatorInGeofence ──► Get mobile location        │
│     └─ RequireVehicleInGeofence ──► Get vehicle GPS             │
│                                                                  │
│  4. For each valid geofence, check if location is inside        │
│     │                                                            │
│     │  Use existing GPSGateGeofenceService methods:             │
│     │  ├─ IsPointInGeofenceAsync(lat, lng, geofenceId)          │
│     │  └─ (Handles Polygon, Circle, Route internally)           │
│     │                                                            │
│  5. If ANY geofence matches                                     │
│     │                                                            │
│     ├─ YES ──► ✅ PASS - Log matched geofence/group, proceed    │
│     │                                                            │
│     └─ NO ───► ❌ FAIL - Block fueling, show valid geofences    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile App UI

```
┌─────────────────────────────────────────────────────────────────┐
│ 🗺️ Geofence Validation                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Vehicle: V-001 (Standard Fleet Rules)                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                           │   │
│  │  Valid Fueling Zones:                                     │   │
│  │                                                           │   │
│  │  ✅ Nairobi Depot          (You are here)                 │   │
│  │  ⚪ Mombasa Depot          (450 km away)                  │   │
│  │  ⚪ Kisumu Depot           (320 km away)                  │   │
│  │                                                           │   │
│  │  ─────────────────────────────────────────────────────   │   │
│  │                                                           │   │
│  │  📍 Current Location: Inside "Nairobi Depot"             │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ✅ Location valid - Fueling allowed                            │
│                                                                  │
│  [Continue to Fueling]                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**When Outside All Geofences:**

```
┌─────────────────────────────────────────────────────────────────┐
│ 🗺️ Geofence Validation                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ❌ FUELING NOT ALLOWED AT THIS LOCATION                        │
│                                                                  │
│  Vehicle: V-001 (Standard Fleet Rules)                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                           │   │
│  │  Valid Fueling Zones:                                     │   │
│  │                                                           │   │
│  │  ⚪ Nairobi Depot          (2.5 km away)                  │   │
│  │  ⚪ Mombasa Depot          (450 km away)                  │   │
│  │  ⚪ Kisumu Depot           (320 km away)                  │   │
│  │                                                           │   │
│  │  ─────────────────────────────────────────────────────   │   │
│  │                                                           │   │
│  │  ⚠️ You are outside all authorized fueling zones         │   │
│  │                                                           │   │
│  │  Nearest zone: Nairobi Depot (2.5 km)                    │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [Go Back]                                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## GPSGate Geofence Groups

### Overview

Geofence Groups are a powerful organizational feature in GPSGate that allows administrators to logically group related geofences together. FMS leverages these groups to simplify fueling rule configuration.

### Benefits of Using Groups

| Benefit                       | Description                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------ |
| **Simplified Administration** | Assign one group instead of many individual geofences                          |
| **Dynamic Membership**        | Adding a geofence to a group in GPSGate automatically includes it in FMS rules |
| **Logical Organization**      | Group by region, purpose, customer, or any criteria                            |
| **Color Coding**              | Groups have colors for easy visual identification                              |

### Group Management Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    GEOFENCE GROUP WORKFLOW                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   GPSGATE (Source of Truth)                    FMS (Consumer)           │
│   ═══════════════════════                      ═══════════════          │
│                                                                          │
│   1. Admin creates geofences                                            │
│      in GPSGate map editor                                              │
│      ┌──────────────────┐                                               │
│      │ 🗺️ Draw polygon  │                                               │
│      │ 🗺️ Draw circle   │                                               │
│      └──────────────────┘                                               │
│               │                                                          │
│               ▼                                                          │
│   2. Admin organizes geofences                                          │
│      into groups in GPSGate                                             │
│      ┌──────────────────┐                                               │
│      │ 📁 Fueling Zones │                                               │
│      │   ├─🗺️ Depot A   │                                               │
│      │   ├─🗺️ Depot B   │                                               │
│      │   └─🗺️ Depot C   │                                               │
│      └──────────────────┘                                               │
│               │                                                          │
│               │  ←───── Sync (every 15 min) ─────→                      │
│               │                                     │                    │
│               ▼                                     ▼                    │
│                                         3. FMS displays synced         │
│                                            geofences & groups           │
│                                            ┌──────────────────┐         │
│                                            │ 📋 Geofence List │         │
│                                            │   (Read Only)    │         │
│                                            └──────────────────┘         │
│                                                     │                    │
│                                                     ▼                    │
│                                         4. Admin assigns groups         │
│                                            to fueling rules             │
│                                            ┌──────────────────┐         │
│                                            │ ✅ Fueling Zones │         │
│                                            │ ☐ Customer Sites │         │
│                                            └──────────────────┘         │
│                                                     │                    │
│                                                     ▼                    │
│                                         5. System validates             │
│                                            fueling location             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### API Extension for Groups

```http
# Sync geofence groups from GPSGate (NEW)
GET /applications/{applicationId}/geofenceGroups

# Response from GPSGate
[
  {
    "id": 1,
    "name": "Authorized Fueling Zones",
    "description": "All company fuel depots",
    "colour": "#4CAF50",
    "geofenceIds": [101, 102, 103, 104],
    "pinned": true,
    "useInGeocoding": true
  },
  {
    "id": 2,
    "name": "Customer Sites",
    "description": "Customer premises",
    "colour": "#2196F3",
    "geofenceIds": [201, 202],
    "pinned": false,
    "useInGeocoding": false
  }
]
```

### Service Extension Required

```csharp
// Add to IGPSGateGeofenceService interface
public interface IGPSGateGeofenceService
{
    // Existing methods...
    Task<FMSResponse<List<GeofenceDTO>>> GetGeofencesAsync();
    Task<FMSResponse<GeofenceDTO>> GetGeofenceByIdAsync(int geofenceId);
    Task<FMSResponse<bool>> IsPointInGeofenceAsync(decimal lat, decimal lng, int geofenceId);
    Task<FMSResponse<bool>> IsVehicleInGeofenceAsync(int vehicleId, int geofenceId);
    Task<FMSResponse<List<GeofenceDTO>>> GetVehicleGeofencesAsync(int vehicleId);

    // NEW: Group support
    Task<FMSResponse<List<GeofenceGroupDTO>>> GetGeofenceGroupsAsync();
    Task<FMSResponse<GeofenceGroupDTO>> GetGeofenceGroupByIdAsync(int groupId);
    Task<FMSResponse<List<GeofenceDTO>>> GetGeofencesInGroupAsync(int groupId);
    Task<FMSResponse<bool>> IsPointInAnyGroupGeofenceAsync(decimal lat, decimal lng, int groupId);
}

// New DTO
public class GeofenceGroupDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Colour { get; set; } = "#808080";
    public List<int> GeofenceIds { get; set; } = new();
    public int GeofenceCount => GeofenceIds.Count;
    public bool IsPinned { get; set; }
    public DateTime LastSyncedAt { get; set; }
}
```

---

## Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FMS BACKEND                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │               Location Validation Service (NEW)                     │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │ │
│  │  │ Fixed Vehicle   │  │   Geofence      │  │   Proximity         │ │ │
│  │  │ Validator       │  │   Validator     │  │   Calculator        │ │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │           GPSGateGeofenceService (EXISTING - Extend)                │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │ │
│  │  │ GetGeofences    │  │ IsPointIn       │  │ GetGeofenceGroups   │ │ │
│  │  │ Async() ✅      │  │ GeofenceAsync()✅│  │ Async() 🆕          │ │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘ │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │ │
│  │  │ IsVehicleIn     │  │ GetVehicle      │  │ IsPointInAnyGroup   │ │ │
│  │  │ GeofenceAsync()✅│  │ GeofencesAsync()│  │ GeofenceAsync() 🆕 │ │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    │  ✅ = Already implemented           │
│                                    │  🆕 = New (to be added)             │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │              Geofence Sync Background Service (NEW)                 │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │ │
│  │  │ Sync Geofences  │  │ Sync Groups     │  │ Cache Manager       │ │ │
│  │  │ from GPSGate    │  │ from GPSGate    │  │ (Database)          │ │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         Database                                    │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │ │
│  │  │ gps_geofences   │  │ gps_geofence_   │  │ fuelingruleset_     │ │ │
│  │  │                 │  │ groups          │  │ geofence_groups     │ │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │
┌───────────────────────────────────┴─────────────────────────────────────┐
│                          EXTERNAL SYSTEMS                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │    GPSGate      │  │   Mobile App    │  │   Admin Portal          │  │
│  │ (Geofences &    │  │  (Location)     │  │ (Rule Configuration)    │  │
│  │  Groups - R/O)  │  │                 │  │                         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Existing GPSGate Models

```
FMS.Infrastructure/VehicleTracking/Models/GPSGate/
├── GPSGateGeofence.cs        ✅ Exists
├── GPSGateGeofenceGroup.cs   ✅ Exists (with GeofenceIds list)
├── GPSGateCircleShape.cs     ✅ Exists
├── GPSGatePolygonShape.cs    ✅ Exists
├── GPSGateRouteShape.cs      ✅ Exists
└── GPSGateShapeType.cs       ✅ Exists (Circle, Polygon, Route)

FMS.Infrastructure/ExternalServices/GPS/GPSGate/Services/
├── IGPSGateGeofenceService.cs  ✅ Exists
└── GPSGateGeofenceService.cs   ✅ Exists (with IsPointInPolygon, IsPointInCircle)

FMS.Application/Features/Vehicle/DTOs/
└── GeofenceDTO.cs              ✅ Exists
```

### Geofence Sync Background Service

```csharp
public class GeofenceSyncBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<GeofenceSyncBackgroundService> _logger;
    private readonly TimeSpan _syncInterval = TimeSpan.FromMinutes(15);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var syncService = scope.ServiceProvider
                    .GetRequiredService<IGeofenceSyncService>();

                await syncService.SyncGeofencesFromGpsProviderAsync(stoppingToken);

                _logger.LogInformation("Geofence sync completed at {Time}",
                    DateTime.UtcNow);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Geofence sync failed");
            }

            await Task.Delay(_syncInterval, stoppingToken);
        }
    }
}
```

---

## User Stories

### Epic: Fixed Vehicle Location Validation

| ID     | User Story                                                                                                                 | Priority | Acceptance Criteria                             |
| ------ | -------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------- |
| US-F01 | As an admin, I want to mark a vehicle as "Fixed Location" so that the system knows it doesn't move                         | High     | Vehicle edit form has "Fixed Location" checkbox |
| US-F02 | As an admin, I want to set GPS coordinates for a fixed vehicle so that the system knows where it is                        | High     | Can enter lat/lng or pick on map                |
| US-F03 | As an admin, I want to set a custom proximity radius for a fixed vehicle so that I can accommodate different site sizes    | Medium   | Configurable radius 10-500m                     |
| US-F04 | As an operator, I want to see if I'm within range of a fixed vehicle before fueling so that I know fueling will be allowed | High     | Mobile app shows distance and status            |
| US-F05 | As an admin, I want to see a history of location changes for fixed vehicles for audit purposes                             | Medium   | Location history log accessible                 |

### Epic: Geofence-Based Fueling Validation

| ID     | User Story                                                                                                         | Priority | Acceptance Criteria                      |
| ------ | ------------------------------------------------------------------------------------------------------------------ | -------- | ---------------------------------------- |
| US-G01 | As an admin, I want to see available geofences from our GPS system so that I can assign them to rules              | High     | Geofence list synced from GPSGate        |
| US-G02 | As an admin, I want to assign geofences to a fueling rule set so that I can restrict fueling to specific areas     | High     | Multi-select geofences in rule set edit  |
| US-G03 | As an admin, I want to configure whether tanker, operator, or vehicle location is checked against geofence         | Medium   | Checkboxes for each location type        |
| US-G04 | As an operator, I want to see which geofences I'm currently in before fueling so that I know if fueling is allowed | High     | Mobile app shows current geofence status |
| US-G05 | As an operator, I want to see the nearest valid geofence when I'm outside all of them so that I know where to go   | Medium   | Distance to nearest shown in UI          |
| US-G06 | As an admin, I want geofences to sync automatically from the GPS provider so that I don't have to manually update  | High     | Background sync every 15 minutes         |

---

## API Specifications

### Fixed Vehicle Location APIs

```http
# Update fixed vehicle location
PUT /api/v1/vehicles/{vehicleId}/fixed-location
{
  "isFixedLocation": true,
  "latitude": -1.2864,
  "longitude": 36.8172,
  "radiusMeters": 100,
  "locationName": "Site Alpha Generator"
}

# Get fixed vehicle location
GET /api/v1/vehicles/{vehicleId}/fixed-location

# Validate proximity (called during authorization)
POST /api/v1/location-validation/fixed-vehicle-proximity
{
  "vehicleId": 123,
  "tankerLatitude": -1.2865,
  "tankerLongitude": 36.8174
}

Response:
{
  "isValid": true,
  "distanceMeters": 25,
  "allowedRadiusMeters": 100,
  "vehicleLocation": {
    "latitude": -1.2864,
    "longitude": 36.8172,
    "locationName": "Site Alpha Generator"
  }
}
```

### Geofence APIs

```http
# Get all synced geofences
GET /api/v1/geofences
    ?search=depot
    &isActive=true
    &pageSize=50

# Manually trigger geofence sync
POST /api/v1/geofences/sync

# Assign geofences to rule set
PUT /api/v1/fueling-rulesets/{ruleSetId}/geofences
{
  "geofenceIds": [1, 2, 5],
  "requireTankerInGeofence": true,
  "requireOperatorInGeofence": false,
  "requireVehicleInGeofence": false
}

# Validate location against geofences
POST /api/v1/location-validation/geofence-check
{
  "vehicleId": 123,
  "latitude": -1.2864,
  "longitude": 36.8172
}

Response:
{
  "isValid": true,
  "matchedGeofence": {
    "id": 1,
    "name": "Nairobi Depot",
    "type": "Polygon"
  },
  "checkedGeofences": [
    { "id": 1, "name": "Nairobi Depot", "isInside": true },
    { "id": 2, "name": "Mombasa Depot", "isInside": false, "distanceMeters": 450000 }
  ]
}
```

---

## UI/UX Requirements

### Admin Portal

#### Vehicle Edit - Fixed Location Section

```
┌─────────────────────────────────────────────────────────────────┐
│ 📍 Fixed Location Settings                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ☑️ This is a fixed location vehicle (doesn't move)             │
│                                                                  │
│  Location Name:  [Site Alpha Generator____________]             │
│                                                                  │
│  Coordinates:                                                    │
│  Latitude:  [-1.286400____]   Longitude: [36.817200____]        │
│                                                                  │
│  Proximity Radius: [100____] meters                             │
│                                                                  │
│  [📍 Pick on Map]                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Fueling Rule Set - Geofence Assignment

```
┌─────────────────────────────────────────────────────────────────┐
│ 🗺️ Geofence Restrictions                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ○ No geofence restrictions (fuel anywhere)                    │
│  ● Restrict fueling to specific geofences or groups             │
│                                                                  │
│  Validate location of:                                          │
│  ☑️ Tanker/Dispenser   ☐ Operator   ☐ Vehicle                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ GEOFENCE GROUPS (assign whole group)                        ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ 🔍 Search groups...                                          ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ ☑️ 🟢 Authorized Fueling Zones         (4 geofences)        ││
│  │ ☐ 🔵 Customer Sites                    (2 geofences)        ││
│  │ ☐ 🟠 Project Sites                     (3 geofences)        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ INDIVIDUAL GEOFENCES (or add specific ones)                 ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ 🔍 Search geofences...                                       ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ ☐ Nairobi Depot                           Polygon  🟢       ││
│  │ ☐ Mombasa Depot                           Circle   🟢       ││
│  │ ☐ Kisumu Depot                            Polygon  🟢       ││
│  │ ☐ Warehouse A                             Circle   ⚪       ││
│  │ ☐ Customer Site - ABC Corp               Polygon  🔵       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ℹ️ Geofences are managed in GPSGate. Last synced: 5 min ago   │
│  [🔄 Sync Now]                                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

> **Note:** Colored dots (🟢🔵🟠) represent the group color from GPSGate for easy identification.

---

## Configuration Reference

### New System Configurations

| Key                                             | Default | Description                           |
| ----------------------------------------------- | ------- | ------------------------------------- |
| `LocationValidation.FixedVehicle.Enabled`       | true    | Enable fixed vehicle proximity checks |
| `LocationValidation.FixedVehicle.DefaultRadius` | 100     | Default radius in meters              |
| `LocationValidation.Geofence.Enabled`           | true    | Enable geofence validation            |
| `LocationValidation.Geofence.SyncInterval`      | 15      | Minutes between GPS provider syncs    |
| `LocationValidation.Geofence.CacheEnabled`      | true    | Cache geofence data locally           |
| `LocationValidation.Geofence.RequireTanker`     | true    | Default: check tanker location        |
| `LocationValidation.Geofence.RequireOperator`   | false   | Default: check operator location      |
| `LocationValidation.Geofence.RequireVehicle`    | false   | Default: check vehicle location       |

### PTS Device Settings (New)

| Setting                        | Type    | Description                   |
| ------------------------------ | ------- | ----------------------------- |
| `EnableFixedVehicleValidation` | Boolean | Check fixed vehicle proximity |
| `EnableGeofenceValidation`     | Boolean | Check geofence restrictions   |
| `GeofenceBypassOnSyncFailure`  | Boolean | Allow if geofence sync failed |

---

## Security Considerations

1. **Location Spoofing Prevention**

   - Validate GPS accuracy before trusting coordinates
   - Flag suspicious location jumps (e.g., 100km in 5 minutes)
   - Cross-reference with vehicle GPS if available

2. **Geofence Data Integrity**

   - Verify geofence data from GPS provider
   - Log all geofence changes
   - Detect deleted/modified geofences

3. **Audit Trail**
   - Log all validation decisions
   - Record override actions with user identity
   - Maintain location history for forensic analysis

---

## Testing Strategy

### Unit Tests

- Haversine distance calculation accuracy
- Point-in-polygon algorithm correctness
- Edge cases (on boundary, at poles, crossing date line)

### Integration Tests

- GPSGate API sync
- Database persistence
- Validation flow end-to-end

### UAT Scenarios

| Scenario                            | Expected Result         |
| ----------------------------------- | ----------------------- |
| Fuel fixed generator within radius  | ✅ Allowed              |
| Fuel fixed generator outside radius | ❌ Blocked              |
| Fuel inside assigned geofence       | ✅ Allowed              |
| Fuel outside all geofences          | ❌ Blocked              |
| GPS failure with bypass enabled     | ⚠️ Allowed with warning |
| Geofence sync failure               | Use cached data         |

---

## Rollout Plan

### Phase 1: Fixed Vehicle Proximity (Week 1-2)

- Database migration (vehicle fixed location columns)
- Backend validation service
- Admin portal UI for fixed vehicle configuration
- Mobile app proximity display

### Phase 2: Geofence Groups Integration (Week 3-4)

- Extend `IGPSGateGeofenceService` with group methods
- Add GPSGate API calls for `/geofenceGroups`
- Database tables for cached groups and assignments
- Geofence sync background service (geofences + groups)

### Phase 3: Rule Set Geofence Assignment (Week 4-5)

- Rule set UI for geofence/group assignment
- Fueling validation integration
- Mobile app geofence display

### Phase 4: Testing & Refinement (Week 6)

- UAT with pilot users
- Performance optimization
- Documentation updates

### Phase 5: Production Rollout (Week 7)

- Staged rollout by site
- Monitor validation logs
- Address any issues

### Development Notes

**Leverage Existing Infrastructure:**

- `GPSGateGeofenceService` already has `IsPointInPolygon` and `IsPointInCircle`
- `GPSGateGeofenceGroup` model already exists with `GeofenceIds` list
- `GeofenceDTO` already maps GPSGate shapes to FMS format
- Haversine distance calculation already implemented

---

## Success Metrics

| Metric                    | Target        | Measurement                                  |
| ------------------------- | ------------- | -------------------------------------------- |
| Fixed vehicle validations | 100% coverage | All fixed vehicles have locations configured |
| Geofence sync uptime      | 99.5%         | Sync service availability                    |
| False positive rate       | < 1%          | Valid fueling blocked incorrectly            |
| False negative rate       | < 0.1%        | Invalid fueling allowed                      |
| User adoption             | 100%          | All sites using new features                 |

---

## Open Questions

1. **Q: Should we support multiple GPS providers or just GPSGate?**

   - ✅ **Decision:** GPSGate only for initial release (existing infrastructure supports this)

2. **Q: How to handle vehicles that move between fixed locations?**

   - Option A: Update location manually when moved
   - Option B: Maintain multiple known locations per vehicle

3. **Q: What happens if a geofence is deleted in GPSGate?**

   - **Recommendation:** Soft delete in FMS cache, warn admin if assigned to rules
   - Option B: Automatically remove from rule sets with notification

4. **Q: Should operators be able to override geofence restrictions?**

   - **Recommendation:** No, only admins can configure bypass

5. **Q: How to handle overlapping geofences?**

   - ✅ **Decision:** Any match = valid (OR logic)

6. **Q: What happens when a new geofence is added to a group in GPSGate?**

   - ✅ **Decision:** Next sync will include it automatically; rules using that group will validate against the new geofence

7. **Q: Should we allow assigning both groups AND individual geofences to the same rule?**

   - **Recommendation:** Yes, combined with OR logic (any match = valid)

8. **Q: How often should we sync geofence groups from GPSGate?**
   - **Recommendation:** Same interval as geofences (15 minutes default, configurable)

---

## Appendix

### Related Documentation

- [Location Validation Feature](../LocationValidation/README.md)
- [Fuel Rules Cascade Hierarchy](../FuelingRule/CASCADE_HIERARCHY_IMPLEMENTATION.md)
- [Safety & Validation Guide](./FuelManagement_Safety_Validation_Guide.md)
- [GPSGate API Documentation](../../GPSGate.md)

### Existing Code References

| File                                                                                  | Purpose                                               |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `FMS.Infrastructure/ExternalServices/GPS/GPSGate/Services/GPSGateGeofenceService.cs`  | Existing geofence service with point-in-polygon logic |
| `FMS.Infrastructure/ExternalServices/GPS/GPSGate/Services/IGPSGateGeofenceService.cs` | Interface to extend with group methods                |
| `FMS.Infrastructure/VehicleTracking/Models/GPSGate/GPSGateGeofence.cs`                | GPSGate geofence model                                |
| `FMS.Infrastructure/VehicleTracking/Models/GPSGate/GPSGateGeofenceGroup.cs`           | GPSGate geofence group model (already exists!)        |
| `FMS.Application/Features/Vehicle/DTOs/GeofenceDTO.cs`                                | DTO for geofence data transfer                        |

### Glossary

| Term                  | Definition                                                    |
| --------------------- | ------------------------------------------------------------- |
| **Fixed Vehicle**     | Vehicle that doesn't move (generator, pump, etc.)             |
| **Geofence**          | Virtual geographic boundary defined by GPS coordinates        |
| **Geofence Group**    | Logical grouping of related geofences in GPSGate              |
| **Proximity Radius**  | Maximum allowed distance between two points                   |
| **Haversine Formula** | Method to calculate distance between two GPS coordinates      |
| **Point-in-Polygon**  | Ray casting algorithm to check if a point is inside a polygon |
| **GPSGate**           | Third-party GPS tracking platform (source of geofence data)   |

---

_Document Status: Draft - Pending Review_
_Last Updated: January 7, 2026_
_Next Review Date: January 8, 2026_
