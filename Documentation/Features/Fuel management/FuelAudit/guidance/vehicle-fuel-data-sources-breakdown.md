# Vehicle Fuel Data Sources - Fuel Audit System

## Overview
This document explains the data sources and classification system for vehicles in a Fuel Management System (FMS). The system tracks fuel consumption across five distinct vehicle categories, each with different data availability and confidence levels.

---

## 5 Vehicle Categories

### Category 1: Site GPS Fleet
**Characteristics:**
- Has GPS tracking with fuel sensors
- Belongs to the audit site
- Full telemetry data available

**Data Confidence:** HIGH

**Data Sources:**

| Data Point | Source | Method |
|------------|--------|--------|
| Opening Fuel Level | GPSGate REST API | Real-time sensor reading (00:00-06:00) |
| Closing Fuel Level | GPSGate REST API | Real-time sensor reading (18:00-23:59) |
| Fuel Consumed | GPS Calculated | Opening + Refueled - Closing |
| Distance Traveled | GPS Odometer | Direct GPS tracking |
| Refuel Events (GPS) | GPSGate API | Fuel jump detection |
| Fuel Refueled (Recorded) | FuelRefill DB | Database records |

**Formula:**
```
Fuel Consumed = Opening Level + Total Refueled - Closing Level
```

---

### Category 2: Site Full Tank (No GPS)
**Characteristics:**
- No GPS/fuel sensor
- Follows "full tank" refueling policy (IsKmL = True)
- Belongs to audit site
- Typically pickup trucks

**Data Confidence:** MEDIUM

**Key Assumption:** Vehicle is always filled to capacity, so fuel added = fuel consumed since last fill

**Data Sources:**

| Data Point | Source | Method |
|------------|--------|--------|
| Opening Fuel Level | Estimated | Tank Capacity - Estimated consumption |
| Closing Fuel Level | Estimated | Tank Capacity - Estimated consumption |
| Fuel Consumed | FuelRefill DB | **= Total Refueled** (by policy) |
| Distance Traveled | FuelRefill DB | Odometer difference between refills |
| Fuel Refueled | FuelRefill DB | Recorded refill amounts |
| Fuel Efficiency | Calculated | Distance / Fuel Consumed |

**Formula:**
```
Fuel Consumed = Total Fuel Refueled (by full tank policy)
Opening/Closing = Estimated based on tank capacity
```

**Confidence Scoring:**

| Days Since Last Refuel | Confidence | Recommendation |
|------------------------|------------|----------------|
| 0-3 days | HIGH (>80%) | Include in reconciliation |
| 4-7 days | MEDIUM (50-80%) | Include with caution |
| 8-14 days | LOW (30-50%) | Flag for review |
| 15+ days | VERY LOW (<30%) | Exclude or manual check |

---

### Category 3: Site Equipment (No GPS)
**Characteristics:**
- No GPS or fuel sensor
- Equipment or vehicles measured in hours (L per hour)
- Cannot determine actual consumption
- Belongs to audit site

**Data Confidence:** LOW

**Data Sources:**

| Data Point | Source | Available |
|------------|--------|-----------|
| Opening Fuel Level | N/A | ❌ Unknown |
| Closing Fuel Level | N/A | ❌ Unknown |
| Fuel Consumed | N/A | ❌ Cannot calculate |
| Hours Operated | FuelRefill DB | ⚠️ If recorded |
| Fuel Issued | FuelRefill DB | ✅ Available |
| Est. Consumption | Historical Data | ~ Estimated L/hr |

**Limitation:** Can only track fuel issued, not actual consumption

---

### Category 4: Cross-Site Company Vehicle
**Characteristics:**
- Company-owned (IsCompany = 1)
- Has GPS with fuel sensors
- **Different site** from audit site
- Fuels at multiple company locations

**Data Confidence:** HIGH

**Data Sources:**

| Data Point | Source | Method |
|------------|--------|--------|
| Opening Fuel Level | GPSGate SOAP Report 212 | FuelBefore @ first refuel |
| Closing Fuel Level | GPSGate SOAP Report 212 | FuelBefore @ next refuel after period |
| Fuel from This Site | FuelRefill DB | Recorded at audit site |
| Total Refueled (All Sites) | GPSGate SOAP Report 212 | Sum of RefillVolume |
| Fleet Reconciliation | Separate Section | Cross-site analysis |

**Database Table:** `GpsGateReportEntry` (stores Report 212 data)

**Formula:**
```
Opening = GpsGateReportEntry.FuelBefore @ first refuel in period
Total Refueled = SUM(GpsGateReportEntry.RefillVolume) during period
Closing = GpsGateReportEntry.FuelBefore @ next refuel after period
Fuel Consumed = Opening + Total Refueled - Closing
```

**Key Insight:** Closing level = FuelBefore of the next refuel event after the audit period ends

---

### Category 5: External Non-Company Vehicle
**Characteristics:**
- Not company-owned (IsCompanyVehicle = 0)
- No GPS tracking
- Third-party/contractor vehicles
- No consumption data possible

**Data Confidence:** ACCOUNTED ONLY

**Data Sources:**

| Data Point | Source | Available |
|------------|--------|-----------|
| Fuel Issued | FuelRefill DB | ✅ Available |
| Refuel Count | FuelRefill DB | ✅ Available |
| Opening/Closing Levels | N/A | ❌ Not available |
| Fuel Consumed | N/A | ❌ Cannot calculate |

**Audit Treatment:**
- **Tanker Side:** Include in "Total Dispensed"
- **Fleet Side:** Exclude from reconciliation (no consumption data)

**Purpose:** Account for fuel leaving tanks, but cannot track how it's used

---

## GPS Data Source Comparison

For GPS-equipped vehicles (Categories 1 and 4), there are **three potential data sources**:

### 1. REST API (Tracks Endpoint)
- **Type:** Real-time / On-demand
- **Data:** Point-in-time fuel readings
- **Key Fields:** `FuelLevel`, `Timestamp`, `Position`
- **Storage:** Not stored (fetched on demand)
- **Timestamp Accuracy:** HIGH - Exact GPS timestamp
- **Best For:** Opening/Closing fuel levels at specific times

**Usage Example:**
```
Opening: Fetch fuel reading between 00:00-06:00 on start date
Closing: Fetch fuel reading between 18:00-23:59 on end date
```

---

### 2. SOAP Report 212 (GPSGate)
- **Type:** Batch / Pre-fetched
- **Data:** Refuel event detection
- **Key Fields:** `FuelBefore`, `FuelAfter`, `RefillVolume`
- **Storage:** `gpsgate_report_entries` table
- **Timestamp Accuracy:** HIGH - Event-based
- **Best For:** Refuel validation, cross-site vehicle tracking

**Usage Example:**
```
- Validate recorded refuels against detected fuel jumps
- Track total refueling across all company sites
- Detect unrecorded refuel events
```

---

### 3. Manual FuelRefill Table
- **Type:** Database table
- **Data:** Recorded fuel entries
- **Key Fields:** `FuelAmount`, `RefillDate`, `Odometer`
- **Storage:** `fuelrefill` table
- **Timestamp Accuracy:** LOW - May not be accurate
- **Best For:** Fuel dispensed amount (authoritative)

**Usage Example:**
```
- Authoritative record of fuel issued from site tanks
- Reconciliation with GPS-detected refuels
```

---

## Data Source Decision Matrix

| Data Need | Use This Source | Why |
|-----------|----------------|-----|
| Opening/Closing Fuel Level | REST API (Tracks) | Real-time reading at specific time window |
| Refuel Validation | SOAP Report 212 | Compare detected vs recorded refuels |
| Fuel Dispensed Amount | FuelRefill Table | Authoritative record from PTS |
| Cross-site Refuel Tracking | SOAP Report 212 | Company-wide refuel events |
| Unrecorded Refuel Detection | SOAP Report 212 | GPS fuel jumps not in FuelRefill |

---

## Data Quality Indicators

The system uses a hierarchical data quality system:

### Fuel Position Data Quality Levels

```
1. Check Cache → FuelPositionCacheService
2. GPSGate REST → FetchFuelPositionFromGPSGateAsync()
   └─ DataQuality: Exact / Interpolated
3. Manual Fallback → TryGetFuelFromManualRefillAsync()
   └─ DataQuality: Low
4. Unavailable → DataQuality: Unavailable
```

### Quality Badges

| Badge | Meaning | Usage |
|-------|---------|-------|
| ✅ Exact | Same day GPS data | High confidence |
| ~ Interpolated | 1-7 days prior GPS data | Medium confidence |
| ⚠️ Low | Manual fallback used | Low confidence |
| ❌ Unavailable | No data found | Cannot calculate |
| — NoSensor | Vehicle has no fuel sensor | Expected limitation |
| ⚡ SensorNotReporting | Sensor malfunction | Technical issue |

---

## Data Availability Matrix

| Data Field | Cat 1 (GPS) | Cat 2 (Full Tank) | Cat 3 (Equipment) | Cat 4 (Cross-Site) | Cat 5 (External) |
|------------|-------------|-------------------|-------------------|--------------------|------------------|
| Opening Fuel | ✅ GPS | ~ Estimated | ❌ Unknown | ✅ SOAP | ❌ N/A |
| Closing Fuel | ✅ GPS | ~ Estimated | ❌ Unknown | ✅ SOAP | ❌ N/A |
| Fuel Consumed | ✅ Calculated | ✅ = Refueled | ❌ Unknown | ✅ Calculated | ❌ N/A |
| Fuel from Site | ✅ FuelRefill | ✅ FuelRefill | ✅ FuelRefill | ✅ FuelRefill | ✅ FuelRefill |
| Total Refueled | ✅ GPS+DB | ✅ FuelRefill | ✅ FuelRefill | ✅ SOAP 212 | — Only this site |
| Refuel Mismatch | ✅ GPS vs Record | ❌ No GPS | ❌ No GPS | ✅ SOAP vs Record | ❌ No GPS |
| Fleet Reconciliation | ✅ Include | ✅ Include (Est) | ~ Optional | ~ Separate | ❌ Exclude |

---

## Variance Calculation Formulas

### GPS Vehicle (Category 1)
```
Expected Closing = Opening + Refueled - Consumed
Variance = Actual Closing - Expected Closing
```

### Full Tank Vehicle (Category 2)
```
Consumed = Refueled (by full tank policy)
Opening = Tank Capacity - Estimated Used
Closing = Tank Capacity - Estimated Used
Variance = Based on estimation accuracy
```

### Non-Full Tank Vehicle (Category 3)
```
⚠️ Cannot Reconcile
Track Only:
  - Fuel Issued
  - Hours Operated
  - Historical L/hr
```

### Cross-Site Company (Category 4)
```
Opening = SOAP FuelBefore @ first refuel
Total Refueled = SUM(SOAP RefillVolume)
Closing = SOAP FuelBefore @ next refuel after period
Consumed = Opening + Total Refueled - Closing
```

### External Non-Company (Category 5)
```
Fuel Issued = SUM(FuelRefill.FuelAmount) ✅
Refill Count = COUNT(FuelRefill) ✅
Opening, Closing, Consumed = ❌ NOT AVAILABLE
∴ Include in tanker "Total Dispensed", exclude from fleet reconciliation
```

---

## Wizard Data Collection Strategy

The system uses a 6-step wizard for creating fuel audits. Optimal data fetching occurs at specific steps:

### Step-by-Step Process

**Step 1: Site & Period**
- User selects audit site and date range
- No data fetching

**Step 2: Tank Selection**
- Fetch list of tanks at selected site
- User selects which tanks to audit

**Step 3: Tank Preview**
- Show ATG (Automatic Tank Gauge) readings
- Display opening/closing tank levels

**Step 4: Vehicle Selection ⭐ (CRITICAL)**
- Fetch all vehicles that fueled from selected tanks
- **Classify each vehicle into Categories 1-5**
- **Prefetch GPS data in background:**
  - Category 1: REST API for opening/closing levels
  - Category 4: SOAP Report 212 for cross-site data
- Display vehicles grouped by category

**Step 5: GPS Preview**
- Show prefetched GPS data
- Display category-specific data quality indicators
- Allow user to review before final creation

**Step 6: Review & Create**
- Final validation
- Save audit to database
- Generate initial reports

### Step 4 Optimization Details

This is where the system becomes "smart" about data fetching:

```
1. POST /tank-refills-preview
   └─ Get all vehicles that fueled from selected tanks

2. For each vehicle:
   └─ ClassifyVehicle(vehicle, siteId) → Assign Category 1-5

3. For Category 1 vehicles (Site GPS):
   └─ Background: Fetch REST API /fleet/audit-period
   └─ Get opening/closing fuel levels

4. For Category 4 vehicles (Cross-Site Company):
   └─ Background: Fetch SOAP Report 212
   └─ Get cross-site refuel data
```

### Benefits of Step 4 Optimization

| Benefit | Impact |
|---------|--------|
| ⚡ 30% Faster | Parallel fetching during user review time |
| 📊 Clear Grouping | Category-aware display in Step 5 |
| ✓ Right Source | Fetch appropriate data per category |
| 🎯 Quality Indicators | Show data confidence upfront |

---

## Category-Aware Data Preview (Step 5)

The system displays vehicles grouped by category with appropriate data confidence:

```
🛰️ Category 1: GPS Fleet
   Opening: REST | Closing: REST | Refuels: GPS+FuelRefill
   Confidence: HIGH

🚛 Category 2: Full Tank
   Opening: Estimated | Closing: Estimated | Consumed = Refueled
   Confidence: MEDIUM

⚙️ Category 3: Equipment
   Opening: ❌ | Closing: ❌ | Track fuel issued only
   Confidence: LOW

🔄 Category 4: Cross-Site Company
   Opening: SOAP FuelBefore | Closing: SOAP FuelBefore | Total: Report 212
   Confidence: HIGH

📋 Category 5: External Non-Company
   Opening: N/A | Closing: N/A | Track fuel issued for tank reconciliation
   Confidence: ACCOUNTED ONLY
```

---

## Key System Principles

### 1. Closed-System Fuel Audit Model
The system tracks fuel from delivery through consumption across multiple data sources, ensuring all fuel is accounted for.

### 2. Hybrid Algorithm Approach
The system separates vehicles based on capabilities:
- GPS-equipped vehicles → Precise consumption tracking
- Full-tank pickup trucks → Estimation based on refill policy
- Equipment/external → Fuel issued only (no consumption tracking)

### 3. Data Source Hierarchy
When multiple sources are available, the system uses:
1. Real-time GPS data (highest confidence)
2. Cached GPS data (medium confidence)
3. Manual records (lowest confidence)
4. Estimation algorithms (when no other option exists)

### 4. Category-Based Logic
Different vehicle categories require different:
- Data fetching strategies
- Calculation methods
- Confidence levels
- Inclusion in fleet reconciliation

### 5. Variance Detection
The system can detect:
- GPS-detected refuels not in database
- Database refuels not detected by GPS
- Abnormal consumption patterns
- Potential fuel theft incidents

---

## Database Tables Referenced

### Primary Tables

**`fuelrefill`**
- Records all fuel dispensing transactions
- Source of truth for fuel issued from site tanks
- Fields: `FuelAmount`, `RefillDate`, `Odometer`, `VehicleId`, `TankId`

**`gpsgate_report_entries`**
- Stores GPSGate SOAP Report 212 data
- Contains refuel event detection from GPS
- Fields: `FuelBefore`, `FuelAfter`, `RefillVolume`, `DeviceId`, `Timestamp`

**`vehicles`**
- Master vehicle registry
- Fields: `IsCompanyVehicle`, `IsKmL`, `TankCapacity`, `SiteId`

**`tanks`**
- Fuel storage tanks at sites
- Fields: `TankName`, `Capacity`, `SiteId`, `ProductType`

---

## API Endpoints Referenced

### GPSGate REST API
- **Endpoint:** `/fleet/audit-period`
- **Purpose:** Fetch real-time fuel readings for audit period
- **Used For:** Category 1 vehicles (Site GPS Fleet)

### GPSGate SOAP API
- **Report:** Report 212
- **Purpose:** Refuel event detection across all company sites
- **Used For:** Category 4 vehicles (Cross-Site Company)

### Internal Endpoints
- **POST** `/tank-refills-preview` - Get vehicles that fueled from selected tanks
- **POST** `/FuelComparison/fetch-gps-data` - Trigger GPS data fetch for cross-site vehicles
- **GET** `/fleet/audit-period` - Fetch fuel data for audit date range

---

## Best Practices

### 1. For Critical Audits
Force pickup truck refuels on audit dates to eliminate estimation uncertainty. This ensures 100% confidence on opening/closing positions for Category 2 vehicles.

### 2. Data Quality Monitoring
Always check data quality indicators before making reconciliation decisions. Low-quality data should be flagged for manual review.

### 3. Category Classification
Ensure vehicles are correctly classified at the start of the audit. Incorrect classification leads to wrong data fetching strategies.

### 4. Cross-Site Reconciliation
Handle Category 4 vehicles (cross-site company) separately from site-specific vehicles to avoid double-counting.

### 5. External Vehicle Treatment
Remember that Category 5 vehicles can only contribute to tank reconciliation (fuel dispensed), never fleet reconciliation (fuel consumed).

---

## Common Scenarios

### Scenario 1: Site GPS Vehicle Refuels Multiple Times
```
Opening (00:00-06:00): 30L
Refuel 1: +40L → 70L
Refuel 2: +35L → 105L
Closing (18:00-23:59): 25L
Consumed = 30 + 75 - 25 = 80L
```

### Scenario 2: Full Tank Pickup Refuels Once
```
Tank Capacity: 80L
Last Refuel: 3 days before audit start (confidence: HIGH)
Refuel during audit: 65L
Consumed = 65L (by full tank policy)
Opening ≈ 80L - estimated daily usage
Closing ≈ 80L - estimated daily usage
```

### Scenario 3: Cross-Site Company Vehicle
```
Vehicle fuels at 3 sites during audit period
Site A (audit site): 50L
Site B: 40L
Site C: 35L
Total Refueled: 125L (from SOAP Report 212)
Opening: FuelBefore @ first refuel = 20L
Closing: FuelBefore @ next refuel after period = 30L
Consumed = 20 + 125 - 30 = 115L
```

### Scenario 4: External Contractor Vehicle
```
Fuel Issued at Audit Site: 200L over 5 refills
Cannot track: Where fuel went, how much consumed, remaining fuel
Audit Treatment:
  ✅ Tank Side: Add 200L to "Total Dispensed"
  ❌ Fleet Side: Exclude from consumption analysis
```

---

## Troubleshooting Guide

### Issue: Missing GPS Data for Category 1 Vehicle
**Possible Causes:**
1. GPS device offline
2. Fuel sensor malfunction
3. Data not cached yet

**Resolution:**
1. Check DataQuality indicator
2. If "SensorNotReporting", verify device status
3. If "Unavailable", fall back to manual refill data (lower confidence)

### Issue: Large Variance in Full Tank Vehicle
**Possible Causes:**
1. Refuel too long before/after audit dates
2. Unusual consumption pattern
3. Unrecorded refuels

**Resolution:**
1. Check "Days Since Last Refuel"
2. If >7 days, confidence drops to MEDIUM/LOW
3. Consider forcing refuel on audit date for accuracy

### Issue: Cross-Site Vehicle Data Mismatch
**Possible Causes:**
1. SOAP Report 212 not fetched
2. Refuel events outside FuelRefill records
3. Vehicle refueled at non-company station

**Resolution:**
1. POST to `/FuelComparison/fetch-gps-data`
2. Compare SOAP RefillVolume with FuelRefill records
3. Flag mismatches for review

---

## Summary Table

| Category | GPS | Fuel Sensor | Data Confidence | Consumption Calculation | Fleet Reconciliation |
|----------|-----|-------------|-----------------|------------------------|---------------------|
| 1. Site GPS | ✅ | ✅ | HIGH | Opening + Refueled - Closing | ✅ Include |
| 2. Site Full Tank | ❌ | ❌ | MEDIUM | = Refueled (policy) | ✅ Include |
| 3. Site Equipment | ❌ | ❌ | LOW | Cannot calculate | ~ Optional |
| 4. Cross-Site Company | ✅ | ✅ | HIGH | SOAP calculated | ~ Separate |
| 5. External Non-Company | ❌ | ❌ | ACCOUNTED | Cannot calculate | ❌ Exclude |

---

## Key Takeaways for AI Agents

1. **Vehicle classification drives everything** - Always determine category first
2. **Different categories need different data sources** - Don't use REST API for Category 2
3. **Data confidence matters** - Flag low-confidence data for human review
4. **Full tank policy simplifies Category 2** - Consumed always equals refueled
5. **Cross-site vehicles are special** - Use SOAP Report 212, not REST API
6. **External vehicles are for accounting only** - Never try to calculate consumption
7. **Prefetch during wizard Step 4** - Optimize user experience with background fetching
8. **Quality indicators guide decisions** - Exact > Interpolated > Low > Unavailable

---

## Implementation Checklist for AI Agents

When processing a fuel audit request:

- [ ] Identify vehicle category (1-5)
- [ ] Check data source availability for that category
- [ ] Fetch appropriate data (REST API, SOAP, or FuelRefill DB)
- [ ] Verify data quality indicators
- [ ] Apply correct calculation formula for category
- [ ] Flag low-confidence data
- [ ] Include/exclude from fleet reconciliation based on category
- [ ] Handle cross-site vehicles separately
- [ ] Account for external vehicles in tank reconciliation only
- [ ] Report variances with confidence levels

---

*This documentation provides a complete reference for understanding and implementing the Vehicle Fuel Data Sources system in a Fuel Management Platform.*
