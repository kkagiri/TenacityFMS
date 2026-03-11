# Product Requirements Document: Vehicle Trip Management

## 1. Executive Summary

Vehicle Trip Management introduces a unified trip model for all GPS-tracked vehicles in FMS. The feature detects, stores, and reports trip legs and round-trip groups using one of two detection engines:

- `Geofence mode` for fleet vehicles moving between known FMS sites
- `Cluster mode` for shuttle/tipper vehicles operating between loading and dump locations without predefined sites

Both engines write into a single trip event model so downstream reporting, fuel audit, variance analysis, and dashboards consume one standard data source regardless of how trips were detected.

## 2. Problem Statement

FMS already has backend support for geofences, vehicle tracking, GPSGate historical/live data, and fuel audit GPS readings. However, there is no unified persisted trip model that converts raw GPS data into business trips for both site-to-site and shuttle/tipper workflows.

Because of this:
- trip counts are inconsistent
- route analytics are incomplete
- dashboards still contain trip-data placeholders
- fuel cannot be reliably attributed per trip cycle

## 3. Goals

- Create one source of truth for vehicle trips
- Support both known-site and cluster-based trip detection
- Attribute fuel usage to trip legs and cycles
- Enable dashboard, tracking, and reporting consumers to read one unified trip dataset
- Detect low-confidence trips and fuel anomalies
- Provide a future-ready integration point for project planning and production monitoring
- Link actual trip execution with expected-average benchmarks and planned working zones

## 4. Scope

### In Scope
- Vehicle-level `movement profile`
- Unified trip leg and trip group persistence
- Geofence trip engine
- Cluster trip engine
- Realtime updates, daily reconciliation, and manual recompute
- Trip APIs
- Vehicle trip history UI
- Tracking page trip timeline/recompute UX
- Reporting integration
- Fuel enrichment and anomaly flags

### Out of Scope
- Route optimization
- Driver behavior scoring
- ETA prediction
- Mobile app trip UI in V1

## 5. Users

- Fleet managers
- Site managers
- Fuel auditors
- Operations/dispatch staff
- Reporting and analytics users
- Project managers / project planners
- Production supervisors

## 6. Strategic Architecture Position

Vehicle Trip Management will serve as the `actual execution layer` for movement intelligence.

This feature is expected to integrate with two adjacent business capabilities:

1. `Project Planning Layer`
	- defines where work is planned to happen
	- defines valid working sections, borrow pits, dump points, and haul corridors
	- defines planned vehicle assignments and expected work targets

2. `Expected Average / Benchmark Layer`
	- defines expected fuel consumption based on route, load, site, and vehicle conditions
	- provides the benchmark for comparing actual trip consumption against planned/expected performance

This means:
- `Vehicle Trips` answers what actually happened
- `Project Planning` answers what was supposed to happen
- `Expected Average` answers what should have been consumed under the configured benchmark

## 7. Movement Profiles

Each GPS-enabled vehicle will be assigned a `movement profile`:

- `SiteToSite`
- `Shuttle`

### Decision Flow
For each vehicle/day:
1. Read vehicle movement profile
2. If `SiteToSite`, run geofence detection
3. If `Shuttle`, run stop extraction, clustering, and cluster classification
4. Persist trip legs and trip groups
5. Enrich with fuel and confidence metadata
6. Expose through APIs and UI

## 8. Detection Engines

### 7.1 Geofence Mode
Used for fleet vehicles traveling between known FMS sites.

#### Inputs
- GPS stream/history
- predefined site geofences from FMS
- vehicle movement profile

#### Logic
- detect site entry/exit transitions
- each site-to-site transition becomes one trip leg
- `origin -> destination -> same origin` becomes one round-trip group

#### Edge Handling
- idle outside all geofences becomes `in transit` or `unauthorized stop`
- geofence overlap uses nearest site centroid
- GPS gaps reduce confidence instead of blindly splitting trips

### 7.2 Cluster Mode
Used for shuttle/tipper vehicles where trips are inferred from stop behavior.

#### Phase A: Stop Extraction
Detect stops using configurable defaults:
- speed threshold around 3 km/h
- stop duration around 90 seconds

#### Phase B: Stop Clustering
Group stops using configurable clustering radius:
- initial default around 150 meters

#### Phase C: Cluster Classification
Classify clusters using:
- longest average dwell time -> loading site
- shortest average dwell time -> dump site
- optional fuel-at-departure evidence to reinforce loading classification

#### Output
- each cluster-to-cluster transition becomes one trip leg
- `load -> dump -> load` becomes one load cycle/group
- if a cluster centroid falls within a known site geofence, use the site name

## 9. Unified Data Model

### 8.1 Trip Leg
Each trip leg stores:
- Vehicle ID
- Trip date
- Daily trip number
- Detection mode
- Origin label and coordinates
- Origin departure time
- Destination label and coordinates
- Destination arrival time
- Distance
- Duration
- Fuel at departure
- Fuel at arrival
- Fuel consumed
- Confidence level
- Status
- Traceability metadata

### 8.2 Trip Group
Each trip group stores:
- Vehicle ID
- Trip date
- Daily group number
- Group type (`RoundTrip` / `LoadCycle`)
- Start/end labels
- Start/end times
- Leg count
- Total distance
- Total duration
- Total fuel consumed
- Group confidence/status

### 9.3 Planning Link Fields

To support later project-planning integration, trip and/or group records should be able to store linkage fields such as:
- Project plan ID
- Work day / shift ID
- Planned haul route ID
- Planned origin zone ID
- Planned destination zone ID
- Plan match status
- Out-of-bounds flag
- Productive trip flag

These fields may be nullable in the first implementation but the PRD requires the model to anticipate them.

## 10. Project Planning Integration Requirements

The system must support a future planning module where project managers select the exact operational area where work is being done.

### Planning Concepts

The planning layer is expected to define:
- project
- site
- section
- borrow pit
- dump point
- road/haul corridor
- working date / shift
- assigned vehicles
- planned trip targets
- planned production targets

### Required Planning Behavior

The planning system should allow a project manager to:
- choose the site where work is active
- define the section or subsection where material is being moved
- define origin zones such as borrow pit or loading area
- define destination zones such as dump point, crusher, or fill area
- assign vehicles to that plan
- define expected work output for the shift/day

### Relationship to Trip Management

Vehicle Trips must be able to match actual trip legs against planned operational zones.

This enables reporting such as:
- planned trips vs actual trips
- planned route vs actual route
- productive trips vs non-productive trips
- site/section-level trip counts
- section-level fuel consumption
- production by work area

## 11. Geo-Zone and Corridor Requirements

The planning system should not rely only on site IDs or route/property IDs.

It must support geo-defined work areas such as:
- section polygons
- borrow pit polygons
- dump point polygons
- corridor/road geofences
- optional temporary work zones for short-lived projects

These geo-zones should be used to:
- validate trip origin/destination against planned work
- detect when a vehicle leaves the approved operating area
- distinguish productive movement from unplanned movement

## 12. Out-of-Bounds Monitoring

There are valid cases where vehicles go outside the intended path or work boundary.

The system must account for that explicitly.

### Out-of-Bounds Rules

When a vehicle leaves all approved planned zones or corridors:
- create an out-of-bounds event when duration/distance exceeds threshold
- record start time, end time, duration, and extra distance
- associate the event with vehicle, active plan, and trip/group if possible
- indicate whether the movement should be excluded from productive trip reporting

### Reporting Use

Out-of-bounds tracking should support:
- exception review
- idle/non-productive analysis
- fuel loss and inefficiency review
- route discipline monitoring

## 13. Production and Work-Done Reporting

The combined planning + trip model is expected to answer:
- what work was planned
- what work was actually done
- how many trips were completed
- how much fuel was consumed
- which section/borrow pit/dump point was active
- where non-productive movement occurred

### Production Reporting Note

Trip count alone does not guarantee true production quantity.

To report actual production with confidence, the broader solution may also require one or more of:
- payload per trip
- standard payload by vehicle type
- tonnage/volume standard per cycle
- loader bucket count integration
- weighbridge or manual production capture

Until such data exists, the system can still report:
- trip count
- cycle count
- section activity
- distance
- duration
- fuel consumption
- productive vs non-productive movement

## 14. Backend Requirements

- Add a new application feature domain: `FMS.Application/Features/VehicleTrips/`
- Add persistence support for trip legs and trip groups
- Add services for geofence detection, cluster detection, enrichment, and recompute
- Reuse existing GPS history, geofence, provider mapping, and fuel audit infrastructure
- Return `FMSResponse<T>` for all trip APIs
- Design APIs and persistence with future links to project planning entities and work zones

## 15. Benchmark and Expected-Average Integration

Expected-average data should remain the benchmark layer, not the primary source of planning geo-data.

### Required Use of Expected Average

The trip system should be able to integrate later with expected-average templates for:
- expected consumption by route/section/load
- actual vs expected consumption by trip or cycle
- variance reporting by vehicle, section, and project plan

### Current Constraint

The existing expected-average model captures route/property relationships but does not fully represent geo-defined working zones such as borrow pit polygons or detailed sections.

Therefore:
- planning geo-zones should be introduced in a dedicated planning module
- expected averages should remain consumption benchmarks linked to routes, loads, sites, or planning assignments

## 16. Processing Modes

### Realtime
- update open/in-progress trips as live data arrives

### Daily Reconciliation
- rebuild previous-day trips to absorb late GPS data and improve confidence

### Manual Recompute
- rebuild vehicle/day or date range safely without duplicates

## 17. API Requirements

Provide APIs for:
- get trips by vehicle/date/date range
- get trip groups/cycles
- filter by mode, site, vehicle, status, and confidence
- recompute vehicle/day
- recompute vehicle/date range
- update/read vehicle movement profile
- expose plan-match and out-of-bounds status where available
- support future filtering by project, section, borrow pit, and dump point

## 18. Frontend Requirements

### Vehicle Configuration
- add `movement profile` to vehicle create/edit flows

### Tracking Page
- show trip timeline/list
- allow recompute
- support trip-focused map display

### Vehicle Details
- add trip history view with filters and details

### Reports
- expose trip count, cycle count, distance, duration, and fuel metrics
- expose future section/borrow-pit/dump-point production views
- expose productive vs out-of-bounds movement summaries

## 19. Fuel and Anomaly Integration

Each trip should attempt to store:
- fuel at origin departure
- fuel at destination arrival
- trip fuel delta

Anomalies to flag:
- unauthorized stops
- low-confidence GPS-gap trips
- empty leg consuming more fuel than loaded leg
- excessive idle duration
- out-of-bounds fuel consumption outside planned work zones

## 20. Acceptance Criteria

- vehicle movement profile can be saved and retrieved
- geofence vehicles generate site-to-site trip legs
- shuttle vehicles generate clustered trip legs and load cycles
- recompute is idempotent
- fuel enrichment is applied when GPS fuel data exists
- tracking/details/reports consume trip data from the unified model
- the data model can support linking trips to future planning zones and project execution reporting
- out-of-bounds behavior can be represented in the model and reporting output

## 21. Risks

- inconsistent GPS data quality
- legacy GPS identity fields conflicting with provider mapping resolution
- ambiguous cluster classification on unusual routes
- historical backfill cost
- existing oversized files may need refactoring before clean UI integration
- production reporting may be misleading if payload or standard-cycle volume is not defined
- planning/zone design can become too complex if sections and corridors are not modeled clearly

## 22. Recommended Future Module Boundary

The long-term solution should separate responsibilities into three connected modules:

1. `Vehicle Trips`
	- actual movement facts
	- trip legs
	- trip groups
	- confidence and anomaly flags

2. `Project Planning`
	- planned working zones
	- borrow pits
	- dump points
	- section assignments
	- planned vehicle assignments
	- productive corridor definitions

3. `Expected Average`
	- benchmark fuel expectations
	- route/load/site expected consumption rules
	- variance against actual trip execution

## 23. Rollout Phases

### Phase 1
- vehicle movement profile
- trip persistence
- geofence engine
- manual recompute

### Phase 2
- cluster engine
- fuel enrichment and anomaly rules
- trip APIs and vehicle detail history

### Phase 3
- dashboards/reports integration
- realtime updates
- daily reconciliation

### Phase 4
- project planning zone integration
- productive vs non-productive reporting
- section / borrow pit / dump point operational analytics
- production benchmarking against expected averages

## 24. Summary

Vehicle Trip Management converts existing GPS, geofence, and fuel telemetry assets into a unified trip intelligence layer. It provides one trip model for both fleet and shuttle workflows and enables reporting, auditing, and operational analysis from the same data source.

It also establishes the execution foundation for a future project-planning system that can define where work is supposed to happen and compare that plan against actual trips, actual fuel consumption, out-of-bounds movement, and work completed.
