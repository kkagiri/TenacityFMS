# Fuel Audit System - Architecture Documentation

**Version:** 1.0
**Created:** November 28, 2025
**Status:** Implemented

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Component Diagram](#component-diagram)
4. [Data Flow Architecture](#data-flow-architecture)
5. [Domain Entities](#domain-entities)
6. [Service Architecture](#service-architecture)
7. [API Architecture](#api-architecture)
8. [Database Schema](#database-schema)
9. [Integration Points](#integration-points)
10. [Error Handling](#error-handling)

---

## 1. System Overview

The Fuel Audit System provides comprehensive fuel reconciliation capabilities for fleet management. It integrates GPS-based fuel sensor data with tank stock records to identify variances and potential fuel losses.

### Key Capabilities

- **Audit Period Management**: Create and manage fuel audits for specific date ranges
- **GPS Data Integration**: Retrieve fuel sensor readings from GPSGate API
- **Tank Stock Integration**: Auto-populate tank readings from TankVolumeHistory
- **Variance Calculation**: Calculate and flag discrepancies in fuel consumption
- **Flag Resolution**: Track and resolve identified issues

### Technology Stack

| Layer | Technology |
|-------|------------|
| Backend | .NET 8.0, C# |
| Architecture | Clean Architecture, CQRS |
| ORM | Entity Framework Core |
| Database | MySQL 5.5.6 |
| API | REST, JSON |
| External Integration | GPSGate REST API |

---

## 2. Architecture Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  FuelAuditGPSController.cs                                   │   │
│  │  (7 endpoints for GPS data operations)                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       APPLICATION LAYER                             │
│  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────┐   │
│  │     Commands       │  │      Queries       │  │    Services   │  │
│  │  ─────────────────│  │  ─────────────────  │  │  ───────────  │  │
│  │  CreateFuelAudit   │  │  GetFuelAudits     │  │  Calculation  │  │
│  │  CalculateAudit    │  │  GetFuelAuditById  │  │  GPSService   │  │
│  │  SubmitTankerReading│ │  GetThresholds     │  │  TankStock    │  │
│  │  FinalizeAudit     │  │                    │  │               │  │
│  │  CancelAudit       │  │                    │  │               │  │
│  │  ResolveFlag       │  │                    │  │               │  │
│  └────────────────────┘  └────────────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DOMAIN LAYER                                │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Entities: FuelAudit, FuelAuditTankerReading, FuelAuditFlag, │   │
│  │            FuelAuditGPSReading, FuelAuditVariance,           │   │
│  │            FuelAuditVehiclePosition, FuelAuditThreshold      │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      INFRASTRUCTURE LAYER                           │
│  ┌─────────────────────┐  ┌─────────────────────────────────────┐   │
│  │  EF Core Configs    │  │  External Services                  │   │
│  │  ─────────────────  │  │  ─────────────────────────────────  │   │
│  │  7 Configuration    │  │  GPSGate REST API                   │   │
│  │  Classes            │  │  TankVolumeHistory (existing)       │   │
│  └─────────────────────┘  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  MySQL Database                                              │   │
│  │  Tables: fuel_audits, fuel_audit_tanker_readings,            │   │
│  │          fuel_audit_gps_readings, fuel_audit_vehicle_positions│  │
│  │          fuel_audit_variances, fuel_audit_flags,             │   │
│  │          fuel_audit_thresholds                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FUEL AUDIT SYSTEM                                 │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         API CONTROLLERS                             │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  FuelAuditGPSController (7 endpoints)                       │    │    │
│  │  │  • GET  /api/fuelaudit/gps/vehicle/{vehicleId}              │    │    │
│  │  │  • POST /api/fuelaudit/gps/fleet                            │    │    │
│  │  │  • GET  /api/fuelaudit/gps/vehicle/{vehicleId}/consumption  │    │    │
│  │  │  • GET  /api/fuelaudit/gps/vehicle/{vehicleId}/refuel-events│    │    │
│  │  │  • POST /api/fuelaudit/gps/vehicle/{vehicleId}/refresh      │    │    │
│  │  │  • GET  /api/fuelaudit/gps/vehicle/{vehicleId}/has-sensor   │    │    │
│  │  │  • POST /api/fuelaudit/gps/fleet/audit-period               │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                          ┌─────────┴─────────┐                              │
│                          ▼                   ▼                              │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐           │
│  │      CQRS COMMANDS          │  │      CQRS QUERIES           │           │
│  │  ┌───────────────────────┐  │  │  ┌───────────────────────┐  │           │
│  │  │ CreateFuelAudit       │  │  │  │ GetFuelAudits         │  │           │
│  │  │ CalculateAudit        │  │  │  │ GetFuelAuditById      │  │           │
│  │  │ SubmitTankerReading   │  │  │  │ GetAuditThresholds    │  │           │
│  │  │ FinalizeAudit         │  │  │  └───────────────────────┘  │           │
│  │  │ CancelAudit           │  │  └─────────────────────────────┘           │
│  │  │ ResolveFlag           │  │                                            │
│  │  └───────────────────────┘  │                                            │
│  └─────────────────────────────┘                                            │
│                          │                                                  │
│                          ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         SERVICES                                    │    │
│  │  ┌───────────────────────────┐  ┌───────────────────────────┐       │    │
│  │  │  FuelAuditGPSService      │  │  FuelAuditCalculationService│     │    │
│  │  │  ─────────────────────────│  │  ─────────────────────────   │    │    │
│  │  │  • GetVehicleFuelPosition │  │  • CalculateAuditAsync       │    │    │
│  │  │  • GetFleetFuelPositions  │  │  • PopulateTankReadings      │    │    │
│  │  │  • GetConsumptionData     │  │  • CalculateVariances        │    │    │
│  │  │  • GetRefuelEvents        │  │  • GenerateFlags             │    │    │
│  │  │  • RefreshVehicleData     │  └───────────────────────────┘       │    │
│  │  │  • HasFuelSensor          │                                      │    │
│  │  └───────────────────────────┘  ┌───────────────────────────┐       │    │
│  │                                 │  FuelAuditTankStockService │       │    │
│  │                                 │  ─────────────────────────  │      │    │
│  │                                 │  • GetTankVolumeAtTime      │      │    │
│  │                                 │  • GetTankAuditPeriodData   │      │    │
│  │                                 │  • GetSiteTankAuditData     │      │    │
│  │                                 │  • GetFuelMovementSummary   │      │    │
│  │                                 └───────────────────────────┘       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                          ┌─────────┴─────────┐                              │
│                          ▼                   ▼                              │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐           │
│  │   EXTERNAL INTEGRATIONS     │  │   DATABASE (MySQL)          │           │
│  │  ┌───────────────────────┐  │  │  ┌───────────────────────┐  │           │
│  │  │  GPSGate API          │  │  │  │  fuel_audits          │  │           │
│  │  │  /tracks endpoint     │  │  │  │  fuel_audit_readings  │  │           │
│  │  └───────────────────────┘  │  │  │  fuel_audit_flags     │  │           │
│  │  ┌───────────────────────┐  │  │  │  tank_volume_history  │  │           │
│  │  │  TankVolumeHistory    │  │  │  │  (existing tables)    │  │           │
│  │  │  (existing system)    │  │  │  └───────────────────────┘  │           │
│  │  └───────────────────────┘  │  └─────────────────────────────┘           │
│  └─────────────────────────────┘                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Data Flow Architecture

### 4.1 Audit Creation Flow

```
┌──────────────┐     ┌──────────────────┐     ┌────────────────────┐
│   Frontend   │────▶│ CreateFuelAudit  │────▶│  FuelAuditService  │
│   (React)    │     │    Command       │     │                    │
└──────────────┘     └──────────────────┘     └────────────────────┘
                                                        │
                     ┌──────────────────────────────────┘
                     ▼
        ┌────────────────────────┐
        │  FuelAuditTankStock    │
        │      Service           │
        │ ┌────────────────────┐ │
        │ │ Query TankVolume   │ │
        │ │ History for period │ │
        │ └────────────────────┘ │
        └────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  Auto-populate Tank    │
        │  Opening/Closing       │
        │  Readings              │
        └────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐     ┌────────────────────────┐
        │   FuelAuditGPSService  │────▶│   GPSGate REST API     │
        │                        │     │   /tracks endpoint     │
        │  • Parallel requests   │     └────────────────────────┘
        │  • Max 10 concurrent   │
        │  • Rate limiting       │
        └────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  Store GPS Readings    │
        │  in Database           │
        │  fuel_audit_gps_readings│
        └────────────────────────┘
```

### 4.2 Audit Calculation Flow

```
┌──────────────┐     ┌──────────────────┐     ┌────────────────────────┐
│   Frontend   │────▶│ CalculateAudit   │────▶│ FuelAuditCalculation   │
│              │     │    Command       │     │      Service           │
└──────────────┘     └──────────────────┘     └────────────────────────┘
                                                        │
                     ┌──────────────────────────────────┘
                     ▼
        ┌────────────────────────────────────────────────────┐
        │  1. Fetch Tank Readings (Opening/Closing)          │
        │     - From FuelAuditTankerReading or              │
        │     - Auto-populate from TankVolumeHistory        │
        └────────────────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────────────────┐
        │  2. Calculate Expected Fuel                        │
        │     Expected = Opening + Deliveries - Sales        │
        └────────────────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────────────────┐
        │  3. Get Actual Fuel (Closing Stock)                │
        │     From tank readings or TankVolumeHistory        │
        └────────────────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────────────────┐
        │  4. Calculate Variance                             │
        │     Variance = Expected - Actual                   │
        └────────────────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────────────────┐
        │  5. Apply Thresholds & Generate Flags              │
        │     If Variance > Threshold → Create Flag          │
        └────────────────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────────────────┐
        │  6. Store Results                                  │
        │     - FuelAuditVariance records                    │
        │     - FuelAuditFlag records                        │
        └────────────────────────────────────────────────────┘
```

---

## 5. Domain Entities

### Entity Relationship Diagram

```
┌─────────────────────────┐
│      FuelAudit          │
│─────────────────────────│
│ PK  Id                  │
│     AuditNumber         │
│     SiteId              │──────────────┐
│     AuditPeriodStart    │              │
│     AuditPeriodEnd      │              │
│     Status              │              │
│     CreatedAt           │              │
│     FinalizedAt         │              │
└─────────────────────────┘              │
         │1                              │
         │                               │
         ├──────────────────────────────┬┼──────────────────────┐
         │                              ││                      │
         ▼ *                            ▼│ *                    ▼ *
┌─────────────────────────┐  ┌──────────┴────────────┐  ┌────────────────────────┐
│ FuelAuditTankerReading  │  │ FuelAuditGPSReading   │  │ FuelAuditVehiclePosition│
│─────────────────────────│  │───────────────────────│  │────────────────────────│
│ PK  Id                  │  │ PK  Id                │  │ PK  Id                 │
│ FK  FuelAuditId         │  │ FK  FuelAuditId       │  │ FK  FuelAuditId        │
│ FK  TankId              │  │ FK  VehicleId         │  │ FK  VehicleId          │
│     ReadingType         │  │     Timestamp         │  │     PositionType       │
│     Volume              │  │     FuelLevel         │  │     FuelLevel          │
│     DataSource          │  │     GPSGateTrackId    │  │     Odometer           │
│     IsAutoPopulated     │  │     Latitude          │  │     Timestamp          │
│     HasDataQualityIssue │  │     Longitude         │  │     DataQualityScore   │
└─────────────────────────┘  └───────────────────────┘  └────────────────────────┘
         │1
         │
         ▼ *
┌─────────────────────────┐  ┌───────────────────────┐  ┌────────────────────────┐
│   FuelAuditVariance     │  │   FuelAuditFlag       │  │  FuelAuditThreshold    │
│─────────────────────────│  │───────────────────────│  │────────────────────────│
│ PK  Id                  │  │ PK  Id                │  │ PK  Id                 │
│ FK  FuelAuditId         │  │ FK  FuelAuditId       │  │     ThresholdType      │
│     VarianceType        │  │     FlagType          │  │     PercentageValue    │
│     ExpectedValue       │  │     Severity          │  │     VolumeValue        │
│     ActualValue         │  │     Description       │  │     IsActive           │
│     VarianceAmount      │  │     Status            │  │     EffectiveFrom      │
│     VariancePercentage  │  │     ResolvedAt        │  │                        │
└─────────────────────────┘  │     ResolvedBy        │  └────────────────────────┘
                             │     Resolution        │
                             └───────────────────────┘
```

### Entity Descriptions

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| **FuelAudit** | Master audit record | AuditNumber, SiteId, Period, Status |
| **FuelAuditTankerReading** | Tank stock readings | TankId, Volume, IsAutoPopulated |
| **FuelAuditGPSReading** | GPS fuel sensor data | VehicleId, FuelLevel, Timestamp |
| **FuelAuditVehiclePosition** | Vehicle fuel snapshots | VehicleId, FuelLevel, Odometer |
| **FuelAuditVariance** | Calculated discrepancies | Expected, Actual, Variance |
| **FuelAuditFlag** | Alerts for review | FlagType, Severity, Status |
| **FuelAuditThreshold** | Variance thresholds | PercentageValue, VolumeValue |

---

## 6. Service Architecture

### 6.1 Service Responsibilities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  IFuelAuditGPSService                                               │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │  Responsibility: GPS data retrieval and processing                  │    │
│  │                                                                     │    │
│  │  Methods:                                                           │    │
│  │  • GetVehicleFuelPositionAsync() - Single vehicle fuel position    │    │
│  │  • GetFleetFuelPositionsAsync() - Multiple vehicles fuel positions │    │
│  │  • GetVehicleFuelConsumptionAsync() - Consumption over period      │    │
│  │  • GetVehicleRefuelEventsAsync() - Detect refueling events         │    │
│  │  • RefreshVehicleFuelDataAsync() - Force refresh from GPSGate      │    │
│  │  • HasFuelSensorAsync() - Check sensor availability                │    │
│  │  • GetFleetFuelPositionsForAuditPeriodAsync() - Audit period data  │    │
│  │                                                                     │    │
│  │  Dependencies: IGPSGateApiClient, GpsdataContext                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  IFuelAuditCalculationService                                       │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │  Responsibility: Core fuel audit calculations                       │    │
│  │                                                                     │    │
│  │  Methods:                                                           │    │
│  │  • CalculateAuditAsync() - Main calculation orchestration          │    │
│  │  • PopulateTankReadingsFromHistoryAsync() - Auto-fill readings     │    │
│  │  • CalculateVariancesAsync() - Variance computation                │    │
│  │  • GenerateFlagsAsync() - Threshold-based flag generation          │    │
│  │                                                                     │    │
│  │  Dependencies: IFuelAuditTankStockService, GpsdataContext           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  IFuelAuditTankStockService                                         │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │  Responsibility: Tank stock data from TankVolumeHistory             │    │
│  │                                                                     │    │
│  │  Methods:                                                           │    │
│  │  • GetTankVolumeAtTimeAsync() - Point-in-time volume               │    │
│  │  • GetTankAuditPeriodDataAsync() - Period opening/closing          │    │
│  │  • GetSiteTankAuditDataAsync() - All tanks for site                │    │
│  │  • GetTankTransactionsDuringPeriodAsync() - Deliveries, transfers  │    │
│  │  • GetFuelMovementSummaryAsync() - Aggregated fuel movements       │    │
│  │                                                                     │    │
│  │  Dependencies: GpsdataContext (TankVolumeHistory, Tank)             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Service Dependencies

```
┌────────────────────────────────────────┐
│         FuelAuditGPSService            │
│────────────────────────────────────────│
│  Dependencies:                         │
│  • IGPSGateApiClient                   │
│  • GpsdataContext                      │
│  • ILogger<FuelAuditGPSService>        │
│  • IConfiguration (for throttling)     │
└────────────────────────────────────────┘
                │
                │ uses
                ▼
┌────────────────────────────────────────┐
│         GPSGate REST API               │
│────────────────────────────────────────│
│  Endpoint: /tracks                     │
│  Variables: FuelLevel, FuelPercentage  │
│  Rate Limit: 10 concurrent calls       │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│    FuelAuditCalculationService         │
│────────────────────────────────────────│
│  Dependencies:                         │
│  • IFuelAuditTankStockService          │
│  • GpsdataContext                      │
│  • ILogger<FuelAuditCalculationService>│
└────────────────────────────────────────┘
                │
                │ uses
                ▼
┌────────────────────────────────────────┐
│     FuelAuditTankStockService          │
│────────────────────────────────────────│
│  Dependencies:                         │
│  • GpsdataContext                      │
│  • ILogger<FuelAuditTankStockService>  │
└────────────────────────────────────────┘
                │
                │ queries
                ▼
┌────────────────────────────────────────┐
│       TankVolumeHistory Table          │
│────────────────────────────────────────│
│  VolumeChangeReasonEnum:               │
│  • OpeningStock                        │
│  • ClosingStock                        │
│  • Delivery                            │
│  • TransferIn / TransferOut            │
│  • Dispensing / AutomatedDispensing    │
│  • Reconciliation                      │
└────────────────────────────────────────┘
```

---

## 7. API Architecture

### 7.1 Controller Structure

```
FMS.WebClient/Controllers/FuelManagement/
└── FuelAuditGPSController.cs (276 lines)
    │
    ├── GET  /api/fuelaudit/gps/vehicle/{vehicleId}
    │   └── Returns: VehicleFuelPositionDTO
    │
    ├── POST /api/fuelaudit/gps/fleet
    │   ├── Request Body: FleetFuelPositionRequest (vehicleIds[])
    │   └── Returns: FleetFuelPositionDTO
    │
    ├── GET  /api/fuelaudit/gps/vehicle/{vehicleId}/consumption
    │   ├── Query Params: startDate, endDate
    │   └── Returns: VehicleFuelConsumptionDTO
    │
    ├── GET  /api/fuelaudit/gps/vehicle/{vehicleId}/refuel-events
    │   ├── Query Params: startDate, endDate
    │   └── Returns: List<RefuelEventDTO>
    │
    ├── POST /api/fuelaudit/gps/vehicle/{vehicleId}/refresh
    │   └── Returns: VehicleFuelPositionDTO (refreshed)
    │
    ├── GET  /api/fuelaudit/gps/vehicle/{vehicleId}/has-fuel-sensor
    │   └── Returns: { hasSensor: boolean }
    │
    └── POST /api/fuelaudit/gps/fleet/audit-period
        ├── Request Body: AuditPeriodRequest (startDate, endDate, vehicleIds[])
        └── Returns: FleetFuelPositionDTO (for audit period)
```

### 7.2 Response Format

All endpoints use `FMSResponse<T>` wrapper:

```json
{
  "isSuccess": true,
  "data": { /* DTO content */ },
  "message": "Operation completed successfully",
  "errors": []
}
```

---

## 8. Database Schema

### 8.1 Table Structure

```sql
-- Master Audit Table
CREATE TABLE fuel_audits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    audit_number VARCHAR(50) NOT NULL,
    site_id INT NULL,
    audit_period_start DATETIME NOT NULL,
    audit_period_end DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Draft',
    total_expected DECIMAL(18,4) NULL,
    total_actual DECIMAL(18,4) NULL,
    total_variance DECIMAL(18,4) NULL,
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finalized_at DATETIME NULL,
    finalized_by INT NULL,
    UNIQUE KEY uk_audit_number (audit_number)
);

-- Tank Stock Readings
CREATE TABLE fuel_audit_tanker_readings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fuel_audit_id INT NOT NULL,
    tank_id INT NOT NULL,
    reading_type VARCHAR(20) NOT NULL,
    volume DECIMAL(18,4) NOT NULL,
    reading_datetime DATETIME NOT NULL,
    data_source VARCHAR(50) NULL,
    is_auto_populated TINYINT(1) NOT NULL DEFAULT 0,
    has_data_quality_issue TINYINT(1) NOT NULL DEFAULT 0,
    data_quality_notes TEXT NULL,
    recorded_by INT NULL,
    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fuel_audit_id) REFERENCES fuel_audits(id)
);

-- GPS Readings
CREATE TABLE fuel_audit_gps_readings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fuel_audit_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    timestamp DATETIME NOT NULL,
    fuel_level DECIMAL(18,4) NULL,
    fuel_percentage DECIMAL(5,2) NULL,
    odometer DECIMAL(18,2) NULL,
    latitude DECIMAL(10,6) NULL,
    longitude DECIMAL(10,6) NULL,
    gpsgate_track_id VARCHAR(100) NULL,
    data_quality_score INT NULL,
    FOREIGN KEY (fuel_audit_id) REFERENCES fuel_audits(id)
);

-- See migration scripts for complete schema
```

### 8.2 Migration Scripts

| Script | Purpose |
|--------|---------|
| `01_fuel_audit_tables.sql` | Core table creation |
| `02_fuel_audit_indexes.sql` | Performance indexes |
| `03_tankvolumehistory_integration.sql` | Auto-populate columns |

---

## 9. Integration Points

### 9.1 GPSGate API Integration

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GPSGate Integration                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Endpoint: /tracks                                                  │
│  Method: GET                                                        │
│                                                                     │
│  Parameters:                                                        │
│  • vehicleId: int                                                   │
│  • fromDate: DateTime                                               │
│  • toDate: DateTime                                                 │
│  • variables: ["FuelLevel", "FuelPercentage"]                       │
│                                                                     │
│  Response:                                                          │
│  {                                                                  │
│    "tracks": [                                                      │
│      {                                                              │
│        "trackId": "abc123",                                         │
│        "timestamp": "2025-11-28T10:00:00Z",                         │
│        "position": { "lat": 1.234, "lng": 5.678 },                  │
│        "variables": {                                               │
│          "FuelLevel": 45.5,                                         │
│          "FuelPercentage": 65                                       │
│        }                                                            │
│      }                                                              │
│    ]                                                                │
│  }                                                                  │
│                                                                     │
│  Rate Limiting:                                                     │
│  • Max 10 concurrent requests                                       │
│  • Exponential backoff on 429 responses                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.2 TankVolumeHistory Integration

```
┌─────────────────────────────────────────────────────────────────────┐
│                TankVolumeHistory Integration                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Table: tank_volume_history                                         │
│                                                                     │
│  VolumeChangeReasonEnum Values:                                     │
│  ┌─────────────────────────┬───────────────────────────────────┐    │
│  │ Enum Value              │ Use in Fuel Audit                 │    │
│  ├─────────────────────────┼───────────────────────────────────┤    │
│  │ OpeningStock            │ Opening reading for period        │    │
│  │ ClosingStock            │ Closing reading for period        │    │
│  │ Delivery                │ Fuel additions                    │    │
│  │ TransferIn              │ Inter-tank transfers (addition)   │    │
│  │ TransferOut             │ Inter-tank transfers (reduction)  │    │
│  │ Dispensing              │ Manual fuel dispensing            │    │
│  │ AutomatedDispensing     │ Automated pump dispensing         │    │
│  │ Reconciliation          │ Manual adjustments                │    │
│  │ AutomatedReconciliation │ System adjustments                │    │
│  │ Adjustment              │ General adjustments               │    │
│  └─────────────────────────┴───────────────────────────────────┘    │
│                                                                     │
│  Query Pattern:                                                     │
│  SELECT * FROM tank_volume_history                                  │
│  WHERE tank_id = @tankId                                            │
│    AND timestamp BETWEEN @startDate AND @endDate                    │
│  ORDER BY timestamp                                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 10. Error Handling

### 10.1 Error Categories

| Category | HTTP Code | Handling |
|----------|-----------|----------|
| Validation Error | 400 | Return validation errors in response |
| Not Found | 404 | Audit or resource not found |
| GPS API Error | 502 | Retry with backoff, log error |
| Database Error | 500 | Log, return generic error |
| Rate Limit | 429 | Queue request, retry later |

### 10.2 Error Response Format

```json
{
  "isSuccess": false,
  "data": null,
  "message": "Validation failed",
  "errors": [
    "Audit period end date must be after start date",
    "At least one vehicle must be selected"
  ]
}
```

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 28, 2025 | Initial architecture documentation |
