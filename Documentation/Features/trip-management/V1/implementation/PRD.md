# Product Requirements Document: Vehicle Trip Management

## 1. Executive Summary

Vehicle Trip Management introduces a unified trip model for all GPS-tracked vehicles in FMS. The system is structured as a five-layer pipeline:

1. **GPS Data Ingestion** — pre-processes raw GPS positions before the trip engine sees them
2. **Real-Time Trip Detection** — runs state-machine detectors per vehicle as GPS data arrives
3. **End-of-Day Reconciliation** — replays the full day in batch to clean up real-time artifacts
4. **Manual Override** — lets operators correct what automation could not
5. **Integration** — connects trip data to fuel audit, dashboards, reporting, rules, and reconciliation

Two detection engines run inside Layers 2 and 3:

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
- no real-time trip visibility exists during the working day
- no automated reconciliation catches GPS artifacts overnight

## 3. Goals

- Create one source of truth for vehicle trips
- Support both known-site and cluster-based trip detection
- Attribute fuel usage to trip legs and cycles
- Enable dashboard, tracking, and reporting consumers to read one unified trip dataset
- Detect low-confidence trips and fuel anomalies
- Provide real-time trip-in-progress visibility via SignalR
- Reconcile trips nightly to correct real-time detection artifacts
- Allow operators to manually override trips that automation cannot fix
- Provide a future-ready integration point for project planning and production monitoring
- Link actual trip execution with expected-average benchmarks and planned working zones

## 4. Scope

### In Scope
- Vehicle-level `movement profile`
- GPS data pre-processing pipeline (filter, enrich, buffer)
- Real-time trip detection with per-vehicle state machines
- Unified trip leg and trip group persistence (including in-progress trips)
- Geofence trip engine with AT_SITE / DEPARTING / ARRIVING states
- Cluster trip engine with progressive cluster discovery
- End-of-day batch reconciliation (replay, compare, finalize, flag)
- Manual override system with audit trail
- Trip APIs including trip detail and override endpoints
- Vehicle trip history UI
- Tracking page trip timeline / recompute UX
- Reporting integration
- Fuel enrichment and anomaly flags
- Integration with dashboards, fuel audit, rule engine, and vehicle reconciliation

### Out of Scope
- Route optimization
- Driver behavior scoring
- ETA prediction
- Mobile app trip UI in V1

## 5. Users

- Fleet managers
- Site managers
- Fuel auditors
- Operations / dispatch staff
- Reporting and analytics users
- Project managers / project planners
- Production supervisors

## 6. Strategic Architecture Position

Vehicle Trip Management will serve as the `actual execution layer` for movement intelligence.

### Five-Layer Pipeline

```
Layer 1: GPS Data Ingestion
  GPSGate → Pre-Processor (filter → enrich → buffer) → Trip Engine

Layer 2: Real-Time Trip Detection
  Pre-Processed Points → State Machine (per vehicle) → Trip Events → SignalR

Layer 3: End-of-Day Reconciliation
  Full Day GPS Data → Batch Replay → Compare vs Real-Time → Reconciled Trips

Layer 4: Manual Override
  Reconciled Trips → Operator Actions → Audit Trail → Final Trips

Layer 5: Integration
  Final Trips → Fuel Audit, Dashboard, Reports, Rules, Vehicle Reconciliation
```

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

- `SiteToSite` (Geofence mode)
- `Shuttle` (Cluster mode)

### Decision Flow
For each vehicle:
1. Read vehicle movement profile
2. If `SiteToSite`, activate the geofence state machine
3. If `Shuttle`, activate the cluster state machine
4. In real-time: process each pre-processed GPS point through the active state machine
5. At end of day: replay the full day in batch for reconciliation
6. Expose results through APIs, SignalR, and UI

## 8. Layer 1 — GPS Data Ingestion

This layer sits between GPSGate and the trip detection engine. GPSGate pushes position data via the existing SOAP/REST integration. The raw stream contains position, speed, heading, ignition, fuel level, and satellites.

### 8.1 Pre-Processor

The pre-processor runs on every incoming GPS point. Its responsibilities:

#### Filter
- Drop invalid points (`valid = false`)
- Drop duplicates (same `trackInfoId` + timestamp)
- Drop points with zero satellites
- Drop points with clearly impossible positions (lat/lng jumping hundreds of km in seconds)

#### Enrich
For each surviving point, compute and attach:
- Distance from previous point (Haversine)
- Time delta from previous point
- Which geofence(s) the point falls inside (if any)

These computed fields are attached to the point before it reaches the trip engine.

#### Buffer
Do not process single points in isolation. Hold a small sliding window (last 5–10 points per vehicle) so the trip engine has enough context to make transition decisions. This prevents false triggers from single noisy points.

### 8.2 Pre-Processor Output
Each enriched, buffered position is forwarded to the appropriate Layer 2 detector based on the vehicle's movement profile.

## 9. Layer 2 — Real-Time Trip Detection

Two parallel detectors run per vehicle based on the vehicle's movement profile tag. Both operate as state machines that process pre-processed GPS points one at a time.

### 9.1 Geofence Detector (Fleet Vehicles)

Maintains a simple state machine per vehicle with three states:

#### States

| State | Description |
|---|---|
| `AT_SITE` | Vehicle is inside a known geofence. The system knows which site. Every incoming point still inside the same geofence updates the "last seen" timestamp. No trip action needed. |
| `DEPARTING` | Vehicle has exited a geofence. A trip record is created in `in-progress` status with the origin site and departure time. The system is watching for the next geofence entry. |
| `ARRIVING` | Vehicle enters a new geofence. The in-progress trip is completed — destination site, arrival time, distance, duration, fuel delta are all stamped. State returns to `AT_SITE`. |

#### Transition Rules

| From | To | Condition |
|---|---|---|
| `AT_SITE` | `DEPARTING` | Point is outside all geofences for more than N consecutive points (prevents GPS drift triggering false departures) |
| `DEPARTING` | `ARRIVING` | Point is inside any geofence |
| `DEPARTING` | `DEPARTING` | Point is outside all geofences (still in transit — accumulate distance and points) |
| `ARRIVING` | `DEPARTING` | Vehicle exits the new site's geofence (next trip begins) |

The "N consecutive points" check is the noise filter. If a vehicle at Galana has one point that drifts 350m outside the geofence but the next point is back inside, it never transitions to `DEPARTING`.

#### Edge Handling
- Geofence overlap: use nearest site centroid to resolve which site the vehicle is at
- GPS gaps: reduce confidence instead of blindly splitting trips
- Idle outside all geofences for extended periods: flag as `unauthorized stop` or `in-transit idle`
- `origin → destination → same origin` patterns: group as a round-trip

### 9.2 Cluster Detector (Tippers)

This detector handles vehicles where trip endpoints are not known in advance. Clusters are discovered progressively through the day.

#### Progressive Cluster Discovery

**First trip of the day** — the system does not know the clusters yet. It watches for the first significant stop (speed < 3 km/h for 90+ seconds). This becomes Cluster A (loading site, assumed). When the vehicle moves and stops again significantly, that becomes Cluster B (dump site, assumed).

**Subsequent trips** — as the day progresses, each new stop is matched against known clusters. If it is within 150m of an existing cluster centroid, it belongs to that cluster. If it is far from all known clusters, a new cluster is created.

**Cluster classification refines over time** — after 2–3 cycles the system has enough data to classify: longest average dwell = loading, shortest average dwell = dump. Early trips may have provisional labels that get corrected as more data arrives.

#### State Machine

The state machine is similar to the geofence detector:

| State | Description |
|---|---|
| `AT_CLUSTER` | Vehicle is stopped at a known cluster. Updates last-seen timestamp. |
| `IN_TRANSIT` | Vehicle is moving between clusters. Accumulates distance and points. |

Each transition between different clusters produces one trip leg.

#### Cluster-to-Geofence Hybrid Labeling
If a cluster centroid falls within a known site geofence, the site name replaces the auto-generated cluster label for reporting purposes.

#### Configurable Thresholds
All detection parameters must be configurable (not hard-coded):
- Stop speed threshold (default: 3 km/h)
- Minimum stop duration (default: 90 seconds)
- Cluster radius (default: 150 meters)
- Minimum trip distance (default: 0.50 km)
- Minimum trip duration (default: 2 minutes)

### 9.3 Real-Time Outputs

Both detectors push events as they happen:

| Event | Payload |
|---|---|
| `TripStarted` | Vehicle ID, origin site/cluster, departure time, mode |
| `TripInProgress` | Periodic updates: current distance, current position, estimated destination (if heading toward a known geofence) |
| `TripCompleted` | Full trip record with all fields |

These events feed SignalR hubs — `dashboardHub` for the operations dashboard, and potentially a dedicated `tripsHub` for live trip monitoring.

### 9.4 In-Progress Trip Persistence
Trips in `DEPARTING` / `IN_TRANSIT` state are persisted with a status of `InProgress` so the tracking page can show vehicles currently in transit with origin and estimated destination.

## 10. Layer 3 — End-of-Day Reconciliation

Real-time detection is good but imperfect. GPS gaps, noise, and edge cases create artifacts that need cleanup. The reconciliation runs after midnight (or on demand).

### 10.1 Replay

Take the full day's GPS data for each vehicle and re-run the detection engine from scratch. With complete data the algorithm has no gaps and can look forward/backward, so it often produces cleaner results than the real-time pass.

### 10.2 Compare

The batch result is compared against the real-time trip records. Differences fall into categories:

| Category | Description | Resolution |
|---|---|---|
| `Confirmed` | Same number of trips, same sites, times within tolerance. No action needed. Expected to be 90%+ of cases. | Keep real-time records as-is. |
| `Split` | Real-time detected 1 trip, batch detected 2. Usually a brief stop mid-trip was long enough to register as a site visit with full context. | Batch version wins — single real-time trip is split into two. |
| `Merged` | Real-time detected 2 trips, batch detected 1. Usually a GPS gap mid-trip caused the real-time engine to think the vehicle returned and left again. | Batch version wins — two real-time trips merge into one. |
| `Adjusted` | Same trip count but times or distances differ. | Batch version updates records with more accurate values. |

### 10.3 Cluster Finalization (Tippers)

The batch pass has the full day's stops so it can do proper clustering with all data:
- Cluster labels that were provisional during real-time get finalized
- If the real-time engine classified a stop as "loading" but the full-day dwell analysis says it is actually a dump site, the batch corrects it
- Cycle counts are recalculated with complete information

### 10.4 Anomaly Flagging

The batch pass also runs quality checks:
- Trips with no fuel level data at start or end
- Trips where fuel consumption is negative (refueled en route)
- Trips with unrealistic speeds (GPS jump artifacts that were not caught by the pre-processor)
- Tippers with asymmetric cycle counts (e.g., 8 visits to loading site but only 6 to dump site)
- Vehicles that never returned to any known site by end of day

### 10.5 Reconciliation Output

The reconciled trip records replace the real-time records. Each record receives a `reconciliationStatus` field with one of these values:
- `Confirmed`
- `Split`
- `Merged`
- `Adjusted`
- `Anomaly`

## 11. Layer 4 — Manual Override

Operators need to fix what automation cannot. The override system works on reconciled trip records.

### 11.1 Available Actions

| Action | Description | Use Case |
|---|---|---|
| **Split trip** | Operator selects a trip and picks a point in the timeline to split it into two trips. | Vehicle made an unplanned stop at a location the geofence did not cover, and the operator knows it was a separate delivery. |
| **Merge trips** | Operator selects two consecutive trips and merges them into one. | GPS gap caused a false trip break, and the operator knows the vehicle never actually returned. |
| **Reassign site** | Operator changes the origin or destination site of a trip. | Vehicle stopped just outside a geofence boundary but was actually at that site. Or for tippers, the auto-classification got loading/dump labels wrong. |
| **Add trip** | Operator manually creates a trip record. | GPS tracker was offline but the operator knows from dispatch records that a trip happened. |
| **Delete trip** | Operator removes a false trip. | Vehicle was being towed, or GPS data was garbage for that period. |
| **Adjust times** | Operator overrides departure or arrival times. | Geofence boundary triggered early/late, and the operator has actual dispatch time from a logbook. |

### 11.2 Override Rules

- Every override creates an **audit trail** — original values, new values, who changed it, when, and a mandatory reason field
- The original auto-detected record is never deleted, just superseded
- Overrides **cannot violate physics** — arrival time cannot be before departure time; a vehicle cannot be at two sites simultaneously
- Overrides for **completed periods** (after fuel audit has run) require supervisor approval to prevent retroactive manipulation of fuel reconciliation data

### 11.3 Override Data Model

Each override record stores:
- Override ID
- Trip ID or Trip Group ID being modified
- Override action type
- Original field values (JSON or structured)
- New field values
- Operator user ID
- Timestamp
- Mandatory reason text
- Supervisor approval status (if required)

## 12. Layer 5 — Integration with Existing FMS Modules

### 12.1 Fuel Audit Module

The trip event table is the bridge. The existing fuel audit compares dispensed fuel vs consumed fuel. With trip data:
- Each trip has fuel level at departure and arrival (from GPS fuel level variable)
- Fuel consumed per trip = departure level − arrival level
- Sum of all trip consumptions should reconcile against total fuel dispensed
- Variance = dispensed − sum(trip consumptions)
- Per-trip fuel rate = fuel consumed / distance = km/L for that specific trip

For tippers specifically: loaded vs unloaded fuel rates provide anomaly signals. A loaded tipper doing 2.5 km/L is normal; an empty return doing 2.5 km/L is suspicious (should be closer to 4 km/L). This feeds the existing variance model.

### 12.2 Existing Reporting

Transaction History Summary and Tank Volume History reports gain a new dimension. Instead of just showing fuel dispensed per vehicle per day, reports can break it down to fuel dispensed per trip. The handoff to jsreport/Puppeteer stays the same — the data model feeding the report gets richer.

### 12.3 Dashboard (SignalR)

The `dashboardHub` already pushes real-time updates. Trip events become a new message type. The operations dashboard can show:
- Vehicles currently in transit (with origin and estimated destination)
- Vehicles at each site
- Trip count per vehicle today vs expected
- Tipper cycle count — live load/dump cycle counter

### 12.4 Rule Management System

The CQRS/MediatR rule engine can add trip-based rules:
- Max trips per day per vehicle
- Max distance per trip
- Expected trip duration between two sites (flag if too long — detour? — or too short — speeding?)
- Tipper minimum cycles per day (productivity monitoring)
- Fuel consumption rate thresholds per route

### 12.5 Vehicle Reconciliation

The 5-category hybrid model (GPS fleet, full-tank policy, equipment, cross-site, external) gains GPS trip data as a primary input rather than just GPS position snapshots. Cross-site vehicles now have a complete movement log, not just "was seen at Juja at 14:00."

## 13. Unified Data Model

### 13.1 Trip Leg

Each trip leg stores:
- Vehicle ID
- Trip date
- Sequence number (daily trip number)
- Detection mode (Geofence / Cluster)
- Status (`InProgress` / `Completed`)
- Origin site ID and label / coordinates
- Origin departure time
- Destination site ID and label / coordinates
- Destination arrival time
- Distance (km)
- Duration (minutes)
- Max speed (km/h)
- Fuel at departure
- Fuel at arrival
- Fuel consumed
- Confidence level (0.0 – 1.0)
- Anomaly flags
- Reconciliation status (`Confirmed` / `Split` / `Merged` / `Adjusted` / `Anomaly`)
- Override status (whether manually overridden)
- Movement profile
- Traceability metadata (created at, updated at)

### 13.2 Trip Group

Each trip group stores:
- Vehicle ID
- Trip date
- Daily group number
- Group type (`RoundTrip` / `LoadCycle`)
- Start/end site labels
- Start/end times
- Leg count
- Total distance
- Total duration
- Total fuel consumed
- Group confidence / status
- Reconciliation status
- Movement profile
- Detection mode

### 13.3 Planning Link Fields

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

### 13.4 Trip Override Record

See section 11.3 for the override data model.

### 13.5 Vehicle Trip State (Real-Time)

Per-vehicle runtime state for the real-time detector:
- Vehicle ID
- Current state (`AT_SITE` / `DEPARTING` / `ARRIVING` / `AT_CLUSTER` / `IN_TRANSIT`)
- Current site or cluster ID
- In-progress trip ID (if any)
- Last processed point timestamp
- Sliding window of recent points (5–10)
- Known clusters for the day (cluster detector only)
- Accumulated distance since last state change

## 14. Processing Modes

### 14.1 Real-Time
- The pre-processor runs on every incoming GPS point
- The state machine detector runs per vehicle, updating trip state and emitting SignalR events
- In-progress trips are persisted and visible on dashboards and tracking pages

### 14.2 Daily Reconciliation (Batch)
- Runs after midnight (configurable schedule) or on demand
- Replays the full day for each vehicle
- Compares batch results against real-time records
- Applies reconciliation status to each trip
- Finalizes cluster labels for tippers
- Flags anomalies

### 14.3 Manual Recompute
- Rebuild vehicle/day or date range safely without duplicates
- Existing behavior: delete existing trips/groups in range, re-run detection, persist new results

### 14.4 Manual Override
- Operator-initiated corrections on reconciled trip records
- Full audit trail with mandatory reason

## 15. Illustrative Day Flow

```
06:00 — Tanker T-01 starts at Galana. GPS stream begins. Pre-processor enriches points.
         Geofence detector confirms AT_SITE (Galana).

06:25 — T-01 exits Galana geofence. Detector transitions to DEPARTING.
         Trip #1 created as in-progress.
         SignalR pushes "T-01 departed Galana" to dashboard.

07:30 — T-01 enters Juja geofence. Trip #1 completed:
         Galana → Juja, 65 min, 48 km, fuel: 120L → 108L, consumed: 12L.
         SignalR pushes arrival. State = AT_SITE (Juja).

07:30–
09:00 — Meanwhile, Tipper P-05 does shuttle runs between a construction site
         and a dump site 3 km away. Cluster detector identifies 2 clusters.
         Dashboard shows "P-05: 4 cycles today."

09:15 — T-01 departs Juja back to Galana. Trip #2 starts.

10:00 — T-01 arrives Galana. Trip #2 completed.
         Round-trip group created (Trip #1 + Trip #2).

...day continues...

00:30 — Batch reconciliation runs.
         T-01's 3 trips all confirmed.
         P-05 real-time showed 14 cycles, batch replay shows 15 — one short stop
         was missed in real-time due to a 2-min GPS gap.
         Batch adds the missing cycle. Affected trip: reconciliationStatus = "Split".

08:00 — Operations manager reviews the anomaly dashboard.
         P-05's 15th cycle has no fuel level data. She marks it "confirmed" with a note.
         T-01's Trip #2 shows unusually high fuel consumption for the return leg.
         She flags it for the fuel audit team.
```

## 16. Project Planning Integration Requirements

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

## 17. Geo-Zone and Corridor Requirements

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

## 18. Out-of-Bounds Monitoring

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

## 19. Production and Work-Done Reporting

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

## 20. Backend Requirements

- Add a new application feature domain: `FMS.Application/Features/VehicleTrips/`
- Add GPS pre-processor service (filter, enrich, buffer)
- Add real-time state machine services for geofence and cluster detectors
- Add persistence support for trip legs, trip groups, vehicle trip state, and trip overrides
- Add end-of-day reconciliation service (replay, compare, finalize, flag)
- Add manual override command handlers with audit trail
- Add services for fuel enrichment and anomaly detection
- Add SignalR trip event publishing
- Reuse existing GPS history, geofence, provider mapping, and fuel audit infrastructure
- Return `FMSResponse<T>` for all trip APIs
- Design APIs and persistence with future links to project planning entities and work zones

## 21. API Requirements

Provide APIs for:
- Get trips by vehicle/date/date range
- Get trip groups/cycles
- Get trip detail (individual leg with full metadata)
- Get in-progress trips (real-time)
- Filter by mode, site, vehicle, status, confidence, reconciliation status
- Recompute vehicle/day
- Recompute vehicle/date range
- Trigger reconciliation for a specific day
- Update/read vehicle movement profile
- Override trip: split, merge, reassign, add, delete, adjust
- Get override audit trail for a trip
- Expose plan-match and out-of-bounds status where available
- Support future filtering by project, section, borrow pit, and dump point

## 22. Benchmark and Expected-Average Integration

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

## 23. Frontend Requirements

### Vehicle Configuration
- Add `movement profile` to vehicle create/edit flows

### Tracking Page
- Show trip timeline/list with real-time in-progress indicators
- Show vehicles currently in transit with origin and estimated destination
- Allow recompute
- Support trip-focused map display

### Vehicle Details
- Add trip history view with filters and details
- Show reconciliation status badges
- Show anomaly flags

### Trip Management
- Trip detail popup/panel with full leg data
- Override actions (split, merge, reassign, add, delete, adjust)
- Override audit trail viewer
- Confidence and anomaly badges

### Dashboard
- Trip count per vehicle today vs expected
- Vehicles currently in transit
- Tipper cycle counter (live)
- Anomaly count and review link

### Reports
- Expose trip count, cycle count, distance, duration, and fuel metrics
- Expose reconciliation status breakdown
- Expose future section/borrow-pit/dump-point production views
- Expose productive vs out-of-bounds movement summaries

## 24. Fuel and Anomaly Integration

Each trip should attempt to store:
- Fuel at origin departure
- Fuel at destination arrival
- Trip fuel delta

Anomalies to flag:
- Unauthorized stops
- Low-confidence GPS-gap trips
- Empty leg consuming more fuel than loaded leg
- Excessive idle duration
- Out-of-bounds fuel consumption outside planned work zones
- Negative fuel consumption (refueled en route)
- Unrealistic speeds (GPS jump artifacts)
- Asymmetric tipper cycle counts (more loads than dumps or vice versa)
- Vehicle not returning to any known site by end of day

## 25. Acceptance Criteria

- Vehicle movement profile can be saved and retrieved
- GPS pre-processor filters invalid points and enriches valid ones
- Geofence vehicles generate site-to-site trip legs via real-time state machine
- Shuttle vehicles generate clustered trip legs and load cycles via progressive cluster discovery
- In-progress trips are visible on dashboards in real-time via SignalR
- End-of-day reconciliation replays the full day and applies reconciliation status to each trip
- Manual override actions create proper audit trail and do not delete original records
- Recompute is idempotent
- Fuel enrichment is applied when GPS fuel data exists
- Tracking/details/reports consume trip data from the unified model
- The data model can support linking trips to future planning zones and project execution reporting
- Out-of-bounds behavior can be represented in the model and reporting output

## 26. Risks

- Inconsistent GPS data quality
- Legacy GPS identity fields conflicting with provider mapping resolution
- Ambiguous cluster classification on unusual routes
- Historical backfill cost
- Existing oversized files may need refactoring before clean UI integration
- Production reporting may be misleading if payload or standard-cycle volume is not defined
- Planning/zone design can become too complex if sections and corridors are not modeled clearly
- Real-time state machine memory consumption for large fleets
- Reconciliation batch window may be too short for fleets with many vehicles

## 27. Recommended Future Module Boundary

The long-term solution should separate responsibilities into three connected modules:

1. `Vehicle Trips`
	- actual movement facts
	- trip legs and trip groups
	- real-time state machines
	- reconciliation
	- manual overrides
	- confidence and anomaly flags

2. `Project Planning`
	- planned working zones
	- borrow pits, dump points
	- section assignments
	- planned vehicle assignments
	- productive corridor definitions

3. `Expected Average`
	- benchmark fuel expectations
	- route/load/site expected consumption rules
	- variance against actual trip execution

## 28. Rollout Phases

### Phase 1 — Foundation
- Vehicle movement profile
- Trip persistence (legs, groups)
- Geofence detection engine (batch/recompute)
- Cluster detection engine (batch/recompute)
- Manual recompute
- Trip list and group APIs
- Vehicle details trip history UI

### Phase 2 — Real-Time and Pre-Processing
- GPS data pre-processor (filter, enrich, buffer)
- Real-time geofence state machine
- Real-time cluster state machine with progressive discovery
- In-progress trip persistence and SignalR events
- Tracking page trip timeline

### Phase 3 — Reconciliation and Override
- End-of-day batch reconciliation service
- Reconciliation status on all trip records
- Manual override system (split, merge, reassign, add, delete, adjust)
- Override audit trail
- Anomaly flagging from reconciliation

### Phase 4 — Fuel and Reporting
- Fuel enrichment per trip leg and group
- Fuel anomaly detection (loaded vs empty, negative consumption)
- Dashboard integration (live trip count, cycle counter, in-transit vehicles)
- Trip-based reporting (route analysis, trip summaries)
- Reconciliation status and anomaly reporting

### Phase 5 — Planning and Production
- Project planning zone integration
- Productive vs non-productive reporting
- Section / borrow pit / dump point operational analytics
- Production benchmarking against expected averages
- Rule engine trip-based rules

## 29. Summary

Vehicle Trip Management converts existing GPS, geofence, and fuel telemetry assets into a unified trip intelligence layer through a five-layer pipeline: ingestion, real-time detection, reconciliation, manual override, and integration.

It provides one trip model for both fleet and shuttle workflows, processes trips in real-time with state machines, reconciles overnight in batch, and allows operator correction with full audit trail. Downstream modules — fuel audit, dashboards, reporting, rules, and vehicle reconciliation — all consume the same unified trip dataset.

It also establishes the execution foundation for a future project-planning system that can define where work is supposed to happen and compare that plan against actual trips, actual fuel consumption, out-of-bounds movement, and work completed.
