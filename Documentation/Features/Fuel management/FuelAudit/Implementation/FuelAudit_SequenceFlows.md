# Fuel Audit System - Sequence Flow Documentation

**Version:** 1.0
**Created:** November 28, 2025
**Status:** Implemented

---

## Table of Contents

1. [Overview](#overview)
2. [Create Fuel Audit Flow](#create-fuel-audit-flow)
3. [Calculate Audit Flow](#calculate-audit-flow)
4. [GPS Data Retrieval Flow](#gps-data-retrieval-flow)
5. [Tank Stock Population Flow](#tank-stock-population-flow)
6. [Submit Tanker Reading Flow](#submit-tanker-reading-flow)
7. [Finalize Audit Flow](#finalize-audit-flow)
8. [Resolve Flag Flow](#resolve-flag-flow)
9. [Cancel Audit Flow](#cancel-audit-flow)

---

## 1. Overview

This document describes the sequence flows for all major operations in the Fuel Audit System. Each flow shows the interaction between components from the API layer through to the database and external systems.

### Component Legend

| Component | Description |
|-----------|-------------|
| **Client** | React Frontend or API Consumer |
| **Controller** | FuelAuditGPSController |
| **Command/Query** | MediatR CQRS handlers |
| **Service** | Business logic services |
| **DbContext** | Entity Framework GpsdataContext |
| **GPSGate** | External GPS API |
| **TankHistory** | TankVolumeHistory table |

---

## 2. Create Fuel Audit Flow

### Sequence Diagram

```
┌────────┐  ┌────────────┐  ┌──────────────────┐  ┌─────────────────┐  ┌───────────────┐  ┌──────────┐
│ Client │  │ Controller │  │ CreateFuelAudit  │  │ CalculationSvc  │  │ TankStockSvc  │  │ Database │
└───┬────┘  └─────┬──────┘  │    Command       │  └────────┬────────┘  └───────┬───────┘  └────┬─────┘
    │             │         └────────┬─────────┘           │                   │               │
    │  POST /api/fuelaudit           │                     │                   │               │
    │─────────────────────────────>│ │                     │                   │               │
    │             │                 │ │                     │                   │               │
    │             │  Send Command   │ │                     │                   │               │
    │             │────────────────>│ │                     │                   │               │
    │             │                 │ │                     │                   │               │
    │             │                 │ │  Generate Audit#    │                   │               │
    │             │                 │ │─────────────────────────────────────────────────────────>│
    │             │                 │ │                     │                   │               │
    │             │                 │ │                     │  Get Site Tanks   │               │
    │             │                 │ │─────────────────────────────────────────>│               │
    │             │                 │ │                     │                   │               │
    │             │                 │ │                     │   Query Tanks     │               │
    │             │                 │ │                     │   ────────────────────────────────>│
    │             │                 │ │                     │                   │               │
    │             │                 │ │                     │  Get Opening/Closing              │
    │             │                 │ │                     │   ────────────────────────────────>│
    │             │                 │ │                     │                   │               │
    │             │                 │ │                     │   Tank Data       │               │
    │             │                 │ │                     │  <────────────────────────────────│
    │             │                 │ │                     │                   │               │
    │             │                 │ │  Auto-populate Readings                 │               │
    │             │                 │ │─────────────────────>│                   │               │
    │             │                 │ │                     │                   │               │
    │             │                 │ │                     │  Create TankerReadings            │
    │             │                 │ │                     │─────────────────────────────────>│
    │             │                 │ │                     │                   │               │
    │             │                 │ │  Save Audit                             │               │
    │             │                 │ │─────────────────────────────────────────────────────────>│
    │             │                 │ │                     │                   │               │
    │             │  FuelAuditDTO   │ │                     │                   │               │
    │             │<────────────────│ │                     │                   │               │
    │             │                 │ │                     │                   │               │
    │  FMSResponse<FuelAuditDTO>    │                       │                   │               │
    │<─────────────────────────────│ │                     │                   │               │
    │             │                 │ │                     │                   │               │
```

### Step-by-Step Description

| Step | Component | Action |
|------|-----------|--------|
| 1 | Client | Sends POST request with audit period and site ID |
| 2 | Controller | Validates request, sends CreateFuelAuditCommand to MediatR |
| 3 | Command Handler | Generates unique audit number (FA-YYYYMMDD-XXXX) |
| 4 | Command Handler | Queries site tanks via TankStockService |
| 5 | TankStockService | Queries TankVolumeHistory for opening/closing volumes |
| 6 | Command Handler | Auto-populates FuelAuditTankerReading records |
| 7 | Command Handler | Saves FuelAudit entity with status "Draft" |
| 8 | Controller | Returns FMSResponse with created audit |

### Request/Response

**Request:**
```json
POST /api/fuelaudit
{
  "siteId": 1,
  "auditPeriodStart": "2025-11-01T00:00:00",
  "auditPeriodEnd": "2025-11-30T23:59:59",
  "vehicleIds": [101, 102, 103]
}
```

**Response:**
```json
{
  "isSuccess": true,
  "data": {
    "id": 1,
    "auditNumber": "FA-20251128-0001",
    "siteId": 1,
    "auditPeriodStart": "2025-11-01T00:00:00",
    "auditPeriodEnd": "2025-11-30T23:59:59",
    "status": "Draft",
    "tankerReadings": [
      {
        "tankId": 1,
        "readingType": "Opening",
        "volume": 15000.00,
        "isAutoPopulated": true,
        "dataSource": "TankVolumeHistory"
      }
    ]
  },
  "message": "Fuel audit created successfully"
}
```

---

## 3. Calculate Audit Flow

### Sequence Diagram

```
┌────────┐  ┌──────────────────┐  ┌─────────────────┐  ┌───────────────┐  ┌──────────────┐  ┌──────────┐
│ Client │  │ CalculateAudit   │  │ CalculationSvc  │  │ TankStockSvc  │  │   GPSSvc     │  │ Database │
└───┬────┘  │    Command       │  └────────┬────────┘  └───────┬───────┘  └──────┬───────┘  └────┬─────┘
    │       └────────┬─────────┘           │                   │                 │               │
    │                │                     │                   │                 │               │
    │  POST /api/fuelaudit/{id}/calculate  │                   │                 │               │
    │───────────────>│                     │                   │                 │               │
    │                │                     │                   │                 │               │
    │                │  Load Audit         │                   │                 │               │
    │                │─────────────────────────────────────────────────────────────────────────>│
    │                │                     │                   │                 │               │
    │                │  CalculateAuditAsync│                   │                 │               │
    │                │────────────────────>│                   │                 │               │
    │                │                     │                   │                 │               │
    │                │                     │  Check Tank Readings Auto-Populated?               │
    │                │                     │───────────────────>│                 │               │
    │                │                     │                   │                 │               │
    │                │                     │  If needed, get TankVolumeHistory   │               │
    │                │                     │                   │─────────────────────────────────>│
    │                │                     │                   │                 │               │
    │                │                     │                   │  Tank volumes    │               │
    │                │                     │                   │<─────────────────────────────────│
    │                │                     │                   │                 │               │
    │                │                     │  Get GPS Vehicle Positions          │               │
    │                │                     │─────────────────────────────────────>│               │
    │                │                     │                   │                 │               │
    │                │                     │                   │    Query GPSGate│               │
    │                │                     │                   │                 │───────────────>│
    │                │                     │                   │                 │               │
    │                │                     │                   │    GPS Readings │               │
    │                │                     │                   │                 │<───────────────│
    │                │                     │                   │                 │               │
    │                │                     │  Calculate Expected Fuel            │               │
    │                │                     │  Opening + Deliveries - Dispensed   │               │
    │                │                     │──────────────────────────────────────────────────────>│
    │                │                     │                   │                 │               │
    │                │                     │  Calculate Variance                 │               │
    │                │                     │  Expected - Actual = Variance       │               │
    │                │                     │                   │                 │               │
    │                │                     │  Check Thresholds │                 │               │
    │                │                     │──────────────────────────────────────────────────────>│
    │                │                     │                   │                 │               │
    │                │                     │  Generate Flags if Variance > Threshold             │
    │                │                     │──────────────────────────────────────────────────────>│
    │                │                     │                   │                 │               │
    │                │                     │  Save Variances & Flags             │               │
    │                │                     │──────────────────────────────────────────────────────>│
    │                │                     │                   │                 │               │
    │                │                     │  Update Audit Status = "Calculated" │               │
    │                │                     │──────────────────────────────────────────────────────>│
    │                │                     │                   │                 │               │
    │                │  Calculation Result │                   │                 │               │
    │                │<────────────────────│                   │                 │               │
    │                │                     │                   │                 │               │
    │  FMSResponse   │                     │                   │                 │               │
    │<───────────────│                     │                   │                 │               │
```

### Calculation Formula

```
EXPECTED FUEL:
  Expected = Opening Stock
           + Deliveries
           + Transfers In
           - Dispensed (Sales)
           - Transfers Out

VARIANCE:
  Variance = Expected - Closing Stock (Actual)
  Variance% = (Variance / Expected) × 100

FLAG GENERATION:
  If Variance% > Threshold% → Create Flag
  If Variance > VolumeThreshold → Create Flag
```

### Step-by-Step Description

| Step | Component | Action |
|------|-----------|--------|
| 1 | Client | Sends POST to trigger calculation |
| 2 | Command Handler | Loads audit with related entities |
| 3 | CalculationService | Checks if tank readings are populated |
| 4 | TankStockService | Gets opening/closing volumes from TankVolumeHistory |
| 5 | TankStockService | Gets deliveries, transfers, dispensing transactions |
| 6 | GPSService | Fetches vehicle fuel positions for period |
| 7 | CalculationService | Calculates expected fuel using formula |
| 8 | CalculationService | Calculates variance (Expected - Actual) |
| 9 | CalculationService | Loads thresholds from database |
| 10 | CalculationService | Generates flags for variances exceeding thresholds |
| 11 | Command Handler | Saves variances and flags |
| 12 | Command Handler | Updates audit status to "Calculated" |

---

## 4. GPS Data Retrieval Flow

### Sequence Diagram

```
┌────────┐  ┌────────────────────┐  ┌────────────────┐  ┌──────────────┐  ┌──────────┐
│ Client │  │ FuelAuditGPS       │  │ FuelAuditGPS   │  │  GPSGate     │  │ Database │
│        │  │ Controller         │  │ Service        │  │  REST API    │  │          │
└───┬────┘  └─────────┬──────────┘  └───────┬────────┘  └──────┬───────┘  └────┬─────┘
    │                 │                     │                  │               │
    │  GET /api/fuelaudit/gps/vehicle/{id}  │                  │               │
    │────────────────>│                     │                  │               │
    │                 │                     │                  │               │
    │                 │ GetVehicleFuelPositionAsync            │               │
    │                 │────────────────────>│                  │               │
    │                 │                     │                  │               │
    │                 │                     │  Check cache     │               │
    │                 │                     │─────────────────────────────────>│
    │                 │                     │                  │               │
    │                 │                     │  If stale, call GPSGate          │
    │                 │                     │─────────────────>│               │
    │                 │                     │                  │               │
    │                 │                     │  GET /tracks?vehicleId={id}      │
    │                 │                     │  &variables=FuelLevel            │
    │                 │                     │─────────────────>│               │
    │                 │                     │                  │               │
    │                 │                     │  Track data with fuel variables  │
    │                 │                     │<─────────────────│               │
    │                 │                     │                  │               │
    │                 │                     │  Extract fuel level & position   │
    │                 │                     │                  │               │
    │                 │                     │  Calculate data quality score    │
    │                 │                     │                  │               │
    │                 │                     │  Store GPS reading               │
    │                 │                     │─────────────────────────────────>│
    │                 │                     │                  │               │
    │                 │  VehicleFuelPositionDTO                │               │
    │                 │<────────────────────│                  │               │
    │                 │                     │                  │               │
    │  FMSResponse<VehicleFuelPositionDTO>  │                  │               │
    │<────────────────│                     │                  │               │
```

### Fleet Parallel Processing

```
┌────────┐  ┌────────────────────┐  ┌────────────────┐  ┌──────────────┐
│ Client │  │ FuelAuditGPS       │  │ FuelAuditGPS   │  │  GPSGate     │
│        │  │ Controller         │  │ Service        │  │  REST API    │
└───┬────┘  └─────────┬──────────┘  └───────┬────────┘  └──────┬───────┘
    │                 │                     │                  │
    │  POST /api/fuelaudit/gps/fleet        │                  │
    │  { vehicleIds: [1,2,3,4,5,6,7,8,9,10] }                  │
    │────────────────>│                     │                  │
    │                 │                     │                  │
    │                 │ GetFleetFuelPositionsAsync             │
    │                 │────────────────────>│                  │
    │                 │                     │                  │
    │                 │                     │  Create SemaphoreSlim(10)
    │                 │                     │  (max 10 concurrent)
    │                 │                     │                  │
    │                 │                     │  Parallel.ForEachAsync
    │                 │                     │  ┌───────────────┴───────────────┐
    │                 │                     │  │ Vehicle 1    GET /tracks      │
    │                 │                     │  │────────────────────────────>  │
    │                 │                     │  │ Vehicle 2    GET /tracks      │
    │                 │                     │  │────────────────────────────>  │
    │                 │                     │  │ ...          (parallel)       │
    │                 │                     │  │ Vehicle 10   GET /tracks      │
    │                 │                     │  │────────────────────────────>  │
    │                 │                     │  └───────────────────────────────┘
    │                 │                     │                  │
    │                 │                     │  Aggregate results               │
    │                 │                     │                  │
    │                 │  FleetFuelPositionDTO                  │
    │                 │<────────────────────│                  │
    │                 │                     │                  │
    │  FMSResponse<FleetFuelPositionDTO>    │                  │
    │<────────────────│                     │                  │
```

### Rate Limiting Strategy

```
GPSGate API Rate Limiting:
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  SemaphoreSlim _throttle = new(10);  // Max 10 concurrent  │
│                                                            │
│  foreach vehicle in vehicles:                              │
│    await _throttle.WaitAsync()                             │
│    try:                                                    │
│      await GetVehicleDataAsync(vehicle)                    │
│    finally:                                                │
│      _throttle.Release()                                   │
│                                                            │
│  On HTTP 429 (Too Many Requests):                          │
│    Wait for Retry-After header                             │
│    Exponential backoff: 1s, 2s, 4s, 8s...                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 5. Tank Stock Population Flow

### Sequence Diagram

```
┌────────────────┐  ┌───────────────────────┐  ┌─────────────────────┐  ┌──────────┐
│ CalculationSvc │  │ FuelAuditTankStock    │  │  TankVolumeHistory  │  │ Database │
│                │  │ Service               │  │  Table              │  │          │
└───────┬────────┘  └───────────┬───────────┘  └──────────┬──────────┘  └────┬─────┘
        │                       │                         │                  │
        │  GetSiteTankAuditDataAsync(siteId, start, end)  │                  │
        │──────────────────────>│                         │                  │
        │                       │                         │                  │
        │                       │  Query tanks for site   │                  │
        │                       │────────────────────────────────────────────>│
        │                       │                         │                  │
        │                       │  SELECT * FROM tanks WHERE site_id = @siteId
        │                       │<────────────────────────────────────────────│
        │                       │                         │                  │
        │                       │  For each tank:         │                  │
        │                       │                         │                  │
        │                       │  Get Opening Stock      │                  │
        │                       │  (Volume nearest to start with OpeningStock reason)
        │                       │────────────────────────────────────────────>│
        │                       │                         │                  │
        │                       │  SELECT TOP 1 FROM tank_volume_history     │
        │                       │  WHERE tank_id = @tankId                   │
        │                       │    AND timestamp <= @startDate             │
        │                       │    AND reason = 'OpeningStock'             │
        │                       │  ORDER BY timestamp DESC                   │
        │                       │<────────────────────────────────────────────│
        │                       │                         │                  │
        │                       │  Get Closing Stock      │                  │
        │                       │  (Volume nearest to end with ClosingStock reason)
        │                       │────────────────────────────────────────────>│
        │                       │                         │                  │
        │                       │  SELECT TOP 1 FROM tank_volume_history     │
        │                       │  WHERE tank_id = @tankId                   │
        │                       │    AND timestamp <= @endDate               │
        │                       │    AND reason = 'ClosingStock'             │
        │                       │  ORDER BY timestamp DESC                   │
        │                       │<────────────────────────────────────────────│
        │                       │                         │                  │
        │                       │  Get Transactions During Period            │
        │                       │────────────────────────────────────────────>│
        │                       │                         │                  │
        │                       │  SELECT * FROM tank_volume_history         │
        │                       │  WHERE tank_id = @tankId                   │
        │                       │    AND timestamp BETWEEN @start AND @end   │
        │                       │<────────────────────────────────────────────│
        │                       │                         │                  │
        │                       │  Build TankAuditPeriodData                 │
        │                       │  - OpeningVolume                           │
        │                       │  - ClosingVolume                           │
        │                       │  - Deliveries[]                            │
        │                       │  - TransfersIn[]                           │
        │                       │  - TransfersOut[]                          │
        │                       │  - Dispensing[]                            │
        │                       │                         │                  │
        │  List<TankAuditPeriodData>                      │                  │
        │<──────────────────────│                         │                  │
```

### Volume Change Reason Mapping

```
TankVolumeHistory Query by VolumeChangeReasonEnum:

┌───────────────────────────┬───────────────────────────────────────┐
│ VolumeChangeReasonEnum    │ Audit Calculation Usage               │
├───────────────────────────┼───────────────────────────────────────┤
│ OpeningStock              │ Period start volume (auto-populate)   │
│ ClosingStock              │ Period end volume (auto-populate)     │
│ Delivery                  │ Add to expected (+)                   │
│ TransferIn                │ Add to expected (+)                   │
│ TransferOut               │ Subtract from expected (-)            │
│ Dispensing                │ Subtract from expected (-)            │
│ AutomatedDispensing       │ Subtract from expected (-)            │
│ Reconciliation            │ Adjustment (±)                        │
│ AutomatedReconciliation   │ Adjustment (±)                        │
│ Adjustment                │ Adjustment (±)                        │
└───────────────────────────┴───────────────────────────────────────┘
```

---

## 6. Submit Tanker Reading Flow

### Sequence Diagram

```
┌────────┐  ┌─────────────────────┐  ┌──────────────┐  ┌──────────┐
│ Client │  │ SubmitTankerReading │  │  Validation  │  │ Database │
│        │  │ Command             │  │              │  │          │
└───┬────┘  └──────────┬──────────┘  └──────┬───────┘  └────┬─────┘
    │                  │                    │               │
    │  POST /api/fuelaudit/{id}/tanker-reading              │
    │  { tankId: 1, readingType: "Opening", volume: 15000 } │
    │─────────────────>│                    │               │
    │                  │                    │               │
    │                  │  Validate Request  │               │
    │                  │───────────────────>│               │
    │                  │                    │               │
    │                  │  - Check audit exists & not finalized
    │                  │  - Check tank belongs to site      │
    │                  │  - Validate volume > 0             │
    │                  │  - Validate readingType (Opening/Closing)
    │                  │                    │               │
    │                  │  Validation OK     │               │
    │                  │<───────────────────│               │
    │                  │                    │               │
    │                  │  Load existing reading if any      │
    │                  │────────────────────────────────────>│
    │                  │                    │               │
    │                  │  Update or Create FuelAuditTankerReading
    │                  │  - IsAutoPopulated = false         │
    │                  │  - DataSource = "ManualEntry"      │
    │                  │────────────────────────────────────>│
    │                  │                    │               │
    │                  │  If overwriting auto-populated:    │
    │                  │  - Keep history of original        │
    │                  │  - Log the override                │
    │                  │                    │               │
    │  FMSResponse<TankerReadingDTO>        │               │
    │<─────────────────│                    │               │
```

### Manual vs Auto-Populated Priority

```
Reading Priority Logic:

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  When submitting manual reading:                            │
│                                                             │
│  IF existing reading:                                       │
│    IF existing.IsAutoPopulated == true:                     │
│      - Replace with manual reading                          │
│      - Set IsAutoPopulated = false                          │
│      - Set DataSource = "ManualEntry"                       │
│      - Log: "Auto-populated reading overridden"             │
│    ELSE:                                                    │
│      - Update existing manual reading                       │
│      - Log: "Manual reading updated"                        │
│  ELSE:                                                      │
│    - Create new reading                                     │
│    - Set IsAutoPopulated = false                            │
│    - Set DataSource = "ManualEntry"                         │
│                                                             │
│  Manual entries always take precedence over auto-populated  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Finalize Audit Flow

### Sequence Diagram

```
┌────────┐  ┌─────────────────┐  ┌──────────────┐  ┌──────────┐
│ Client │  │ FinalizeAudit   │  │  Validation  │  │ Database │
│        │  │ Command         │  │              │  │          │
└───┬────┘  └────────┬────────┘  └──────┬───────┘  └────┬─────┘
    │                │                  │               │
    │  POST /api/fuelaudit/{id}/finalize│               │
    │───────────────>│                  │               │
    │                │                  │               │
    │                │  Load Audit      │               │
    │                │──────────────────────────────────>│
    │                │                  │               │
    │                │  Validate Status │               │
    │                │─────────────────>│               │
    │                │                  │               │
    │                │  - Status must be "Calculated"   │
    │                │  - All required readings present │
    │                │  - All flags reviewed (optional) │
    │                │                  │               │
    │                │  Validation OK   │               │
    │                │<─────────────────│               │
    │                │                  │               │
    │                │  Update Audit:   │               │
    │                │  - Status = "Finalized"          │
    │                │  - FinalizedAt = DateTime.UtcNow │
    │                │  - FinalizedBy = CurrentUserId   │
    │                │──────────────────────────────────>│
    │                │                  │               │
    │                │  Lock all readings (no more edits)
    │                │──────────────────────────────────>│
    │                │                  │               │
    │  FMSResponse<FuelAuditDTO>        │               │
    │<───────────────│                  │               │
```

### Status Transition Rules

```
Audit Status State Machine:

┌─────────┐     Calculate      ┌────────────┐     Finalize     ┌───────────┐
│  Draft  │───────────────────>│ Calculated │─────────────────>│ Finalized │
└─────────┘                    └────────────┘                  └───────────┘
     │                              │                                │
     │ Cancel                       │ Cancel                         │
     ▼                              ▼                                │
┌─────────┐                    ┌─────────┐                           │
│Cancelled│<───────────────────│Cancelled│                           │
└─────────┘                    └─────────┘                           │
                                                                     │
     ┌───────────────────────────────────────────────────────────────┘
     │
     ▼
  NO CHANGES ALLOWED AFTER FINALIZED
  (Read-only access only)
```

---

## 8. Resolve Flag Flow

### Sequence Diagram

```
┌────────┐  ┌─────────────────┐  ┌──────────────┐  ┌──────────┐
│ Client │  │ ResolveFlag     │  │  Validation  │  │ Database │
│        │  │ Command         │  │              │  │          │
└───┬────┘  └────────┬────────┘  └──────┬───────┘  └────┬─────┘
    │                │                  │               │
    │  POST /api/fuelaudit/flag/{id}/resolve            │
    │  { resolution: "Pump calibration issue confirmed" }
    │───────────────>│                  │               │
    │                │                  │               │
    │                │  Load Flag       │               │
    │                │──────────────────────────────────>│
    │                │                  │               │
    │                │  Validate        │               │
    │                │─────────────────>│               │
    │                │                  │               │
    │                │  - Flag exists   │               │
    │                │  - Flag not already resolved     │
    │                │  - Audit not finalized           │
    │                │  - Resolution text not empty     │
    │                │                  │               │
    │                │  Validation OK   │               │
    │                │<─────────────────│               │
    │                │                  │               │
    │                │  Update Flag:    │               │
    │                │  - Status = "Resolved"           │
    │                │  - Resolution = request.Resolution
    │                │  - ResolvedAt = DateTime.UtcNow  │
    │                │  - ResolvedBy = CurrentUserId    │
    │                │──────────────────────────────────>│
    │                │                  │               │
    │  FMSResponse<FlagDTO>             │               │
    │<───────────────│                  │               │
```

### Flag Severity Levels

```
Flag Severity Classification:

┌────────────┬──────────────────────────────────────────────┐
│ Severity   │ Criteria                                     │
├────────────┼──────────────────────────────────────────────┤
│ Critical   │ Variance > 5% OR Volume > 1000 liters        │
│ High       │ Variance 3-5% OR Volume 500-1000 liters      │
│ Medium     │ Variance 1-3% OR Volume 100-500 liters       │
│ Low        │ Variance < 1% OR Volume < 100 liters         │
└────────────┴──────────────────────────────────────────────┘

Note: Thresholds are configurable via FuelAuditThreshold table
```

---

## 9. Cancel Audit Flow

### Sequence Diagram

```
┌────────┐  ┌─────────────────┐  ┌──────────────┐  ┌──────────┐
│ Client │  │ CancelAudit     │  │  Validation  │  │ Database │
│        │  │ Command         │  │              │  │          │
└───┬────┘  └────────┬────────┘  └──────┬───────┘  └────┬─────┘
    │                │                  │               │
    │  POST /api/fuelaudit/{id}/cancel  │               │
    │  { reason: "Duplicate audit period" }             │
    │───────────────>│                  │               │
    │                │                  │               │
    │                │  Load Audit      │               │
    │                │──────────────────────────────────>│
    │                │                  │               │
    │                │  Validate        │               │
    │                │─────────────────>│               │
    │                │                  │               │
    │                │  - Audit exists  │               │
    │                │  - Status != "Finalized"         │
    │                │  - Reason provided               │
    │                │                  │               │
    │                │  Validation OK   │               │
    │                │<─────────────────│               │
    │                │                  │               │
    │                │  Update Audit:   │               │
    │                │  - Status = "Cancelled"          │
    │                │  - CancellationReason = reason   │
    │                │  - CancelledAt = DateTime.UtcNow │
    │                │  - CancelledBy = CurrentUserId   │
    │                │──────────────────────────────────>│
    │                │                  │               │
    │  FMSResponse<FuelAuditDTO>        │               │
    │<───────────────│                  │               │
```

---

## Error Handling Flows

### GPS API Error Recovery

```
┌────────────────────────────────────────────────────────────┐
│                GPS API Error Handling                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  try:                                                      │
│    response = await GPSGate.GetTracksAsync(vehicleId)      │
│                                                            │
│  catch HttpRequestException:                               │
│    IF status == 429 (Rate Limit):                          │
│      - Wait for Retry-After header value                   │
│      - Retry request                                       │
│    ELIF status == 401 (Unauthorized):                      │
│      - Refresh authentication token                        │
│      - Retry request                                       │
│    ELIF status == 503 (Service Unavailable):               │
│      - Mark vehicle as "DataUnavailable"                   │
│      - Continue with other vehicles                        │
│    ELSE:                                                   │
│      - Log error                                           │
│      - Mark vehicle with HasDataQualityIssue = true        │
│                                                            │
│  catch TimeoutException:                                   │
│    - Retry up to 3 times with exponential backoff          │
│    - Mark vehicle as "Timeout" if all retries fail         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Database Transaction Flow

```
┌────────────────────────────────────────────────────────────┐
│              Database Transaction Pattern                  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  using var transaction = await _context                    │
│      .Database.BeginTransactionAsync();                    │
│                                                            │
│  try:                                                      │
│    // 1. Create/Update main audit record                   │
│    _context.FuelAudits.Add(audit);                         │
│                                                            │
│    // 2. Create tanker readings                            │
│    _context.FuelAuditTankerReadings.AddRange(readings);    │
│                                                            │
│    // 3. Create GPS readings                               │
│    _context.FuelAuditGPSReadings.AddRange(gpsReadings);    │
│                                                            │
│    // 4. Calculate and save variances                      │
│    _context.FuelAuditVariances.AddRange(variances);        │
│                                                            │
│    // 5. Generate and save flags                           │
│    _context.FuelAuditFlags.AddRange(flags);                │
│                                                            │
│    await _context.SaveChangesAsync();                      │
│    await transaction.CommitAsync();                        │
│                                                            │
│  catch Exception:                                          │
│    await transaction.RollbackAsync();                      │
│    throw;                                                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 28, 2025 | Initial sequence flow documentation |
