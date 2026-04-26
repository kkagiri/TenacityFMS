# Fuel Audit System - API Documentation

**Version:** 1.0
**Created:** November 28, 2025
**Status:** Implemented

---

## Table of Contents

1. [Overview](#overview)
2. [Base URL & Authentication](#base-url--authentication)
3. [Response Format](#response-format)
4. [GPS Data Endpoints](#gps-data-endpoints)
5. [CQRS Commands](#cqrs-commands)
6. [CQRS Queries](#cqrs-queries)
7. [Data Transfer Objects (DTOs)](#data-transfer-objects-dtos)
8. [Error Codes](#error-codes)

---

## Overview

The Fuel Audit API provides endpoints for managing fuel audits, retrieving GPS-based fuel sensor data, and performing reconciliation calculations. All endpoints follow REST conventions and return responses wrapped in the `FMSResponse<T>` format.

### Implemented Controllers

| Controller | Route Prefix | Description |
|------------|--------------|-------------|
| `FuelAuditGPSController` | `/api/fuelaudit/gps` | GPS fuel data operations |

### Planned Controllers (Not Yet Implemented)

| Controller | Route Prefix | Description |
|------------|--------------|-------------|
| `FuelAuditController` | `/api/fuelaudit` | Core audit CRUD operations |
| `TankerReadingController` | `/api/fuelaudit/tanker` | Tank reading management |
| `FuelAuditFlagController` | `/api/fuelaudit/flag` | Flag resolution |
| `FuelAuditReportController` | `/api/fuelaudit/report` | Report generation |

---

## Base URL & Authentication

### Base URL

```
Development: https://localhost:5001/api/fuelaudit
Production:  https://api.fms.example.com/api/fuelaudit
```

### Authentication

All endpoints require JWT Bearer token authentication:

```http
Authorization: Bearer <jwt_token>
```

Required permissions for fuel audit operations:
- `_Read_FuelAudit` - View audits and GPS data
- `_Create_FuelAudit` - Create new audits
- `_Update_FuelAudit` - Modify existing audits
- `_Delete_FuelAudit` - Cancel audits
- `_Finalize_FuelAudit` - Finalize audits

---

## Response Format

All API responses use the `FMSResponse<T>` wrapper:

### Success Response

```json
{
  "isSuccess": true,
  "data": {
    // Response payload
  },
  "message": "Operation completed successfully",
  "errors": []
}
```

### Error Response

```json
{
  "isSuccess": false,
  "data": null,
  "message": "Validation failed",
  "errors": [
    "Start date must be before end date",
    "At least one vehicle must be selected"
  ]
}
```

---

## GPS Data Endpoints

### 1. Get Vehicle Fuel Position

Retrieves the current fuel position for a single vehicle.

**Endpoint:** `GET /api/fuelaudit/gps/vehicle/{vehicleId}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| vehicleId | int | Yes | The vehicle ID |

**Response:**

```json
{
  "isSuccess": true,
  "data": {
    "vehicleId": 101,
    "vehicleName": "TRK-001",
    "vehicleCode": "H-12345",
    "currentFuelLevel": 45.5,
    "fuelPercentage": 65,
    "tankCapacity": 70.0,
    "lastUpdated": "2025-11-28T10:30:00Z",
    "position": {
      "latitude": 1.3521,
      "longitude": 103.8198
    },
    "odometer": 125450.5,
    "dataQuality": {
      "score": 95,
      "hasSensorData": true,
      "lastSensorReading": "2025-11-28T10:28:00Z",
      "issues": []
    }
  },
  "message": "Vehicle fuel position retrieved successfully"
}
```

---

### 2. Get Fleet Fuel Positions

Retrieves fuel positions for multiple vehicles in parallel.

**Endpoint:** `POST /api/fuelaudit/gps/fleet`

**Request Body:**

```json
{
  "vehicleIds": [101, 102, 103, 104, 105]
}
```

**Response:**

```json
{
  "isSuccess": true,
  "data": {
    "totalVehicles": 5,
    "successfulRetrievals": 5,
    "failedRetrievals": 0,
    "retrievedAt": "2025-11-28T10:30:00Z",
    "vehicles": [
      {
        "vehicleId": 101,
        "vehicleName": "TRK-001",
        "currentFuelLevel": 45.5,
        "fuelPercentage": 65,
        "tankCapacity": 70.0,
        "lastUpdated": "2025-11-28T10:30:00Z",
        "dataQuality": {
          "score": 95,
          "hasSensorData": true
        }
      },
      {
        "vehicleId": 102,
        "vehicleName": "TRK-002",
        "currentFuelLevel": 32.0,
        "fuelPercentage": 46,
        "tankCapacity": 70.0,
        "lastUpdated": "2025-11-28T10:29:00Z",
        "dataQuality": {
          "score": 90,
          "hasSensorData": true
        }
      }
      // ... more vehicles
    ],
    "summary": {
      "totalFuel": 225.5,
      "averageFuelPercentage": 58,
      "vehiclesWithLowFuel": 1,
      "vehiclesWithSensorIssues": 0
    }
  }
}
```

---

### 3. Get Vehicle Fuel Consumption

Retrieves fuel consumption data for a vehicle over a specified period.

**Endpoint:** `GET /api/fuelaudit/gps/vehicle/{vehicleId}/consumption`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| vehicleId | int | Yes | The vehicle ID |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | DateTime | Yes | Period start (ISO 8601) |
| endDate | DateTime | Yes | Period end (ISO 8601) |

**Example:**

```
GET /api/fuelaudit/gps/vehicle/101/consumption?startDate=2025-11-01T00:00:00Z&endDate=2025-11-30T23:59:59Z
```

**Response:**

```json
{
  "isSuccess": true,
  "data": {
    "vehicleId": 101,
    "vehicleName": "TRK-001",
    "periodStart": "2025-11-01T00:00:00Z",
    "periodEnd": "2025-11-30T23:59:59Z",
    "consumption": {
      "totalConsumed": 850.5,
      "averagePerDay": 28.35,
      "averagePerKm": 0.12,
      "efficiency": "8.3 km/L"
    },
    "mileage": {
      "startOdometer": 118350.0,
      "endOdometer": 125450.5,
      "totalDistance": 7100.5
    },
    "refuels": {
      "count": 12,
      "totalVolume": 840.0,
      "averageVolume": 70.0
    },
    "dataPoints": 8640,
    "dataQuality": {
      "score": 92,
      "missingDataPoints": 150,
      "interpolatedPoints": 45
    }
  }
}
```

---

### 4. Get Vehicle Refuel Events

Detects and returns refueling events for a vehicle.

**Endpoint:** `GET /api/fuelaudit/gps/vehicle/{vehicleId}/refuel-events`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| vehicleId | int | Yes | The vehicle ID |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | DateTime | Yes | Period start (ISO 8601) |
| endDate | DateTime | Yes | Period end (ISO 8601) |

**Response:**

```json
{
  "isSuccess": true,
  "data": [
    {
      "eventId": "REF-001",
      "vehicleId": 101,
      "timestamp": "2025-11-15T14:30:00Z",
      "location": {
        "latitude": 1.3521,
        "longitude": 103.8198,
        "address": "Shell Station, Orchard Road"
      },
      "fuelBefore": 15.5,
      "fuelAfter": 68.0,
      "volumeAdded": 52.5,
      "duration": "00:05:30",
      "confidence": 0.95,
      "detectionMethod": "FuelLevelIncrease",
      "isVerified": true
    },
    {
      "eventId": "REF-002",
      "vehicleId": 101,
      "timestamp": "2025-11-20T09:15:00Z",
      "location": {
        "latitude": 1.2945,
        "longitude": 103.8527,
        "address": "Petron Station, Changi"
      },
      "fuelBefore": 12.0,
      "fuelAfter": 65.5,
      "volumeAdded": 53.5,
      "duration": "00:06:00",
      "confidence": 0.92,
      "detectionMethod": "FuelLevelIncrease",
      "isVerified": false
    }
  ],
  "message": "Found 2 refuel events"
}
```

---

### 5. Refresh Vehicle Fuel Data

Forces a refresh of vehicle fuel data from GPSGate.

**Endpoint:** `POST /api/fuelaudit/gps/vehicle/{vehicleId}/refresh`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| vehicleId | int | Yes | The vehicle ID |

**Response:**

```json
{
  "isSuccess": true,
  "data": {
    "vehicleId": 101,
    "vehicleName": "TRK-001",
    "currentFuelLevel": 45.5,
    "fuelPercentage": 65,
    "lastUpdated": "2025-11-28T10:35:00Z",
    "refreshedAt": "2025-11-28T10:35:00Z",
    "previousReading": {
      "fuelLevel": 46.0,
      "timestamp": "2025-11-28T10:30:00Z"
    }
  },
  "message": "Vehicle fuel data refreshed successfully"
}
```

---

### 6. Check Fuel Sensor Availability

Checks if a vehicle has a fuel sensor configured and working.

**Endpoint:** `GET /api/fuelaudit/gps/vehicle/{vehicleId}/has-fuel-sensor`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| vehicleId | int | Yes | The vehicle ID |

**Response:**

```json
{
  "isSuccess": true,
  "data": {
    "vehicleId": 101,
    "hasFuelSensor": true,
    "sensorType": "CapacitiveFuelSensor",
    "lastSensorReading": "2025-11-28T10:30:00Z",
    "sensorStatus": "Active",
    "calibrationDate": "2025-09-15T00:00:00Z"
  }
}
```

---

### 7. Get Fleet Fuel Positions for Audit Period

Retrieves fleet fuel positions at specific audit period boundaries (opening/closing).

**Endpoint:** `POST /api/fuelaudit/gps/fleet/audit-period`

**Request Body:**

```json
{
  "auditPeriodStart": "2025-11-01T00:00:00Z",
  "auditPeriodEnd": "2025-11-30T23:59:59Z",
  "vehicleIds": [101, 102, 103, 104, 105]
}
```

**Response:**

```json
{
  "isSuccess": true,
  "data": {
    "auditPeriodStart": "2025-11-01T00:00:00Z",
    "auditPeriodEnd": "2025-11-30T23:59:59Z",
    "totalVehicles": 5,
    "vehiclePositions": [
      {
        "vehicleId": 101,
        "vehicleName": "TRK-001",
        "openingPosition": {
          "fuelLevel": 55.0,
          "fuelPercentage": 79,
          "timestamp": "2025-11-01T00:05:00Z",
          "odometer": 118350.0
        },
        "closingPosition": {
          "fuelLevel": 45.5,
          "fuelPercentage": 65,
          "timestamp": "2025-11-30T23:55:00Z",
          "odometer": 125450.5
        },
        "periodConsumption": 850.5,
        "periodDistance": 7100.5,
        "refuelEvents": 12
      }
      // ... more vehicles
    ],
    "fleetSummary": {
      "totalOpeningFuel": 275.0,
      "totalClosingFuel": 225.5,
      "totalConsumption": 4250.0,
      "totalDistance": 35500.0,
      "totalRefuelEvents": 60
    }
  }
}
```

---

## CQRS Commands

### CreateFuelAuditCommand

Creates a new fuel audit.

```csharp
public record CreateFuelAuditCommand(
    int? SiteId,
    DateTime AuditPeriodStart,
    DateTime AuditPeriodEnd,
    List<int> VehicleIds,
    bool AutoPopulateTankReadings = true
) : IRequest<FMSResponse<FuelAuditDTO>>;
```

---

### CalculateAuditCommand

Triggers audit calculation.

```csharp
public record CalculateAuditCommand(
    int AuditId,
    bool RecalculateExisting = false
) : IRequest<FMSResponse<FuelAuditCalculationResultDTO>>;
```

---

### SubmitTankerReadingCommand

Submits or updates a tank reading.

```csharp
public record SubmitTankerReadingCommand(
    int AuditId,
    int TankId,
    string ReadingType,  // "Opening" or "Closing"
    decimal Volume,
    DateTime ReadingDateTime,
    string? Notes = null
) : IRequest<FMSResponse<FuelAuditTankerReadingDTO>>;
```

---

### FinalizeAuditCommand

Finalizes and locks an audit.

```csharp
public record FinalizeAuditCommand(
    int AuditId
) : IRequest<FMSResponse<FuelAuditDTO>>;
```

---

### CancelAuditCommand

Cancels an audit.

```csharp
public record CancelAuditCommand(
    int AuditId,
    string CancellationReason
) : IRequest<FMSResponse<FuelAuditDTO>>;
```

---

### ResolveFlagCommand

Resolves an audit flag.

```csharp
public record ResolveFlagCommand(
    int FlagId,
    string Resolution
) : IRequest<FMSResponse<FuelAuditFlagDTO>>;
```

---

## CQRS Queries

### GetFuelAuditsQuery

Lists audits with filtering.

```csharp
public record GetFuelAuditsQuery(
    int? SiteId = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    string? Status = null,
    int PageNumber = 1,
    int PageSize = 20
) : IRequest<FMSResponse<PagedResult<FuelAuditSummaryDTO>>>;
```

---

### GetFuelAuditByIdQuery

Gets detailed audit by ID.

```csharp
public record GetFuelAuditByIdQuery(
    int AuditId,
    bool IncludeReadings = true,
    bool IncludeVariances = true,
    bool IncludeFlags = true
) : IRequest<FMSResponse<FuelAuditDetailDTO>>;
```

---

### GetAuditThresholdsQuery

Gets current variance thresholds.

```csharp
public record GetAuditThresholdsQuery()
    : IRequest<FMSResponse<List<FuelAuditThresholdDTO>>>;
```

---

## Data Transfer Objects (DTOs)

### VehicleFuelPositionDTO

```csharp
public class VehicleFuelPositionDTO
{
    public int VehicleId { get; set; }
    public string VehicleName { get; set; }
    public string VehicleCode { get; set; }
    public decimal CurrentFuelLevel { get; set; }
    public int FuelPercentage { get; set; }
    public decimal TankCapacity { get; set; }
    public DateTime LastUpdated { get; set; }
    public PositionDTO Position { get; set; }
    public decimal? Odometer { get; set; }
    public FuelDataQuality DataQuality { get; set; }
}

public class PositionDTO
{
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
}
```

---

### FleetFuelPositionDTO

```csharp
public class FleetFuelPositionDTO
{
    public int TotalVehicles { get; set; }
    public int SuccessfulRetrievals { get; set; }
    public int FailedRetrievals { get; set; }
    public DateTime RetrievedAt { get; set; }
    public List<VehicleFuelPositionDTO> Vehicles { get; set; }
    public FleetSummaryDTO Summary { get; set; }
}

public class FleetSummaryDTO
{
    public decimal TotalFuel { get; set; }
    public int AverageFuelPercentage { get; set; }
    public int VehiclesWithLowFuel { get; set; }
    public int VehiclesWithSensorIssues { get; set; }
}
```

---

### VehicleFuelConsumptionDTO

```csharp
public class VehicleFuelConsumptionDTO
{
    public int VehicleId { get; set; }
    public string VehicleName { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public ConsumptionDataDTO Consumption { get; set; }
    public MileageDataDTO Mileage { get; set; }
    public RefuelSummaryDTO Refuels { get; set; }
    public int DataPoints { get; set; }
    public FuelDataQuality DataQuality { get; set; }
}

public class ConsumptionDataDTO
{
    public decimal TotalConsumed { get; set; }
    public decimal AveragePerDay { get; set; }
    public decimal AveragePerKm { get; set; }
    public string Efficiency { get; set; }
}

public class MileageDataDTO
{
    public decimal StartOdometer { get; set; }
    public decimal EndOdometer { get; set; }
    public decimal TotalDistance { get; set; }
}

public class RefuelSummaryDTO
{
    public int Count { get; set; }
    public decimal TotalVolume { get; set; }
    public decimal AverageVolume { get; set; }
}
```

---

### RefuelEventDTO

```csharp
public class RefuelEventDTO
{
    public string EventId { get; set; }
    public int VehicleId { get; set; }
    public DateTime Timestamp { get; set; }
    public LocationDTO Location { get; set; }
    public decimal FuelBefore { get; set; }
    public decimal FuelAfter { get; set; }
    public decimal VolumeAdded { get; set; }
    public TimeSpan Duration { get; set; }
    public double Confidence { get; set; }
    public string DetectionMethod { get; set; }
    public bool IsVerified { get; set; }
}

public class LocationDTO
{
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public string Address { get; set; }
}
```

---

### FuelDataQuality

```csharp
public class FuelDataQuality
{
    public int Score { get; set; }  // 0-100
    public bool HasSensorData { get; set; }
    public DateTime? LastSensorReading { get; set; }
    public int? MissingDataPoints { get; set; }
    public int? InterpolatedPoints { get; set; }
    public List<string> Issues { get; set; }
}
```

---

### FuelAuditDTO

```csharp
public class FuelAuditDTO
{
    public int Id { get; set; }
    public string AuditNumber { get; set; }
    public int? SiteId { get; set; }
    public string SiteName { get; set; }
    public DateTime AuditPeriodStart { get; set; }
    public DateTime AuditPeriodEnd { get; set; }
    public string Status { get; set; }
    public decimal? TotalExpected { get; set; }
    public decimal? TotalActual { get; set; }
    public decimal? TotalVariance { get; set; }
    public decimal? VariancePercentage { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedByName { get; set; }
    public DateTime? FinalizedAt { get; set; }
    public string FinalizedByName { get; set; }
    public List<FuelAuditTankerReadingDTO> TankerReadings { get; set; }
    public List<FuelAuditVarianceDTO> Variances { get; set; }
    public List<FuelAuditFlagDTO> Flags { get; set; }
}
```

---

### TankAuditPeriodData (Internal DTO)

```csharp
public class TankAuditPeriodData
{
    public int TankId { get; set; }
    public string TankName { get; set; }
    public string ProductType { get; set; }
    public decimal Capacity { get; set; }
    public TankVolumeSnapshot OpeningSnapshot { get; set; }
    public TankVolumeSnapshot ClosingSnapshot { get; set; }
    public List<TankVolumeTransaction> Transactions { get; set; }
    public FuelMovementSummary MovementSummary { get; set; }
}

public class TankVolumeSnapshot
{
    public decimal Volume { get; set; }
    public DateTime Timestamp { get; set; }
    public string Reason { get; set; }
    public bool IsInterpolated { get; set; }
}

public class TankVolumeTransaction
{
    public DateTime Timestamp { get; set; }
    public string Reason { get; set; }
    public decimal VolumeChange { get; set; }
    public decimal VolumeAfter { get; set; }
    public string Reference { get; set; }
}

public class FuelMovementSummary
{
    public decimal TotalDeliveries { get; set; }
    public decimal TotalTransfersIn { get; set; }
    public decimal TotalTransfersOut { get; set; }
    public decimal TotalDispensed { get; set; }
    public decimal TotalAdjustments { get; set; }
    public decimal NetChange { get; set; }
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET/PUT/PATCH |
| 201 | Created | Successful POST (create) |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing/invalid JWT |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | State conflict (e.g., finalized audit) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 502 | Bad Gateway | GPS API unavailable |

### Application Error Codes

| Code | Message | Description |
|------|---------|-------------|
| FA001 | AuditNotFound | Requested audit does not exist |
| FA002 | AuditAlreadyFinalized | Cannot modify finalized audit |
| FA003 | InvalidPeriod | End date before start date |
| FA004 | NoVehiclesSelected | At least one vehicle required |
| FA005 | TankNotFound | Tank ID does not exist |
| FA006 | InvalidReadingType | Must be "Opening" or "Closing" |
| FA007 | DuplicateReading | Reading already exists for tank/type |
| FA008 | FlagAlreadyResolved | Flag was already resolved |
| FA009 | GPSDataUnavailable | Cannot retrieve GPS data |
| FA010 | TankHistoryUnavailable | No TankVolumeHistory data |

---

## Rate Limiting

### API Rate Limits

| Endpoint Category | Rate Limit | Window |
|-------------------|------------|--------|
| Single Vehicle GPS | 60 requests | 1 minute |
| Fleet GPS | 10 requests | 1 minute |
| Audit Operations | 30 requests | 1 minute |
| Report Generation | 5 requests | 1 minute |

### GPSGate API Throttling

- Maximum 10 concurrent requests to GPSGate API
- Automatic retry with exponential backoff on 429 responses
- Request queuing for fleet operations

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 28, 2025 | Initial API documentation |
