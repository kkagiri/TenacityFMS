# Hybrid Fuel Audit Model Algorithm

## Overview

This algorithm handles a fleet with mixed visibility:
- **GPS Fleet (Category 1)**: Full tracking with fuel sensors
- **Full Tank Policy Fleet (Category 2)**: No GPS, follows full-tank refuel policy (e.g., pickups)
- **Equipment (Category 3)**: No GPS, no odometer, L/hr consumption
- **Cross-Site Fleet (Category 4)**: Company vehicles from other sites
- **External Vehicles (Category 5)**: Non-company/contractor vehicles

---

## Vehicle Categories (5-Category System)

### Category 1: Site GPS Fleet
- **Definition**: Vehicles assigned to audit site with GPS fuel sensor
- **Identification**: `vehicle.workingSiteId == auditSiteId && vehicle.restId != null`
- **Data Source**: GPSGate REST API (real-time track data)
- **Confidence**: HIGH
- **Opening/Closing**: Direct sensor readings
- **Consumption**: GPS-measured from `VehicleConsumption` table

### Category 2: Site Full Tank Policy (No GPS)
- **Definition**: Vehicles assigned to audit site, no GPS, follows full-tank policy
- **Identification**: `vehicle.workingSiteId == auditSiteId && vehicle.restId == null && vehicle.isFullTankPolicy == true`
- **Data Source**: Estimation based on refuel pattern
- **Confidence**: MEDIUM
- **Opening/Closing**: Estimated from refuel dates and average consumption
- **Consumption**: Total fuel refilled = consumption (full tank policy)

### Category 3: Site Equipment (No GPS, L/hr)
- **Definition**: Equipment at audit site without GPS (generators, pumps, etc.)
- **Identification**: `vehicle.workingSiteId == auditSiteId && vehicle.restId == null && vehicle.isFullTankPolicy == false`
- **Data Source**: FuelRefill records only
- **Confidence**: LOW
- **Opening/Closing**: Not tracked (no sensor)
- **Consumption**: Track fuel issued only

### Category 4: Cross-Site Company
- **Definition**: Company vehicles from other sites refueling at audit site
- **Identification**: `vehicle.workingSiteId != auditSiteId && vehicle.isCompanyOwned == true`
- **Data Source**: GPSGate SOAP API (Report 212) from `gpsgate_report_entries`
- **Confidence**: HIGH (if data available)
- **Opening/Closing**: From SOAP historical data
- **Consumption**: GPS-measured or calculated

### Category 5: External Non-Company
- **Definition**: Non-company vehicles (contractors, visitors)
- **Identification**: `vehicle.isCompanyOwned == false`
- **Data Source**: FuelRefill records only
- **Confidence**: ACCOUNTED
- **Opening/Closing**: Not applicable
- **Consumption**: Not tracked (fuel issued for accountability only)

---

## Data Inputs Required

### Tanker Data
- Opening stock (physical dip/gauge or ATG)
- Deliveries received (date, litres, document reference)
- Dispensing transactions (date, vehicle, litres, method)
- Closing stock (physical dip/gauge or ATG)

### Category 1: GPS Fleet Data
- Opening dead stock per vehicle (sensor reading via REST API)
- **Daily consumption per vehicle (from `VehicleConsumption` table)**
- Refuel events detected (tank level jumps)
- Closing dead stock per vehicle (sensor reading via REST API)

### Category 2: Full Tank Policy Data
- Vehicle tank capacity
- Refuel transactions (date, litres dispensed)
- Last refuel date per vehicle
- Average consumption rates (historical)

### Category 3: Equipment Data
- Refuel transactions only
- No dead stock tracking

### Category 4: Cross-Site Data
- Opening/closing from SOAP Report 212 (if available)
- Refuel transactions at audit site

### Category 5: External Data
- Refuel transactions only (for accountability)

### Reference Data
- Vehicle master list with:
  - `workingSiteId` (assigned site)
  - `restId` (GPSGate REST ID for GPS vehicles)
  - `isFullTankPolicy` (follows full tank policy)
  - `isCompanyOwned` (company vs external)
  - `fuelTankCapacity` (tank capacity)
  - `averageEfficiency` (km/L or L/hr)

---

## Algorithm Structure

### PHASE 1: Data Collection & Validation

```
1.1 Set audit period
    - Define: audit_start_date, audit_end_date
    - Define: audit_site_id

1.2 Collect tanker data
    - Get opening_stock for each tanker at audit_start_date
    - Get closing_stock for each tanker at audit_end_date
    - Pull all delivery transactions in period
    - Pull all dispensing transactions in period

1.3 Classify vehicles into categories
    For each vehicle with refuel in period:
        IF vehicle.workingSiteId == audit_site_id:
            IF vehicle.restId != null:
                category = 1  // Site GPS Fleet
            ELSE IF vehicle.isFullTankPolicy:
                category = 2  // Site Full Tank Policy
            ELSE:
                category = 3  // Site Equipment
        ELSE IF vehicle.isCompanyOwned:
            category = 4  // Cross-Site Company
        ELSE:
            category = 5  // External Non-Company

1.4 Collect Category 1 data (GPS Fleet)
    For each Category 1 vehicle:
        - Get dead_stock at audit_start_date (GPS REST API)
        - Get dead_stock at audit_end_date (GPS REST API)
        - Sum all consumption in period (from VehicleConsumption table)
        - Sum all refuels in period (from FuelRefill table)

1.5 Collect Category 2 data (Full Tank Policy)
    For each Category 2 vehicle:
        - Get last_refuel_date before audit_start_date
        - Get all refuel transactions in period
        - Get last_refuel_date before or on audit_end_date
        - Calculate days_since_last_refuel at audit_end_date

1.6 Collect Category 3 & 5 data (Equipment & External)
    For each Category 3/5 vehicle:
        - Sum all refuels in period (fuel issued only)

1.7 Collect Category 4 data (Cross-Site)
    For each Category 4 vehicle:
        - Check gpsgate_report_entries for SOAP data
        - If available: Get opening/closing from SOAP data
        - Sum refuels at audit site in period

1.8 Validate data completeness
    - Flag vehicles with missing readings
    - Flag tankers with missing dip readings
    - Flag Full Tank vehicles with no refuel history (can't estimate)
    - Calculate data completeness percentage per category
```

### PHASE 2: Category 1 Reconciliation (GPS Fleet - Closed System)

```
2.1 Calculate per-vehicle position (GPS Fleet)
    For each Category 1 vehicle:
        // Get GPS-measured consumption from VehicleConsumption table
        gps_consumption = SUM(VehicleConsumption.Consumption
                              WHERE VehicleId = vehicle_id
                              AND Date BETWEEN audit_start_date AND audit_end_date)

        // Calculate expected closing
        expected_closing = opening_dead_stock + total_refueled - gps_consumption

        // Get actual closing from GPS sensor
        actual_closing = closing_dead_stock (sensor)

        // Calculate vehicle variance
        vehicle_variance = actual_closing - expected_closing

2.2 Aggregate Category 1 fleet
    cat1_fleet_opening = SUM(all Category 1 vehicle opening_dead_stock)
    cat1_fleet_closing = SUM(all Category 1 vehicle closing_dead_stock)
    cat1_fleet_refueled = SUM(all Category 1 vehicle refuels)
    cat1_fleet_consumed = SUM(all Category 1 vehicle gps_consumption)
    cat1_fleet_variance = SUM(all Category 1 vehicle variances)

2.3 Cross-verify with tanker
    tanker_dispensed_to_cat1 = SUM(dispensing WHERE category = 1)

    IF cat1_fleet_refueled != tanker_dispensed_to_cat1:
        FLAG "Dispensing mismatch - Category 1 fleet"
        mismatch_amount = cat1_fleet_refueled - tanker_dispensed_to_cat1
```

### PHASE 3: Category 2 Reconciliation (Full Tank Policy - Consumption-Based)

```
3.1 Calculate consumption from refuel pattern
    For each Category 2 vehicle:
        # Full tank policy: litres added = litres consumed since last fill
        total_consumed = SUM(refuel_litres in period)

        # Estimate current dead stock
        IF last_refuel_date = audit_end_date:
            closing_dead_stock = tank_capacity  # Just filled
        ELSE:
            days_since_refuel = audit_end_date - last_refuel_date
            avg_daily_consumption = historical_average OR (tank_capacity / avg_refuel_interval)
            estimated_used = days_since_refuel * avg_daily_consumption
            closing_dead_stock = tank_capacity - estimated_used
            confidence = "ESTIMATED"

3.2 Handle opening dead stock for Category 2
    # Find refuel closest to audit_start_date
    IF refuel exists on audit_start_date:
        opening_dead_stock = tank_capacity
    ELSE:
        days_since_last_refuel_before_start = audit_start_date - last_refuel_before_start
        estimated_used = days_since_last_refuel_before_start * avg_daily_consumption
        opening_dead_stock = tank_capacity - estimated_used
        confidence = "ESTIMATED"

3.3 Aggregate Category 2 fleet
    cat2_fleet_opening = SUM(all Category 2 opening_dead_stock)  # Mix of actual/estimated
    cat2_fleet_closing = SUM(all Category 2 closing_dead_stock)  # Mix of actual/estimated
    cat2_fleet_consumed = SUM(all Category 2 consumption from refuels)
    cat2_fleet_refueled = SUM(all dispensing to Category 2)

    # These should match since consumption = refuel amount (full tank policy)
    IF cat2_fleet_consumed != cat2_fleet_refueled:
        FLAG "Data inconsistency in Category 2 records"

3.4 Calculate estimation confidence
    vehicles_with_recent_refuel = COUNT(Category 2 WHERE last_refuel within 3 days of audit_end)
    vehicles_estimated = COUNT(Category 2 WHERE last_refuel > 3 days from audit_end)
    cat2_confidence_score = vehicles_with_recent_refuel / total_cat2_vehicles * 100
```

### PHASE 4: Categories 3, 4, 5 Handling

```
4.1 Category 3 (Equipment - No Dead Stock)
    # Only track fuel issued - no opening/closing
    cat3_fuel_issued = SUM(dispensing to Category 3)
    cat3_opening = 0  # Unknown
    cat3_closing = 0  # Unknown
    cat3_consumed = cat3_fuel_issued  # Assume all fuel is consumed

4.2 Category 4 (Cross-Site)
    For each Category 4 vehicle:
        IF SOAP data available:
            # Use SOAP Report 212 data
            opening = SOAP opening_fuel_level
            closing = SOAP closing_fuel_level
            consumed = opening + refueled - closing
            confidence = "HIGH"
        ELSE:
            # Mark as unavailable
            confidence = "LOW"

    cat4_fleet_opening = SUM(Category 4 with data opening)
    cat4_fleet_closing = SUM(Category 4 with data closing)
    cat4_fuel_issued = SUM(dispensing to Category 4)

4.3 Category 5 (External - Accountability Only)
    # External fuel is OUT of system - not in reconciliation
    external_fuel_issued = SUM(dispensing to Category 5)
    # This fuel leaves the system (accounted but not reconciled)
```

### PHASE 5: Tanker Reconciliation

```
5.1 Calculate tanker position
    For each tanker:
        total_deliveries = SUM(deliveries in period)
        total_dispensed = SUM(dispensing in period)
        expected_closing = opening_stock + total_deliveries - total_dispensed
        actual_closing = closing_stock (physical reading)
        tanker_variance = actual_closing - expected_closing

5.2 Aggregate all tankers
    total_tanker_opening = SUM(all tanker opening_stock)
    total_tanker_closing = SUM(all tanker closing_stock)
    total_deliveries_in = SUM(all deliveries)
    total_dispensed_out = SUM(all dispensing)
    total_tanker_variance = SUM(all tanker variances)

5.3 Verify dispensing split
    dispensed_to_cat1 = SUM(dispensing WHERE category = 1)
    dispensed_to_cat2 = SUM(dispensing WHERE category = 2)
    dispensed_to_cat3 = SUM(dispensing WHERE category = 3)
    dispensed_to_cat4 = SUM(dispensing WHERE category = 4)
    dispensed_to_cat5 = SUM(dispensing WHERE category = 5)

    total_categorized = dispensed_to_cat1 + dispensed_to_cat2 + dispensed_to_cat3
                       + dispensed_to_cat4 + dispensed_to_cat5

    IF total_categorized != total_dispensed_out:
        FLAG "Unclassified dispensing transactions"
```

### PHASE 6: System-Wide Reconciliation

```
6.1 Calculate total opening position
    # Only include trackable categories
    system_opening = total_tanker_opening
                   + cat1_fleet_opening      # GPS Fleet (verified)
                   + cat2_fleet_opening      # Full Tank Policy (estimated)
                   + cat4_fleet_opening      # Cross-Site (if data available)
                   # Note: Cat3 and Cat5 not included (no dead stock tracking)

6.2 Calculate total closing position
    system_closing_actual = total_tanker_closing
                          + cat1_fleet_closing      # GPS Fleet (verified)
                          + cat2_fleet_closing      # Full Tank Policy (estimated)
                          + cat4_fleet_closing      # Cross-Site (if data available)

6.3 Calculate expected closing
    # External movements
    external_in = total_deliveries_in
    external_out = cat1_fleet_consumed      # GPS-measured consumption
                 + cat2_fleet_consumed      # Full tank = refuel consumption
                 + cat3_fuel_issued         # Equipment fuel issued
                 + cat4_fuel_consumed       # Cross-site consumption (if available)
                 + external_fuel_issued     # Category 5 - leaves system

    system_closing_expected = system_opening + external_in - external_out

6.4 Calculate system variance
    system_variance = system_closing_actual - system_closing_expected
    system_variance_pct = system_variance / system_opening * 100

6.5 Break down variance by confidence level
    verified_variance = tanker_variance + cat1_fleet_variance + cat4_variance
    estimated_component = cat2_fleet_closing (estimated portion)
    untracked_component = cat3_fuel_issued + external_fuel_issued

    variance_confidence = "HIGH" IF cat2_confidence_score > 80% AND cat4_data_available
                         "MEDIUM" IF cat2_confidence_score 50-80% OR partial cat4 data
                         "LOW" IF cat2_confidence_score < 50% OR no cat4 data
```

### PHASE 7: Variance Analysis & Flags

```
7.1 Threshold checks
    Set thresholds:
        - acceptable_daily_variance = 0.5%
        - acceptable_period_variance = 1.0%
        - vehicle_variance_flag = 5 litres
        - tanker_variance_flag = 20 litres
        - consumption_variance_flag = 10 litres (GPS measured vs calculated)

7.2 Generate flags
    For each Category 1 vehicle:
        IF ABS(vehicle_variance) > vehicle_variance_flag:
            FLAG "Vehicle variance exceeds threshold" + details

        // NEW: Consumption variance check
        calculated_consumption = opening + refueled - closing
        IF ABS(calculated_consumption - gps_consumption) > consumption_variance_flag:
            FLAG "Consumption variance: GPS measured differs from calculated"

    For each tanker:
        IF ABS(tanker_variance) > tanker_variance_flag:
            FLAG "Tanker variance exceeds threshold" + details

    For each Category 2 vehicle:
        IF days_since_last_refuel > 14:
            FLAG "Full Tank vehicle dead stock highly uncertain" + vehicle

    For each Category 4 vehicle:
        IF SOAP data not available:
            FLAG "Cross-site vehicle missing GPS data" + vehicle

    IF ABS(system_variance_pct) > acceptable_period_variance:
        FLAG "System variance exceeds acceptable threshold"

7.3 Pattern detection
    # Accumulating variance over time
    IF variance trending consistently negative across days:
        FLAG "Potential systematic loss - investigate"

    # Dispensing vs consumption mismatch
    IF tanker_dispensed_to_cat1 > cat1_fleet_refueled:
        FLAG "More fuel dispensed than received by GPS fleet"
        # Possible: dispensing to wrong vehicle, theft, data entry error

    # Cross-site fuel tracking
    IF cat4_fuel_issued > cat4_fleet_consumed:
        FLAG "Cross-site vehicles may have consumed fuel at other sites"
```

---

## Output Structure

```
HYBRID FUEL AUDIT REPORT (5-CATEGORY MODEL)
===========================================

AUDIT PERIOD: [start_date] to [end_date]
AUDIT SITE: [site_name]

SECTION A: VERIFIED POSITIONS (High Confidence)
-----------------------------------------------
                            Opening     Closing     Variance
Tanker Stock:               X,XXX L     X,XXX L     ±XX L
Category 1 (GPS Fleet):     X,XXX L     X,XXX L     ±XX L
Category 4 (Cross-Site):    X,XXX L     X,XXX L     ±XX L
-----------------------------------------------
Subtotal Verified:          X,XXX L     X,XXX L     ±XX L


SECTION B: ESTIMATED POSITIONS (Medium Confidence)
--------------------------------------------------
                            Opening     Closing     Confidence
Category 2 (Full Tank):     X,XXX L     X,XXX L     XX%
--------------------------------------------------
Estimation basis: [X] vehicles with recent refuel, [Y] vehicles estimated


SECTION C: FUEL ISSUED ONLY (Low/No Confidence)
-----------------------------------------------
Category 3 (Equipment):     X,XXX L issued (no dead stock tracking)
Category 5 (External):      X,XXX L issued (accountability only)
-----------------------------------------------


SECTION D: MOVEMENTS
--------------------
External In (Deliveries):                   +X,XXX L

External Out:
  - GPS Consumption (Cat 1):                -X,XXX L (verified)
  - Full Tank Consumption (Cat 2):          -X,XXX L (from refuel records)
  - Equipment Issued (Cat 3):               -X,XXX L (assumed consumed)
  - Cross-Site Consumption (Cat 4):         -X,XXX L (verified/estimated)
  - External Issued (Cat 5):                -X,XXX L (leaves system)
--------------------
Net Movement:                               ±X,XXX L


SECTION E: SYSTEM RECONCILIATION
--------------------------------
Total Opening (A + B):              X,XXX L
+ Deliveries:                      +X,XXX L
- Total Consumption:               -X,XXX L
= Expected Closing:                 X,XXX L

Actual Closing (A + B):             X,XXX L

SYSTEM VARIANCE:                    ±XX L (X.X%)
Variance Confidence:                [HIGH/MEDIUM/LOW]


SECTION F: CONSUMPTION VARIANCE (Category 1 GPS Fleet)
------------------------------------------------------
Vehicle        GPS Measured    Calculated    Variance    Flag
KBZ 001        480.0 L         470.0 L       -10.0 L     ⚠️
KBZ 002        520.0 L         522.0 L        +2.0 L     ✓
...


SECTION G: FLAGS & ALERTS
-------------------------
[List all generated flags with details]


SECTION H: CATEGORY BREAKDOWN
-----------------------------
Category    Vehicles    Fuel Issued    Consumption    Data Quality
Cat 1       45          12,500 L       11,800 L       HIGH (GPS)
Cat 2       23           5,200 L        5,200 L       MEDIUM (Est)
Cat 3        8           1,800 L        1,800 L       LOW (Issued)
Cat 4       12           3,400 L        3,100 L       HIGH (SOAP)
Cat 5        5             800 L          N/A         ACCOUNTED
```

---

## Implementation Notes

1. **Category 1 (GPS Fleet) provides highest accuracy** - use as primary verification

2. **Category 2 (Full Tank Policy) estimation accuracy improves when:**
   - Refuel frequency is high (more data points)
   - Audit closing date coincides with scheduled refuels
   - Historical consumption data is reliable

3. **Consider forcing Full Tank vehicle refuels on audit dates** for critical audits to eliminate estimation uncertainty

4. **Odometer-based validation** for Category 2 can cross-check consumption estimates against km/L benchmarks

5. **Store historical averages** per vehicle to improve estimation accuracy over time

6. **Separate variance buckets** help identify whether issues are in verified or estimated portions

7. **Category 5 (External) fuel is accounted but not reconciled** - it leaves the system by definition

8. **Cross-Site (Category 4) requires SOAP data fetch** - ensure GPS data sync before audit

9. **Consumption variance (GPS measured vs calculated)** is critical for detecting sensor drift

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Initial | Original 2-category model (GPS + Pickup) |
| 2.0 | Dec 2025 | Updated to 5-category model, added consumption variance |
