# Fuel Audit - GPS Data Service Design

**Version:** 1.0  
**Created:** November 27, 2025  
**Status:** Design Phase  

---

## 1. Overview

This document outlines the design for the GPS Data Service that will retrieve historical fuel sensor data from GPSGate for the Fuel Audit system.

### 1.1 Purpose

The service needs to:
- Get **fuel level at a specific date/time** for GPS fleet vehicles
- Support **batch operations** for all GPS vehicles
- Parse sensor variables (fuel level, ignition, etc.) from track data
- Handle edge cases (offline vehicles, missing data)

### 1.2 Existing Infrastructure

| Component | Location | Description |
|-----------|----------|-------------|
| `IGPSService` | `FMS.Application/Features/Vehicle/Services/` | Main GPS interface |
| `GPSGateSensorService` | `FMS.Infrastructure/ExternalServices/GPS/GPSGate/Services/` | Current sensor implementation |
| `GPSGateLocationService` | `FMS.Infrastructure/ExternalServices/GPS/GPSGate/Services/` | Track/location implementation |
| `GPSGateTrack` | `FMS.Infrastructure/VehicleTracking/Models/GPSGate/` | Track point model (**missing Variables**) |
| `GPSGateVariable` | `FMS.Infrastructure/ExternalServices/GPS/GPSGate/` | Variable model for parsing |
| `ParseSensorVariables()` | `GPSGateSensorService.cs` | Existing parser for sensor data |

---

## 2. GPSGate API Reference

### 2.1 Tracks Endpoint

```
GET /applications/{applicationId}/users/{userId}/tracks
    ?Date=2025-10-30
    &From=00:00:00
    &Until=23:59:59
    &Filtered=true
```

**Response:**
```json
[
  {
    "position": {
      "altitude": 0,
      "latitude": -1.2345,
      "longitude": 36.7890
    },
    "serverUtc": "2025-10-30T00:05:23Z",
    "trackInfoId": 12345,
    "uTC": "2025-10-30T00:05:23Z",
    "valid": true,
    "variables": [
      { "name": "fuel level", "type": "double", "time": "...", "value": "150.5" },
      { "name": "ignition", "type": "bool", "time": "...", "value": "true" },
      { "name": "satellitecount", "type": "int", "time": "...", "value": "8" }
    ],
    "velocity": {
      "groundSpeed": 45.5,
      "heading": 180
    }
  }
]
```

### 2.2 TrackInfo Endpoint (for last online status)

```
GET /applications/{applicationId}/users/{userId}/trackinfos?Date=2025-10-30
```

Returns track info with `endPosition` and last track timestamp - useful for determining when vehicle was last online.

---

## 3. Service Design

### 3.1 New Interface: `IFuelAuditGPSService`

**Location:** `FMS.Application/Features/FuelAudit/Services/`

```csharp
namespace FMS.Application.Features.FuelAudit.Services
{
    /// <summary>
    /// GPS Service specifically for Fuel Audit operations
    /// Retrieves historical fuel sensor data for audit reconciliation
    /// </summary>
    public interface IFuelAuditGPSService
    {
        /// <summary>
        /// Get fuel level for a vehicle at a specific date
        /// Returns the first valid fuel reading from track data on that date
        /// </summary>
        /// <param name="vehicleId">FMS Vehicle ID</param>
        /// <param name="date">Target date for fuel reading</param>
        /// <returns>Fuel position with level and metadata</returns>
        Task<FMSResponse<VehicleFuelPositionDTO>> GetVehicleFuelAtDateAsync(int vehicleId, DateTime date);

        /// <summary>
        /// Get fuel levels for multiple vehicles at a specific date (batch)
        /// Used for audit opening/closing stock calculations
        /// </summary>
        /// <param name="vehicleIds">List of FMS Vehicle IDs</param>
        /// <param name="date">Target date for fuel readings</param>
        /// <returns>List of fuel positions for all vehicles</returns>
        Task<FMSResponse<List<VehicleFuelPositionDTO>>> GetFleetFuelAtDateAsync(
            List<int> vehicleIds, DateTime date);

        /// <summary>
        /// Get fuel consumption data for a vehicle over a date range
        /// Aggregates from FuelConsumptionReport (Report ID 208)
        /// </summary>
        Task<FMSResponse<VehicleFuelConsumptionDTO>> GetVehicleConsumptionAsync(
            int vehicleId, DateTime fromDate, DateTime toDate);

        /// <summary>
        /// Detect refuel events for a vehicle over a date range
        /// Identifies fuel level increases from track data
        /// </summary>
        Task<FMSResponse<List<RefuelEventDTO>>> DetectRefuelEventsAsync(
            int vehicleId, DateTime fromDate, DateTime toDate);
    }
}
```

### 3.2 DTOs

**Location:** `FMS.Application/Features/FuelAudit/DTOs/`

```csharp
/// <summary>
/// Fuel position for a vehicle at a specific point in time
/// </summary>
public class VehicleFuelPositionDTO
{
    public int VehicleId { get; set; }
    public string VehicleName { get; set; } = string.Empty;
    public string? NumberPlate { get; set; }
    
    // Fuel Data
    public decimal? FuelLevel { get; set; }          // Liters
    public string FuelLevelUnit { get; set; } = "Liters";
    public DateTime? ReadingTimestamp { get; set; }   // When this reading was taken
    
    // Data Quality
    public FuelDataQuality DataQuality { get; set; }
    public string? DataQualityReason { get; set; }
    
    // Vehicle Status at Reading Time
    public bool WasOnline { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public bool? IgnitionStatus { get; set; }
    
    // For Audit Trail
    public DateTime RequestedDate { get; set; }       // The date we asked for
    public DateTime? ActualDataDate { get; set; }     // The actual date of the data (may differ)
}

public enum FuelDataQuality
{
    /// <summary>Fuel reading from exact requested date</summary>
    Exact = 1,
    
    /// <summary>No data on requested date, used nearest available</summary>
    Interpolated = 2,
    
    /// <summary>Vehicle was offline, no recent data</summary>
    Unavailable = 3,
    
    /// <summary>Vehicle has no fuel sensor</summary>
    NoSensor = 4,
    
    /// <summary>Data exists but fuel variable not in track</summary>
    SensorNotReporting = 5
}

/// <summary>
/// Fuel consumption data for a vehicle over a period
/// </summary>
public class VehicleFuelConsumptionDTO
{
    public int VehicleId { get; set; }
    public string VehicleName { get; set; } = string.Empty;
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    
    // Consumption Metrics
    public decimal? TotalFuelConsumed { get; set; }      // From fuel probe
    public decimal? FlowMeterFuelUsed { get; set; }      // From flow meter (if available)
    public decimal? TotalDistance { get; set; }           // Kilometers
    public decimal? EngineHours { get; set; }
    
    // Calculated
    public decimal? FuelEfficiency { get; set; }          // km/L or L/100km
}

/// <summary>
/// Detected refuel event from GPS data
/// </summary>
public class RefuelEventDTO
{
    public int VehicleId { get; set; }
    public DateTime Timestamp { get; set; }
    public decimal FuelLevelBefore { get; set; }
    public decimal FuelLevelAfter { get; set; }
    public decimal LitresAdded { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? Location { get; set; }
}
```

### 3.3 Implementation: `FuelAuditGPSService`

**Location:** `FMS.Infrastructure/ExternalServices/GPS/GPSGate/Services/`

```csharp
namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services
{
    /// <summary>
    /// GPS service for Fuel Audit - retrieves historical fuel data from GPSGate
    /// </summary>
    public class FuelAuditGPSService : IFuelAuditGPSService
    {
        private readonly GpsdataContext _context;
        private readonly HttpClient _httpClient;
        private readonly IGPSGateConfigurationProvider _configurationProvider;
        private readonly ILogger<FuelAuditGPSService> _logger;

        // Reuse existing parser from GPSGateSensorService
        // Or extract to shared utility class
    }
}
```

---

## 4. Flow Diagrams

### 4.1 Get Fuel Level at Date (Single Vehicle)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ GetVehicleFuelAtDateAsync(vehicleId: 627, date: 2025-10-01)                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Get Vehicle from Database                                                │
│    - Check if GPS vehicle (HasGPSInstalled = 1)                            │
│    - Get ExternalDeviceId from vehicle_provider_mappings                   │
│      (fallback to vehicle.DeviceId)                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │ Has GPS Device?               │
                    └───────────────┬───────────────┘
                          NO │           │ YES
                             ▼           ▼
              ┌──────────────────┐  ┌──────────────────────────────────────────┐
              │ Return:          │  │ 2. Call GPSGate Tracks API               │
              │ DataQuality =    │  │                                          │
              │ NoSensor         │  │ GET /tracks?Date=2025-10-01              │
              └──────────────────┘  │     &From=00:00:00                       │
                                    │     &Until=23:59:59                      │
                                    │     &Filtered=true                       │
                                    └──────────────────────────────────────────┘
                                                        │
                                    ┌───────────────────┴───────────────────┐
                                    │ Has Track Points?                     │
                                    └───────────────────┬───────────────────┘
                                          NO │           │ YES
                                             ▼           ▼
                    ┌────────────────────────────┐  ┌──────────────────────────┐
                    │ 3a. Try Previous Days      │  │ 3b. Find First Track     │
                    │     (up to 7 days back)    │  │     with Fuel Variable   │
                    │                            │  │                          │
                    │ If found:                  │  │ Loop through tracks:     │
                    │   DataQuality=Interpolated │  │   ParseSensorVariables() │
                    │ If not found:              │  │   If fuel level found:   │
                    │   DataQuality=Unavailable  │  │     Return with Exact    │
                    └────────────────────────────┘  └──────────────────────────┘
                                                                │
                                                                ▼
                                    ┌──────────────────────────────────────────┐
                                    │ 4. Build VehicleFuelPositionDTO          │
                                    │    - FuelLevel from parsed variables     │
                                    │    - ReadingTimestamp from track UTC     │
                                    │    - Position from track                 │
                                    │    - DataQuality based on source         │
                                    └──────────────────────────────────────────┘
                                                                │
                                                                ▼
                                    ┌──────────────────────────────────────────┐
                                    │ Return FMSResponse<VehicleFuelPositionDTO>│
                                    └──────────────────────────────────────────┘
```

### 4.2 Get Fleet Fuel at Date (Batch for Audit)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ GetFleetFuelAtDateAsync(vehicleIds: [627, 628, 629...], date: 2025-10-01)  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Get All GPS Vehicles from Database (batch query)                         │
│    SELECT * FROM vehicles v                                                 │
│    JOIN vehicle_provider_mappings vpm ON v.VehicleId = vpm.VehicleId       │
│    WHERE v.VehicleId IN (627, 628, 629...)                                 │
│      AND vpm.IsActive = 1                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. For Each Vehicle (parallel with throttling)                              │
│                                                                              │
│    ┌─────────────────────────────────────────────────────────────────────┐  │
│    │ Call GetVehicleFuelAtDateAsync(vehicleId, date)                     │  │
│    │ (reuse single vehicle logic)                                        │  │
│    └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│    Throttle: Max 10 concurrent API calls to avoid overwhelming GPSGate     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. Aggregate Results                                                         │
│    - Collect all VehicleFuelPositionDTO                                     │
│    - Log any failures/unavailable data                                      │
│    - Return combined list                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Return FMSResponse<List<VehicleFuelPositionDTO>>                            │
│   - Includes all vehicles with their fuel readings                          │
│   - Each entry has DataQuality indicator                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Model Updates Required

### 5.1 Update GPSGateTrack.cs

**Current:** Missing `Variables` property

**Required Update:**
```csharp
// Location: FMS.Infrastructure/VehicleTracking/Models/GPSGate/GPSGateTrack.cs

public class GPSGateTrack
{
    [JsonPropertyName("uTC")]
    public string? UTC { get; set; }

    [JsonPropertyName("position")]
    public GPSGatePosition? Position { get; set; }

    [JsonPropertyName("velocity")]
    public GPSGateVelocity? Velocity { get; set; }

    [JsonPropertyName("valid")]
    public bool Valid { get; set; }

    [JsonPropertyName("serverUtc")]
    public string? ServerUtc { get; set; }

    [JsonPropertyName("trackInfoId")]
    public int TrackInfoId { get; set; }

    // ADD THIS - Variables array containing sensor data
    [JsonPropertyName("variables")]
    public List<GPSGateVariable>? Variables { get; set; }
}
```

### 5.2 Reuse GPSGateVariable

The existing `GPSGateVariable` class works for track variables:
```csharp
// Location: FMS.Infrastructure/ExternalServices/GPS/GPSGate/GPSGateVariable.cs
public class GPSGateVariable
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("time")]
    public string? Time { get; set; }

    [JsonPropertyName("value")]
    public string? Value { get; set; }
}
```

### 5.3 Reuse ParseSensorVariables

Extract from `GPSGateSensorService` to shared utility or call directly:
```csharp
// Existing logic in GPSGateSensorService.ParseSensorVariables()
// Parses: fuel level, rawfuel, batteryvoltage, ignition, satellitecount, etc.
```

---

## 6. Edge Cases & Handling

### 6.1 No Track Data on Requested Date

**Scenario:** Vehicle was offline/parked with no GPS signal on audit date.

**Handling:**
1. Search previous days (up to 7 days back)
2. If found, return with `DataQuality = Interpolated`
3. Add `ActualDataDate` to show when data is from
4. If no data in 7 days, return `DataQuality = Unavailable`

### 6.2 Track Exists but No Fuel Variable

**Scenario:** GPS is reporting location but fuel sensor not transmitting.

**Handling:**
1. Check all track points for the day
2. If no fuel variable in any track, return `DataQuality = SensorNotReporting`
3. Other sensor data (ignition, position) can still be returned

### 6.3 Vehicle Not in GPS Fleet

**Scenario:** Vehicle ID provided but vehicle has no GPS device.

**Handling:**
1. Check `HasGPSInstalled` flag and provider mappings
2. Return immediately with `DataQuality = NoSensor`
3. Don't attempt GPSGate API call

### 6.4 Multiple Fuel Readings on Same Date

**Scenario:** Many track points throughout the day, each with fuel level.

**Handling for Opening Stock:**
- Use FIRST valid fuel reading of the day (earliest timestamp)

**Handling for Closing Stock:**
- Use LAST valid fuel reading of the day (latest timestamp)

**API Parameter:**
- For opening: `From=00:00:00&Until=06:00:00` (first 6 hours)
- For closing: `From=18:00:00&Until=23:59:59` (last 6 hours)

---

## 7. Integration with Fuel Audit

### 7.1 How Audit Will Use This Service

```csharp
// In FuelAuditCalculationService

public async Task<AuditResult> CalculateGPSFleetPositionAsync(
    int auditId, DateTime auditStartDate, DateTime auditEndDate)
{
    // 1. Get all GPS fleet vehicle IDs
    var gpsVehicleIds = await _context.Vehicles
        .Where(v => v.HasGPSInstalled == 1 && v.IsActive == 1)
        .Select(v => v.VehicleId)
        .ToListAsync();

    // 2. Get opening fuel positions
    var openingPositions = await _fuelAuditGPSService
        .GetFleetFuelAtDateAsync(gpsVehicleIds, auditStartDate);

    // 3. Get closing fuel positions
    var closingPositions = await _fuelAuditGPSService
        .GetFleetFuelAtDateAsync(gpsVehicleIds, auditEndDate);

    // 4. Get consumption data for the period
    // Uses existing FuelConsumptionReportDto (Report ID 208)

    // 5. Calculate reconciliation per vehicle
    foreach (var vehicle in gpsVehicleIds)
    {
        var opening = openingPositions.FirstOrDefault(p => p.VehicleId == vehicle);
        var closing = closingPositions.FirstOrDefault(p => p.VehicleId == vehicle);
        
        // Expected = Opening + Refueled - Consumed
        // Variance = Actual Closing - Expected
    }
}
```

---

## 8. File Structure

```
FMS.Application/
├── Features/
│   └── FuelAudit/
│       ├── Services/
│       │   └── IFuelAuditGPSService.cs          # Interface
│       └── DTOs/
│           ├── VehicleFuelPositionDTO.cs        # Fuel position at point in time
│           ├── VehicleFuelConsumptionDTO.cs     # Consumption over period
│           └── RefuelEventDTO.cs                # Detected refuel events

FMS.Infrastructure/
├── ExternalServices/
│   └── GPS/
│       └── GPSGate/
│           └── Services/
│               └── FuelAuditGPSService.cs       # Implementation
│
└── VehicleTracking/
    └── Models/
        └── GPSGate/
            └── GPSGateTrack.cs                  # UPDATE: Add Variables property
```

---

## 9. Dependencies

| Dependency | Status | Action Required |
|------------|--------|-----------------|
| `GPSGateTrack.cs` | Needs update | Add `Variables` property |
| `GPSGateVariable.cs` | ✅ Exists | Reuse as-is |
| `ParseSensorVariables()` | ✅ Exists | Reuse or extract to utility |
| `IGPSGateConfigurationProvider` | ✅ Exists | Reuse for API auth |
| `vehicle_provider_mappings` | ✅ Exists | Use for device ID lookup |

---

## 10. Next Steps

1. [ ] Update `GPSGateTrack.cs` to add `Variables` property
2. [ ] Create `IFuelAuditGPSService` interface
3. [ ] Create DTOs (`VehicleFuelPositionDTO`, etc.)
4. [ ] Implement `FuelAuditGPSService`
5. [ ] Register service in DI container
6. [ ] Write unit tests
7. [ ] Integration test with actual GPSGate API

---

## 11. Open Questions

| # | Question | Notes |
|---|----------|-------|
| 1 | Should we cache fuel readings? | Avoid repeated API calls for same date |
| 2 | What's the throttle limit for GPSGate API? | Avoid rate limiting |
| 3 | How far back should we search for data? | Currently proposed: 7 days |
| 4 | Should we store historical readings in FMS? | For faster future audits |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Nov 27, 2025 | | Initial design |
