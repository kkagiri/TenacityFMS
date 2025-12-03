# Fuel Audit Wizard - Step 4 to Step 5 Implementation Guide

## Overview

This document details the complete implementation for Steps 4-5 of the Fuel Audit Wizard, covering vehicle classification and GPS data preview functionality.

**Last Updated:** December 2025
**Status:** ✅ Step 4 Complete | ✅ Step 5 Complete

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                        STEP 4 → STEP 5 DATA FLOW                               │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                          STEP 4: Vehicle Selection                       │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                          │   │
│  │  Input (from Steps 1-2):                                                 │   │
│  │    • siteId, periodStart, periodEnd                                      │   │
│  │    • selectedTankIds[]                                                   │   │
│  │                                                                          │   │
│  │  Backend Query:                                                          │   │
│  │    POST /api/v1/FuelAudit/tank-refills-preview                          │   │
│  │    → GetTankRefillsForPeriodQuery                                       │   │
│  │                                                                          │   │
│  │  Classification Logic (Vehicle.cs properties):                           │   │
│  │    ┌──────────────────────────────────────────────────────────────────┐ │   │
│  │    │ Property              │ Used For                                 │ │   │
│  │    ├──────────────────────────────────────────────────────────────────┤ │   │
│  │    │ WorkingSiteId         │ At audit site check                      │ │   │
│  │    │ IsCompanyVehicle      │ Company ownership                        │ │   │
│  │    │ IsFullTankPolicy      │ Category 2 classification (NEW)          │ │   │
│  │    │ AverageKmL            │ Fallback for full tank (legacy)          │ │   │
│  │    │ VehicleProviderMappings│ Modern GPS detection (NEW)              │ │   │
│  │    │ FuelTankCapacity      │ Estimate calculations (NEW)              │ │   │
│  │    └──────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                          │   │
│  │  Output (VehicleRefillSummaryDTO[]):                                     │   │
│  │    • vehicleId, vehicleNo, driverName                                    │   │
│  │    • vehicleCategory (1-5), vehicleCategoryName                          │   │
│  │    • hasGPS, isCompanyVehicle, belongsToAuditSite                        │   │
│  │    • dataSourcePrimary, dataConfidence                                   │   │
│  │    • isFullTankPolicy, fuelTankCapacity                                  │   │
│  │    • refillCount, totalFuelAmount, efficiency                            │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                          STEP 5: GPS Data Preview                        │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                          │   │
│  │  Input (from Step 4):                                                    │   │
│  │    • selectedVehicleIds[] (grouped by category)                          │   │
│  │    • Vehicle classification data                                         │   │
│  │                                                                          │   │
│  │  Category-Aware Data Loading:                                            │   │
│  │    ┌──────────────────────────────────────────────────────────────────┐ │   │
│  │    │ Category │ Data Source   │ API Call                              │ │   │
│  │    ├──────────────────────────────────────────────────────────────────┤ │   │
│  │    │ 1        │ GPS REST API  │ POST /FuelAuditGPS/fleet/category-audit│ │   │
│  │    │ 2        │ Estimated     │ POST /FuelAuditGPS/estimate/full-tank  │ │   │
│  │    │ 3        │ FuelRefill    │ No additional fetch                    │ │   │
│  │    │ 4        │ Database      │ POST /FuelAuditGPS/fleet/category-audit│ │   │
│  │    │          │ (gpsgate_     │ → GetCrossSiteGpsDataQuery             │ │   │
│  │    │          │ report_entries)│                                       │ │   │
│  │    │ 5        │ FuelRefill    │ No additional fetch                    │ │   │
│  │    └──────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                          │   │
│  │  Output (Enhanced VehicleRefillSummaryDTO[]):                            │   │
│  │    • openingFuel, closingFuel (GPS categories)                           │   │
│  │    • consumption (calculated)                                            │   │
│  │    • dataQuality (Exact/Interpolated/Low/Unavailable)                    │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## Step 4: Vehicle Selection & Classification

### 4.1 Backend Implementation

#### Query Handler: `GetTankRefillsForPeriodQuery.cs`

**Location:** `FMS.Application/Features/FuelAudit/Queries/GetTankRefillsForPeriodQuery.cs`

```csharp
// Core classification logic - uses Vehicle.cs entity properties
private static (int category, string name, string dataSource, string confidence) ClassifyVehicle(
    Vehicle? vehicle,
    int auditSiteId,
    bool isKmL,
    bool hasGPS,
    bool isFullTankPolicy)
{
    if (vehicle == null)
        return (5, "External Non-Company", "Unavailable", "ACCOUNTED");

    var atSite = vehicle.WorkingSiteId == auditSiteId;
    var isCompany = vehicle.IsCompanyVehicle ?? false;

    // Category 1: Site GPS Fleet
    if (atSite && hasGPS)
        return (1, "Site GPS Fleet", "GPS_REST", "HIGH");

    // Category 2: Site Full Tank (No GPS)
    // Uses IsFullTankPolicy flag OR falls back to IsKmL for legacy data
    if (atSite && !hasGPS && (isFullTankPolicy || isKmL))
        return (2, "Site Full Tank (No GPS)", "Estimated", "MEDIUM");

    // Category 3: Site Equipment (No GPS)
    if (atSite && !hasGPS && !isKmL && !isFullTankPolicy)
        return (3, "Site Equipment (No GPS)", "FuelRefill", "LOW");

    // Category 4: Cross-Site Company Vehicle
    if (!atSite && isCompany)
        return (4, "Cross-Site Company", hasGPS ? "GPS_SOAP" : "FuelRefill", "HIGH");

    // Category 5: External Non-Company
    return (5, "External Non-Company", "FuelRefill", "ACCOUNTED");
}
```

#### GPS Detection - Modern Approach

```csharp
// Fetch active GPS provider mappings (replaces deprecated HasGPSInstalled/DeviceId)
var gpsVehicleIds = await _context.VehicleProviderMappings
    .AsNoTracking()
    .Where(m => vehicleIds.Contains(m.VehicleId) && m.IsActive)
    .Select(m => m.VehicleId)
    .Distinct()
    .ToListAsync(cancellationToken);

var vehiclesWithGps = new HashSet<int>(gpsVehicleIds);

// Hybrid detection: Modern OR legacy for backward compatibility
var hasModernGps = vehiclesWithGps.Contains(vehicleId);
var hasLegacyGps = vehicle?.HasGPSInstalled == true || vehicle?.DeviceId.HasValue == true;
var hasGPS = hasModernGps || hasLegacyGps;
```

#### DTO: `VehicleRefillSummaryDTO`

**Location:** `FMS.Application/Features/FuelAudit/DTOs/TankRefillPreviewDTO.cs`

```csharp
public class VehicleRefillSummaryDTO
{
    // Basic vehicle info
    public int VehicleId { get; set; }
    public string VehicleNo { get; set; }
    public int? DriverId { get; set; }
    public string DriverName { get; set; }
    public int? VehicleTypeId { get; set; }
    public string VehicleTypeName { get; set; }
    public bool IsKmL { get; set; }

    // Vehicle Category Classification (1-5)
    public int VehicleCategory { get; set; }
    public string VehicleCategoryName { get; set; }
    public bool HasGPS { get; set; }
    public bool IsCompanyVehicle { get; set; }
    public bool BelongsToAuditSite { get; set; }
    public string DataSourcePrimary { get; set; }   // GPS_REST, GPS_SOAP, Estimated, FuelRefill
    public string DataConfidence { get; set; }      // HIGH, MEDIUM, LOW, ACCOUNTED

    // NEW: Vehicle properties for calculations
    public bool IsFullTankPolicy { get; set; }      // From Vehicle.IsFullTankPolicy
    public decimal? FuelTankCapacity { get; set; }  // From Vehicle.FuelTankCapacity

    // Computed display helpers
    public string CategoryIcon => VehicleCategory switch
    {
        1 => "fa-satellite",
        2 => "fa-truck",
        3 => "fa-gear",
        4 => "fa-arrow-right-arrow-left",
        5 => "fa-user-plus",
        _ => "fa-question"
    };

    public string CategoryBadgeColor => VehicleCategory switch
    {
        1 => "green",
        2 => "yellow",
        3 => "orange",
        4 => "cyan",
        5 => "pink",
        _ => "gray"
    };

    // Refill summary
    public int RefillCount { get; set; }
    public decimal TotalFuelAmount { get; set; }
    public decimal? TotalDistanceOrHours { get; set; }
    public decimal? Efficiency { get; set; }
    public DateTime? FirstRefillDate { get; set; }
    public DateTime? LastRefillDate { get; set; }
    public List<TankRefillPreviewDTO> Refills { get; set; }
}
```

### 4.2 Frontend Implementation

#### Component: `Step4VehicleSelection.js`

**Location:** `fms.frontend/src/pages/tankStock/fuelAudit/components/wizard/Step4VehicleSelection.js`

**Key Features:**
- Accordion-style grouping by vehicle category
- Category badges with confidence indicators
- Multi-select with "Select All" per category
- Data source indicators

```jsx
// Category configuration
const CATEGORY_CONFIG = {
  1: {
    name: 'Site GPS Fleet',
    icon: 'fa-satellite',
    bgColor: 'tw-bg-green-50',
    borderColor: 'tw-border-green-200',
    textColor: 'tw-text-green-700',
    badgeColor: 'tw-bg-green-100 tw-text-green-800',
    confidence: 'HIGH'
  },
  2: {
    name: 'Site Full Tank (No GPS)',
    icon: 'fa-truck',
    bgColor: 'tw-bg-yellow-50',
    borderColor: 'tw-border-yellow-200',
    textColor: 'tw-text-yellow-700',
    badgeColor: 'tw-bg-yellow-100 tw-text-yellow-800',
    confidence: 'MEDIUM'
  },
  // ... categories 3-5
};

// Group vehicles by category
const vehiclesByCategory = useMemo(() => {
  const grouped = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  tankRefills.forEach(vehicle => {
    const category = vehicle.vehicleCategory || 5;
    grouped[category].push(vehicle);
  });
  return grouped;
}, [tankRefills]);
```

---

## Step 5: GPS Data Preview

### 5.1 Backend Implementation

#### Controller: `FuelAuditGPSController.cs`

**Location:** `FMS.WebClient/Controllers/FuelManagement/FuelAuditGPSController.cs`

**Endpoint:** `POST /api/v1/FuelAuditGPS/fleet/audit-period`

```csharp
[HttpPost("fleet/audit-period")]
public async Task<IActionResult> GetFleetAuditPeriodFuel(
    [FromBody] FleetAuditPeriodRequestDTO request,
    CancellationToken cancellationToken = default)
{
    // Get opening positions
    var openingRequest = new FleetFuelPositionRequestDTO
    {
        VehicleIds = request.VehicleIds,
        Date = request.StartDate,
        ReadingType = "opening",
        AuditId = request.AuditId
    };
    var openingResult = await _fuelAuditGPSService.GetFleetFuelAtDateAsync(openingRequest, cancellationToken);

    // Get closing positions
    var closingRequest = new FleetFuelPositionRequestDTO
    {
        VehicleIds = request.VehicleIds,
        Date = request.EndDate,
        ReadingType = "closing",
        AuditId = request.AuditId
    };
    var closingResult = await _fuelAuditGPSService.GetFleetFuelAtDateAsync(closingRequest, cancellationToken);

    return Ok(new FleetAuditPeriodResponseDTO
    {
        StartDate = request.StartDate,
        EndDate = request.EndDate,
        TotalVehicles = request.VehicleIds.Count,
        Opening = openingResult.Data!,
        Closing = closingResult.Data!
    });
}
```

#### Request/Response DTOs

```csharp
public class FleetAuditPeriodRequestDTO
{
    public List<int> VehicleIds { get; set; } = new();
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int? AuditId { get; set; }
    public int? CategoryId { get; set; }  // For REST vs SOAP differentiation
}

public class FleetAuditPeriodResponseDTO
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalVehicles { get; set; }
    public FleetFuelPositionResponseDTO Opening { get; set; }
    public FleetFuelPositionResponseDTO Closing { get; set; }
}
```

### 5.2 Frontend Implementation

#### Component: `Step5VehiclePreview.js`

**Location:** `fms.frontend/src/pages/tankStock/fuelAudit/components/wizard/Step5VehiclePreview.js`

**Key Features:**
- Category-aware data loading
- Progress indicators per category
- Expandable accordion panels
- Data quality badges
- Legend for data sources

```jsx
// Category-specific data loading
const handleLoadCategoryData = useCallback(async (categoryId) => {
  const vehicles = vehiclesByCategory[categoryId];
  const config = CATEGORY_CONFIG[categoryId];

  if (!config.canFetchGps) {
    // For non-GPS categories, mark as loaded (data from FuelRefill)
    setLoadedCategories(prev => ({ ...prev, [categoryId]: true }));
    return;
  }

  setLoadingCategory(categoryId);

  const vehicleIds = vehicles.map(v => v.vehicleId);

  await dispatch(fetchFleetAuditPeriodFuel({
    vehicleIds,
    startDate: wizard.periodStart,
    endDate: wizard.periodEnd,
    categoryId
  }));

  setLoadedCategories(prev => ({ ...prev, [categoryId]: true }));
  setLoadingCategory(null);
}, [vehiclesByCategory, wizard, dispatch]);
```

#### Redux Slice Integration

**Location:** `fms.frontend/src/redux/slices/fuelAuditSlice.js`

```javascript
// Thunk for fetching fleet GPS data
export const fetchFleetAuditPeriodFuel = createAsyncThunk(
  'fuelAudit/fetchFleetAuditPeriodFuel',
  async ({ vehicleIds, startDate, endDate, categoryId }, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.getFleetFuelPositionsForAuditPeriod({
        vehicleIds,
        auditPeriodStart: startDate,
        auditPeriodEnd: endDate,
        categoryId
      });
      return { ...response, categoryId };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Reducer case
.addCase(fetchFleetAuditPeriodFuel.fulfilled, (state, action) => {
  state.loading.gpsPreview = false;

  // Merge GPS data into existing tank refills
  const { Opening, Closing, categoryId } = action.payload;

  state.wizard.tankRefills = state.wizard.tankRefills.map(vehicle => {
    const openingData = Opening?.positions?.find(p => p.vehicleId === vehicle.vehicleId);
    const closingData = Closing?.positions?.find(p => p.vehicleId === vehicle.vehicleId);

    if (openingData || closingData) {
      return {
        ...vehicle,
        openingFuel: openingData?.fuelLevel,
        closingFuel: closingData?.fuelLevel,
        consumption: openingData && closingData
          ? openingData.fuelLevel - closingData.fuelLevel + vehicle.totalFuelAmount
          : null,
        dataQuality: openingData?.dataQuality || closingData?.dataQuality
      };
    }
    return vehicle;
  });
})
```

---

## Vehicle Classification Reference

### 5 Vehicle Categories

| Cat | Name | At Site | Company | GPS | Data Source | Confidence | Icon |
|-----|------|---------|---------|-----|-------------|------------|------|
| 1 | Site GPS Fleet | ✅ | ✅ | ✅ | GPS REST API | HIGH | 🛰️ `fa-satellite` |
| 2 | Site Full Tank | ✅ | ✅ | ❌ | Estimated | MEDIUM | 🚛 `fa-truck` |
| 3 | Site Equipment | ✅ | ✅ | ❌ | FuelRefill | LOW | ⚙️ `fa-gear` |
| 4 | Cross-Site Company | ❌ | ✅ | ✅/❌ | Database (gpsgate_report_entries) | HIGH | 🔄 `fa-arrow-right-arrow-left` |
| 5 | External | ❌ | ❌ | ❌ | FuelRefill | ACCOUNTED | 👤 `fa-user-plus` |

### Category 2 Classification Logic

```
IsFullTankPolicy = true  →  Category 2 (preferred)
OR
IsKmL = true (AverageKmL) →  Category 2 (legacy fallback)
```

### GPS Detection Priority

```
1. VehicleProviderMappings (Modern - preferred)
2. HasGPSInstalled = true (Legacy - fallback)
3. DeviceId.HasValue = true (Legacy - fallback)
```

---

## Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 4                                                                       │
│                                                                              │
│  User selects tanks (Step 2)                                                 │
│         │                                                                    │
│         ▼                                                                    │
│  POST /api/v1/FuelAudit/tank-refills-preview                                │
│         │                                                                    │
│         ▼                                                                    │
│  GetTankRefillsForPeriodQuery                                               │
│    ├─ Query FuelRefills by tankIds + period                                 │
│    ├─ Query VehicleProviderMappings for GPS detection                       │
│    ├─ Classify each vehicle → VehicleCategory (1-5)                         │
│    └─ Return VehicleRefillSummaryDTO[]                                      │
│         │                                                                    │
│         ▼                                                                    │
│  Frontend groups by category, user selects vehicles                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 5                                                                       │
│                                                                              │
│  selectedVehicleIds[] grouped by category                                    │
│         │                                                                    │
│         ├─ Category 1 (GPS Fleet) ─────────────────────────────────────────┐│
│         │         │                                                         ││
│         │         ▼                                                         ││
│         │  POST /api/v1/FuelAuditGPS/fleet/audit-period                    ││
│         │         │                                                         ││
│         │         ▼                                                         ││
│         │  FuelAuditGPSService.GetFleetFuelAtDateAsync()                   ││
│         │    ├─ Opening: REST API tracks 00:00-06:00                       ││
│         │    └─ Closing: REST API tracks 18:00-23:59                       ││
│         │                                                                   ││
│         ├─ Category 2 (Full Tank) ────────────────────────────────────────┐││
│         │         │                                                        │││
│         │         ▼                                                        │││
│         │  Calculate from FuelRefill data:                                 │││
│         │    Opening = TankCapacity - EstimatedUsed                        │││
│         │    Closing = TankCapacity - EstimatedUsed                        │││
│         │    Consumption = TotalFuelAdded (Full Tank Policy)               │││
│         │                                                                  │││
│         ├─ Category 3 (Equipment) ────────────────────────────────────────┤││
│         │         │                                                        │││
│         │         ▼                                                        │││
│         │  No additional fetch - use FuelRefill data only                  │││
│         │    Opening = Unknown                                             │││
│         │    Closing = Unknown                                             │││
│         │    Track fuel issued only                                        │││
│         │                                                                  │││
│         ├─ Category 4 (Cross-Site) ───────────────────────────────────────┤││
│         │         │                                                        │││
│         │         ▼                                                        │││
│         │  POST /api/v1/FuelAuditGPS/fleet/category-audit (category=4)    │││
│         │         │                                                        │││
│         │         ▼                                                        │││
│         │  GetCrossSiteGpsDataQuery → gpsgate_report_entries table        │││
│         │    Opening = FuelBefore of first entry in period                │││
│         │    Closing = FuelAfter of last entry in period                  │││
│         │    Consumption = Opening + RefillTotals - Closing               │││
│         │                                                                  │││
│         └─ Category 5 (External) ─────────────────────────────────────────┘││
│                   │                                                         ││
│                   ▼                                                         ││
│         No additional fetch - account for fuel issued only                  ││
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Step 4

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/api/v1/FuelAudit/tank-refills-preview` | Get classified vehicles | ✅ Done |

### Step 5

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/api/v1/FuelAuditGPS/fleet/audit-period` | Get GPS opening/closing | ✅ Done |
| POST | `/api/v1/FuelAuditGPS/fleet/category-audit` | **NEW** Category-aware routing | ✅ Done |
| POST | `/api/v1/FuelAuditGPS/estimate/full-tank` | **NEW** Full tank estimation | ✅ Done |
| POST | `/api/v1/FuelAuditGPS/vehicle/{id}` | Single vehicle fuel | ✅ Done |

---

## Implementation Checklist

### Backend - ✅ COMPLETE

- [x] `GetTankRefillsForPeriodQuery` - Vehicle classification
- [x] `VehicleRefillSummaryDTO` - Classification fields
- [x] `VehicleProviderMappings` - Modern GPS detection
- [x] `IsFullTankPolicy` - Full tank policy flag usage
- [x] `FuelTankCapacity` - Exposed in DTO
- [x] `FuelAuditGPSController.GetFleetAuditPeriodFuel` - GPS endpoint
- [x] `FuelAuditGPSController.GetCategoryAuditFuel` - **NEW** Category-aware routing
- [x] `FuelAuditGPSController.GetFullTankEstimations` - **NEW** Full tank estimation endpoint
- [x] `FullTankEstimationService` - **NEW** Category 2 estimation logic
- [x] `CategoryAuditRequestDTO` - **NEW** Category-aware request/response DTOs
- [x] `FuelAuditGPSService` - REST API integration

### Frontend - ✅ COMPLETE

- [x] `Step4VehicleSelection.js` - Category grouping
- [x] `Step5VehiclePreview.js` - Category-aware preview
- [x] `fuelAuditSlice.js` - Redux thunks
- [x] `fuelAuditApi.js` - API calls
- [x] Category badges and icons
- [x] Progress indicators
- [x] Data source legend

### Pending

- [ ] Frontend: Audit list page with individual XSL export
- [ ] Prefetch optimization (background loading)
- [ ] Error boundary improvements

---

## New Backend Services

### FullTankEstimationService

Estimates opening/closing fuel levels for Category 2 vehicles (Full Tank Policy).

**Location:** `FMS.Application/Features/FuelAudit/Services/FullTankEstimationService.cs`

**Key Features:**
- Uses "fill-up to fill-up" method
- Infers full tank refills from amount (≥80% capacity OR ≥60L)
- Calculates daily consumption from refill patterns
- Provides confidence scores and warnings
- Tracks estimation method for audit trail

**Estimation Methods:**
1. `FullTank_BackCalculation` - Work backward from first refill in period
2. `FullTank_ForwardCalculation` - Work forward from last refill before period
3. `FullTank_BackFromNext` - Work backward from next refill after period
4. `Consumption_FromOpening` - Use opening level minus consumption

### CategoryAuditRequestDTO

New DTOs for category-aware audit requests.

**Location:** `FMS.Application/Features/FuelAudit/DTOs/CategoryAuditRequestDTO.cs`

**Includes:**
- `CategoryAuditRequestDTO` - Request with vehicle categories
- `CategoryVehicleDTO` - Vehicle with category info
- `CategoryAuditResponseDTO` - Response organized by category
- `CategoryResultDTO` - Results per category
- `VehicleFuelAuditResultDTO` - Individual vehicle results
- `CategorySummaryDTO` - Summary statistics

---

## Testing

### Manual Testing Steps

1. **Step 4 Testing:**
   - Select site and tanks in Steps 1-2
   - Navigate to Step 4
   - Verify vehicles are grouped by category
   - Check classification accuracy against Vehicle.cs properties
   - Confirm GPS detection uses `VehicleProviderMappings`

2. **Step 5 Testing:**
   - Select vehicles from multiple categories
   - Click "Load GPS Data" for Category 1
   - Verify opening/closing values appear
   - Check consumption calculation
   - Confirm data quality badges

3. **Full Tank Estimation Testing (NEW):**
   - Select Category 2 vehicles
   - Call `/api/v1/FuelAuditGPS/estimate/full-tank`
   - Verify estimation details include method and confidence
   - Check warnings for low-reliability estimates

### Test Cases

| Test | Expected Result |
|------|-----------------|
| Vehicle with `VehicleProviderMappings` | Category 1 (Site GPS Fleet) |
| Vehicle with `IsFullTankPolicy = true` | Category 2 (Site Full Tank) |
| Vehicle with `AverageKmL = false, IsFullTankPolicy = false` | Category 3 (Site Equipment) |
| Vehicle at different site, `IsCompanyVehicle = true` | Category 4 (Cross-Site) |
| Vehicle with `IsCompanyVehicle = false` | Category 5 (External) |
| Category 2 with large refill (≥80% capacity) | Estimated as full tank |
| Category 2 with small refill (<60L) | Estimated as partial tank |

---

## API Examples

### Category-Aware Audit Request

```json
POST /api/v1/FuelAuditGPS/fleet/category-audit
{
  "vehicles": [
    {
      "vehicleId": 123,
      "category": 1,
      "hasGPS": true,
      "isFullTankPolicy": false
    },
    {
      "vehicleId": 456,
      "category": 2,
      "hasGPS": false,
      "isFullTankPolicy": true,
      "fuelTankCapacity": 80,
      "totalFuelRefilled": 120
    }
  ],
  "startDate": "2025-11-01",
  "endDate": "2025-11-30",
  "auditSiteId": 5
}
```

### Full Tank Estimation Request

```json
POST /api/v1/FuelAuditGPS/estimate/full-tank
[
  {
    "vehicleId": 456,
    "vehicleName": "PU-001",
    "startDate": "2025-11-01",
    "endDate": "2025-11-30",
    "fuelTankCapacity": 80,
    "averageEfficiency": 8.5,
    "isKmL": true,
    "isFullTankPolicy": true
  }
]
```

---

## File References

| File | Purpose |
|------|---------|
| `GetTankRefillsForPeriodQuery.cs` | Backend classification logic |
| `TankRefillPreviewDTO.cs` | VehicleRefillSummaryDTO definition |
| `FuelAuditGPSController.cs` | GPS endpoints (updated) |
| `FullTankEstimationService.cs` | **NEW** Full tank estimation |
| `CategoryAuditRequestDTO.cs` | **NEW** Category-aware DTOs |
| `Step4VehicleSelection.js` | Frontend category grouping |
| `Step5VehiclePreview.js` | GPS preview component |
| `fuelAuditSlice.js` | Redux state management |
| `fuelAuditApi.js` | API client |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 30, 2025 | Initial implementation documentation |
| 1.1 | Nov 30, 2025 | Added FullTankEstimationService, CategoryAuditRequestDTO, category-aware routing |
