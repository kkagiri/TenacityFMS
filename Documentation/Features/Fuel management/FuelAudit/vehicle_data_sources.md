# Vehicle Fuel Data Sources - Fuel Audit System

## Overview

This document details the data sources for vehicle fuel positions in the Fuel Audit system.

---

## GPS Data Source Comparison

For vehicles with GPS, we have **three potential data sources** for fuel levels. Understanding when to use each is critical for accurate fuel audits.

### Available Data Sources

| Data Source | API Type | What It Provides | Best For |
|-------------|----------|------------------|----------|
| **GPSGate REST API** | Real-time | Fuel level at any specific moment | Opening/Closing readings |
| **GPSGate SOAP Report 212** | Batch | FuelBefore & FuelAfter at refuel events | Refuel validation |
| **Manual FuelRefill Table** | Database | Recorded fuel entries (timestamps unreliable) | Fuel dispensed amount |

### Decision Matrix: Which Source for What?

| Data Point | Recommended Source | Why | Fallback |
|------------|-------------------|-----|----------|
| **Opening Fuel** (Period Start) | GPSGate REST API | Real-time reading at 00:00-06:00 | Manual FuelRefill + Estimation |
| **Closing Fuel** (Period End) | GPSGate REST API | Real-time reading at 18:00-23:59 | Manual FuelRefill + Estimation |
| **Fuel Before Refuel** | GPSGate SOAP Report 212 | `FuelBefore` column | GPSGate REST (nearest track) |
| **Fuel After Refuel** | GPSGate SOAP Report 212 | `FuelAfter` column | GPSGate REST (nearest track) |
| **Refuel Volume (GPS)** | GPSGate SOAP Report 212 | `RefillVolume` column | FuelAfter - FuelBefore |
| **Refuel Volume (Recorded)** | Manual FuelRefill Table | `FuelAmount` column | N/A |

### Current Implementation Strategy

The `FuelAuditGPSService` implements the following strategy:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    FUEL POSITION DATA SOURCE HIERARCHY                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │ STEP 1: Check Cache                                                        │ │
│  │   - FuelPositionCacheService.TryGetCachedPosition()                        │ │
│  │   - If found and valid → Return cached position                            │ │
│  └───────────────────────────────┬────────────────────────────────────────────┘ │
│                                  │ Not in cache                                  │
│                                  ▼                                               │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │ STEP 2: Get Device Mapping                                                 │ │
│  │   - Look up VehicleProviderMappings for GPSGate device ID                  │ │
│  │   - If no mapping → Fall back to legacy vehicle table                      │ │
│  └───────────────────────────────┬────────────────────────────────────────────┘ │
│                                  │ Has device mapping                            │
│                                  ▼                                               │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │ STEP 3: Fetch from GPSGate REST API                                        │ │
│  │   - FetchFuelPositionFromGPSGateAsync()                                    │ │
│  │   - Opening: GET /tracks?Date=YYYY-MM-DD&From=00:00:00&Until=06:00:00      │ │
│  │   - Closing: GET /tracks?Date=YYYY-MM-DD&From=18:00:00&Until=23:59:59      │ │
│  │   - Returns first/last track with "Fuel level" variable                    │ │
│  │   - If data on date → DataQuality = "Exact"                                │ │
│  │   - If data from prior days → DataQuality = "Interpolated"                 │ │
│  └───────────────────────────────┬────────────────────────────────────────────┘ │
│                                  │ No GPS data found                             │
│                                  ▼                                               │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │ STEP 4: Fallback to Manual FuelRefill                                      │ │
│  │   - TryGetFuelFromManualRefillAsync()                                      │ │
│  │   - Find nearest FuelRefill entry                                          │ │
│  │   - Opening: Find closest refill BEFORE the date                           │ │
│  │   - Closing: Find closest refill AFTER the date                            │ │
│  │   - DataSource = "Manual"                                                  │ │
│  │   - DataQuality = "Low" (timestamps not accurate)                          │ │
│  └───────────────────────────────┬────────────────────────────────────────────┘ │
│                                  │ No manual data                                │
│                                  ▼                                               │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │ STEP 5: Return Unavailable                                                 │ │
│  │   - DataQuality = "Unavailable"                                            │ │
│  │   - Reason = "No GPS or manual data available"                             │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Data Quality Indicators

| Quality Level | Meaning | Confidence | When Applied |
|---------------|---------|------------|--------------|
| `Exact` | Data from requested date | **HIGH** | GPS data on same date |
| `Interpolated` | Data from nearby date | **MEDIUM** | GPS data 1-7 days prior |
| `Low` | From manual entry | **LOW** | Manual FuelRefill fallback |
| `Unavailable` | No data at all | **NONE** | Vehicle offline/no records |
| `NoSensor` | GPS active but no fuel | **NONE** | GPS installed but no sensor |
| `SensorNotReporting` | Sensor exists but silent | **NONE** | Sensor malfunction |

### Key Code Reference

```csharp
// Location: FMS.Infrastructure/ExternalServices/GPS/GPSGate/Services/FuelAuditGPSService.cs

// Main entry point - uses hierarchy above
public async Task<VehicleFuelPositionDTO> GetVehicleFuelAtDateAsync(
    int vehicleId,
    DateTime date,
    string readingType,  // "opening" or "closing"
    ...)

// Opening: First track 00:00-06:00 with fuel data
// Closing: Last track 18:00-23:59 with fuel data
// Searches back up to 7 days for closing, 1 day for opening
```

### SOAP Report 212 vs REST API

| Aspect | REST API (Tracks) | SOAP Report 212 |
|--------|-------------------|-----------------|
| **Data Type** | Point-in-time fuel readings | Refuel event detection |
| **Use Case** | Opening/Closing snapshots | Validate refuel amounts |
| **Accuracy** | Exact timestamp | Event-based (refuel duration) |
| **Fields** | `FuelLevel`, `Timestamp`, `Position` | `FuelBefore`, `FuelAfter`, `RefillVolume` |
| **Storage** | Not stored (on-demand) | Stored in `gpsgate_report_entries` |
| **Vehicles** | Site vehicles with GPSGate | Any company vehicle with GPSGate |

### Recommended Approach for Fuel Audit

1. **Opening/Closing Stock**: Use **GPSGate REST API** (via `FuelAuditGPSService`)
   - Provides exact fuel level at time window (morning/evening)
   - Has intelligent fallback with quality indicators

2. **Refuel Validation**: Use **GPSGate SOAP Report 212** (via `GpsGateReportEntry`)
   - Compare `RefillVolume` with `FuelRefill.FuelAmount`
   - Detect unrecorded refuels or discrepancies

3. **Fuel Dispensed**: Use **Manual FuelRefill Table**
   - This is the authoritative source for what was actually dispensed
   - Timestamps may not be exact but amounts are accurate

4. **Cross-Site Vehicles**: Use **GPSGate SOAP Report 212** only
   - REST API doesn't apply (vehicle not tracked at this site)
   - Report 212 data available for any company vehicle with GPS

---

### Vehicle Classification Matrix

Vehicles are classified based on these key properties from `Vehicle.cs`:

| Property | Field | Description |
|----------|-------|-------------|
| **Site Assignment** | `WorkingSiteId` | Which site the vehicle belongs to |
| **Company Owned** | `IsCompanyVehicle` | Is this a company-owned vehicle? |
| **Full Tank Policy** | `IsFullTankPolicy` | ✅ **NEW** Explicit full tank policy flag |
| **Measurement Type** | `AverageKmL` | True = km/L (vehicles), False = L/hr (equipment) - **legacy fallback** |
| **GPS Tracking** | `VehicleProviderMappings` | ✅ **NEW** Modern GPS detection via provider mappings |
| **Tank Capacity** | `FuelTankCapacity` | ✅ **NEW** Vehicle tank size for estimates |
| **Legacy GPS** | `HasGPSInstalled` / `DeviceId` | ⚠️ **Deprecated** - used as fallback only |

### Classification Logic (Implemented)

```csharp
// Location: FMS.Application/Features/FuelAudit/Queries/GetTankRefillsForPeriodQuery.cs

// GPS Detection: Modern VehicleProviderMappings OR legacy fields
var hasModernGps = vehiclesWithGps.Contains(vehicleId);  // From VehicleProviderMappings
var hasLegacyGps = vehicle?.HasGPSInstalled == true || vehicle?.DeviceId.HasValue == true;
var hasGPS = hasModernGps || hasLegacyGps;

// Full Tank Policy: Explicit flag OR legacy AverageKmL
var isFullTankPolicy = vehicle?.IsFullTankPolicy ?? false;

// Category 2 logic: Uses IsFullTankPolicy OR falls back to IsKmL
if (atSite && !hasGPS && (isFullTankPolicy || isKmL))
{
    return (2, "Site Full Tank (No GPS)", "Estimated", "MEDIUM");
}
```

### Vehicle Categories for Fuel Audit

| Category | At Audit Site | IsCompany | HasGPS | IsFullTankPolicy | Data Source | Confidence |
|----------|---------------|-----------|--------|------------------|-------------|------------|
| **1. Site GPS Fleet** | ✅ Yes | ✅ Yes | ✅ Yes | - | GPSGate REST API | **HIGH** |
| **2. Site Full Tank (No GPS)** | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes OR IsKmL=true | Estimated | **MEDIUM** |
| **3. Site Equipment (No GPS)** | ✅ Yes | ✅ Yes | ❌ No | ❌ No AND IsKmL=false | FuelRefill only | **LOW** |
| **4. Cross-Site Company** | ❌ No | ✅ Yes | ✅/❌ | - | GPS_SOAP/FuelRefill | **HIGH** |
| **5. External Non-Company** | ❌ No | ❌ No | ❌ No | - | FuelRefill only | **ACCOUNTED** |

---

## 1. GPS Vehicles (Full Telemetry)

### Data Fields Available

| Field | Source | Table/API | Period Point |
|-------|--------|-----------|--------------|
| Opening Fuel Level | GPS Sensor | GPSGate → track_points | Period Start |
| Closing Fuel Level | GPS Sensor | GPSGate → track_points | Period End |
| Fuel Consumed (GPS) | GPS Calculation | GPSGate API | Period |
| Distance Traveled | GPS Odometer | GPSGate → track_points | Period |
| Fuel Refueled (Detected) | GPS Fuel Jumps | GPSGate Algorithm | Period |
| Fuel Refueled (Recorded) | Manual Entry | FuelRefill table | Period |
| Refuel Count | FuelRefill | FuelRefill table | Period |
| Fuel Efficiency | Calculated | Distance / Consumed | Period |

### Data Collection Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      GPS VEHICLE DATA FLOW                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐      ┌──────────────────┐                     │
│  │   GPSGate API    │      │   FuelRefill     │                     │
│  │  (External API)  │      │    (Database)    │                     │
│  └────────┬─────────┘      └────────┬─────────┘                     │
│           │                         │                                │
│           ▼                         ▼                                │
│  ┌──────────────────────────────────────────────────────┐           │
│  │              Period Start (Opening)                   │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │  Opening Fuel Level = GPS reading at 00:00           │           │
│  │  Opening Data Quality = Exact/Interpolated/Low       │           │
│  │  Opening Source = "GPS"                              │           │
│  └──────────────────────────────────────────────────────┘           │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────────────────────────────────────────┐           │
│  │              During Period (Movements)                │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │  Fuel Refueled (GPS) = SUM(fuel jumps > 10L)         │           │
│  │  Fuel Refueled (Rec) = SUM(FuelRefill.FuelAmount)    │           │
│  │  Fuel Consumed = Opening - Closing + Refueled        │           │
│  │  Distance = GPS odometer difference                  │           │
│  │  Refuel Mismatch = GPS Detected - Recorded           │           │
│  └──────────────────────────────────────────────────────┘           │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────────────────────────────────────────┐           │
│  │              Period End (Closing)                     │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │  Closing Fuel Level = GPS reading at 23:59           │           │
│  │  Closing Data Quality = Exact/Interpolated/Low       │           │
│  │  Closing Source = "GPS"                              │           │
│  └──────────────────────────────────────────────────────┘           │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────────────────────────────────────────┐           │
│  │              Variance Calculation                     │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │  Expected Closing = Opening + Refueled - Consumed    │           │
│  │  Variance = Actual Closing - Expected Closing        │           │
│  │  Variance % = (Variance / Opening) × 100             │           │
│  └──────────────────────────────────────────────────────┘           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### SQL Data Query (GPS Vehicle)

```sql
-- Opening position from GPS
SELECT
    v.VehicleId,
    v.VehicleCode,
    v.NumberPlate,
    v.Capacity AS TankCapacity,
    -- GPS data comes from FuelAuditGPSService API call
    gps_opening.FuelLevel AS OpeningStock,
    gps_opening.ReadingTime AS OpeningReadingTime,
    gps_opening.DataQuality AS OpeningDataQuality,
    gps_closing.FuelLevel AS ClosingStock,
    gps_closing.ReadingTime AS ClosingReadingTime,
    gps_closing.DataQuality AS ClosingDataQuality,
    -- From FuelRefill table
    COALESCE(refill_sum.TotalFuel, 0) AS FuelRefueled,
    COALESCE(refill_sum.RefillCount, 0) AS RefuelCount
FROM vehicles v
LEFT JOIN (
    SELECT
        VehicleId,
        SUM(FuelAmount) AS TotalFuel,
        COUNT(*) AS RefillCount
    FROM fuelrefill
    WHERE RefillDate BETWEEN @StartDate AND @EndDate
    GROUP BY VehicleId
) refill_sum ON v.VehicleId = refill_sum.VehicleId
WHERE v.HasGPSInstalled = 1
  AND v.IsActive = 1
  AND v.WorkingSiteId = @SiteId
```

### API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/FuelAuditGPS/vehicle/{id}` | Single vehicle current fuel position |
| `POST /api/v1/FuelAuditGPS/fleet/audit-period` | Fleet opening/closing for date range |
| `GET /api/v1/FuelAuditGPS/vehicle/{id}/consumption` | Consumption over period |
| `GET /api/v1/FuelAuditGPS/vehicle/{id}/refuel-events` | Detected refuel events |

---

## 2. Full Tank Vehicles (No GPS, IsKmL = True)

### Policy Assumption
> **Full Tank Policy**: Vehicle is always refueled to full tank.
> Therefore: **Consumption = Amount Refueled Since Last Fill**

### Data Fields Available

| Field | Source | Table | Derivation |
|-------|--------|-------|------------|
| Opening Fuel Level | **Estimated** | FuelRefill | Tank Capacity - Estimated Used |
| Closing Fuel Level | **Estimated** | FuelRefill | Tank Capacity - Estimated Used |
| Fuel Consumed | **Recorded** | FuelRefill | = Total Refill Amount |
| Distance Traveled | Manual Entry | FuelRefill | Odometer diff |
| Fuel Refueled | Manual Entry | FuelRefill | SUM(FuelAmount) |
| Fuel Efficiency | Calculated | FuelRefill | Distance / Fuel |

### Data Collection Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│              FULL TANK VEHICLE (NO GPS) DATA FLOW                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐      ┌──────────────────┐                     │
│  │    FuelRefill    │      │     Vehicles     │                     │
│  │    (Database)    │      │    (Capacity)    │                     │
│  └────────┬─────────┘      └────────┬─────────┘                     │
│           │                         │                                │
│           ▼                         ▼                                │
│  ┌──────────────────────────────────────────────────────┐           │
│  │              Period Start (Opening)                   │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │                                                       │           │
│  │  CASE 1: Refuel ON start date                        │           │
│  │    Opening = Tank Capacity (just filled)              │           │
│  │    Confidence = HIGH                                  │           │
│  │                                                       │           │
│  │  CASE 2: Refuel BEFORE start date                    │           │
│  │    Last Refuel Date = most recent before start        │           │
│  │    Days Since = StartDate - LastRefuelDate           │           │
│  │    Avg Daily Use = Tank Capacity / Avg Refuel Days    │           │
│  │    Estimated Used = Days Since × Avg Daily Use        │           │
│  │    Opening = Tank Capacity - Estimated Used           │           │
│  │    Confidence = MEDIUM/LOW (based on days)            │           │
│  │                                                       │           │
│  └──────────────────────────────────────────────────────┘           │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────────────────────────────────────────┐           │
│  │              During Period (Movements)                │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │                                                       │           │
│  │  KEY INSIGHT (Full Tank Policy):                     │           │
│  │  ┌─────────────────────────────────────────────────┐ │           │
│  │  │  Fuel Added = Fuel Consumed Since Last Fill     │ │           │
│  │  └─────────────────────────────────────────────────┘ │           │
│  │                                                       │           │
│  │  Fuel Refueled = SUM(FuelRefill.FuelAmount)          │           │
│  │  Fuel Consumed = Fuel Refueled (same value!)         │           │
│  │  Distance = SUM(CurrentOdo - PreviousOdo)            │           │
│  │  Efficiency = Distance / Fuel Consumed               │           │
│  │                                                       │           │
│  └──────────────────────────────────────────────────────┘           │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────────────────────────────────────────┐           │
│  │              Period End (Closing)                     │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │                                                       │           │
│  │  CASE 1: Refuel ON end date                          │           │
│  │    Closing = Tank Capacity (just filled)              │           │
│  │    Confidence = HIGH                                  │           │
│  │                                                       │           │
│  │  CASE 2: Refuel BEFORE end date                      │           │
│  │    Last Refuel Date = most recent before/on end      │           │
│  │    Days Since = EndDate - LastRefuelDate             │           │
│  │    Estimated Used = Days Since × Avg Daily Use        │           │
│  │    Closing = Tank Capacity - Estimated Used           │           │
│  │    Confidence = MEDIUM/LOW (based on days)            │           │
│  │                                                       │           │
│  └──────────────────────────────────────────────────────┘           │
│                                                                      │
│  ┌──────────────────────────────────────────────────────┐           │
│  │              Confidence Scoring                       │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │  Days Since Last Refuel | Confidence                  │           │
│  │  ─────────────────────────────────────                │           │
│  │  0-3 days              | HIGH (>80%)                  │           │
│  │  4-7 days              | MEDIUM (50-80%)              │           │
│  │  8+ days               | LOW (<50%)                   │           │
│  └──────────────────────────────────────────────────────┘           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### SQL Data Query (Full Tank Vehicle)

```sql
-- Full Tank Vehicle with estimation
WITH VehicleRefills AS (
    SELECT
        fr.VehicleId,
        fr.RefillDate,
        fr.FuelAmount,
        fr.CurrentMeter,
        fr.PreviousMeter,
        LAG(fr.RefillDate) OVER (PARTITION BY fr.VehicleId ORDER BY fr.RefillDate) AS PrevRefillDate
    FROM fuelrefill fr
    WHERE fr.VehicleId = @VehicleId
),
RefillStats AS (
    SELECT
        VehicleId,
        AVG(DATEDIFF(RefillDate, PrevRefillDate)) AS AvgRefillIntervalDays
    FROM VehicleRefills
    WHERE PrevRefillDate IS NOT NULL
    GROUP BY VehicleId
),
PeriodRefills AS (
    SELECT
        VehicleId,
        SUM(FuelAmount) AS TotalFuel,
        COUNT(*) AS RefillCount,
        SUM(CurrentMeter - PreviousMeter) AS TotalDistance,
        MIN(RefillDate) AS FirstRefillDate,
        MAX(RefillDate) AS LastRefillDate
    FROM VehicleRefills
    WHERE RefillDate BETWEEN @StartDate AND @EndDate
    GROUP BY VehicleId
)
SELECT
    v.VehicleId,
    v.VehicleCode,
    v.Capacity AS TankCapacity,
    v.AverageKmL AS IsKmL,

    -- Opening calculation
    CASE
        WHEN EXISTS (SELECT 1 FROM VehicleRefills WHERE RefillDate = @StartDate)
        THEN CAST(v.Capacity AS DECIMAL(10,2))
        ELSE CAST(v.Capacity AS DECIMAL(10,2)) -
             (DATEDIFF(@StartDate, (SELECT MAX(RefillDate) FROM VehicleRefills WHERE RefillDate < @StartDate))
              * (CAST(v.Capacity AS DECIMAL(10,2)) / COALESCE(rs.AvgRefillIntervalDays, 7)))
    END AS OpeningStock,

    -- Closing calculation
    CASE
        WHEN pr.LastRefillDate = @EndDate
        THEN CAST(v.Capacity AS DECIMAL(10,2))
        ELSE CAST(v.Capacity AS DECIMAL(10,2)) -
             (DATEDIFF(@EndDate, pr.LastRefillDate)
              * (CAST(v.Capacity AS DECIMAL(10,2)) / COALESCE(rs.AvgRefillIntervalDays, 7)))
    END AS ClosingStock,

    -- Movements (Full Tank: Consumed = Refueled)
    pr.TotalFuel AS FuelRefueled,
    pr.TotalFuel AS FuelConsumed,  -- Same for full tank!
    pr.TotalDistance AS DistanceTraveled,
    pr.RefillCount,

    -- Confidence
    CASE
        WHEN DATEDIFF(@EndDate, pr.LastRefillDate) <= 3 THEN 'HIGH'
        WHEN DATEDIFF(@EndDate, pr.LastRefillDate) <= 7 THEN 'MEDIUM'
        ELSE 'LOW'
    END AS EstimationConfidence

FROM vehicles v
LEFT JOIN RefillStats rs ON v.VehicleId = rs.VehicleId
LEFT JOIN PeriodRefills pr ON v.VehicleId = pr.VehicleId
WHERE v.VehicleId = @VehicleId
  AND v.AverageKmL = 1  -- Full tank policy
  AND v.HasGPSInstalled = 0
```

---

## 3. Non-Full Tank Vehicles (No GPS, IsKmL = False)

### Policy Reality
> **Partial Fill Policy**: Equipment/machinery filled with varied amounts.
> **No direct consumption tracking** - can only track fuel issued.

### Data Fields Available

| Field | Source | Table | Accuracy |
|-------|--------|-------|----------|
| Opening Fuel Level | **Unknown** | N/A | ❌ Cannot determine |
| Closing Fuel Level | **Unknown** | N/A | ❌ Cannot determine |
| Fuel Consumed | **Unknown** | N/A | ❌ Cannot determine |
| Hours Operated | Manual Entry | FuelRefill | ⚠️ If recorded |
| Fuel Refueled | Manual Entry | FuelRefill | ✅ Accurate |
| Fuel Efficiency | **Estimated** | Historical | ⚠️ Based on history |

### Data Collection Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│           NON-FULL TANK VEHICLE (NO GPS) DATA FLOW                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ⚠️  LIMITED DATA - CANNOT RECONCILE PROPERLY                       │
│                                                                      │
│  ┌──────────────────┐                                               │
│  │    FuelRefill    │                                               │
│  │    (Database)    │                                               │
│  └────────┬─────────┘                                               │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────────────────────────────────────────┐           │
│  │              What We CAN Track                        │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │  ✅ Fuel Issued = SUM(FuelRefill.FuelAmount)         │           │
│  │  ✅ Refill Count = COUNT(FuelRefill)                 │           │
│  │  ⚠️ Hours = SUM(CurrentMeter - PreviousMeter)        │           │
│  │       (If odometer type = hours)                      │           │
│  └──────────────────────────────────────────────────────┘           │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────────────────────────────────────────┐           │
│  │              What We CANNOT Track                     │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │  ❌ Opening Fuel Level - Unknown                     │           │
│  │  ❌ Closing Fuel Level - Unknown                     │           │
│  │  ❌ Actual Consumption - Cannot verify               │           │
│  │  ❌ Dead Stock - Cannot calculate                    │           │
│  └──────────────────────────────────────────────────────┘           │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────────────────────────────────────────┐           │
│  │              Audit Treatment                          │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │                                                       │           │
│  │  OPTION A: Exclude from reconciliation               │           │
│  │    - Don't include in fleet dead stock               │           │
│  │    - Only track fuel issued (tanker output)          │           │
│  │                                                       │           │
│  │  OPTION B: Use estimated consumption                 │           │
│  │    - Historical L/hr rate × hours operated           │           │
│  │    - Flag as "ESTIMATED" with LOW confidence         │           │
│  │    - Accept significant variance possibility          │           │
│  │                                                       │           │
│  │  OPTION C: Manual audit adjustment                   │           │
│  │    - Physical tank check at period end               │           │
│  │    - User enters manual reading                      │           │
│  │                                                       │           │
│  └──────────────────────────────────────────────────────┘           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### SQL Data Query (Non-Full Tank Vehicle)

```sql
-- Non-Full Tank Vehicle - Limited data
SELECT
    v.VehicleId,
    v.VehicleCode,
    v.Capacity AS TankCapacity,
    'Equipment/Machinery' AS VehicleCategory,

    -- What we CAN track
    COALESCE(pr.TotalFuel, 0) AS FuelRefueled,
    COALESCE(pr.RefillCount, 0) AS RefillCount,
    COALESCE(pr.TotalHours, 0) AS HoursOperated,

    -- What we CANNOT track (null/estimated)
    NULL AS OpeningStock,
    NULL AS ClosingStock,
    NULL AS FuelConsumed,

    -- Historical estimate for reference only
    COALESCE(hist.AvgLPerHour, 0) * pr.TotalHours AS EstimatedConsumption,

    -- Flags
    'LOW' AS DataConfidence,
    'No GPS, partial fills - cannot reconcile' AS AuditNote

FROM vehicles v
LEFT JOIN (
    SELECT
        VehicleId,
        SUM(FuelAmount) AS TotalFuel,
        COUNT(*) AS RefillCount,
        SUM(CurrentMeter - PreviousMeter) AS TotalHours
    FROM fuelrefill
    WHERE RefillDate BETWEEN @StartDate AND @EndDate
    GROUP BY VehicleId
) pr ON v.VehicleId = pr.VehicleId
LEFT JOIN (
    -- Historical average from last 90 days
    SELECT
        VehicleId,
        SUM(FuelAmount) / NULLIF(SUM(CurrentMeter - PreviousMeter), 0) AS AvgLPerHour
    FROM fuelrefill
    WHERE RefillDate >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
    GROUP BY VehicleId
) hist ON v.VehicleId = hist.VehicleId
WHERE v.VehicleId = @VehicleId
  AND v.AverageKmL = 0  -- Not full tank policy
  AND v.HasGPSInstalled = 0
```

---

## 4. Cross-Site Company Vehicles (IsCompanyVehicle = 1, Different Site)

### Scenario

> Company-owned vehicles that are assigned to a different site but occasionally fuel at the audit site.
> Since they are company vehicles with GPS, we can get accurate fuel data using **GPSGate SOAP Report 212**.

### Key Identifier

```sql
WHERE v.IsCompanyVehicle = 1
  AND v.WorkingSiteId != @AuditSiteId
  AND EXISTS (SELECT 1 FROM fuelrefill WHERE VehicleId = v.VehicleId AND TankId IN (@AuditSiteTanks))
```

### Data Fields Available

| Field | Source | How to Get | Confidence |
|-------|--------|------------|------------|
| Opening Fuel Level | GPSGate Report 212 | `GpsGateReportEntry.FuelBefore` at first refuel | **HIGH** |
| Closing Fuel Level | GPSGate Report 212 | `GpsGateReportEntry.FuelBefore` at next refuel | **HIGH** |
| Fuel Issued (This Site) | FuelRefill | `SUM(FuelAmount)` from audit site tanks | **HIGH** |
| Total Fuel Period | GPSGate Report 212 | `SUM(RefillVolume)` for all refuels in period | **HIGH** |
| Fuel Consumed | Calculated | Opening + Total Refueled - Closing | **HIGH** |

### Data Collection Flow

```text
┌─────────────────────────────────────────────────────────────────────┐
│          CROSS-SITE COMPANY VEHICLE DATA FLOW                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐      ┌──────────────────┐                     │
│  │   GPSGate SOAP   │      │   FuelRefill     │                     │
│  │    Report 212    │      │  (Audit Site)    │                     │
│  │ (GpsGateReport   │      └────────┬─────────┘                     │
│  │   Entry table)   │               │                               │
│  └────────┬─────────┘               │                               │
│           │                         │                               │
│           ▼                         ▼                               │
│  ┌──────────────────────────────────────────────────────┐          │
│  │              STEP 1: Fetch GPS Data                   │          │
│  ├──────────────────────────────────────────────────────┤          │
│  │                                                       │          │
│  │  Before audit: Call FuelComparison SOAP Service      │          │
│  │  POST /api/v1/FuelComparison/fetch-gps-data          │          │
│  │  { startDate, endDate }                              │          │
│  │                                                       │          │
│  │  This populates GpsGateReportEntry table with:       │          │
│  │    - FuelBefore (fuel level before refueling)        │          │
│  │    - FuelAfter (fuel level after refueling)          │          │
│  │    - RefillVolume (amount added)                     │          │
│  │    - DispenseDate, StartTime                         │          │
│  │                                                       │          │
│  └──────────────────────────────────────────────────────┘          │
│           │                                                         │
│           ▼                                                         │
│  ┌──────────────────────────────────────────────────────┐          │
│  │              STEP 2: Get Opening Stock                │          │
│  ├──────────────────────────────────────────────────────┤          │
│  │                                                       │          │
│  │  Opening Stock = FuelBefore of FIRST refuel event    │          │
│  │                  in the audit period                 │          │
│  │                                                       │          │
│  │  Query: SELECT FuelBefore FROM gpsgate_report_entries│          │
│  │         WHERE VehicleId = @VehicleId                 │          │
│  │           AND DispenseDate >= @PeriodStart           │          │
│  │         ORDER BY DispenseDate, StartTime ASC         │          │
│  │         LIMIT 1                                      │          │
│  │                                                       │          │
│  └──────────────────────────────────────────────────────┘          │
│           │                                                         │
│           ▼                                                         │
│  ┌──────────────────────────────────────────────────────┐          │
│  │              STEP 3: Get Fuel Issued (This Site)      │          │
│  ├──────────────────────────────────────────────────────┤          │
│  │                                                       │          │
│  │  Fuel from audit site = SUM(FuelRefill.FuelAmount)   │          │
│  │  WHERE TankId belongs to AuditSiteId                 │          │
│  │    AND RefillDate BETWEEN PeriodStart AND PeriodEnd  │          │
│  │                                                       │          │
│  └──────────────────────────────────────────────────────┘          │
│           │                                                         │
│           ▼                                                         │
│  ┌──────────────────────────────────────────────────────┐          │
│  │              STEP 4: Get Closing Stock                │          │
│  ├──────────────────────────────────────────────────────┤          │
│  │                                                       │          │
│  │  Find NEXT refuel event (at any site) after period:  │          │
│  │                                                       │          │
│  │  Option A: From FuelRefill table                     │          │
│  │    SELECT MIN(RefillDate) FROM fuelrefill            │          │
│  │    WHERE VehicleId = @VehicleId                      │          │
│  │      AND RefillDate > @PeriodEnd                     │          │
│  │                                                       │          │
│  │  Option B: From GpsGateReportEntry (preferred)       │          │
│  │    SELECT FuelBefore FROM gpsgate_report_entries     │          │
│  │    WHERE VehicleId = @VehicleId                      │          │
│  │      AND DispenseDate > @PeriodEnd                   │          │
│  │    ORDER BY DispenseDate, StartTime ASC              │          │
│  │    LIMIT 1                                           │          │
│  │                                                       │          │
│  │  Closing Stock = FuelBefore of that next refuel      │          │
│  │                                                       │          │
│  └──────────────────────────────────────────────────────┘          │
│           │                                                         │
│           ▼                                                         │
│  ┌──────────────────────────────────────────────────────┐          │
│  │              STEP 5: Calculate Consumption            │          │
│  ├──────────────────────────────────────────────────────┤          │
│  │                                                       │          │
│  │  Total Refueled = SUM(RefillVolume) from GPS report  │          │
│  │                   for all refuels in period          │          │
│  │                                                       │          │
│  │  Fuel Consumed = Opening + Total Refueled - Closing  │          │
│  │                                                       │          │
│  │  ┌─────────────────────────────────────────────────┐ │          │
│  │  │  RECONCILIATION FOR AUDIT:                      │ │          │
│  │  │                                                 │ │          │
│  │  │  Tanker Side: Include fuel issued from site    │ │          │
│  │  │  Fleet Side: Track but report separately       │ │          │
│  │  │              (not in site's fleet dead stock)  │ │          │
│  │  └─────────────────────────────────────────────────┘ │          │
│  │                                                       │          │
│  └──────────────────────────────────────────────────────┘          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### SQL Data Query (Cross-Site Company Vehicle)

```sql
-- Step 1: Ensure GPS data is fetched first via SOAP service
-- POST /api/v1/FuelComparison/fetch-gps-data { startDate, endDate }

-- Step 2: Get Opening Stock from first GPS refuel event
SELECT
    g.FuelBefore AS OpeningStock,
    g.DispenseDate AS OpeningDate,
    g.StartTime AS OpeningTime
FROM gpsgate_report_entries g
INNER JOIN gpsgate_reports r ON g.ReportId = r.Id
WHERE g.VehicleId = @VehicleId
  AND g.DispenseDate >= @PeriodStart
  AND g.IsDeleted = 0
ORDER BY g.DispenseDate, g.StartTime ASC
LIMIT 1;

-- Step 3: Get fuel issued from audit site
SELECT
    v.VehicleId,
    v.VehicleCode AS VehicleNo,
    v.NumberPlate,
    v.WorkingSiteId AS HomeSiteId,
    home_site.SiteName AS HomeSiteName,
    SUM(fr.FuelAmount) AS FuelIssuedFromAuditSite,
    COUNT(fr.RefillId) AS RefillCountFromAuditSite
FROM vehicles v
INNER JOIN fuelrefill fr ON v.VehicleId = fr.VehicleId
INNER JOIN tanks t ON fr.TankId = t.TankId
INNER JOIN sites home_site ON v.WorkingSiteId = home_site.SiteId
WHERE t.SiteId = @AuditSiteId
  AND v.IsCompanyVehicle = 1
  AND v.WorkingSiteId != @AuditSiteId
  AND fr.RefillDate BETWEEN @PeriodStart AND @PeriodEnd
GROUP BY v.VehicleId, v.VehicleCode, v.NumberPlate, v.WorkingSiteId, home_site.SiteName;

-- Step 4: Get Closing Stock from next GPS refuel event after period
SELECT
    g.FuelBefore AS ClosingStock,
    g.DispenseDate AS ClosingDate,
    g.StartTime AS ClosingTime
FROM gpsgate_report_entries g
WHERE g.VehicleId = @VehicleId
  AND g.DispenseDate > @PeriodEnd
  AND g.IsDeleted = 0
ORDER BY g.DispenseDate, g.StartTime ASC
LIMIT 1;

-- Step 5: Get total refueled from GPS during period (includes all sites)
SELECT
    SUM(g.EffectiveVolume) AS TotalRefueledGPS,
    COUNT(*) AS RefuelEventCount
FROM gpsgate_report_entries g
WHERE g.VehicleId = @VehicleId
  AND g.DispenseDate BETWEEN @PeriodStart AND @PeriodEnd
  AND g.IsDeleted = 0;
```

### Audit Treatment

| Aspect | Treatment |
|--------|-----------|
| **Tanker Reconciliation** | ✅ Include `FuelIssuedFromAuditSite` in tanker output |
| **Fleet Dead Stock** | ❌ Exclude from site's fleet opening/closing |
| **Reporting** | 📋 Separate section: "Cross-Site Company Vehicles" |
| **Accountability** | 🔗 Link to vehicle's home site for their audit |

---

## 5. External Non-Company Vehicles (IsCompanyVehicle = 0)

### Scenario

> Third-party or contractor vehicles that occasionally fuel at the site.
> Not company-owned, no GPS tracking available.
> **Can only track fuel issued** - no consumption data possible.

### Key Identifier

```sql
WHERE v.IsCompanyVehicle = 0
  AND EXISTS (SELECT 1 FROM fuelrefill WHERE VehicleId = v.VehicleId AND TankId IN (@AuditSiteTanks))
```

### Data Fields Available

| Field | Source | Availability | Confidence |
|-------|--------|--------------|------------|
| Fuel Issued | FuelRefill | ✅ Available | **HIGH** |
| Refuel Count | FuelRefill | ✅ Available | **HIGH** |
| Opening Fuel Level | N/A | ❌ Not Available | N/A |
| Closing Fuel Level | N/A | ❌ Not Available | N/A |
| Fuel Consumed | N/A | ❌ Cannot Calculate | N/A |

### Data Collection Flow

```text
┌─────────────────────────────────────────────────────────────────────┐
│          EXTERNAL NON-COMPANY VEHICLE DATA FLOW                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ⚠️  LIMITED DATA - NO GPS, NOT COMPANY OWNED                       │
│                                                                      │
│  ┌──────────────────┐                                               │
│  │    FuelRefill    │                                               │
│  │  (Audit Site)    │                                               │
│  └────────┬─────────┘                                               │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────────────────────────────────────────┐           │
│  │              What We CAN Track                        │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │                                                       │           │
│  │  ✅ Fuel Issued = SUM(FuelRefill.FuelAmount)         │           │
│  │  ✅ Refuel Count = COUNT(FuelRefill)                 │           │
│  │  ✅ Refuel Dates                                     │           │
│  │  ✅ Driver (if recorded)                             │           │
│  │  ✅ Vehicle Info (plate, type from master)           │           │
│  │                                                       │           │
│  └──────────────────────────────────────────────────────┘           │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────────────────────────────────────────┐           │
│  │              What We CANNOT Track                     │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │                                                       │           │
│  │  ❌ Opening Fuel Level - No GPS                      │           │
│  │  ❌ Closing Fuel Level - No GPS                      │           │
│  │  ❌ Fuel Consumed - Cannot verify                    │           │
│  │  ❌ Distance/Hours - Not our vehicle                 │           │
│  │  ❌ Efficiency - Cannot calculate                    │           │
│  │                                                       │           │
│  └──────────────────────────────────────────────────────┘           │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────────────────────────────────────────┐           │
│  │              Audit Treatment                          │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │                                                       │           │
│  │  TANKER SIDE:                                        │           │
│  │  ✅ Include in Total Dispensed                       │           │
│  │  ✅ Fuel physically left the tanker                  │           │
│  │                                                       │           │
│  │  FLEET SIDE:                                         │           │
│  │  ❌ Exclude completely                               │           │
│  │  ❌ No dead stock calculation                        │           │
│  │                                                       │           │
│  │  REPORTING:                                          │           │
│  │  📋 Separate section: "External Vehicle Fueling"    │           │
│  │  📋 List as: "Fuel Issued to Third Parties"         │           │
│  │  📋 No reconciliation attempted                      │           │
│  │                                                       │           │
│  └──────────────────────────────────────────────────────┘           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### SQL Data Query (External Non-Company Vehicle)

```sql
-- External non-company vehicles fueled at audit site
SELECT
    v.VehicleId,
    v.VehicleCode AS VehicleNo,
    v.NumberPlate,
    COALESCE(vt.VehicleTypeName, 'Unknown') AS VehicleType,

    -- Only what we CAN track
    SUM(fr.FuelAmount) AS FuelIssued,
    COUNT(fr.RefillId) AS RefillCount,
    MIN(fr.RefillDate) AS FirstRefillDate,
    MAX(fr.RefillDate) AS LastRefillDate,

    -- Driver info if available
    GROUP_CONCAT(DISTINCT e.FullName) AS Drivers,

    -- Flags
    'EXTERNAL' AS VehicleCategory,
    'Non-company vehicle - fuel issued only' AS AuditNote

FROM fuelrefill fr
INNER JOIN vehicles v ON fr.VehicleId = v.VehicleId
INNER JOIN tanks t ON fr.TankId = t.TankId
LEFT JOIN vehicletypes vt ON v.VehicleTypeId = vt.VehicleTypeId
LEFT JOIN employees e ON fr.DriverId = e.EmployeeId
WHERE t.SiteId = @AuditSiteId
  AND v.IsCompanyVehicle = 0  -- NOT company owned
  AND fr.RefillDate BETWEEN @PeriodStart AND @PeriodEnd
GROUP BY v.VehicleId, v.VehicleCode, v.NumberPlate, vt.VehicleTypeName
ORDER BY SUM(fr.FuelAmount) DESC;

-- Summary total
SELECT
    COUNT(DISTINCT v.VehicleId) AS ExternalVehicleCount,
    COUNT(fr.RefillId) AS TotalRefillEvents,
    SUM(fr.FuelAmount) AS TotalFuelIssued
FROM fuelrefill fr
INNER JOIN vehicles v ON fr.VehicleId = v.VehicleId
INNER JOIN tanks t ON fr.TankId = t.TankId
WHERE t.SiteId = @AuditSiteId
  AND v.IsCompanyVehicle = 0
  AND fr.RefillDate BETWEEN @PeriodStart AND @PeriodEnd;
```

### Audit Treatment

| Aspect | Treatment |
|--------|-----------|
| **Tanker Reconciliation** | ✅ Include in total dispensed |
| **Fleet Dead Stock** | ❌ Exclude completely |
| **Reporting** | 📋 "External Vehicle Fueling" section |
| **Accountability** | ⚠️ Track for billing/invoicing purposes |

---

## Complete Data Model Summary

### Entity Relationship for Fuel Audit

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FUEL AUDIT DATA MODEL                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐            │
│  │   Sites     │────→│   Tanks     │────→│Tank Volume  │            │
│  │             │     │             │     │  History    │            │
│  └─────────────┘     └──────┬──────┘     └─────────────┘            │
│        │                    │                                        │
│        │                    │ FuelRefill.TankId                      │
│        │                    ▼                                        │
│        │            ┌─────────────┐                                 │
│        │            │ FuelRefill  │                                 │
│        │            │             │                                 │
│        │            └──────┬──────┘                                 │
│        │                   │ FuelRefill.VehicleId                   │
│        │                   ▼                                        │
│        │            ┌─────────────┐                                 │
│        └───────────→│  Vehicles   │                                 │
│  WorkingSiteId      │             │                                 │
│                     └──────┬──────┘                                 │
│                            │                                        │
│              ┌─────────────┼─────────────┐                         │
│              │             │             │                          │
│              ▼             ▼             ▼                          │
│       ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│       │ GPS      │  │ Full Tank│  │ Non-Full │                     │
│       │ Vehicles │  │ Vehicles │  │   Tank   │                     │
│       │          │  │          │  │ Vehicles │                     │
│       └────┬─────┘  └────┬─────┘  └────┬─────┘                     │
│            │             │             │                            │
│            ▼             ▼             ▼                            │
│       ┌─────────────────────────────────────┐                      │
│       │    FuelAuditVehiclePosition         │                      │
│       │    (Per-vehicle audit record)       │                      │
│       └─────────────────────────────────────┘                      │
│                            │                                        │
│                            ▼                                        │
│       ┌─────────────────────────────────────┐                      │
│       │           FuelAudit                 │                      │
│       │    (Aggregated audit totals)        │                      │
│       └─────────────────────────────────────┘                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Vehicle Classification Query

```sql
-- Classify all vehicles for audit
SELECT
    v.VehicleId,
    v.VehicleCode,
    v.NumberPlate,
    v.WorkingSiteId,
    v.Capacity AS TankCapacity,

    -- Classification
    CASE
        WHEN v.HasGPSInstalled = 1 THEN 'GPS'
        WHEN v.AverageKmL = 1 THEN 'FullTank'
        ELSE 'NonFullTank'
    END AS VehicleCategory,

    -- Data source
    CASE
        WHEN v.HasGPSInstalled = 1 THEN 'GPSGate API + FuelRefill'
        WHEN v.AverageKmL = 1 THEN 'FuelRefill (Estimated)'
        ELSE 'FuelRefill (Limited)'
    END AS DataSource,

    -- Confidence level
    CASE
        WHEN v.HasGPSInstalled = 1 THEN 'HIGH'
        WHEN v.AverageKmL = 1 THEN 'MEDIUM'
        ELSE 'LOW'
    END AS DataConfidence,

    -- Is this vehicle external to audit site?
    CASE
        WHEN v.WorkingSiteId != @AuditSiteId
             AND EXISTS (
                 SELECT 1 FROM fuelrefill fr
                 INNER JOIN tanks t ON fr.TankId = t.TankId
                 WHERE fr.VehicleId = v.VehicleId
                   AND t.SiteId = @AuditSiteId
                   AND fr.RefillDate BETWEEN @StartDate AND @EndDate
             )
        THEN 1
        ELSE 0
    END AS IsExternalVehicle

FROM vehicles v
WHERE v.IsActive = 1;
```

---

## Fuel Audit Report Structure

```
╔═══════════════════════════════════════════════════════════════════════╗
║                     FUEL AUDIT REPORT                                  ║
║                    Site: Kisumu | Period: 01-30 Nov 2025              ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  SECTION A: TANKER/STORAGE RECONCILIATION                             ║
║  ─────────────────────────────────────────                            ║
║  Opening Stock (Physical Dip):           25,000 L                     ║
║  + Deliveries Received:                  +50,000 L                    ║
║  − Total Dispensed:                      -48,500 L                    ║
║    ├─ To Site Fleet:              42,000 L                            ║
║    ├─ To External Vehicles:        6,500 L ← Accounted separately    ║
║    └─ Unallocated:                     0 L                            ║
║  = Expected Closing:                      26,500 L                    ║
║  Actual Closing (Physical Dip):           26,200 L                    ║
║  TANKER VARIANCE:                           -300 L (1.1%)             ║
║                                                                        ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  SECTION B: FLEET RECONCILIATION (Site Vehicles Only)                 ║
║  ─────────────────────────────────────────────────────                ║
║                                                                        ║
║  B.1 GPS FLEET (High Confidence)                                      ║
║  ┌──────────┬─────────┬─────────┬─────────┬──────────┬─────────┐     ║
║  │ Vehicle  │ Opening │ Refueled│ Consumed│ Closing  │ Variance│     ║
║  ├──────────┼─────────┼─────────┼─────────┼──────────┼─────────┤     ║
║  │ KBZ 001  │   150 L │   800 L │   780 L │   170 L  │    0 L  │     ║
║  │ KBZ 002  │   200 L │ 1,200 L │ 1,150 L │   250 L  │    0 L  │     ║
║  │ ...      │   ...   │   ...   │   ...   │   ...    │   ...   │     ║
║  ├──────────┼─────────┼─────────┼─────────┼──────────┼─────────┤     ║
║  │ SUBTOTAL │ 3,500 L │18,000 L │17,500 L │ 4,000 L  │  +100 L │     ║
║  └──────────┴─────────┴─────────┴─────────┴──────────┴─────────┘     ║
║                                                                        ║
║  B.2 FULL TANK FLEET - No GPS (Medium Confidence)                     ║
║  ┌──────────┬─────────┬─────────┬─────────┬──────────┬───────────┐   ║
║  │ Vehicle  │ Opening*│ Refueled│ Consumed│ Closing* │ Confidence│   ║
║  ├──────────┼─────────┼─────────┼─────────┼──────────┼───────────┤   ║
║  │ KCA 001  │    80 L │   400 L │   400 L │   100 L  │ HIGH      │   ║
║  │ KCA 002  │   120 L │   600 L │   600 L │    60 L  │ MEDIUM    │   ║
║  │ ...      │   ...   │   ...   │   ...   │   ...    │ ...       │   ║
║  ├──────────┼─────────┼─────────┼─────────┼──────────┼───────────┤   ║
║  │ SUBTOTAL │ 2,000 L │20,000 L │20,000 L │ 2,500 L  │ 75% avg   │   ║
║  └──────────┴─────────┴─────────┴─────────┴──────────┴───────────┘   ║
║  * Estimated based on full-tank policy                                ║
║                                                                        ║
║  B.3 NON-FULL TANK FLEET - No GPS (Low Confidence)                    ║
║  ┌──────────┬───────────┬─────────┬──────────┬────────────────────┐  ║
║  │ Vehicle  │ Fuel Issued│  Hours │ Est Cons*│ Note               │  ║
║  ├──────────┼───────────┼─────────┼──────────┼────────────────────┤  ║
║  │ EXC-001  │    2,000 L│   200 h │ 2,200 L  │ Generator          │  ║
║  │ GEN-002  │    1,500 L│   300 h │ 1,400 L  │ Excavator          │  ║
║  │ ...      │    ...    │   ...   │   ...    │ ...                │  ║
║  ├──────────┼───────────┼─────────┼──────────┼────────────────────┤  ║
║  │ SUBTOTAL │    4,000 L│   600 h │ 4,200 L  │ Cannot reconcile   │  ║
║  └──────────┴───────────┴─────────┴──────────┴────────────────────┘  ║
║  * Based on historical L/hr rate - for reference only                 ║
║                                                                        ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  SECTION C: EXTERNAL VEHICLE FUELING                                  ║
║  ───────────────────────────────────                                  ║
║  (Vehicles fueled from this site but belong to other sites)           ║
║                                                                        ║
║  ┌─────────────┬───────────┬───────────┬─────────────────────────┐   ║
║  │ Home Site   │ Vehicles  │ Total Fuel│ Note                    │   ║
║  ├─────────────┼───────────┼───────────┼─────────────────────────┤   ║
║  │ Nairobi     │     3     │  3,500 L  │ KAA 001, KAA 002, ...   │   ║
║  │ Mombasa     │     2     │  2,000 L  │ KBB 001, KBB 002        │   ║
║  │ Nakuru      │     1     │  1,000 L  │ KCC 001                 │   ║
║  ├─────────────┼───────────┼───────────┼─────────────────────────┤   ║
║  │ TOTAL       │     6     │  6,500 L  │ Accounted in Tanker Out │   ║
║  └─────────────┴───────────┴───────────┴─────────────────────────┘   ║
║                                                                        ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  SECTION D: SYSTEM SUMMARY                                            ║
║  ─────────────────────────                                            ║
║                                                                        ║
║  Total Opening (Tanker + Fleet):              30,500 L                ║
║  + External In (Deliveries):                 +50,000 L                ║
║  − External Out (Fleet Consumption):         -41,700 L                ║
║  = Expected Closing:                          38,800 L                ║
║                                                                        ║
║  Actual Closing (Tanker + Fleet):             32,700 L                ║
║                                                                        ║
║  SYSTEM VARIANCE:                               +100 L (0.26%)        ║
║  VARIANCE CONFIDENCE:                           MEDIUM (65%)          ║
║                                                                        ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## Implementation Checklist

### Backend Changes - ✅ COMPLETED

- [x] Add vehicle classification to `GetTankRefillsForPeriodQuery`
- [x] Use `IsFullTankPolicy` property for Category 2 classification
- [x] Use `VehicleProviderMappings` for modern GPS detection
- [x] Add `FuelTankCapacity` to DTO for estimate calculations
- [x] Maintain backward compatibility with legacy `HasGPSInstalled`/`DeviceId`
- [x] Add `IsFullTankPolicy` and `FuelTankCapacity` to `VehicleRefillSummaryDTO`

### Backend Changes - Pending

- [ ] Add `IsExternalToSite(vehicleId, siteId)` method
- [ ] Create `GetExternalVehicleFueling(auditId)` query
- [ ] Update `FuelAuditVehiclePosition` to include `IsExternal` flag
- [ ] Update calculation service to separate external vehicles
- [ ] Add external fuel summary to audit detail DTO

### Frontend Changes - ✅ COMPLETED

- [x] Step 4: Category-grouped vehicle selection with expandable sections
- [x] Step 5: Category-aware GPS preview with different data sources

### Frontend Changes - Pending

- [ ] Update Step 6 review to display external fuel
- [ ] Add external vehicles section to audit detail view

### Database Changes Needed

- [ ] Consider adding `IsExternalVehicle` column to `fuel_audit_vehicle_positions`
- [ ] Add `ExternalFuelToOtherSites` column to `fuel_audits`

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Nov 30, 2025 | | Initial data source documentation |
| 1.1 | Nov 30, 2025 | | Added Vehicle.cs property documentation, updated classification to use IsFullTankPolicy, VehicleProviderMappings, and FuelTankCapacity |
