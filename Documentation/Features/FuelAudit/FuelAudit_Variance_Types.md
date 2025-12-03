# Fuel Audit Variance Types & Implementation Guide

## Document Purpose
This document clarifies the different types of variances in the FMS Fuel Audit system, what each variance measures, and how they are implemented.

---

## Overview: Three Types of Variance

The FMS system tracks **three distinct types of variance**, each serving a different audit purpose:

| Variance Type | What It Measures | Data Sources | Current Implementation | Purpose |
|---------------|------------------|--------------|------------------------|---------|
| **1. Refuel Variance** | Difference between fuel dispensed vs fuel received | FuelRefill vs GPS SOAP (Report 212) | ✅ **FuelComparisonController** | Detect dispensing errors, theft at pump |
| **2. Consumption Variance** | Difference between GPS-measured consumption vs calculated consumption | VehicleConsumption vs Formula | ❌ **NOT IMPLEMENTED** | Detect sensor drift, fuel theft during operation |
| **3. System Variance** | Total system fuel position vs expected | Opening + Deliveries - Consumption vs Closing | ⚠️ **PARTIAL** (Wizard Step 6) | Overall audit reconciliation |

---

## 1. Refuel Variance (IMPLEMENTED)

### **What It Measures:**
> "Did the vehicle receive the amount of fuel that was dispensed from the pump?"

### **Formula:**
```
Refuel Variance = GPS Detected Refuel - Manual Recorded Refuel
```

### **Data Sources:**
- **Manual Recorded**: `FuelRefill.ManualFuelrefillAmount` (what pump/tank says was dispensed)
- **GPS Detected**: `GpsGateReportEntry.RefillVolume` (what GPS sensor detected as fuel increase)
- **Alternative**: `PumpTransaction.Volume` (PTS system reading)

### **Implementation:**
```
Location: FuelComparisonController.cs
Endpoint: GET /api/v1/FuelComparison/data
Query: GetComparisonDataQuery
```

### **Example Scenario:**
```
Pump dispensed:    150.0 L  (FuelRefill record)
GPS detected:      145.0 L  (GPS Report 212)
Refuel Variance:    -5.0 L  (5 liters missing!)
```

**Possible Causes:**
- Fuel theft during dispensing
- Pump calibration error
- GPS sensor calibration error
- Data entry error
- Fuel spilled/leaked during dispensing

### **Current Usage:**
- Used in **Fuel Comparison** module
- Compares Manual vs PTS vs GPS SOAP data
- Generates variance reports
- Allows modification of GPS entries with reason tracking

---

## 2. Consumption Variance (NOT IMPLEMENTED - PROPOSED)

### **What It Measures:**
> "Does the GPS-measured daily consumption match the calculated consumption from fuel levels?"

### **Formula:**
```
Consumption Variance = Calculated Consumption - GPS Measured Consumption

Where:
  Calculated Consumption = Opening Fuel + Refueled - Closing Fuel
  GPS Measured Consumption = SUM(daily consumption from VehicleConsumption table)
```

### **Data Sources:**
- **GPS Measured**: `VehicleConsumption.Consumption` (daily GPS-calculated consumption)
- **Calculated**: Formula based on opening/closing fuel levels + refuels

### **Implementation Status:**
```
❌ NOT IMPLEMENTED

Proposed Location: FuelAuditGPSController.ProcessGPSCategoryAsync()
Required Query: GetHistoryConsumptionByVehicleQuery (EXISTS but not used)
Required Table: vehicleconsumptions (EXISTS and populated)
```

### **Example Scenario:**
```
Period: 1-7 Nov 2025

Opening Fuel:       150.0 L
Refueled:          +500.0 L
Closing Fuel:       170.0 L
Calculated Consumption: 480.0 L  (150 + 500 - 170)

GPS Daily Consumption:
  Nov 1:  65.0 L
  Nov 2:  72.0 L
  Nov 3:  68.0 L
  Nov 4:  70.0 L
  Nov 5:  75.0 L
  Nov 6:  69.0 L
  Nov 7:  71.0 L
  Total:  490.0 L

Consumption Variance: -10.0 L  (Calculated shows 10L less than GPS measured!)
```

**Possible Causes:**
- GPS fuel sensor drift over time
- Opening/closing readings taken at wrong time
- Fuel theft during operation (not at pump)
- Sensor calibration degradation
- Temperature-related fuel expansion/contraction

### **Why This Matters:**
- **Refuel Variance** only catches theft/errors at the pump
- **Consumption Variance** catches theft/leaks during vehicle operation
- Provides cross-validation of GPS sensor accuracy
- Helps identify systematic sensor drift

### **Proposed Implementation:**

```csharp
// In ProcessGPSCategoryAsync()

// 1. Fetch GPS-measured consumption
var gpsConsumptionQuery = new GetHistoryConsumptionByVehicleQuery
{
    VehicleId = vehicle.VehicleId,
    StartDate = startDate,
    EndDate = endDate
};
var gpsConsumptionData = await _mediator.Send(gpsConsumptionQuery, cancellationToken);

// 2. Sum daily GPS consumption
decimal gpsMeasuredConsumption = gpsConsumptionData.Sum(c => c.Consumption);

// 3. Calculate formula-based consumption
decimal calculatedConsumption = opening + refueled - closing;

// 4. Calculate variance
decimal consumptionVariance = calculatedConsumption - gpsMeasuredConsumption;

// 5. Flag if variance exceeds threshold
if (Math.Abs(consumptionVariance) > 10.0m || Math.Abs(consumptionVariance / calculatedConsumption) > 0.05m)
{
    // Flag: Consumption variance exceeds 10L or 5%
}
```

---

## 3. System Variance (PARTIAL IMPLEMENTATION)

### **What It Measures:**
> "Does the total system fuel position (tanks + vehicles) match what we expect based on deliveries and consumption?"

### **Formula:**
```
System Variance = Actual Closing Position - Expected Closing Position

Where:
  Expected Closing = Opening Position + Deliveries - Total Consumption
  Actual Closing = Physical Tank Readings + Vehicle Dead Stock
```

### **Data Sources:**
- **Tank Opening/Closing**: `TankVolumeHistory` (ATG or manual dip)
- **Deliveries**: `TankVolumeHistory` (delivery transactions)
- **Vehicle Opening/Closing**: GPS fuel levels or estimates
- **Consumption**: GPS consumption or refuel-based estimates

### **Implementation Status:**
```
⚠️ PARTIAL IMPLEMENTATION

Location: Wizard Step 6 (Review & Create)
Status: Shows summary but doesn't calculate system variance
Missing: Variance calculation and threshold checking
```

### **Example Scenario:**
```
OPENING POSITION (1 Nov 2025):
  Tanks:           25,000 L
  GPS Fleet:        3,500 L
  Pickup Fleet:     2,000 L
  Total Opening:   30,500 L

MOVEMENTS:
  + Deliveries:   +50,000 L
  - GPS Consumption: -42,000 L
  - Pickup Consumption: -20,000 L

EXPECTED CLOSING:
  30,500 + 50,000 - 62,000 = 18,500 L

ACTUAL CLOSING (7 Nov 2025):
  Tanks:           26,200 L
  GPS Fleet:        4,000 L
  Pickup Fleet:     2,500 L
  Total Actual:    32,700 L

SYSTEM VARIANCE: +14,200 L  (14,200 L more than expected!)
```

**Possible Causes:**
- Unrecorded deliveries
- Consumption calculation errors
- Opening/closing reading errors
- External vehicles fueled (not in audit)
- Fuel expansion due to temperature

---

## Variance Comparison Matrix

| Aspect | Refuel Variance | Consumption Variance | System Variance |
|--------|----------------|---------------------|-----------------|
| **Scope** | Single refuel event | Vehicle over period | Entire system |
| **Detection** | Immediate | Daily/Period | Period end |
| **Precision** | High (±1L) | Medium (±5L) | Low (±20L) |
| **Data Quality** | High | High (GPS) | Mixed |
| **Theft Detection** | At pump | During operation | System-wide |
| **Implementation** | ✅ Complete | ❌ Missing | ⚠️ Partial |

---

## Current Wizard Implementation

### **What the Wizard DOES:**

```
STEP 1: Site & Period Selection
  ✅ Select audit site
  ✅ Select date range
  ✅ Define audit type

STEP 2: Tank Selection
  ✅ Select tanks to audit
  ✅ Preview available tanks

STEP 3: Tank Data Preview
  ✅ Show opening/closing tank readings (ATG or manual)
  ✅ Show deliveries
  ✅ Show dispensing transactions

STEP 4: Vehicle Selection
  ✅ Classify vehicles into 5 categories
  ✅ Show refill summary per vehicle
  ✅ Select vehicles for audit

STEP 5: Vehicle Data Preview
  ✅ Fetch GPS opening/closing fuel (Category 1)
  ✅ Calculate consumption: Opening + Refilled - Closing
  ❌ Does NOT fetch GPS-measured consumption from VehicleConsumption
  ❌ Does NOT calculate Consumption Variance

STEP 6: Review & Create
  ✅ Show summary of selections
  ✅ Show total fuel dispensed
  ❌ Does NOT calculate System Variance
  ❌ Does NOT show variance thresholds
  ✅ Create audit record
```

### **What the Wizard SHOULD DO (Per Hybrid Algorithm):**

```
PHASE 1: Data Collection ✅ DONE
  ✅ Tanker opening/closing
  ✅ GPS fleet opening/closing
  ✅ Pickup fleet refills
  ✅ Deliveries

PHASE 2: GPS Fleet Reconciliation ⚠️ PARTIAL
  ✅ Calculate per-vehicle position
  ❌ Fetch GPS-measured consumption
  ❌ Calculate Consumption Variance
  ❌ Flag vehicles with variance

PHASE 3: Pickup Fleet Reconciliation ✅ DONE
  ✅ Estimate consumption from refuels
  ✅ Estimate opening/closing dead stock
  ✅ Calculate confidence scores

PHASE 4: Tanker Reconciliation ⚠️ PARTIAL
  ✅ Calculate tanker position
  ❌ Calculate tanker variance
  ❌ Flag tanker variance

PHASE 5: System-Wide Reconciliation ❌ MISSING
  ❌ Calculate total opening position
  ❌ Calculate total closing position
  ❌ Calculate system variance
  ❌ Calculate variance confidence

PHASE 6: Variance Analysis & Flags ❌ MISSING
  ❌ Threshold checks
  ❌ Generate flags
  ❌ Pattern detection
```

---

## Recommendation: Implementation Priority

### **Priority 1: System Variance (Step 6 Enhancement)**
**Why:** This is the core audit output - the final reconciliation
**Effort:** Medium
**Impact:** High

**Implementation:**
1. Calculate total opening position (tanks + vehicles)
2. Calculate expected closing (opening + deliveries - consumption)
3. Calculate actual closing (physical readings)
4. Calculate system variance
5. Apply threshold checks
6. Generate variance flags

### **Priority 2: Consumption Variance (Step 5 Enhancement)**
**Why:** Provides GPS sensor validation and theft detection
**Effort:** Low (query already exists)
**Impact:** High

**Implementation:**
1. Fetch GPS-measured consumption from `VehicleConsumption` table
2. Compare with calculated consumption (opening + refilled - closing)
3. Calculate consumption variance
4. Flag vehicles with variance > threshold
5. Display in Step 5 DataGrid

### **Priority 3: Enhanced Variance Reporting**
**Why:** Makes variance actionable
**Effort:** Medium
**Impact:** Medium

**Implementation:**
1. Add variance summary to Step 6
2. Create variance detail view
3. Add variance trend analysis
4. Export variance report

---

## Summary: Are We on the Right Track?

### **✅ What's Working Well:**

1. **Vehicle Classification** - Correctly categorizes vehicles into 5 types
2. **GPS Data Fetching** - Uses GPSGate REST API for opening/closing
3. **Refuel Variance** - Separate FuelComparison module handles this
4. **Pickup Estimation** - Full tank policy estimation working
5. **Data Collection** - All required data is being collected

### **⚠️ What's Missing (Per Hybrid Algorithm):**

1. **GPS Consumption Variance** - Not using `VehicleConsumption` table
2. **System Variance Calculation** - No final reconciliation math
3. **Variance Flags** - No threshold checking or alerts
4. **Variance Confidence** - No confidence scoring for estimates

### **🎯 The Core Issue:**

The wizard is **collecting all the right data** but **not performing the final reconciliation calculations** that the Hybrid Algorithm specifies. It's like gathering all the ingredients for a recipe but not cooking the meal!

**Current State:**
```
Wizard = Data Collection Tool
```

**Should Be:**
```
Wizard = Data Collection + Reconciliation + Variance Analysis Tool
```

---

## Next Steps

1. ✅ **Keep Refuel Variance separate** - FuelComparison module is correct
2. ✅ **Add Consumption Variance** to Step 5 (use existing VehicleConsumption data)
3. ✅ **Add System Variance** to Step 6 (implement reconciliation math)
4. ✅ **Add Variance Flags** throughout wizard (threshold checks)
5. ❌ **Skip efficiency trends** - not needed for audit

---

## Conclusion

**Yes, we are on the right track!** The wizard architecture is sound, and the data collection is comprehensive. We just need to add the **reconciliation and variance analysis layers** to complete the Hybrid Algorithm implementation.

The three variance types serve different purposes:
- **Refuel Variance** (FuelComparison) → Pump/dispensing accuracy
- **Consumption Variance** (Proposed) → GPS sensor accuracy & theft detection
- **System Variance** (Proposed) → Overall audit reconciliation

All three are valuable and non-overlapping. The wizard should focus on **Consumption Variance** and **System Variance**, while keeping **Refuel Variance** in the separate FuelComparison module.
