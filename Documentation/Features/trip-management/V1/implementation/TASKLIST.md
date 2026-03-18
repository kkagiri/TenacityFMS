<!--
File: TASKLIST.md
Purpose: Tracks verified implementation status for Vehicle Trip Management (5-Layer Architecture).
Dependencies: PRD.md, current backend/frontend implementation, mysql-phase1-trip-management.sql, mysql-phase3-trip-management-status-and-fuel.sql.
Last Modified: 2026-03-12
-->

# Task List: Vehicle Trip Management

> Audit note (2026-03-12): check marks below were refreshed against the current codebase. Checked items indicate code is present and wired in the repository; formal runtime verification still belongs to Section 24.

## 1. Discovery and Design
- [x] Confirm final trip table and trip group table schema
- [x] Confirm `MovementProfile` enum values and default behavior
- [x] Confirm global default thresholds for stop speed, stop duration, and cluster radius
- [x] Confirm permissions for trip view and trip recompute
- [ ] Confirm whether historical backfill is needed for go-live
- [ ] Confirm future project-planning integration boundary
- [ ] Confirm how sections, borrow pits, dump points, and haul corridors will be geo-defined
- [ ] Confirm what constitutes `productive` vs `non-productive` movement
- [ ] Confirm whether production will use payload, standard cycle quantity, or manual capture
- [x] Confirm reconciliation batch window schedule (after midnight default)
- [x] Confirm manual override approval workflow for completed periods
- [x] Confirm SignalR hub strategy (reuse `dashboardHub` vs new `tripsHub`)

## 2. Domain and Persistence
- [x] Add vehicle `movement profile` field
- [x] Add trip leg entity
- [x] Add trip group entity
- [x] Add trip status field (`InProgress` / `Completed`) to trip leg entity
- [x] Add confidence score field (decimal 0.0–1.0) to trip leg and trip group entities
- [x] Add anomaly flags field to trip leg entity
- [x] Add reconciliation status field (`Confirmed` / `Split` / `Merged` / `Adjusted` / `Anomaly`) to trip leg and trip group entities
- [x] Add fuel fields (fuel at departure, fuel at arrival, fuel consumed) to trip leg entity
- [x] Add group type field (`RoundTrip` / `LoadCycle`) to trip group entity
- [x] Add total fuel consumed field to trip group entity
- [ ] Add vehicle trip state entity (per-vehicle real-time state machine state)
- [ ] Add trip override entity (audit trail for manual corrections)
- [ ] Add optional cluster snapshot entity if required for auditability
- [ ] Add nullable planning-link fields for project/zone matching
- [ ] Add out-of-bounds event entity or equivalent model
- [x] Update EF configurations
- [x] Update `GpsdataContext`
- [x] Prepare migration script and verify MySQL compatibility
- [x] Prepare migration script for new fields and entities (phase 2+)

## 3. Application Feature Setup
- [x] Create `FMS.Application/Features/VehicleTrips/Commands`
- [x] Create `FMS.Application/Features/VehicleTrips/Queries`
- [x] Create `FMS.Application/Features/VehicleTrips/DTOs`
- [x] Create `FMS.Application/Features/VehicleTrips/Services`
- [x] Create `FMS.Application/Features/VehicleTrips/Validators`
- [x] Create `FMS.Application/Features/VehicleTrips/StateMachines` (real-time detectors)
- [x] Add request/response DTOs for trip list, trip detail, trip group, recompute results, and override actions
- [x] Add DTOs for real-time trip events (`TripStarted`, `TripInProgress`, `TripCompleted`)
- [x] Add DTOs for reconciliation results and anomaly reports

## 4. Vehicle Configuration Integration
- [x] Extend vehicle DTOs with `movement profile`
- [x] Update vehicle mapping profile
- [x] Update vehicle create command flow
- [x] Update vehicle update command flow
- [x] Update vehicle read/query flow
- [x] Update vehicle controller endpoints to explicitly handle `MovementProfile`

## 5. Shared Trip Orchestration
- [x] Implement trip orchestration service
- [x] Implement per-vehicle/day processing pipeline
- [x] Implement idempotent persistence strategy
- [x] Implement confidence scoring model
- [x] Implement anomaly flagging model
- [ ] Add hooks for future project-plan matching and productive-trip classification

## 6. Layer 1 — GPS Data Pre-Processor
- [x] Implement GPS point filter (drop invalid, duplicates, zero satellites, impossible jumps)
- [x] Implement GPS point enrichment (distance from previous, time delta, geofence containment)
- [x] Implement per-vehicle sliding window buffer (5–10 points)
- [x] Integrate pre-processor into existing GPS data ingestion pipeline
- [x] Add configurable filter thresholds (max position jump km, min satellites)
- [ ] Add unit tests for filter, enrich, and buffer logic

## 7. Layer 2 — Real-Time Geofence Detector
- [x] Read active site geofence assignments
- [x] Detect site entry/exit transitions
- [x] Build site-to-site trip legs
- [x] Implement per-vehicle state machine (`AT_SITE` → `DEPARTING` → `ARRIVING`)
- [x] Implement N-consecutive-points noise filter for departure transition
- [x] Persist in-progress trips with `InProgress` status during `DEPARTING` state
- [x] Complete trip record on `ARRIVING` (destination, arrival time, distance, duration, fuel delta)
- [x] Build round-trip groups (`origin → destination → same origin`)
- [ ] Handle geofence overlap using closest centroid
- [ ] Handle off-site idle and unauthorized stops (flag extended idle outside all geofences)
- [ ] Mark low-confidence trips for GPS gaps (reduce confidence instead of splitting)
- [ ] Capture boundary-exit events for future out-of-bounds reporting
- [x] Emit `TripStarted`, `TripInProgress`, `TripCompleted` events to SignalR
- [ ] Store and restore state machine state (for service restart recovery)

## 8. Layer 2 — Real-Time Cluster Detector
- [x] Extract stops from GPS history
- [x] Cluster stops by centroid radius
- [x] Classify clusters into load/dump/other
- [x] Replace cluster labels with known site labels when applicable
- [x] Build trip legs from cluster transitions
- [x] Implement per-vehicle state machine (`AT_CLUSTER` → `IN_TRANSIT`)
- [x] Implement progressive cluster discovery (first stop of day creates Cluster A, second creates Cluster B)
- [x] Match new stops against existing clusters within 150m radius, or create new cluster
- [x] Refine cluster classification over time (reclassify after 2–3 cycles based on dwell time)
- [ ] Implement configurable threshold evaluation (stop speed, stop duration, cluster radius, min trip distance, min trip duration)
- [x] Build load-cycle groups (`load → dump → load`)
- [ ] Handle multi-drop/multi-cluster day patterns
- [ ] Support matching cluster centroids to future planning zones (sections, borrow pits)
- [x] Emit `TripStarted`, `TripInProgress`, `TripCompleted` events to SignalR
- [ ] Store and restore state machine state (for service restart recovery)

## 9. Layer 3 — End-of-Day Reconciliation
- [x] Implement batch replay service (re-run full day's GPS data through detection engine)
- [x] Implement compare logic (match batch results against real-time trip records)
- [x] Handle `Confirmed` category (same trips, same sites, times within tolerance)
- [x] Handle `Split` category (real-time 1 trip → batch 2 trips)
- [x] Handle `Merged` category (real-time 2 trips → batch 1 trip)
- [x] Handle `Adjusted` category (same count but different times/distances)
- [ ] Implement cluster finalization for tippers (relabel provisional clusters, recalculate cycle counts)
- [x] Implement anomaly flagging (no fuel data, negative consumption, unrealistic speeds, asymmetric cycles, no return to site)
- [x] Apply reconciliation status to each trip record
- [x] Replace real-time records with reconciled records (preserve originals for audit)
- [x] Implement scheduled background job (after midnight, configurable)
- [x] Implement on-demand reconciliation trigger (API endpoint)
- [x] Add logging and error handling for reconciliation failures

## 10. Layer 4 — Manual Override
- [x] Implement split trip command (operator picks a timeline point to split one trip into two)
- [x] Implement merge trips command (operator selects two consecutive trips to merge)
- [x] Implement reassign site command (change origin or destination site of a trip)
- [x] Implement add trip command (manually create a trip record)
- [x] Implement delete trip command (remove a false trip)
- [x] Implement adjust times command (override departure or arrival times)
- [x] Implement audit trail persistence (original values, new values, operator, timestamp, mandatory reason)
- [x] Preserve original auto-detected record (supersede, never delete)
- [x] Implement physics validation (no arrival before departure, no simultaneous site presence)
- [x] Implement supervisor approval gate for overrides on completed periods (after fuel audit)
- [x] Add override audit trail query (get history of changes for a trip)

## 11. Layer 5 — Fuel Enrichment
- [x] Integrate fuel audit GPS readings into trip records
- [x] Resolve fuel level at departure and arrival for each trip leg
- [x] Calculate per-leg fuel consumption (departure level − arrival level)
- [x] Calculate per-group fuel consumption (sum of leg consumptions)
- [x] Calculate per-trip fuel rate (fuel consumed / distance = km/L)
- [x] Flag suspicious loaded vs empty leg anomalies (tippers: loaded 2.5 km/L vs empty 4 km/L)
- [x] Flag negative fuel consumption (refueled en route)
- [x] Lower confidence when fuel data is missing or weak
- [ ] Support future actual-vs-expected fuel variance by planning zone and route benchmark

## 12. Layer 5 — SignalR and Dashboard Integration
- [x] Define trip event message types for SignalR (`TripStarted`, `TripInProgress`, `TripCompleted`)
- [x] Publish trip events to `dashboardHub` (or dedicated `tripsHub`)
- [x] Dashboard: show vehicles currently in transit (origin + estimated destination)
- [x] Dashboard: show vehicles at each site
- [x] Dashboard: show trip count per vehicle today vs expected
- [x] Dashboard: show tipper cycle count (live load/dump counter)
- [x] Replace dashboard trip placeholders with persisted trip data
- [x] Populate average trip duration and trip count metrics

## 13. Layer 5 — Rule Engine Integration
- [x] Add trip-based rule: max trips per day per vehicle
- [x] Add trip-based rule: max distance per trip
- [x] Add trip-based rule: expected trip duration between two sites (flag too long or too short)
- [x] Add trip-based rule: tipper minimum cycles per day (productivity monitoring)
- [x] Add trip-based rule: fuel consumption rate thresholds per route

## 14. Layer 5 — Vehicle Reconciliation Integration
- [ ] Replace GPS position snapshots with trip-based movement data in vehicle reconciliation
- [ ] Provide complete cross-site movement log (not just "was seen at Juja at 14:00")
- [ ] Feed trip distance, fuel consumed, and site visits into the 5-category hybrid model

## 15. Processing Modes
- [x] Implement real-time trip processing (pre-processor + state machine on every incoming GPS point)
- [x] Implement daily reconciliation job/service (batch, scheduled after midnight)
- [x] Implement manual recompute command for vehicle/day
- [x] Implement manual recompute command for vehicle/date range
- [x] Ensure reruns do not create duplicates
- [x] Implement on-demand reconciliation trigger via API
- [x] Implement manual override processing (Layer 4 commands)

## 16. API Layer
- [x] Add trip list endpoint
- [x] Add trip detail endpoint (individual leg with full metadata)
- [x] Add trip group endpoint
- [x] Add recompute endpoint(s)
- [x] Add in-progress trips endpoint (real-time active trips)
- [x] Add override endpoints (split, merge, reassign, add, delete, adjust)
- [x] Add override audit trail endpoint (history of changes for a trip)
- [x] Add reconciliation trigger endpoint (on-demand batch reconciliation)
- [x] Add filtering by vehicle, site, date range, mode, status, confidence, reconciliation status
- [x] Include reconciliation status and anomaly flags in API response contracts
- [x] Include out-of-bounds and productive/non-productive fields in API contracts
- [ ] Design future filters for project, section, borrow pit, and dump point
- [x] Ensure all APIs return `FMSResponse<T>`

## 17. Layer 5 — Reporting Integration
- [x] Connect route analysis/reporting views to trip APIs
- [x] Add trip count and cycle count summaries
- [x] Add trip distance, duration, and fuel metrics
- [x] Add reconciliation status breakdown report
- [x] Add anomaly and low-confidence reporting output
- [x] Add productive vs out-of-bounds movement reporting
- [x] Add future section/borrow-pit/dump-point reporting model
- [x] Define how production is calculated or clearly mark it unavailable when payload data is absent

## 18. Project Planning Integration Preparation
- [ ] Define future planning entities: project, work day, work zone, planned haul route, vehicle assignment
- [ ] Define geo-zone types: section, borrow pit, dump point, corridor
- [ ] Define trip-to-plan matching rules
- [ ] Define out-of-bounds thresholds by time and/or distance
- [ ] Define whether non-productive trips are excluded from production reports

## 18a. Frontend: Planning Entity Linking (V2)
- [x] Extract planning section from `VehicleTripDetailPanel` into `VehicleTripPlanningSection.js`
- [x] Replace static "Not linked" cards with cascading `SelectBox` controls (Project → Work day → Work zone → Haul route)
- [x] Add `updateTripPlanningLink` to `vehicleTripService.js` (`PATCH /vehicletrips/{groupId}/planning`)
- [x] Add `fetchProjectLookup`, `fetchProjectWorkDays`, `fetchProjectZones`, `fetchProjectHaulRoutes` to `vehicleTripService.js`
- [x] Permission-gate planning link controls (`canManageTrips` → editable, otherwise read-only)
- [x] Show linked state with green check badges and unlinked state with gray "V2" hints
- [x] Add vehicle assignment read-only display (auto-resolved from project + date)

## 18b. Frontend: Geo-Zone Administration (V2)
- [x] Add "Planning zones & boundaries" section to `VehicleTripSettingsPage.js`
- [x] Show zone type summary cards (Section, Borrow pit, Dump point, Corridor) with counts and "Manage" action
- [x] Create `GeoZoneManagementPanel.js` slide panel with DataGrid for CRUD per zone type
- [x] Add geo-zone API calls to `vehicleTripService.js` (`GET/POST/PUT/DELETE /geozones`)
- [ ] Add polygon input (coordinate entry or map picker) for zone creation
- [ ] Show associated project/site for each zone

## 18c. Frontend: Out-of-Bounds & Rules Settings (V2)
- [ ] Add out-of-bounds governance controls to settings page (time threshold, distance threshold, enable toggle)
- [ ] Add non-productive trip exclusion toggle to settings page
- [ ] Add trip-to-plan matching controls to settings page (auto-match toggle, match radius, require project)
- [ ] Extend `updateVehicleTripSettings` payload with planning/bounds fields
- [ ] Extend `fetchVehicleTripSettings` response handling for planning/bounds fields

## 18d. Frontend: Planning Filters on VehicleTripsPage (V2)
- [ ] Add Project filter (`SelectBox` with search)
- [ ] Add Section, Borrow pit, Dump point filters (cascaded from project)
- [x] Add Plan match status filter (All / Matched / Unmatched / Partial)
- [x] Add Out-of-bounds filter (All / In bounds / Out of bounds)
- [x] Add Productive filter (All / Productive / Non-productive)
- [x] Add plan match, origin zone, destination zone, and out-of-bounds grid columns

## 18e. Frontend: Tracking Page Planning Indicators (V2)
- [x] Replace "Plan match reserved" footer on timeline cards with live plan match badge
- [x] Replace "Out-of-bounds reserved" footer on timeline cards with out-of-bounds indicator

## 18f. Frontend: Planning UI Constants & Utilities (V2)
- [ ] Add `GEO_ZONE_TYPE_MAP` to `vehicleTripUi.js` with icons, colors, and labels per zone type
- [x] Add `PLAN_MATCH_STATUS_MAP` to `vehicleTripUi.js`
- [ ] Update `PLANNING_ENTITY_PLACEHOLDERS` with V2 metadata (control type, API source, cascade dependency)

## 19. Frontend: Vehicle Configuration
- [x] Add `movement profile` field to vehicle edit form
- [x] Add `movement profile` to create flow
- [ ] Update Redux actions/state if needed
- [ ] Validate display and save behavior

## 20. Frontend: Tracking and History
- [x] Add trip panel/timeline to tracking page with real-time in-progress indicators
- [x] Show vehicles currently in transit with origin and estimated destination
- [x] Add recompute action on tracking page
- [x] Add trip history to vehicle details page
- [x] Add trip details popup/panel (individual leg with full metadata)
- [x] Add confidence/anomaly badges
- [x] Add reconciliation status badges
- [x] Keep new UI split into smaller components where needed
- [x] Reserve UX space for future plan match and out-of-bounds indicators

## 21. Frontend: Trip Management (Override UI)
- [x] Add override panel accessible from trip detail view
- [x] Implement split trip UI (select timeline point to split)
- [x] Implement merge trips UI (select two consecutive trips)
- [x] Implement reassign site UI (change origin/destination)
- [x] Implement add trip UI (manual trip entry form)
- [x] Implement delete trip UI (with mandatory reason)
- [x] Implement adjust times UI (override departure/arrival)
- [x] Add mandatory reason field for all override actions
- [x] Add supervisor approval workflow UI for completed-period overrides
- [x] Add override audit trail viewer (history of changes per trip)

## 22. Frontend: Dashboard
- [ ] Add trip count per vehicle today vs expected
- [ ] Add vehicles currently in transit display
- [ ] Add tipper cycle counter (live)
- [ ] Add anomaly count and review link
- [ ] Replace static trip placeholders with live trip data

## 23. Frontend: Reports
- [x] Replace static route analysis placeholder
- [x] Add trip count and cycle count summaries
- [x] Add trip distance, duration, and fuel metrics
- [x] Add filter controls for date, vehicle, site, detection mode, and reconciliation status
- [x] Add future filter groups for section, borrow pit, dump point, and project
- [x] Add out-of-bounds summary cards/tables
- [x] Add reconciliation status breakdown view

## 24. Testing and Verification
- [ ] Validate vehicle movement profile CRUD
- [ ] Validate GPS pre-processor filter logic (invalid, duplicates, impossible jumps)
- [ ] Validate GPS pre-processor enrichment (distance, time delta, geofence containment)
- [ ] Validate GPS pre-processor buffer (sliding window behavior)
- [ ] Validate geofence state machine transitions (`AT_SITE` → `DEPARTING` → `ARRIVING`)
- [ ] Validate N-consecutive-points noise filter for departures
- [ ] Validate cluster state machine with progressive cluster discovery
- [ ] Validate cluster classification refinement over multiple cycles
- [ ] Validate site-to-site trip generation (batch recompute mode)
- [ ] Validate shuttle/tipper cycle generation (batch recompute mode)
- [ ] Validate hybrid site labeling for cluster centroids inside geofences
- [ ] Validate low-confidence handling on GPS gaps
- [ ] Validate duplicate-safe recompute
- [ ] Validate end-of-day reconciliation (confirmed, split, merged, adjusted categories)
- [ ] Validate cluster finalization during reconciliation
- [ ] Validate anomaly flagging during reconciliation
- [ ] Validate manual override actions (split, merge, reassign, add, delete, adjust)
- [ ] Validate override audit trail persistence
- [ ] Validate physics validation (no arrival before departure)
- [ ] Validate supervisor approval gate for completed-period overrides
- [ ] Validate fuel enrichment and anomaly flags
- [ ] Validate SignalR trip event publishing
- [ ] Validate dashboard/report consumers
- [ ] Validate out-of-bounds event generation and reporting
- [ ] Validate future plan-match readiness in the persisted model

## 25. Rollout Readiness
- [ ] Confirm seed/default configuration values (thresholds, batch schedule, buffer size)
- [ ] Confirm permissions and navigation exposure
- [ ] Confirm backfill/go-live plan
- [ ] Confirm operational monitoring for reconciliation/recompute failures
- [ ] Confirm state machine recovery strategy after service restart
- [ ] Confirm override approval workflow configuration
- [ ] Prepare release notes if required
