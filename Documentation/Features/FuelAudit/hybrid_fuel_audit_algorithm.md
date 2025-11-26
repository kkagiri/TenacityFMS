# Hybrid Fuel Audit Model Algorithm

## Overview

This algorithm handles a fleet with mixed visibility - GPS-equipped vehicles (full tracking) and pickups (no fuel sensors, full-tank refuel policy).

---

## Data Inputs Required

### Tanker Data
- Opening stock (physical dip/gauge)
- Deliveries received (date, litres, document reference)
- Dispensing transactions (date, vehicle, litres, method)
- Closing stock (physical dip/gauge)

### GPS Fleet Data (Trucks, Buses, etc.)
- Opening dead stock per vehicle (sensor reading)
- Daily consumption per vehicle (GPS calculated)
- Refuel events detected (tank level jumps)
- Closing dead stock per vehicle (sensor reading)

### Pickup Fleet Data
- Vehicle tank capacity
- Refuel transactions (date, litres dispensed)
- Odometer readings at refuel (optional, for km/L analysis)
- Last refuel date per vehicle

### Reference Data
- Vehicle master list with type (GPS/Pickup) and tank capacity
- Average consumption rates per pickup (historical)

---

## Algorithm Structure

### PHASE 1: Data Collection & Validation

```
1.1 Set audit period
    - Define: audit_start_date, audit_end_date

1.2 Collect tanker data
    - Get opening_stock for each tanker at audit_start_date
    - Get closing_stock for each tanker at audit_end_date
    - Pull all delivery transactions in period
    - Pull all dispensing transactions in period

1.3 Collect GPS fleet data
    - For each GPS vehicle:
        - Get dead_stock at audit_start_date (sensor)
        - Get dead_stock at audit_end_date (sensor)
        - Sum all consumption in period (GPS)
        - Sum all refuels in period (from dispensing records)

1.4 Collect pickup fleet data
    - For each pickup:
        - Get last_refuel_date before audit_start_date
        - Get all refuel transactions in period
        - Get last_refuel_date before or on audit_end_date
        - Calculate days_since_last_refuel at audit_end_date

1.5 Validate data completeness
    - Flag vehicles with missing readings
    - Flag tankers with missing dip readings
    - Flag pickups with no refuel history (can't estimate)
```

### PHASE 2: GPS Fleet Reconciliation (Closed System)

```
2.1 Calculate per-vehicle position
    For each GPS vehicle:
        expected_closing = opening_dead_stock + total_refueled - total_consumed_gps
        actual_closing = closing_dead_stock (sensor)
        vehicle_variance = actual_closing - expected_closing

2.2 Aggregate GPS fleet
    gps_fleet_opening = SUM(all GPS vehicle opening_dead_stock)
    gps_fleet_closing = SUM(all GPS vehicle closing_dead_stock)
    gps_fleet_refueled = SUM(all GPS vehicle refuels)
    gps_fleet_consumed = SUM(all GPS vehicle consumption)
    gps_fleet_variance = SUM(all vehicle variances)

2.3 Cross-verify with tanker
    tanker_dispensed_to_gps = SUM(dispensing WHERE vehicle_type = 'GPS')
    
    IF gps_fleet_refueled != tanker_dispensed_to_gps:
        FLAG "Dispensing mismatch - GPS fleet"
        mismatch_amount = gps_fleet_refueled - tanker_dispensed_to_gps
```

### PHASE 3: Pickup Fleet Reconciliation (Consumption-Based)

```
3.1 Calculate consumption from refuel pattern
    For each pickup:
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

3.2 Handle opening dead stock for pickups
    # Find refuel closest to audit_start_date
    IF refuel exists on audit_start_date:
        opening_dead_stock = tank_capacity
    ELSE:
        days_since_last_refuel_before_start = audit_start_date - last_refuel_before_start
        estimated_used = days_since_last_refuel_before_start * avg_daily_consumption
        opening_dead_stock = tank_capacity - estimated_used
        confidence = "ESTIMATED"

3.3 Aggregate pickup fleet
    pickup_fleet_opening = SUM(all pickup opening_dead_stock)  # Mix of actual/estimated
    pickup_fleet_closing = SUM(all pickup closing_dead_stock)  # Mix of actual/estimated
    pickup_fleet_consumed = SUM(all pickup consumption from refuels)
    pickup_fleet_refueled = SUM(all dispensing to pickups)

    # These should match since consumption = refuel amount (full tank policy)
    IF pickup_fleet_consumed != pickup_fleet_refueled:
        FLAG "Data inconsistency in pickup records"

3.4 Calculate estimation confidence
    pickups_with_recent_refuel = COUNT(pickups WHERE last_refuel within 3 days of audit_end)
    pickups_estimated = COUNT(pickups WHERE last_refuel > 3 days from audit_end)
    confidence_score = pickups_with_recent_refuel / total_pickups * 100
```

### PHASE 4: Tanker Reconciliation

```
4.1 Calculate tanker position
    For each tanker:
        total_deliveries = SUM(deliveries in period)
        total_dispensed = SUM(dispensing in period)
        expected_closing = opening_stock + total_deliveries - total_dispensed
        actual_closing = closing_stock (physical reading)
        tanker_variance = actual_closing - expected_closing

4.2 Aggregate all tankers
    total_tanker_opening = SUM(all tanker opening_stock)
    total_tanker_closing = SUM(all tanker closing_stock)
    total_deliveries_in = SUM(all deliveries)
    total_dispensed_out = SUM(all dispensing)
    total_tanker_variance = SUM(all tanker variances)

4.3 Verify dispensing split
    dispensed_to_gps_fleet = SUM(dispensing WHERE vehicle_type = 'GPS')
    dispensed_to_pickups = SUM(dispensing WHERE vehicle_type = 'Pickup')
    dispensed_other = SUM(dispensing WHERE vehicle_type NOT IN ('GPS', 'Pickup'))
    
    IF (dispensed_to_gps_fleet + dispensed_to_pickups + dispensed_other) != total_dispensed_out:
        FLAG "Unclassified dispensing transactions"
```

### PHASE 5: System-Wide Reconciliation

```
5.1 Calculate total opening position
    system_opening = total_tanker_opening 
                   + gps_fleet_opening 
                   + pickup_fleet_opening

5.2 Calculate total closing position
    system_closing_actual = total_tanker_closing 
                          + gps_fleet_closing 
                          + pickup_fleet_closing

5.3 Calculate expected closing
    # Only external movements affect total system
    external_in = total_deliveries_in
    external_out = gps_fleet_consumed + pickup_fleet_consumed
    
    system_closing_expected = system_opening + external_in - external_out

5.4 Calculate system variance
    system_variance = system_closing_actual - system_closing_expected
    system_variance_pct = system_variance / system_opening * 100

5.5 Break down variance by confidence level
    verified_variance = tanker_variance + gps_fleet_variance
    estimated_component = pickup_fleet_closing (estimated portion)
    
    variance_confidence = "HIGH" IF pickup estimation confidence > 80%
                         "MEDIUM" IF pickup estimation confidence 50-80%
                         "LOW" IF pickup estimation confidence < 50%
```

### PHASE 6: Variance Analysis & Flags

```
6.1 Threshold checks
    Set thresholds:
        - acceptable_daily_variance = 0.5%
        - acceptable_period_variance = 1.0%
        - vehicle_variance_flag = 5 litres
        - tanker_variance_flag = 20 litres

6.2 Generate flags
    For each GPS vehicle:
        IF ABS(vehicle_variance) > vehicle_variance_flag:
            FLAG "Vehicle variance exceeds threshold" + details

    For each tanker:
        IF ABS(tanker_variance) > tanker_variance_flag:
            FLAG "Tanker variance exceeds threshold" + details

    For each pickup:
        IF days_since_last_refuel > 14:
            FLAG "Pickup dead stock highly uncertain" + vehicle

    IF ABS(system_variance_pct) > acceptable_period_variance:
        FLAG "System variance exceeds acceptable threshold"

6.3 Pattern detection
    # Accumulating variance over time
    IF variance trending consistently negative across days:
        FLAG "Potential systematic loss - investigate"
    
    # Dispensing vs consumption mismatch
    IF tanker_dispensed_to_gps > gps_fleet_refueled:
        FLAG "More fuel dispensed than received by GPS fleet"
        # Possible: dispensing to wrong vehicle, theft, data entry error
```

---

## Output Structure

```
HYBRID FUEL AUDIT REPORT
========================

AUDIT PERIOD: [start_date] to [end_date]

SECTION A: VERIFIED POSITIONS (High Confidence)
-----------------------------------------------
                        Opening     Closing     Variance
Tanker Stock:           X,XXX L     X,XXX L     ±XX L
GPS Fleet Dead Stock:   X,XXX L     X,XXX L     ±XX L
-----------------------------------------------
Subtotal Verified:      X,XXX L     X,XXX L     ±XX L


SECTION B: ESTIMATED POSITIONS (Lower Confidence)
-------------------------------------------------
                        Opening     Closing     Confidence
Pickup Fleet Dead Stock: X,XXX L    X,XXX L     XX%
-------------------------------------------------
Estimation basis: [X] pickups with recent refuel, [Y] pickups estimated


SECTION C: MOVEMENTS
--------------------
External In (Deliveries):           +X,XXX L
External Out (GPS Consumption):     -X,XXX L (verified)
External Out (Pickup Consumption):  -X,XXX L (from refuel records)
--------------------
Net Movement:                       ±X,XXX L


SECTION D: SYSTEM RECONCILIATION
--------------------------------
Total Opening (A + B):              X,XXX L
+ Deliveries:                      +X,XXX L
- Total Consumption:               -X,XXX L
= Expected Closing:                 X,XXX L

Actual Closing (A + B):             X,XXX L

SYSTEM VARIANCE:                    ±XX L (X.X%)
Variance Confidence:                [HIGH/MEDIUM/LOW]


SECTION E: FLAGS & ALERTS
-------------------------
[List all generated flags with details]


SECTION F: RECOMMENDATIONS
--------------------------
[Based on flags and variance patterns]
```

---

## Implementation Notes

1. **Pickup estimation accuracy improves when:**
   - Refuel frequency is high (more data points)
   - Audit closing date coincides with scheduled refuels
   - Historical consumption data is reliable

2. **Consider forcing pickup refuels on audit dates** for critical audits to eliminate estimation uncertainty

3. **Odometer-based validation** for pickups can cross-check consumption estimates against km/L benchmarks

4. **Store historical averages** per pickup to improve estimation accuracy over time

5. **Separate variance buckets** help identify whether issues are in verified or estimated portions
