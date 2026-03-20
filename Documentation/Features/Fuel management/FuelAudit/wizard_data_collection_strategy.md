# Fuel Audit Wizard - Optimized Data Collection Strategy

## Overview

This document outlines the optimal approach for collecting and analyzing data for all **5 vehicle categories** during the Fuel Audit wizard creation process.

## Current Wizard Steps

| Step | Name | Current Function |
|------|------|------------------|
| 1 | Site & Period Selection | Select audit site and date range |
| 2 | Tank Selection | Choose which tanks to audit |
| 3 | Tank Data Preview | Preview tank opening/closing stock |
| 4 | Vehicle Selection | Select vehicles from FuelRefill records |
| 5 | GPS Data Preview | Preview GPS fuel data |
| 6 | Review & Create | Final review and create audit |

---

## The Challenge: 5 Vehicle Categories

From our vehicle classification, we have:

| Category | At Site | Company | GPS | Current Wizard Coverage |
|----------|---------|---------|-----|------------------------|
| 1. Site GPS Fleet | ✅ | ✅ | ✅ | ✅ Step 4 + Step 5 |
| 2. Site Full Tank (No GPS) | ✅ | ✅ | ❌ | ✅ Step 4 only |
| 3. Site Equipment (No GPS) | ✅ | ✅ | ❌ | ✅ Step 4 only |
| 4. Cross-Site Company | ❌ | ✅ | ✅ | ⚠️ Partially (FuelRefill) |
| 5. External Non-Company | ❌ | ❌ | ❌ | ⚠️ Partially (FuelRefill) |

### Problem with Current Approach

The current Step 4 only queries the `FuelRefill` table based on selected tanks. This:
- ✅ Finds all vehicles that fueled from site tanks (Categories 1-5)
- ❌ Doesn't classify vehicles into categories
- ❌ Doesn't identify GPS vs Non-GPS vehicles
- ❌ Doesn't distinguish site vehicles from cross-site/external

---

## Optimized Data Collection Strategy

### Phase 1: Enhanced Vehicle Classification (Step 4)

**Current Flow:**
```
Tank Selection → FuelRefill Query → Vehicle List
```

**Proposed Flow:**
```
Tank Selection → FuelRefill Query → Classify by Category → Display Grouped
```

#### Backend Enhancement

Modify `GetTankRefillsForPeriodQuery` to include vehicle classification:

```csharp
// Location: FMS.Application/Features/FuelAudit/DTOs/TankRefillPreviewDTO.cs
// ✅ IMPLEMENTED

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
    public string DataSourcePrimary { get; set; }   // "GPS_REST", "GPS_SOAP", "Estimated", "FuelRefill"
    public string DataConfidence { get; set; }      // "HIGH", "MEDIUM", "LOW", "ACCOUNTED"

    // NEW: Vehicle properties for calculations
    public bool IsFullTankPolicy { get; set; }      // ✅ From Vehicle.IsFullTankPolicy
    public decimal? FuelTankCapacity { get; set; }  // ✅ From Vehicle.FuelTankCapacity

    // Computed display helpers
    public string CategoryIcon => VehicleCategory switch
    {
        1 => "fa-satellite",      // GPS Fleet
        2 => "fa-truck",          // Full Tank
        3 => "fa-gear",           // Equipment
        4 => "fa-arrow-right-arrow-left", // Cross-Site
        5 => "fa-user-plus",      // External
        _ => "fa-question"
    };

    public string CategoryBadgeColor => VehicleCategory switch
    {
        1 => "green",   // HIGH confidence
        2 => "yellow",  // MEDIUM confidence
        3 => "orange",  // LOW confidence
        4 => "cyan",    // HIGH confidence (cross-site)
        5 => "pink",    // ACCOUNTED only
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

#### Classification Logic

```csharp
// Location: FMS.Application/Features/FuelAudit/Queries/GetTankRefillsForPeriodQuery.cs
// ✅ IMPLEMENTED

/// <summary>
/// Classifies a vehicle into one of 5 categories based on:
/// - WorkingSiteId (belongs to audit site or not)
/// - IsCompanyVehicle (company-owned or external)
/// - HasGPS (via VehicleProviderMappings or legacy fields)
/// - IsFullTankPolicy (explicit full tank policy flag)
/// - AverageKmL (IsKmL: true = vehicle, false = equipment with L/hr)
/// </summary>
private int ClassifyVehicle(
    Vehicle vehicle,
    int auditSiteId,
    bool isKmL,
    bool hasGPS,
    bool isFullTankPolicy)
{
    bool atSite = vehicle.WorkingSiteId == auditSiteId;
    bool isCompany = vehicle.IsCompanyVehicle == true;

    // Category 1: Site GPS Fleet - has GPS at audit site
    if (atSite && hasGPS)
        return 1;

    // Category 2: Site Full Tank - at site, no GPS, follows full tank policy
    // Uses IsFullTankPolicy flag OR falls back to IsKmL for legacy data
    if (atSite && !hasGPS && (isFullTankPolicy || isKmL))
        return 2;

    // Category 3: Site Equipment - at site, no GPS, L/hr equipment
    if (atSite && !hasGPS && !isKmL && !isFullTankPolicy)
        return 3;

    // Category 4: Cross-Site Company - company vehicle from different site
    if (!atSite && isCompany)
        return 4;

    // Category 5: External Non-Company - third party
    return 5;
}
```

### GPS Detection (Implemented)

```csharp
// Modern approach: VehicleProviderMappings table (replaces deprecated HasGPSInstalled/DeviceId)
var gpsVehicleIds = await _context.VehicleProviderMappings
    .AsNoTracking()
    .Where(m => vehicleIds.Contains(m.VehicleId) && m.IsActive)
    .Select(m => m.VehicleId)
    .Distinct()
    .ToListAsync();

var vehiclesWithGps = new HashSet<int>(gpsVehicleIds);

// Hybrid detection: Modern OR legacy for backward compatibility
var hasModernGps = vehiclesWithGps.Contains(vehicleId);
var hasLegacyGps = vehicle?.HasGPSInstalled == true || vehicle?.DeviceId.HasValue == true;
var hasGPS = hasModernGps || hasLegacyGps;
```

### Vehicle Properties Used (from Vehicle.cs)

| Property | Type | Usage | Status |
|----------|------|-------|--------|
| `WorkingSiteId` | `int?` | Site assignment check | ✅ Implemented |
| `IsCompanyVehicle` | `sbyte?` | Ownership classification | ✅ Implemented |
| `IsFullTankPolicy` | `bool` | Full tank policy flag (Cat 2) | ✅ **NEW** Implemented |
| `AverageKmL` | `bool?` | Legacy fallback for full tank | ✅ Implemented |
| `FuelTankCapacity` | `decimal?` | Tank size for estimates | ✅ **NEW** Exposed in DTO |
| `VehicleProviderMappings` | `relation` | Modern GPS detection | ✅ **NEW** Implemented |
| `HasGPSInstalled` | `sbyte?` | Legacy GPS flag | ⚠️ Deprecated (fallback only) |
| `DeviceId` | `int?` | Legacy device ID | ⚠️ Deprecated (fallback only) |

### Phase 2: Parallel GPS Data Fetching (Step 5 Optimization)

**Current Problem:**
- Step 5 only fetches GPS data on button click
- Doesn't handle different data sources per category
- No pre-fetching while user reviews Step 4

**Optimized Approach:**

```javascript
// In Step 4, after vehicle selection, start background GPS fetch
useEffect(() => {
    if (selectedVehicleIds.length > 0) {
        // Group vehicles by category
        const gpsVehicles = vehicles.filter(v => v.vehicleCategory === 1);
        const crossSiteVehicles = vehicles.filter(v => v.vehicleCategory === 4);

        // Start parallel fetches
        if (gpsVehicles.length > 0) {
            dispatch(prefetchGPSData({
                vehicleIds: gpsVehicles.map(v => v.vehicleId),
                startDate: wizard.periodStart,
                endDate: wizard.periodEnd,
                source: 'REST' // GPSGate REST API
            }));
        }

        if (crossSiteVehicles.length > 0) {
            dispatch(prefetchSOAPData({
                vehicleIds: crossSiteVehicles.map(v => v.vehicleId),
                startDate: wizard.periodStart,
                endDate: wizard.periodEnd,
                source: 'SOAP' // GPSGate Report 212
            }));
        }
    }
}, [selectedVehicleIds]);
```

### Phase 3: Unified Data Preview (Enhanced Step 5)

Instead of a single GPS preview, show a **category-aware preview**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    VEHICLE DATA PREVIEW BY CATEGORY                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─ Category 1: Site GPS Fleet (12 vehicles) ─────────────────────┐ │
│  │  [✓] Opening: REST API    [✓] Closing: REST API                │ │
│  │  [✓] Refuels: FuelRefill + GPS Detection                       │ │
│  │  Status: ██████████░░ 85% data available                       │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─ Category 2: Site Full Tank (5 vehicles) ──────────────────────┐ │
│  │  [~] Opening: Estimated    [~] Closing: Estimated              │ │
│  │  [✓] Refuels: FuelRefill                                       │ │
│  │  Status: Using Full Tank Policy (Consumed = Refueled)          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─ Category 3: Site Equipment (3 vehicles) ──────────────────────┐ │
│  │  [✗] Opening: Unknown      [✗] Closing: Unknown                │ │
│  │  [✓] Refuels: FuelRefill                                       │ │
│  │  Status: Track fuel issued only                                │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─ Category 4: Cross-Site Company (2 vehicles) ──────────────────┐ │
│  │  [✓] Opening: SOAP FuelBefore    [✓] Closing: SOAP FuelBefore  │ │
│  │  [✓] Fuel from site: FuelRefill  [✓] Total: Report 212         │ │
│  │  Status: ████████████ 100% data (Report 212 available)         │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─ Category 5: External Non-Company (1 vehicle) ─────────────────┐ │
│  │  [✗] Opening: N/A          [✗] Closing: N/A                    │ │
│  │  [✓] Fuel issued: FuelRefill                                   │ │
│  │  Status: Accounted in tank reconciliation only                 │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Backend Classification (Priority: HIGH)

1. **Modify `VehicleRefillSummaryDTO`** to include classification fields
2. **Update `GetTankRefillsForPeriodQuery`** to classify vehicles
3. **Add endpoint for fetching SOAP Report 212 data** for cross-site vehicles

### Phase 2: Frontend Grouping (Priority: HIGH)

1. **Update Step 4** to group vehicles by category
2. **Add category tabs or grouping** in the DataGrid
3. **Show data source indicators** (GPS, Estimated, FuelRefill only)

### Phase 3: Parallel Data Fetching (Priority: MEDIUM)

1. **Create prefetch thunks** for GPS REST and SOAP data
2. **Implement background fetching** when vehicles are selected
3. **Cache results** to avoid re-fetching in Step 5

### Phase 4: Enhanced Preview (Priority: MEDIUM)

1. **Redesign Step 5** to show category-based preview
2. **Add progress indicators** per category
3. **Show data quality warnings** for low-confidence data

---

## Data Collection Timing

### Recommended Timing for Each Data Source

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Step 1: Site & Period Selection                                            │
│   └─→ No data fetching yet                                                 │
├────────────────────────────────────────────────────────────────────────────┤
│ Step 2: Tank Selection                                                     │
│   └─→ Fetch tank list for selected site                                   │
├────────────────────────────────────────────────────────────────────────────┤
│ Step 3: Tank Preview                                                       │
│   └─→ Fetch tank readings for period (ATG or manual)                      │
├────────────────────────────────────────────────────────────────────────────┤
│ Step 4: Vehicle Selection                                                  │
│   ├─→ Fetch FuelRefill records (immediate)                                │
│   ├─→ Classify vehicles by category (immediate)                           │
│   └─→ START background: Prefetch GPS REST data for Category 1             │
│       START background: Prefetch SOAP Report 212 for Category 4           │
├────────────────────────────────────────────────────────────────────────────┤
│ Step 5: Data Preview                                                       │
│   ├─→ Display prefetched GPS data (if ready)                              │
│   ├─→ Calculate Full Tank estimates for Category 2                        │
│   └─→ Show data quality summary by category                               │
├────────────────────────────────────────────────────────────────────────────┤
│ Step 6: Review & Create                                                    │
│   └─→ Validate all data present, create audit record                      │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints Required

### Existing Endpoints (Already Implemented)

| Endpoint | Purpose | Categories |
|----------|---------|------------|
| `POST /fuelaudit/tank-refills-preview` | Get vehicles from FuelRefill | All |
| `POST /FuelAuditGPS/fleet/audit-period` | Get GPS opening/closing | 1 |
| `POST /FuelComparison/fetch-gps-data` | Fetch SOAP Report 212 | 4 |

### New/Enhanced Endpoints Needed

| Endpoint | Purpose | Categories |
|----------|---------|------------|
| `POST /fuelaudit/tank-refills-preview-v2` | Classified vehicles | All |
| `GET /fuelaudit/vehicle-category/{vehicleId}` | Get vehicle classification | All |
| `POST /fuelaudit/prefetch-vehicle-data` | Parallel data fetch | 1, 4 |

---

## Frontend Component Updates

### Step 4: Vehicle Selection (Enhanced)

```jsx
// Group vehicles by category with expandable sections
<Accordion>
  <AccordionItem
    title="🛰️ GPS Fleet (12 vehicles)"
    badge="HIGH CONFIDENCE"
    badgeColor="green"
  >
    <DataGrid dataSource={gpsVehicles} />
  </AccordionItem>

  <AccordionItem
    title="🚛 Full Tank Vehicles (5 vehicles)"
    badge="MEDIUM CONFIDENCE"
    badgeColor="yellow"
  >
    <DataGrid dataSource={fullTankVehicles} />
  </AccordionItem>

  <AccordionItem
    title="⚙️ Equipment (3 vehicles)"
    badge="LOW CONFIDENCE"
    badgeColor="orange"
  >
    <DataGrid dataSource={equipmentVehicles} />
  </AccordionItem>

  <AccordionItem
    title="🔄 Cross-Site Company (2 vehicles)"
    badge="HIGH CONFIDENCE"
    badgeColor="cyan"
  >
    <DataGrid dataSource={crossSiteVehicles} />
  </AccordionItem>

  <AccordionItem
    title="📋 External (1 vehicle)"
    badge="ACCOUNTED ONLY"
    badgeColor="pink"
  >
    <DataGrid dataSource={externalVehicles} />
  </AccordionItem>
</Accordion>
```

### Step 5: Vehicle Preview (Enhanced)

```jsx
// Show category-specific data collection status
<CategoryDataStatus categories={[
  {
    id: 1,
    name: "Site GPS Fleet",
    count: 12,
    openingSource: "REST API",
    closingSource: "REST API",
    refuelSource: "FuelRefill + GPS",
    status: "fetching", // or "ready", "partial", "unavailable"
    progress: 85
  },
  // ... other categories
]} />
```

---

## Summary

### Key Optimizations

1. **Early Classification**: Classify vehicles in Step 4, not Step 5
2. **Parallel Fetching**: Start GPS/SOAP fetches in background during Step 4
3. **Category-Aware UI**: Group vehicles by category with appropriate indicators
4. **Progressive Loading**: Show data as it becomes available
5. **Clear Confidence Indicators**: Help users understand data quality

### Expected Benefits

| Benefit | Impact |
|---------|--------|
| Faster wizard completion | -30% time (parallel fetching) |
| Better user understanding | Clear category grouping |
| Accurate audit data | Right source for each category |
| Reduced errors | Automatic classification |

---

## Next Steps

1. [x] Implement `VehicleCategory` classification in backend ✅ **DONE**
2. [x] Update `GetTankRefillsForPeriodQuery` to include classification ✅ **DONE**
3. [x] Add `IsFullTankPolicy` and `FuelTankCapacity` to DTO ✅ **DONE**
4. [x] Use `VehicleProviderMappings` for modern GPS detection ✅ **DONE**
5. [x] Update Step 4 UI to show grouped vehicles ✅ **DONE**
6. [x] Update Step 5 for category-aware GPS preview ✅ **DONE**
7. [ ] Create prefetch thunks for parallel data loading
8. [ ] Add data quality indicators throughout wizard
